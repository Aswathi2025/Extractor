"""
Dashboard app — views and URLs.
Mirrors dashboard/controller.js (getDashboardStats, getCandidateDashboardStats).
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.authentication.models import User, UserRole
from apps.authentication.permissions import IsAdmin, IsCandidate
from apps.jobs.models import JobRole
from apps.applications.models import Application, ApplicationStatus
from apps.tests.models import Test


class AdminDashboardView(APIView):
    """GET /api/v1/dashboard/stats — admin stats"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from datetime import timedelta
        from django.utils.timezone import now
        from django.db.models import Count
        from django.db.models.functions import TruncDate

        thirty_days_ago = now() - timedelta(days=30)
        apps_over_time_qs = (
            Application.objects.filter(applied_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('applied_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        applications_over_time = [
            {'date': item['date'].strftime('%b %d'), 'count': item['count']}
            for item in apps_over_time_qs
        ]

        stats = {
            'total_users': User.objects.filter(role=UserRole.CANDIDATE).count(),
            'total_jobs': JobRole.objects.filter(status='ACTIVE').count(),
            'total_applications': Application.objects.count(),
            'pending_applications': Application.objects.filter(status=ApplicationStatus.PENDING).count(),
            'accepted_applications': Application.objects.filter(status=ApplicationStatus.ACCEPTED).count(),
            'rejected_applications': Application.objects.filter(status=ApplicationStatus.REJECTED).count(),
            'applications_by_status': {
                s.value: Application.objects.filter(status=s).count()
                for s in ApplicationStatus
            },
            'applications_over_time': applications_over_time,
        }
        return Response(stats)


class CandidateDashboardView(APIView):
    """GET /api/v1/dashboard/candidate — candidate stats"""
    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        user = request.user
        applications = Application.objects.filter(user=user)
        tests = Test.objects.filter(user=user)

        stats = {
            'total_applications': applications.count(),
            'pending': applications.filter(status=ApplicationStatus.PENDING).count(),
            'accepted': applications.filter(status=ApplicationStatus.ACCEPTED).count(),
            'rejected': applications.filter(status=ApplicationStatus.REJECTED).count(),
            'total_tests': tests.count(),
            'completed_tests': tests.filter(is_completed=True).count(),
            'average_test_score': (
                tests.filter(is_completed=True, score__isnull=False)
                .values_list('score', flat=True)
            ),
        }
        scores = list(stats.pop('average_test_score'))
        stats['average_test_score'] = round(sum(scores) / len(scores), 2) if scores else None

        return Response(stats)
