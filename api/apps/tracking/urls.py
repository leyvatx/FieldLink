from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UbicacionTecnicoViewSet

router = DefaultRouter()
router.register('ubicaciones', UbicacionTecnicoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
