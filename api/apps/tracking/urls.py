from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TechnicianLocationViewSet, LocationGeoFenceViewSet, public_tracking_view

router = DefaultRouter()
router.register('locations', TechnicianLocationViewSet, basename='location')
router.register('geofences', LocationGeoFenceViewSet, basename='geofence')

urlpatterns = [
    # Public tracking endpoint (NO LOGIN REQUIRED)
    path('public/<str:tracking_token>/', public_tracking_view, name='public_tracking'),
    
    # Router endpoints (PROTECTED)
    path('', include(router.urls)),
]
