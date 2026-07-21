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
from utils.pagination import StandardPagination
from utils.backblaze import upload_to_b2, generate_b2_presigned_url
from utils.resume_parser import extract_text_from_file
from utils.groq_utils import extract_resume_data, compute_match_score

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class ApplicationListSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='user.username', read_only=True)
    candidate_email = serializers.CharField(source='user.email', read_only=True)
    job_title = serializers.CharField(source='job_role.title', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'candidate_name', 'candidate_email', 'job_title',
            'match_score', 'matched_skills', 'missing_skills',
            'status', 'applied_at', 'updated_at',
        ]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)


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

        # Upload to Backblaze B2
        try:
            key = upload_to_b2(
                name=file.name,
                buffer=file_bytes,
                mimetype=file.content_type,
                custom_key=f'resumes/{request.user.id}/{file.name}',
            )
        except Exception as e:
            logger.error(f'B2 upload failed: {e}')
            return Response({'error': f'File upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        return Response({'message': 'Resume uploaded and parsed successfully.', 'resume_id': str(resume.id), 'url': url})


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
        qs = Application.objects.select_related('user', 'job_role').all()

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
            app = Application.objects.select_related('user', 'job_role').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ApplicationDetailSerializer(app).data)


class UpdateApplicationStatusView(APIView):
    """PUT /api/v1/applications/<id>/status/ — admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            app = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app.status = serializer.validated_data['status']
        app.save(update_fields=['status'])
        return Response({'message': 'Application status updated.', 'status': app.status})
