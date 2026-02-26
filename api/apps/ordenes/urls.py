from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, EvidenceViewSet, SignatureViewSet, SimulationEventViewSet

router = DefaultRouter()
router.register('work-orders', WorkOrderViewSet, basename='workorder')
router.register('evidences', EvidenceViewSet, basename='evidence')
router.register('signatures', SignatureViewSet, basename='signature')
router.register('simulations', SimulationEventViewSet, basename='simulation')

urlpatterns = [
    path('', include(router.urls)),
]
