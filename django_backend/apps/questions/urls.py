"""Questions URL routing."""
from django.urls import path
from .views import GenerateQuestionView, QuestionListCreateView, QuestionDetailView

urlpatterns = [
    path('generate', GenerateQuestionView.as_view(), name='question-generate'),
    path('', QuestionListCreateView.as_view(), name='question-list-create'),
    path('<uuid:pk>/', QuestionDetailView.as_view(), name='question-detail'),
]
