"""
Authentication API views.
Mirrors the Node.js controller.js and index.js (routes).
All responses set JWT tokens in HTTP-only cookies.
"""
import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    VerifyEmailSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
)
from .services import (
    login_user,
    register_user,
    verify_email_service,
    forgot_password_service,
    reset_password_service,
    change_password_service,
)

logger = logging.getLogger(__name__)

COOKIE_SETTINGS = {
    'httponly': settings.JWT_COOKIE_HTTPONLY,
    'secure': settings.JWT_COOKIE_SECURE,
    'samesite': settings.JWT_COOKIE_SAMESITE,
}


def _set_jwt_cookies(response, access_token, refresh_token):
    """Helper: set access + refresh tokens in HTTP-only cookies."""
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    response.set_cookie(
        settings.JWT_ACCESS_COOKIE,
        access_token,
        max_age=int(access_lifetime.total_seconds()),
        **COOKIE_SETTINGS,
    )
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE,
        refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        **COOKIE_SETTINGS,
    )
    return response


class RegisterView(APIView):
    """POST /api/v1/auth/register"""
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = register_user(serializer.validated_data)
            return Response(
                {'success': True, 'message': 'Registration successful. Please verify your email.', 'data': result},
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """POST /api/v1/auth/login"""
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = login_user(serializer.validated_data)
            response = Response(
                {
                    'success': True,
                    'message': 'Login successfully',
                    'accessToken': result['access'],
                    'refreshToken': result['refresh'],
                    'data': {
                        'name': result['name'],
                        'role': result['role'],
                    },
                },
                status=status.HTTP_200_OK,
            )
            _set_jwt_cookies(response, result['access'], result['refresh'])
            return response
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """POST /api/v1/auth/verify-email"""
    permission_classes = [AllowAny]

    @extend_schema(request=VerifyEmailSerializer)
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            tokens = verify_email_service(serializer.validated_data)
            response = Response(
                {
                    'success': True,
                    'message': 'Email verified successfully.',
                    'accessToken': tokens['access'],
                    'refreshToken': tokens['refresh'],
                },
                status=status.HTTP_200_OK,
            )
            _set_jwt_cookies(response, tokens['access'], tokens['refresh'])
            return response
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password"""
    permission_classes = [AllowAny]

    @extend_schema(request=ForgotPasswordSerializer)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = forgot_password_service(serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password"""
    permission_classes = [AllowAny]

    @extend_schema(request=ResetPasswordSerializer)
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = reset_password_service(serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password"""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = change_password_service(request.user, serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """POST /api/v1/auth/logout"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}},
        description="Logout by clearing JWT cookies and blacklisting the refresh token."
    )
    def post(self, request):
        # Blacklist the refresh token
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE) or request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.JWT_ACCESS_COOKIE)
        response.delete_cookie(settings.JWT_REFRESH_COOKIE)
        return response


class RefreshTokenView(APIView):
    """POST /api/v1/auth/refresh — exchange refresh token for new access token"""
    permission_classes = [AllowAny]

    @extend_schema(
        request=None,
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}},
        description="Exchange refresh token cookie for a new access token."
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE) or request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token not provided.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            response = Response({
                'success': True,
                'message': 'Token refreshed.',
                'accessToken': access_token,
            }, status=status.HTTP_200_OK)
            access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            response.set_cookie(
                settings.JWT_ACCESS_COOKIE,
                access_token,
                max_age=int(access_lifetime.total_seconds()),
                **COOKIE_SETTINGS,
            )
            return response
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
