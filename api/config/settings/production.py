"""
Production settings for FieldLink.
Usage: DJANGO_SETTINGS_MODULE=config.settings.production
"""

from .base import *  # noqa: F401,F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '108.175.9.159,localhost').split(',')

# Database — Docker PostgreSQL service
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'fieldlink'),
        'USER': os.environ.get('DB_USER', 'fieldlink'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS — restrict in production
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://108.175.9.159:8000'
).split(',')

# Swagger — admin only in production
SPECTACULAR_SETTINGS['SERVE_PERMISSIONS'] = ['rest_framework.permissions.IsAdminUser']

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = False      # Set True when HTTPS is enabled
SESSION_COOKIE_SECURE = False   # Set True when HTTPS is enabled
# SECURE_SSL_REDIRECT = True    # Uncomment when HTTPS is enabled
