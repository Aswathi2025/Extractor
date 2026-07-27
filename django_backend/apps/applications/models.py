"""
Applications app — models: Resume, ResumeAnalysis, Application.
"""
import uuid
from django.db import models
from apps.authentication.models import User, EntityStatus
from apps.jobs.models import JobRole


class ApplicationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    REVIEWED = 'reviewed', 'Reviewed'
    APTITUDE_ROUND = 'aptitude_round', 'Aptitude Round'
    TECHNICAL_ROUND = 'technical_round', 'Technical Round'
    FACE_TO_FACE_INTERVIEW = 'face_to_face_interview', 'Face to Face Interview'
    ACCEPTED = 'accepted', 'Accepted'
    REJECTED = 'rejected', 'Rejected'


class Resume(models.Model):
    """Mirrors resume.js — resumes table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='resumes', db_column='user_id'
    )
    file = models.CharField(max_length=500, help_text='Backblaze B2 key for the resume file')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resumes'

    def __str__(self):
        return f'Resume of {self.user_id}'


class ResumeAnalysis(models.Model):
    """Mirrors resumeAnalysis.js — resume_analyses table. JSONB → JSONField."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.OneToOneField(
        Resume, on_delete=models.CASCADE, related_name='analysis', db_column='resume_id'
    )
    extracted_name = models.CharField(max_length=255, blank=True, null=True)
    extracted_email = models.CharField(max_length=255, blank=True, null=True)
    extracted_phone = models.CharField(max_length=50, blank=True, null=True)
    extracted_website = models.CharField(max_length=255, blank=True, null=True)
    extracted_linkedin = models.CharField(max_length=255, blank=True, null=True)
    extracted_github = models.CharField(max_length=255, blank=True, null=True)
    education = models.JSONField(blank=True, null=True)
    experience = models.JSONField(blank=True, null=True)
    projects = models.JSONField(blank=True, null=True)
    certifications = models.JSONField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    extracted_skills = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resume_analyses'

    def __str__(self):
        return f'Analysis for resume {self.resume_id}'


class Application(models.Model):
    """Mirrors application.js — applications table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='applications', db_column='user_id'
    )
    job_role = models.ForeignKey(
        JobRole, on_delete=models.CASCADE, related_name='applications', db_column='job_role_id'
    )
    match_score = models.FloatField(
        blank=True, null=True,
        help_text='AI computed match score percentage'
    )
    matched_skills = models.JSONField(blank=True, null=True)
    missing_skills = models.JSONField(blank=True, null=True)
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
    )
    interview_date = models.CharField(max_length=100, blank=True, null=True)
    interview_time = models.CharField(max_length=100, blank=True, null=True)
    interview_location = models.CharField(max_length=255, blank=True, null=True, default='Abc company chennai')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications'

    def __str__(self):
        return f'Application {self.id} — {self.user_id} → {self.job_role_id}'
