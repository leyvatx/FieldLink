from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, TechnicianInventoryViewSet, UsedMaterialViewSet

router = DefaultRouter()
router.register('materials', MaterialViewSet)
router.register('technician-inventory', TechnicianInventoryViewSet)
router.register('used-materials', UsedMaterialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
