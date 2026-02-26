from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, TokenRefreshView, login_view, logout_view, me_view,
    change_password_view, UserViewSet, CompanyViewSet, CompanyConfigurationViewSet,
    SubscriptionPlanViewSet, CompanyPlanViewSet
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('companies', CompanyViewSet, basename='company')
router.register('company-config', CompanyConfigurationViewSet, basename='company-config')
router.register('subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register('company-plans', CompanyPlanViewSet, basename='company-plan')

urlpatterns = [
    # Authentication endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/change-password/', change_password_view, name='change_password'),
    
    # Router endpoints
    path('', include(router.urls)),
]
