from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdenServicioViewSet, EvidenciaViewSet, FirmaViewSet, SimulacionEventoViewSet

router = DefaultRouter()
router.register('ordenes', OrdenServicioViewSet)
router.register('evidencias', EvidenciaViewSet)
router.register('firmas', FirmaViewSet)
router.register('simulaciones', SimulacionEventoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
