from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    ServiceRequestViewSet,
    BlacklistViewSet,
    public_service_request_view,
)

router = DefaultRouter()
router.register('customers', CustomerViewSet, basename='customer')
router.register('service-requests', ServiceRequestViewSet, basename='service-request')
router.register('blacklist', BlacklistViewSet, basename='blacklist')

urlpatterns = [
    path('public/companies/<slug:company_slug>/service-requests/', public_service_request_view, name='public_service_request'),
    path('', include(router.urls)),
]
