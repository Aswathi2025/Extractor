"""
Users app — serializers, views, and URLs.
Mirrors users/controller.js and users/index.js.
"""
import logging
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from apps.authentication.models import User, EntityStatus, UserRole
from apps.authentication.permissions import IsAdmin
from apps.applications.models import Resume
from utils.backblaze import upload_to_b2, generate_b2_presigned_url
from utils.pagination import StandardPagination

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'status',
            'profile_pic', 'phone', 'website', 'linkedin_url', 'github_url',
            'is_verified', 'created_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'status', 'is_verified', 'created_at']


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'status', 'is_verified', 'created_at']


class UpdateUserStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=EntityStatus.choices)


# ── Views ─────────────────────────────────────────────────────────────────────

class ProfileView(APIView):
    """GET/PUT /api/v1/users/profile"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        data = UserProfileSerializer(user).data

        # Generate presigned URL for profile pic
        if user.profile_pic:
            try:
                data['profile_pic_url'] = generate_b2_presigned_url(user.profile_pic)
            except Exception:
                data['profile_pic_url'] = None

        return Response(data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Handle photo upload
        photo = request.FILES.get('photo')
        if photo:
            try:
                key = upload_to_b2(
                    name=photo.name,
                    buffer=photo.read(),
                    mimetype=photo.content_type,
                    custom_key=f'profile_pics/{request.user.id}/{photo.name}',
                )
                serializer.validated_data['profile_pic'] = key
            except Exception as e:
                logger.error(f'Profile pic upload failed: {e}')
                return Response({'error': 'Photo upload failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user = serializer.save()
        return Response(UserProfileSerializer(user).data)


class UserListView(APIView):
    """GET /api/v1/users/ — admin list all users"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = User.objects.exclude(status=EntityStatus.DELETED).exclude(role=UserRole.ADMIN).order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        role = request.query_params.get('role')
        if role:
            qs = qs.filter(role=role.upper())

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(UserListSerializer(page, many=True).data)


class UserDetailView(APIView):
    """GET /api/v1/users/<id>/ — admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserProfileSerializer(user).data)


class UpdateUserStatusView(APIView):
    """PUT /api/v1/users/<id>/status/ — admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateUserStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user.status = serializer.validated_data['status']
        user.save(update_fields=['status'])
        return Response({'message': 'User status updated.', 'status': user.status})


class UserResumeView(APIView):
    """GET /api/v1/users/<id>/resume/ — admin view a user's resume"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        resume = Resume.objects.filter(user=user).order_by('-uploaded_at').first()
        if not resume:
            return Response({'resume_url': None})

        try:
            url = generate_b2_presigned_url(resume.file)
            return Response({'resume_url': url})
        except Exception as e:
            logger.error(f'Presigned URL error: {e}')
            return Response({'error': 'Could not generate URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
