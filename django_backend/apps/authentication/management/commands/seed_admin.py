"""
Management command: python manage.py seed_admin
Creates the default admin user from ADMIN_MAIL and ADMIN_PASS env vars.
Mirrors the Node.js seed:admin npm script.
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.authentication.models import User, UserRole, EntityStatus


class Command(BaseCommand):
    help = 'Seed the initial admin user from ADMIN_MAIL and ADMIN_PASS env variables.'

    def handle(self, *args, **options):
        email = settings.ADMIN_MAIL if hasattr(settings, 'ADMIN_MAIL') else os.environ.get('ADMIN_MAIL', 'admin@gmail.com')
        password = os.environ.get('ADMIN_PASS', 'Admin@123')
        username = 'Admin'

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Admin user already exists: {email}'))
            return

        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
            role=UserRole.ADMIN,
            status=EntityStatus.ACTIVE,
            is_verified=True,
        )
        self.stdout.write(self.style.SUCCESS(f'[SUCCESS] Admin user created: {email}'))
