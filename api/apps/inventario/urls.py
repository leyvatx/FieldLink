from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialViewSet,
    TechnicianInventoryViewSet,
    UsedMaterialViewSet,
    CentralWarehouseViewSet,
    MaterialApprovalViewSet,
    RestockHistoryViewSet,
)

router = DefaultRouter()
router.register('materials', MaterialViewSet, basename='material')
router.register('technician-inventory', TechnicianInventoryViewSet, basename='technician-inventory')
router.register('used-materials', UsedMaterialViewSet, basename='used-material')
router.register('central-warehouse', CentralWarehouseViewSet, basename='central-warehouse')
router.register('material-approvals', MaterialApprovalViewSet, basename='material-approval')
router.register('restock-history', RestockHistoryViewSet, basename='restock-history')

urlpatterns = [
    path('', include(router.urls)),
]
