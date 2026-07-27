"""Questions app — model."""
import uuid
from django.db import models


class QuestionType(models.TextChoices):
    MCQ = 'MCQ', 'Multiple Choice'
    PROGRAMMING = 'PROGRAMMING', 'Programming'


class Question(models.Model):
    """Mirrors question.js — questions table."""
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=20, choices=QuestionType.choices, default=QuestionType.MCQ
    )
    question = models.TextField()
    option_a = models.CharField(max_length=500, blank=True, null=True)
    option_b = models.CharField(max_length=500, blank=True, null=True)
    option_c = models.CharField(max_length=500, blank=True, null=True)
    option_d = models.CharField(max_length=500, blank=True, null=True)
    correct_answer = models.CharField(
        max_length=1, blank=True, null=True,
        help_text="'A', 'B', 'C', or 'D' for MCQ. Null for PROGRAMMING."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questions'

    def save(self, *args, **kwargs):
        # Mirror the Sequelize beforeValidate hook logic
        if self.type == QuestionType.PROGRAMMING:
            self.option_a = None
            self.option_b = None
            self.option_c = None
            self.option_d = None
            self.correct_answer = None
        elif self.type == QuestionType.MCQ and self.correct_answer:
            answer = self.correct_answer.upper()
            if answer not in ('A', 'B', 'C', 'D'):
                # Try to match to option text
                options = {'A': self.option_a, 'B': self.option_b,
                           'C': self.option_c, 'D': self.option_d}
                for key, val in options.items():
                    if val and self.correct_answer == val:
                        self.correct_answer = key
                        break
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.type}] {self.question[:60]}'
