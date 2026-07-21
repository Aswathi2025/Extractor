"""Dashboard URL routing."""
from django.urls import path
from .views import AdminDashboardView, CandidateDashboardView

urlpatterns = [
    path('stats', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('candidate', CandidateDashboardView.as_view(), name='dashboard-candidate'),
]
