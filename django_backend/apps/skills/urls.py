"""Skills URL routing."""
from django.urls import path
from .views import SkillListCreateView, SkillDeleteView

urlpatterns = [
    path('', SkillListCreateView.as_view(), name='skill-list-create'),
    path('<uuid:pk>/', SkillDeleteView.as_view(), name='skill-delete'),
]
