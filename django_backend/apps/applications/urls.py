"""Applications URL routing."""
from django.urls import path
from .views import (
    MyApplicationsView,
    CurrentResumeView,
    UploadResumeView,
    CreateApplicationView,
    ApplicationListView,
    ApplicationDetailView,
    UpdateApplicationStatusView,
)

urlpatterns = [
    path('me', MyApplicationsView.as_view(), name='application-me'),
    path('resume', CurrentResumeView.as_view(), name='application-resume-get'),
    path('', ApplicationListView.as_view(), name='application-list'),
    path('apply', CreateApplicationView.as_view(), name='application-create'),
    path('upload-resume', UploadResumeView.as_view(), name='application-upload-resume'),
    path('<uuid:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('<uuid:pk>/status/', UpdateApplicationStatusView.as_view(), name='application-status-update'),
]
