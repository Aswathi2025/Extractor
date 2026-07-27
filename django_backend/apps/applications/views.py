"""
Applications app — serializers, views, and URLs.
Mirrors applications/controller.js and applications/index.js.
"""
import logging
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from .models import Application, Resume, ResumeAnalysis, ApplicationStatus
from apps.authentication.models import User
from apps.authentication.permissions import IsAdmin
from apps.jobs.models import JobRole
from apps.skills.models import Skill
from apps.tests.models import Test, TestAnswer, TestType
from apps.questions.models import Question, QuestionType
from apps.tests.views import TestSerializer
from django.conf import settings
from utils.pagination import StandardPagination
from utils.backblaze import upload_to_b2, generate_b2_presigned_url
from utils.resume_parser import extract_text_from_file
from utils.groq_utils import extract_resume_data, compute_match_score
from utils.email_utils import send_email

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class ApplicationListSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='user.username', read_only=True)
    candidate_email = serializers.CharField(source='user.email', read_only=True)
    candidate_id = serializers.UUIDField(source='user.id', read_only=True)
    job_title = serializers.CharField(source='job_role.title', read_only=True)
    job_role_id = serializers.UUIDField(source='job_role.id', read_only=True)
    min_experience = serializers.IntegerField(source='job_role.min_experience', read_only=True)
    tests = TestSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'candidate_name', 'candidate_email', 'candidate_id',
            'job_role_id', 'job_title', 'min_experience',
            'match_score', 'matched_skills', 'missing_skills',
            'status', 'applied_at', 'updated_at', 'tests',
        ]


class JobRoleBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRole
        fields = ['id', 'title', 'min_experience']

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ApplicationDetailSerializer(serializers.ModelSerializer):
    candidate = UserBasicSerializer(source='user', read_only=True)
    job_role = JobRoleBasicSerializer(read_only=True)
    tests = TestSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = '__all__'


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
    interview_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    interview_time = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    interview_location = serializers.CharField(required=False, allow_blank=True, allow_null=True)


# ── Views ─────────────────────────────────────────────────────────────────────

class MyApplicationsView(APIView):
    """GET /api/v1/applications/me — candidate's own applications"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = Application.objects.select_related('job_role').filter(
            user=request.user
        ).order_by('-applied_at')
        serializer = ApplicationListSerializer(apps, many=True)
        return Response({'data': serializer.data})


class CurrentResumeView(APIView):
    """GET /api/v1/applications/resume — get candidate's current resume presigned URL"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
        if not resume:
            return Response({'resume_url': None})
        try:
            url = generate_b2_presigned_url(resume.file)
            return Response({'resume_url': url, 'uploaded_at': resume.uploaded_at})
        except Exception as e:
            logger.error(f'Presigned URL failed: {e}')
            return Response({'error': 'Could not generate resume URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadResumeView(APIView):
    """POST /api/v1/applications/resume — upload and parse resume"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['application/pdf',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            return Response({'error': 'Only PDF and DOCX files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        file_bytes = file.read()

        # Upload to Backblaze B2 (non-fatal: fall back to local key on failure)
        b2_upload_ok = True
        try:
            key = upload_to_b2(
                name=file.name,
                buffer=file_bytes,
                mimetype=file.content_type,
                custom_key=f'resumes/{request.user.id}/{file.name}',
            )
        except Exception as e:
            logger.error(f'B2 upload failed (continuing with local key): {e}')
            key = f'resumes/{request.user.id}/{file.name}'
            b2_upload_ok = False

        # Save resume record
        resume = Resume.objects.create(user=request.user, file=key)

        # Extract text and run AI analysis
        try:
            text = extract_text_from_file(file_bytes, file.name)
            extracted = extract_resume_data(text)

            # Upsert ResumeAnalysis
            ResumeAnalysis.objects.update_or_create(
                resume=resume,
                defaults={
                    'extracted_name': extracted.get('extracted_name'),
                    'extracted_email': extracted.get('extracted_email'),
                    'extracted_phone': extracted.get('extracted_phone'),
                    'extracted_website': extracted.get('extracted_website'),
                    'extracted_linkedin': extracted.get('extracted_linkedin'),
                    'extracted_github': extracted.get('extracted_github'),
                    'education': extracted.get('education'),
                    'experience': extracted.get('experience'),
                    'projects': extracted.get('projects'),
                    'certifications': extracted.get('certifications'),
                    'summary': extracted.get('summary'),
                    'extracted_skills': extracted.get('extracted_skills'),
                },
            )
        except Exception as e:
            logger.error(f'Resume AI extraction failed: {e}')

        url = None
        try:
            url = generate_b2_presigned_url(resume.file)
        except Exception:
            pass

        resp_data = {
            'message': 'Resume uploaded and parsed successfully.',
            'resume_id': str(resume.id),
            'url': url,
        }
        if not b2_upload_ok:
            resp_data['warning'] = 'Cloud storage upload failed; file stored locally.'

        return Response(resp_data)


class CreateApplicationView(APIView):
    """POST /api/v1/applications/ — candidate submits application"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_role_id = request.data.get('job_role_id')
        if not job_role_id:
            return Response({'error': 'job_role_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = JobRole.objects.prefetch_related('required_skills').get(pk=job_role_id)
        except JobRole.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        if Application.objects.filter(user=request.user, job_role=job).exists():
            return Response({'error': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get resume analysis for match scoring
        resume = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
        match_data = {'match_score': None, 'matched_skills': [], 'missing_skills': []}

        if resume:
            try:
                analysis = resume.analysis
                resume_skills = analysis.extracted_skills or []
                job_skills = list(job.required_skills.values_list('name', flat=True))
                match_data = compute_match_score(resume_skills, job_skills)
            except Exception as e:
                logger.warning(f'Match score computation failed: {e}')

        application = Application.objects.create(
            user=request.user,
            job_role=job,
            match_score=match_data['match_score'],
            matched_skills=match_data['matched_skills'],
            missing_skills=match_data['missing_skills'],
        )

        return Response(
            ApplicationListSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class ApplicationListView(APIView):
    """GET /api/v1/applications/ — admin: list all applications"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Application.objects.select_related('user', 'job_role').prefetch_related('tests').all()

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) | Q(user__email__icontains=search)
            )

        job_role_id = request.query_params.get('job_role_id')
        if job_role_id:
            qs = qs.filter(job_role_id=job_role_id)

        skill = request.query_params.get('skill')
        if skill:
            # Filter by matched_skills JSON contains
            qs = qs.filter(matched_skills__icontains=skill)

        sort_by = request.query_params.get('sortBy', 'updated_at')
        sort_order = request.query_params.get('sortOrder', 'DESC')
        order_prefix = '-' if sort_order.upper() == 'DESC' else ''
        try:
            qs = qs.order_by(f'{order_prefix}{sort_by}')
        except Exception:
            qs = qs.order_by('-updated_at')

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(ApplicationListSerializer(page, many=True).data)


class ApplicationDetailView(APIView):
    """GET /api/v1/applications/<id>/ — admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            app = Application.objects.select_related('user', 'job_role').prefetch_related('tests').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ApplicationDetailSerializer(app).data)

    def delete(self, request, pk):
        try:
            app = Application.objects.get(pk=pk)
            app.delete()
            return Response({'message': 'Application deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)


class UpdateApplicationStatusView(APIView):
    """PUT /api/v1/applications/<id>/status/ — admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            app = Application.objects.select_related('user', 'job_role').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app.status = serializer.validated_data['status']
        
        if 'interview_date' in serializer.validated_data and serializer.validated_data['interview_date']:
            app.interview_date = serializer.validated_data['interview_date']
        if 'interview_time' in serializer.validated_data and serializer.validated_data['interview_time']:
            app.interview_time = serializer.validated_data['interview_time']
        if 'interview_location' in serializer.validated_data and serializer.validated_data['interview_location']:
            app.interview_location = serializer.validated_data['interview_location']
        elif not app.interview_location:
            app.interview_location = 'Abc company chennai'

        app.save()

        # Auto-generate tests if advancing to testing rounds
        if app.status == ApplicationStatus.APTITUDE_ROUND:
            if not Test.objects.filter(application=app, test_type=TestType.APTITUDE).exists():
                questions = list(Question.objects.filter(type=QuestionType.MCQ).order_by('?')[:10])
                if questions:
                    test = Test.objects.create(
                        test_type=TestType.APTITUDE,
                        user=app.user,
                        application=app,
                        total_questions=len(questions)
                    )
                    TestAnswer.objects.bulk_create([
                        TestAnswer(test=test, question=q) for q in questions
                    ])
        elif app.status == ApplicationStatus.TECHNICAL_ROUND:
            if not Test.objects.filter(application=app, test_type=TestType.TECHNICAL).exists():
                # For technical round, pull 2 programming questions
                questions = list(Question.objects.filter(type=QuestionType.PROGRAMMING).order_by('?')[:2])
                if questions:
                    test = Test.objects.create(
                        test_type=TestType.TECHNICAL,
                        user=app.user,
                        application=app,
                        total_questions=len(questions)
                    )
                    TestAnswer.objects.bulk_create([
                        TestAnswer(test=test, question=q) for q in questions
                    ])

        # Dispatch email notification for candidate status update
        self._send_status_email(app)

        return Response({'message': 'Application status updated.', 'status': app.status})

    def _send_status_email(self, app):
        candidate = app.user
        job_title = app.job_role.title if app.job_role else 'Applied Position'
        frontend_url = settings.FRONTEND_URL

        try:
            if app.status == ApplicationStatus.APTITUDE_ROUND:
                send_email(
                    to=candidate.email,
                    subject='Aptitude Round Invitation — Extractor',
                    template='aptitude_round.html',
                    context={
                        'name': candidate.username,
                        'job_title': job_title,
                        'dashboard_url': f'{frontend_url}/tests',
                    }
                )
            elif app.status == ApplicationStatus.TECHNICAL_ROUND:
                send_email(
                    to=candidate.email,
                    subject='Technical Round Invitation — Extractor',
                    template='technical_round.html',
                    context={
                        'name': candidate.username,
                        'job_title': job_title,
                        'dashboard_url': f'{frontend_url}/tests',
                    }
                )
            elif app.status == ApplicationStatus.FACE_TO_FACE_INTERVIEW:
                send_email(
                    to=candidate.email,
                    subject='Face-to-Face Interview Schedule — Extractor',
                    template='face_to_face_interview.html',
                    context={
                        'name': candidate.username,
                        'job_title': job_title,
                        'interview_date': app.interview_date or 'To be communicated',
                        'interview_time': app.interview_time or 'To be communicated',
                        'interview_location': app.interview_location or 'Abc company chennai',
                    }
                )
            elif app.status == ApplicationStatus.ACCEPTED:
                send_email(
                    to=candidate.email,
                    subject='Congratulations! Application Accepted — Extractor',
                    template='candidate_selected.html',
                    context={
                        'name': candidate.username,
                        'job_title': job_title,
                    }
                )
        except Exception as e:
            logger.error(f'Status update email failed for {candidate.email}: {e}')

