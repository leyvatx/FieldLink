from django.apps import AppConfig


class OrdenesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ordenes'
    verbose_name = 'Work Orders'
    def ready(self):
        """Initialize signals when app is ready"""
        import apps.ordenes.signals