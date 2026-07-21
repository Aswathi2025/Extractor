"""Tests URL routing."""
from django.urls import path
from .views import MyTestsView, AdminTestDetailView, TestDetailView, SubmitTestView, EvaluateTestView

urlpatterns = [
    path('me', MyTestsView.as_view(), name='test-me'),
    path('admin/<uuid:pk>/', AdminTestDetailView.as_view(), name='test-admin-detail'),
    path('<uuid:pk>/', TestDetailView.as_view(), name='test-detail'),
    path('<uuid:pk>/submit/', SubmitTestView.as_view(), name='test-submit'),
    path('<uuid:pk>/evaluate/', EvaluateTestView.as_view(), name='test-evaluate'),
]
