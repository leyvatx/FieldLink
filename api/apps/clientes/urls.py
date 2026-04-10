from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    PublicLandingViewSet,
    ServiceRequestViewSet,
    BlacklistViewSet,
    public_landing_view,
    public_service_request_by_landing_view,
    public_service_request_by_host_view,
    public_service_request_view,
)

router = DefaultRouter()
router.register('customers', CustomerViewSet, basename='customer')
router.register('public-landings', PublicLandingViewSet, basename='public-landing')
router.register('service-requests', ServiceRequestViewSet, basename='service-request')
router.register('blacklist', BlacklistViewSet, basename='blacklist')

urlpatterns = [
    path('public/landing/', public_landing_view, name='public_landing'),
    path('public/service-requests/', public_service_request_by_host_view, name='public_service_request_by_host'),
    path(
        'public/companies/<slug:company_slug>/landings/<slug:landing_slug>/service-requests/',
        public_service_request_by_landing_view,
        name='public_service_request_by_landing',
    ),
    path('public/companies/<slug:company_slug>/service-requests/', public_service_request_view, name='public_service_request'),
    path('', include(router.urls)),
]
