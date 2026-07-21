"""
Questions app — views and URLs.
Mirrors questions/controller.js and questions/index.js.
"""
import logging
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Question, QuestionType
from apps.authentication.permissions import IsAdmin
from utils.groq_utils import generate_questions
from utils.pagination import StandardPagination

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'type', 'question', 'option_a', 'option_b', 'option_c',
            'option_d', 'correct_answer', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GenerateQuestionSerializer(serializers.Serializer):
    topic = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=['Easy', 'Medium', 'Hard'])


# ── Views ─────────────────────────────────────────────────────────────────────

class GenerateQuestionView(APIView):
    """POST /api/v1/questions/generate — AI MCQ generation, admin only"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = GenerateQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            raw_questions = generate_questions(
                serializer.validated_data['topic'],
                serializer.validated_data['difficulty'],
            )
            # Bulk create
            created = Question.objects.bulk_create([
                Question(
                    type=QuestionType.MCQ,
                    question=q.get('question', ''),
                    option_a=q.get('option_a'),
                    option_b=q.get('option_b'),
                    option_c=q.get('option_c'),
                    option_d=q.get('option_d'),
                    correct_answer=q.get('correct_answer'),
                )
                for q in raw_questions
            ])
            return Response(
                QuestionSerializer(created, many=True).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f'Question generation failed: {e}')
            return Response({'error': 'AI generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuestionListCreateView(APIView):
    """GET /api/v1/questions/ — list (auth), POST — create (admin)"""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def get(self, request):
        qs = Question.objects.all().order_by('-created_at')
        q_type = request.query_params.get('type')
        if q_type:
            qs = qs.filter(type=q_type.upper())
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(QuestionSerializer(page, many=True).data)

    def post(self, request):
        serializer = QuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        question = serializer.save()
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class QuestionDetailView(APIView):
    """GET/PUT/DELETE /api/v1/questions/<id>/"""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def _get_question(self, pk):
        try:
            return Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return None

    def get(self, request, pk):
        q = self._get_question(pk)
        if not q:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(QuestionSerializer(q).data)

    def put(self, request, pk):
        q = self._get_question(pk)
        if not q:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuestionSerializer(q, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(QuestionSerializer(serializer.save()).data)

    def delete(self, request, pk):
        q = self._get_question(pk)
        if not q:
            return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
        q.delete()
        return Response({'message': 'Question deleted successfully.'})
