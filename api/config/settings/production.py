"""
Production settings for FieldLink.
Usage: DJANGO_SETTINGS_MODULE=config.settings.production
"""

from .base import *  # noqa: F401,F403

DEBUG = False


ALLOWED_HOSTS = env_list(
    'ALLOWED_HOSTS',
    'fieldlinkapp.com,www.fieldlinkapp.com,108.175.9.159,localhost,127.0.0.1'
)

# Database - Docker PostgreSQL service
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

# Browser origins:
# - keep production domain(s) explicit
# - allow localhost / 127.0.0.1 on any port for local web clients
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'https://fieldlinkapp.com,https://www.fieldlinkapp.com'
)
CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$'
)
CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    'https://fieldlinkapp.com,https://www.fieldlinkapp.com,http://localhost,http://127.0.0.1'
)

# Swagger - admin only in production
SPECTACULAR_SETTINGS['SERVE_PERMISSIONS'] = ['rest_framework.permissions.IsAdminUser']

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = False      # Set True when HTTPS is enabled
SESSION_COOKIE_SECURE = False   # Set True when HTTPS is enabled
# SECURE_SSL_REDIRECT = True    # Uncomment when HTTPS is enabled
