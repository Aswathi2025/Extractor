"""Users URL routing."""
from django.urls import path
from .views import (
    ProfileView,
    UserListView,
    UserDetailView,
    UpdateUserStatusView,
    UserResumeView,
)

urlpatterns = [
    path('profile', ProfileView.as_view(), name='user-profile'),
    path('', UserListView.as_view(), name='user-list'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('<uuid:pk>/status/', UpdateUserStatusView.as_view(), name='user-status-update'),
    path('<uuid:pk>/resume/', UserResumeView.as_view(), name='user-resume'),
]
