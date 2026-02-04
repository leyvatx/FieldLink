from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TechnicianLocationViewSet

router = DefaultRouter()
router.register('locations', TechnicianLocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
