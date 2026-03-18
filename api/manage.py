#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def apply_default_runserver_addr():
    if len(sys.argv) < 2 or sys.argv[1] != 'runserver':
        return

    has_addrport = any(not arg.startswith('-') for arg in sys.argv[2:])
    if not has_addrport:
        sys.argv.append('127.0.0.1:8001')


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
    apply_default_runserver_addr()
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
