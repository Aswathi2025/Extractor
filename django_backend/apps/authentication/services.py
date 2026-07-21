"""
Authentication service layer.
Mirrors the Node.js service.js logic: loginUser, registerUser, verifyEmail,
forgotPassword, resetPassword, changePassword.
"""
import secrets
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, AuthToken, EntityStatus, TokenType, UserRole
from utils.email_utils import send_email

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate access + refresh JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def login_user(data):
    """Authenticate a user with email and password."""
    email = data.get('email', '').strip()
    password = data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError('Invalid email or password')

    if user.status == EntityStatus.BLOCKED:
        raise ValueError('Your account is blocked. Please contact admin.')

    if not user.is_verified:
        raise ValueError('Please verify your email before logging in.')

    if not user.check_password(password):
        raise ValueError('Invalid email or password')

    tokens = get_tokens_for_user(user)
    return {
        'name': user.username,
        'role': user.role,
        'access': tokens['access'],
        'refresh': tokens['refresh'],
    }


def _send_verification_email(user):
    """Generate a verify-email token and dispatch the email."""
    token = secrets.token_hex(32)
    expire_hours = settings.VERIFICATION_EXPIRE_HOURS
    expires_at = timezone.now() + timedelta(hours=expire_hours)

    AuthToken.objects.create(
        token=token,
        user=user,
        type=TokenType.VERIFY_EMAIL,
        expires_at=expires_at,
    )

    frontend_url = settings.FRONTEND_URL
    verify_link = f'{frontend_url}/verify-email?token={token}'

    try:
        send_email(
            to=user.email,
            subject='Verify Your Email — Extractor',
            template='verify_email.html',
            context={
                'name': user.username,
                'verify_link': verify_link,
                'expire_hours': expire_hours,
            },
        )
    except Exception as e:
        logger.error(f'Verification email failed for {user.email}: {e}')


def register_user(data):
    """Register a new candidate user and send verification email."""
    name = data['name']
    email = data['email']
    password = data['password']

    if User.objects.filter(email=email).exists():
        existing = User.objects.get(email=email)
        if existing.status == EntityStatus.BLOCKED:
            raise ValueError('This account is blocked. Please contact support.')
        raise ValueError('This user already exists.')

    user = User.objects.create_user(
        email=email,
        username=name,
        password=password,
        role=UserRole.CANDIDATE,
        status=EntityStatus.ACTIVE,
        is_verified=False,
    )

    _send_verification_email(user)

    return {
        'id': str(user.id),
        'email': user.email,
        'name': user.username,
    }


def verify_email_service(data):
    """Verify user email using a token."""
    token_str = data['token']

    try:
        auth_token = AuthToken.objects.select_related('user').get(
            token=token_str,
            type=TokenType.VERIFY_EMAIL,
            status=EntityStatus.ACTIVE,
        )
    except AuthToken.DoesNotExist:
        raise ValueError('Invalid or expired token.')

    if auth_token.expires_at < timezone.now():
        raise ValueError('Invalid or expired token.')

    user = auth_token.user
    if user.status == EntityStatus.BLOCKED:
        raise ValueError('This account is blocked.')

    user.is_verified = True
    user.status = EntityStatus.ACTIVE
    user.save(update_fields=['is_verified', 'status'])

    auth_token.status = EntityStatus.DELETED
    auth_token.save(update_fields=['status'])

    tokens = get_tokens_for_user(user)
    return tokens


def forgot_password_service(data):
    """Initiate password reset — generate token and send email."""
    email = data['email']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError('User not found.')

    token = secrets.token_hex(32)
    expire_minutes = settings.PASSWORD_RESET_EXPIRE_MINUTES
    expires_at = timezone.now() + timedelta(minutes=expire_minutes)

    AuthToken.objects.create(
        token=token,
        user=user,
        type=TokenType.RESET_PASSWORD,
        expires_at=expires_at,
    )

    frontend_url = settings.FRONTEND_URL
    reset_link = f'{frontend_url}/reset-password?token={token}'

    try:
        send_email(
            to=user.email,
            subject='Password Reset Request — Extractor',
            template='forgot_password.html',
            context={
                'name': user.username,
                'reset_link': reset_link,
                'expire_minutes': expire_minutes,
            },
        )
    except Exception as e:
        logger.error(f'Reset email failed for {user.email}: {e}')
        raise ValueError('Failed to send reset email.')

    return {'message': 'Password reset link sent to email.'}


def reset_password_service(data):
    """Reset user password using a valid reset token."""
    token_str = data['token']
    new_password = data['new_password']
    confirm_password = data['confirm_password']

    if new_password != confirm_password:
        raise ValueError('Passwords do not match.')

    try:
        auth_token = AuthToken.objects.select_related('user').get(
            token=token_str,
            type=TokenType.RESET_PASSWORD,
            status=EntityStatus.ACTIVE,
        )
    except AuthToken.DoesNotExist:
        raise ValueError('Invalid or expired token.')

    if auth_token.expires_at < timezone.now():
        raise ValueError('Invalid or expired token.')

    user = auth_token.user
    user.set_password(new_password)
    user.save(update_fields=['password'])

    auth_token.status = EntityStatus.DELETED
    auth_token.save(update_fields=['status'])

    return {'message': 'Password reset successfully.'}


def change_password_service(user, data):
    """Change password for a logged-in user."""
    old_password = data['old_password']
    new_password = data['new_password']

    if not user.check_password(old_password):
        raise ValueError('Incorrect old password.')

    user.set_password(new_password)
    user.save(update_fields=['password'])

    return {'message': 'Password changed successfully.'}
