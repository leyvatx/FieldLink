from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SubscriptionPlanViewSet, UserPlanViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('plans', SubscriptionPlanViewSet)
router.register('user-plans', UserPlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
