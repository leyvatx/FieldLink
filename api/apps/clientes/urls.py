from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, SolicitudServicioViewSet, ListaNegraViewSet

router = DefaultRouter()
router.register('clientes', ClienteViewSet)
router.register('solicitudes', SolicitudServicioViewSet)
router.register('lista-negra', ListaNegraViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
