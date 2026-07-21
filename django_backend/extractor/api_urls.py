"""API v1 URL router — aggregates all app URLs."""
from django.urls import path, include

urlpatterns = [
    # Health check
    path('health/', include('apps.authentication.health_urls')),
    # Authentication
    path('auth/', include('apps.authentication.urls')),
    # Users
    path('users/', include('apps.users.urls')),
    # Jobs
    path('jobs/', include('apps.jobs.urls')),
    # Skills
    path('skills/', include('apps.skills.urls')),
    # Questions
    path('questions/', include('apps.questions.urls')),
    # Applications
    path('applications/', include('apps.applications.urls')),
    # Tests
    path('tests/', include('apps.tests.urls')),
    # Dashboard
    path('dashboard/', include('apps.dashboard.urls')),
]
