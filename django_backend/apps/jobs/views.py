"""
Jobs app — serializers, views, and URLs.
Mirrors jobs/controller.js and jobs/index.js routes.
"""
import logging
from rest_framework import serializers, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import JobRole, JobRequiredSkill
from apps.skills.models import Skill
from apps.authentication.permissions import IsAdmin
from utils.groq_utils import generate_job_description
from utils.pagination import StandardPagination

logger = logging.getLogger(__name__)


# ── Serializers ────────────────────────────────────────────────────────────────

class SkillBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()


class JobRoleSerializer(serializers.ModelSerializer):
    required_skills = SkillBriefSerializer(many=True, read_only=True)
    skill_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = JobRole
        fields = [
            'id', 'title', 'description', 'min_education', 'min_experience',
            'last_application_date', 'status', 'required_skills', 'skill_ids',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status']

    def create(self, validated_data):
        skill_ids = validated_data.pop('skill_ids', [])
        job = JobRole.objects.create(**validated_data)
        if skill_ids:
            skills = Skill.objects.filter(id__in=skill_ids)
            job.required_skills.set(skills)
        return job

    def update(self, instance, validated_data):
        skill_ids = validated_data.pop('skill_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skill_ids is not None:
            skills = Skill.objects.filter(id__in=skill_ids)
            instance.required_skills.set(skills)
        return instance


# ── Views ──────────────────────────────────────────────────────────────────────

class GenerateJobDescriptionView(APIView):
    """POST /api/v1/jobs/generate-description — AI powered, admin only"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        title = request.data.get('title', '')
        skill_ids = request.data.get('skill_ids', [])
        min_experience = request.data.get('min_experience')
        min_education = request.data.get('min_education', '')

        skill_names = list(Skill.objects.filter(id__in=skill_ids).values_list('name', flat=True))
        try:
            description = generate_job_description(title, skill_names, min_experience, min_education)
            return Response({'description': description})
        except Exception as e:
            logger.error(f'Job description generation failed: {e}')
            return Response({'error': 'AI generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class JobListCreateView(APIView):
    """GET /api/v1/jobs/ — list jobs (paginated, search, filter by skill)
       POST /api/v1/jobs/ — create job (admin)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def get(self, request):
        qs = JobRole.objects.prefetch_related('required_skills').filter(
            status='ACTIVE'
        )
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        skill_id = request.query_params.get('skill_id')
        if skill_id:
            qs = qs.filter(required_skills__id=skill_id)

        sort_by = request.query_params.get('sortBy', 'created_at')
        sort_order = request.query_params.get('sortOrder', 'DESC')
        order_prefix = '-' if sort_order.upper() == 'DESC' else ''
        try:
            qs = qs.order_by(f'{order_prefix}{sort_by}')
        except Exception:
            qs = qs.order_by('-created_at')

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = JobRoleSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = JobRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        job = serializer.save()
        return Response(JobRoleSerializer(job).data, status=status.HTTP_201_CREATED)


class JobDetailView(APIView):
    """GET/PUT/DELETE /api/v1/jobs/<id>/"""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def _get_job(self, pk):
        try:
            return JobRole.objects.prefetch_related('required_skills').get(pk=pk)
        except JobRole.DoesNotExist:
            return None

    def get(self, request, pk):
        job = self._get_job(pk)
        if not job:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(JobRoleSerializer(job).data)

    def put(self, request, pk):
        job = self._get_job(pk)
        if not job:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = JobRoleSerializer(job, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        job = serializer.save()
        return Response(JobRoleSerializer(job).data)

    def delete(self, request, pk):
        job = self._get_job(pk)
        if not job:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        job.status = 'DELETED'
        job.save(update_fields=['status'])
        return Response({'message': 'Job deleted successfully.'})
