"""
Authentication service layer using OTP for verification and password reset.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTP, EntityStatus, UserRole
from utils.email_utils import send_email
from utils.otp_utils import generate_otp

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


def _send_verification_otp(user):
    """Generate a 6-digit OTP with 5 minutes expiration and send email."""
    # Delete old OTPs for this user
    OTP.objects.filter(user=user).delete()

    otp_code = generate_otp(6)
    expires_at = timezone.now() + timedelta(minutes=5)

    OTP.objects.create(
        user=user,
        otp=otp_code,
        expires_at=expires_at,
    )

    try:
        send_email(
            to=user.email,
            subject='Verify Your Email — OTP Code',
            template='verify_email.html',
            context={
                'name': user.username,
                'otp': otp_code,
                'expire_minutes': 5,
            },
        )
    except Exception as e:
        logger.error(f'Verification email failed for {user.email}: {e}')


def register_user(data):
    """Register a new candidate user and send verification OTP."""
    name = data['name']
    email = data['email']
    password = data['password']

    if User.objects.filter(email=email).exists():
        existing = User.objects.get(email=email)
        if existing.status == EntityStatus.BLOCKED:
            raise ValueError('This account is blocked. Please contact support.')
        if not existing.is_verified:
            # If user exists but is unverified, re-send OTP
            _send_verification_otp(existing)
            return {
                'id': str(existing.id),
                'email': existing.email,
                'name': existing.username,
            }
        raise ValueError('This user already exists.')

    user = User.objects.create_user(
        email=email,
        username=name,
        password=password,
        role=UserRole.CANDIDATE,
        status=EntityStatus.ACTIVE,
        is_verified=False,
    )

    _send_verification_otp(user)

    return {
        'id': str(user.id),
        'email': user.email,
        'name': user.username,
    }


def verify_otp_service(data):
    """Verify user email using OTP."""
    user_id = data.get('user_id')
    email = data.get('email')
    otp_code = data.get('otp')

    try:
        if user_id:
            user = User.objects.get(id=user_id)
        elif email:
            user = User.objects.get(email=email)
        else:
            raise ValueError('User identifier is missing.')
    except User.DoesNotExist:
        raise ValueError('User not found.')

    if user.status == EntityStatus.BLOCKED:
        raise ValueError('This account is blocked.')

    otp_record = OTP.objects.filter(user=user, otp=otp_code).first()

    if not otp_record:
        raise ValueError('Invalid OTP code.')

    if otp_record.expires_at < timezone.now():
        otp_record.delete()
        raise ValueError('OTP has expired. Please request a new one.')

    user.is_verified = True
    user.status = EntityStatus.ACTIVE
    user.save(update_fields=['is_verified', 'status'])

    # Clear all OTPs for user once verified
    OTP.objects.filter(user=user).delete()

    tokens = get_tokens_for_user(user)
    return {
        'tokens': tokens,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'name': user.username,
            'role': user.role,
        }
    }


def resend_otp_service(data):
    """Resend OTP code to user's email."""
    user_id = data.get('user_id')
    email = data.get('email')

    try:
        if user_id:
            user = User.objects.get(id=user_id)
        elif email:
            user = User.objects.get(email=email)
        else:
            raise ValueError('User identifier is missing.')
    except User.DoesNotExist:
        raise ValueError('User not found.')

    if user.is_verified:
        raise ValueError('User email is already verified.')

    _send_verification_otp(user)
    return {'message': 'OTP resent successfully to your email.'}


def forgot_password_service(data):
    """Initiate password reset — generate 5-min OTP and send email."""
    email = data['email']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError('User not found.')

    OTP.objects.filter(user=user).delete()

    otp_code = generate_otp(6)
    expires_at = timezone.now() + timedelta(minutes=5)

    OTP.objects.create(
        user=user,
        otp=otp_code,
        expires_at=expires_at,
    )

    try:
        send_email(
            to=user.email,
            subject='Password Reset OTP — Extractor',
            template='forgot_password.html',
            context={
                'name': user.username,
                'otp': otp_code,
                'expire_minutes': 5,
            },
        )
    except Exception as e:
        logger.error(f'Reset email failed for {user.email}: {e}')
        raise ValueError('Failed to send reset email.')

    return {'message': 'Password reset OTP sent to email.'}


def reset_password_service(data):
    """Reset user password using a valid OTP code."""
    email = data['email']
    otp_code = data['otp']
    new_password = data['new_password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise ValueError('User not found.')

    otp_record = OTP.objects.filter(user=user, otp=otp_code).first()

    if not otp_record:
        raise ValueError('Invalid OTP code.')

    if otp_record.expires_at < timezone.now():
        otp_record.delete()
        raise ValueError('OTP has expired. Please request a new one.')

    user.set_password(new_password)
    user.save(update_fields=['password'])

    OTP.objects.filter(user=user).delete()

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
