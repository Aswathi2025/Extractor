"""Jobs URL routing."""
from django.urls import path
from .views import GenerateJobDescriptionView, JobListCreateView, JobDetailView

urlpatterns = [
    path('generate-description', GenerateJobDescriptionView.as_view(), name='job-generate-description'),
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('<uuid:pk>/', JobDetailView.as_view(), name='job-detail'),
]
