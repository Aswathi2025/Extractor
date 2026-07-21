"""
Tests app — views and URLs.
Mirrors tests/controller.js and tests/index.js.
"""
import logging
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Test, TestAnswer, TestType
from apps.questions.models import Question, QuestionType
from apps.authentication.permissions import IsAdmin
from utils.groq_utils import evaluate_technical_test

logger = logging.getLogger(__name__)


# ── Serializers ───────────────────────────────────────────────────────────────

class TestAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)

    class Meta:
        model = TestAnswer
        fields = [
            'id', 'question_id', 'question_text', 'selected_answer',
            'language', 'is_correct', 'correct_answer',
        ]


class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = [
            'id', 'test_type', 'user_id', 'application_id', 'total_questions',
            'score', 'is_completed', 'assigned_at', 'submitted_at',
        ]


class SubmitAnswerSerializer(serializers.Serializer):
    answer_id = serializers.UUIDField()
    selected_answer = serializers.CharField(allow_blank=True, required=False)
    language = serializers.CharField(required=False, allow_blank=True)


class SubmitTestSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)


# ── Views ─────────────────────────────────────────────────────────────────────

class MyTestsView(APIView):
    """GET /api/v1/tests/me"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tests = Test.objects.filter(user=request.user).order_by('-assigned_at')
        return Response({'data': TestSerializer(tests, many=True).data})


class AdminTestDetailView(APIView):
    """GET /api/v1/tests/admin/<id>/ — full test details with answers (admin)"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            test = Test.objects.select_related('user', 'application').get(pk=pk)
        except Test.DoesNotExist:
            return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

        answers = TestAnswer.objects.select_related('question').filter(test=test)
        return Response({
            **TestSerializer(test).data,
            'answers': TestAnswerSerializer(answers, many=True).data,
        })


class TestDetailView(APIView):
    """GET /api/v1/tests/<id>/ — candidate test details with questions"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            test = Test.objects.get(pk=pk, user=request.user)
        except Test.DoesNotExist:
            return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

        answers = TestAnswer.objects.select_related('question').filter(test=test)
        answers_data = []
        for ans in answers:
            q = ans.question
            item = {
                'answer_id': str(ans.id),
                'question_id': str(q.id),
                'question': q.question,
                'type': q.type,
                'selected_answer': ans.selected_answer,
                'language': ans.language,
            }
            # Include options for MCQ
            if q.type == QuestionType.MCQ:
                item['option_a'] = q.option_a
                item['option_b'] = q.option_b
                item['option_c'] = q.option_c
                item['option_d'] = q.option_d
            # Only reveal correct_answer if test is completed
            if test.is_completed:
                item['correct_answer'] = q.correct_answer
                item['is_correct'] = ans.is_correct
            answers_data.append(item)

        return Response({
            **TestSerializer(test).data,
            'answers': answers_data,
        })


class SubmitTestView(APIView):
    """PUT /api/v1/tests/<id>/submit"""
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            test = Test.objects.get(pk=pk, user=request.user)
        except Test.DoesNotExist:
            return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

        if test.is_completed:
            return Response({'error': 'Test already submitted.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        answers_data = serializer.validated_data['answers']
        correct_count = 0
        total = 0

        for ans_data in answers_data:
            try:
                answer = TestAnswer.objects.select_related('question').get(
                    pk=ans_data['answer_id'], test=test
                )
            except TestAnswer.DoesNotExist:
                continue

            answer.selected_answer = ans_data.get('selected_answer', '')
            answer.language = ans_data.get('language', '')

            if test.test_type == TestType.APTITUDE and answer.question.type == QuestionType.MCQ:
                is_correct = (
                    answer.selected_answer.upper() == answer.question.correct_answer
                ) if answer.selected_answer else False
                answer.is_correct = is_correct
                if is_correct:
                    correct_count += 1
                total += 1

            answer.save(update_fields=['selected_answer', 'language', 'is_correct'])

        # Compute score for aptitude
        if test.test_type == TestType.APTITUDE:
            score = (correct_count / total * 100) if total > 0 else 0.0
            test.score = round(score, 2)

        test.is_completed = True
        test.submitted_at = timezone.now()
        test.save(update_fields=['is_completed', 'submitted_at', 'score'])

        return Response({'message': 'Test submitted.', 'score': test.score})


class EvaluateTestView(APIView):
    """POST /api/v1/tests/<id>/evaluate — AI evaluation for TECHNICAL tests (admin)"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            test = Test.objects.get(pk=pk)
        except Test.DoesNotExist:
            return Response({'error': 'Test not found.'}, status=status.HTTP_404_NOT_FOUND)

        if test.test_type != TestType.TECHNICAL:
            return Response({'error': 'Only TECHNICAL tests can be AI-evaluated.'}, status=status.HTTP_400_BAD_REQUEST)

        answers = TestAnswer.objects.select_related('question').filter(test=test)
        payload = [
            {
                'question': a.question.question,
                'language': a.language or 'Unknown',
                'selected_answer': a.selected_answer or '',
            }
            for a in answers
        ]

        try:
            result = evaluate_technical_test(payload)
            test.score = result.get('score', 0)
            test.save(update_fields=['score'])
            return Response({'message': 'Test evaluated.', 'score': test.score})
        except Exception as e:
            logger.error(f'Technical test evaluation failed: {e}')
            return Response({'error': 'AI evaluation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
