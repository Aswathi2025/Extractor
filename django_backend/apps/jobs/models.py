"""Jobs app — models: JobRole and JobRequiredSkill."""
import uuid
from django.db import models
from apps.authentication.models import EntityStatus
from apps.skills.models import Skill


class JobRole(models.Model):
    """Mirrors jobRole.js — job_roles table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    min_education = models.CharField(max_length=100, blank=True, null=True)
    min_experience = models.IntegerField(
        blank=True, null=True,
        help_text='Minimum experience required in years'
    )
    last_application_date = models.DateField(
        blank=True, null=True,
        help_text='Last date to submit an application'
    )
    status = models.CharField(
        max_length=20,
        choices=EntityStatus.choices,
        default=EntityStatus.ACTIVE,
    )
    required_skills = models.ManyToManyField(
        Skill,
        through='JobRequiredSkill',
        related_name='job_roles',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_roles'

    def __str__(self):
        return self.title


class JobRequiredSkill(models.Model):
    """Through table for JobRole ↔ Skill M2M. Mirrors jobRequiredSkill.js."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(JobRole, on_delete=models.CASCADE, db_column='job_id')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, db_column='skill_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'job_required_skills'
        unique_together = ('job', 'skill')
