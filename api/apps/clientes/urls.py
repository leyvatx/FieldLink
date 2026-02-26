from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ServiceRequestViewSet, BlacklistViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet, basename='customer')
router.register('service-requests', ServiceRequestViewSet, basename='service-request')
router.register('blacklist', BlacklistViewSet, basename='blacklist')

urlpatterns = [
    path('', include(router.urls)),
]
