"""
Permission classes that mirror the Node.js middleware:
  authorize-admin.js  → IsAdmin
  authorize-candidate.js → IsCandidate
"""
from rest_framework.permissions import BasePermission
from .models import UserRole


class IsAdmin(BasePermission):
    """Allows access only to users with ADMIN role."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsCandidate(BasePermission):
    """Allows access only to users with CANDIDATE role."""
    message = 'Candidate access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.CANDIDATE
        )


class IsAdminOrSelf(BasePermission):
    """Admin can access any user; candidates can only access their own data."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        return obj == request.user
