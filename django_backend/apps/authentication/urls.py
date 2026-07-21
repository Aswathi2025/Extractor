"""Auth URLs — mirrors Express /auth/* routes."""
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    LogoutView,
    RefreshTokenView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth-register'),
    path('login', LoginView.as_view(), name='auth-login'),
    path('verify-email', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('forgot-password', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('change-password', ChangePasswordView.as_view(), name='auth-change-password'),
    path('logout', LogoutView.as_view(), name='auth-logout'),
    path('refresh', RefreshTokenView.as_view(), name='auth-refresh'),
]
