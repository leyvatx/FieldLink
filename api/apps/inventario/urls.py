from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, InventarioTecnicoViewSet, MaterialUsadoViewSet

router = DefaultRouter()
router.register('materiales', MaterialViewSet)
router.register('inventario-tecnico', InventarioTecnicoViewSet)
router.register('materiales-usados', MaterialUsadoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
