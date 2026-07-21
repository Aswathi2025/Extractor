"""
Authentication models: User (custom) and AuthToken.
Mirrors the Sequelize user.js and authToken.js models.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ── Enums / choices ──────────────────────────────────────────────────────────

class UserRole(models.TextChoices):
    CANDIDATE = 'CANDIDATE', 'Candidate'
    ADMIN = 'ADMIN', 'Admin'
    RECRUITER = 'RECRUITER', 'Recruiter'


class EntityStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    BLOCKED = 'BLOCKED', 'Blocked'
    INACTIVE = 'INACTIVE', 'Inactive'
    DELETED = 'DELETED', 'Deleted'


class TokenType(models.TextChoices):
    VERIFY_EMAIL = 'verify_email', 'Verify Email'
    RESET_PASSWORD = 'reset_password', 'Reset Password'


# ── User Manager ─────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('role', UserRole.CANDIDATE)
        extra_fields.setdefault('status', EntityStatus.ACTIVE)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('status', EntityStatus.ACTIVE)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        return self.create_user(email, username, password, **extra_fields)


# ── User Model ───────────────────────────────────────────────────────────────

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that replaces the default Django User.
    Mirrors the Sequelize User model (user.js).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.CANDIDATE
    )
    status = models.CharField(
        max_length=20, choices=EntityStatus.choices, default=EntityStatus.ACTIVE
    )
    profile_pic = models.CharField(max_length=500, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    linkedin_url = models.CharField(max_length=255, blank=True, null=True)
    github_url = models.CharField(max_length=255, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    # Required by Django auth
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.username} <{self.email}>'


# ── AuthToken Model ──────────────────────────────────────────────────────────

class AuthToken(models.Model):
    """
    Stores email-verification and password-reset tokens.
    Mirrors authToken.js.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=128, unique=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='auth_tokens', db_column='user_id'
    )
    type = models.CharField(max_length=20, choices=TokenType.choices)
    expires_at = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=EntityStatus.choices, default=EntityStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auth_tokens'

    def __str__(self):
        return f'{self.type} token for {self.user_id}'
