from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, EvidenceViewSet, SignatureViewSet, SimulationEventViewSet

router = DefaultRouter()
router.register('work-orders', WorkOrderViewSet)
router.register('evidences', EvidenceViewSet)
router.register('signatures', SignatureViewSet)
router.register('simulations', SimulationEventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
