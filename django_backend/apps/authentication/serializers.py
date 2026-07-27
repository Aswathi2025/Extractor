"""
DRF Serializers for the authentication module.
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_name(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(default=False, required=False)


class VerifyOTPSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Either user_id or email must be provided.')
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError('Either user_id or email must be provided.')
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False)
