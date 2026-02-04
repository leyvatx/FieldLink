from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ServiceRequestViewSet, BlacklistViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet)
router.register('service-requests', ServiceRequestViewSet)
router.register('blacklist', BlacklistViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
