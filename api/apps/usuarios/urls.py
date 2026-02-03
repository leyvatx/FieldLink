from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, PlanSuscripcionViewSet, PlanUsuarioViewSet

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet)
router.register('planes', PlanSuscripcionViewSet)
router.register('planes-usuario', PlanUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
