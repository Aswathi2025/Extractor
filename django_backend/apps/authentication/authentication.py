"""
Cookie-based JWT authentication class for DRF.
Reads the access token from the HTTP-only cookie instead of Authorization header.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticates users via JWT stored in an HTTP-only cookie.
    Falls back to Authorization header if cookie is not present.
    """

    def authenticate(self, request):
        # Try cookie first
        raw_token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE)

        if raw_token is None:
            # Fall back to standard Authorization header
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None

        return self.get_user(validated_token), validated_token
