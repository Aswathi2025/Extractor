"""Tests app — models: Test and TestAnswer."""
import uuid
from django.db import models
from apps.authentication.models import User
from apps.applications.models import Application
from apps.questions.models import Question


class TestType(models.TextChoices):
    APTITUDE = 'APTITUDE', 'Aptitude'
    TECHNICAL = 'TECHNICAL', 'Technical'


class Test(models.Model):
    """Mirrors test.js — tests table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_type = models.CharField(
        max_length=20, choices=TestType.choices, default=TestType.APTITUDE
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='tests', db_column='user_id'
    )
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name='tests', db_column='application_id'
    )
    total_questions = models.IntegerField(default=0)
    score = models.FloatField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tests'

    def __str__(self):
        return f'{self.test_type} Test for {self.user_id}'


class TestAnswer(models.Model):
    """Mirrors testAnswer.js — test_answers table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        Test, on_delete=models.CASCADE, related_name='answers', db_column='test_id'
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name='answers', db_column='question_id'
    )
    selected_answer = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True)
    is_correct = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'test_answers'

    def __str__(self):
        return f'Answer for test {self.test_id}, question {self.question_id}'
