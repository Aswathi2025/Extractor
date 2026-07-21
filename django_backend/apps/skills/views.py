"""Skills app — serializers, views, and URLs."""
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Skill
from apps.authentication.permissions import IsAdmin


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SkillListCreateView(APIView):
    """GET /api/v1/skills/ — list all skills (any auth)
       POST /api/v1/skills/ — create skill (admin only)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def get(self, request):
        qs = Skill.objects.all().order_by('name')
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(name__icontains=search)
            
        from utils.pagination import StandardPagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SkillSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = SkillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if Skill.objects.filter(name__iexact=serializer.validated_data['name']).exists():
            return Response({'error': 'Skill already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        skill = serializer.save()
        return Response(SkillSerializer(skill).data, status=status.HTTP_201_CREATED)


class SkillDeleteView(APIView):
    """DELETE /api/v1/skills/<id>/ — admin only"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            skill = Skill.objects.get(pk=pk)
        except Skill.DoesNotExist:
            return Response({'error': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)
        skill.delete()
        return Response({'message': 'Skill deleted successfully.'})
