"""
Django settings for extractor project — base configuration.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# ── Base directory ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from the project root (django_backend/)
load_dotenv(BASE_DIR / '.env')

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-fallback-key')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ── Applications ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Local apps
    'apps.authentication',
    'apps.users',
    'apps.jobs',
    'apps.skills',
    'apps.questions',
    'apps.applications',
    'apps.tests',
    'apps.dashboard',
]

# ── Middleware ─────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'utils.middleware.TrailingSlashMiddleware',
    'utils.middleware.ExceptionLoggingMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

APPEND_SLASH = False
ROOT_URLCONF = 'extractor.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'extractor.wsgi.application'

# ── Database (MySQL) ───────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'extractor_db'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# ── Custom User Model ──────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.User'

# ── Password Validation ────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ───────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ── Static Files ───────────────────────────────────────────────────────────────
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Django REST Framework ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.authentication.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',
}

# ── SimpleJWT ──────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 10))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        hours=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_HOURS', 720))
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ── Cookie names for JWT ────────────────────────────────────────────────────────
JWT_ACCESS_COOKIE = 'access_token'
JWT_REFRESH_COOKIE = 'refresh_token'
JWT_COOKIE_SECURE = False          # Set True in production (HTTPS only)
JWT_COOKIE_HTTPONLY = True
JWT_COOKIE_SAMESITE = 'Lax'

# ── CORS ────────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    'ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ── Email ──────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('MAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('MAIL_EMAIL', '')
EMAIL_HOST_PASSWORD = os.environ.get('MAIL_PASS', '')
DEFAULT_FROM_EMAIL = os.environ.get('MAIL_EMAIL', 'noreply@extractor.com')

# ── Backblaze B2 ───────────────────────────────────────────────────────────────
BACKBLAZE_BUCKET_NAME = os.environ.get('BACKBLAZE_BUCKET_NAME', '')
BACKBLAZE_ENDPOINT = os.environ.get('BACKBLAZE_ENDPOINT', '')
BACKBLAZE_REGION = os.environ.get('BACKBLAZE_REGION', '')
BACKBLAZE_KEY_ID = os.environ.get('BACKBLAZE_KEY_ID', '')
BACKBLAZE_APP_KEY = os.environ.get('BACKBLAZE_APP_KEY', '')

# ── Groq AI ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

# ── Token expiry ───────────────────────────────────────────────────────────────
VERIFICATION_EXPIRE_HOURS = int(os.environ.get('VERIFICATION_EXPIRE_HOURS', 24))
PASSWORD_RESET_EXPIRE_MINUTES = int(os.environ.get('PASSWORD_RESET_EXPIRE_MINUTES', 15))
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# ── drf-spectacular (Swagger) ──────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'Extractor API',
    'DESCRIPTION': 'AI-powered recruitment and resume extraction platform.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SECURITY': [{'cookieAuth': []}],
    'COMPONENTS': {
        'securitySchemes': {
            'cookieAuth': {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'access_token',
            }
        }
    },
}

# ── Logging ────────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
