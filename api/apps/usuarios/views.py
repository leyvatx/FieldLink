from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Company, SubscriptionPlan, CompanyPlan, CompanyConfiguration
from .serializers import (
    UserSerializer, UserDetailSerializer, CustomTokenObtainPairSerializer,
    LoginSerializer, ChangePasswordSerializer, CompanySerializer,
    CompanyConfigurationSerializer, SubscriptionPlanSerializer, CompanyPlanSerializer
)
from .permissions import IsOwner, IsDispatcherOrOwner, IsSameCompany, IsTechnician
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT Token endpoint.
    POST /api/auth/token/
    Body: { "email": "user@example.com", "password": "password123" }
    Returns: { "access": "jwt_token", "refresh": "refresh_token", "user": {...} }
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


@extend_schema(request=LoginSerializer, responses={200: inline_serializer('LoginResponse', fields={'access': drf_serializers.CharField(), 'refresh': drf_serializers.CharField(), 'user': drf_serializers.DictField()})})
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login endpoint (alternative to token/).
    POST /api/auth/login/
    Body: { "email": "user@example.com", "password": "password123" }
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        tokens = serializer.save()
        return Response(tokens, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(request=inline_serializer('LogoutRequest', fields={'refresh': drf_serializers.CharField()}), responses={200: inline_serializer('LogoutResponse', fields={'detail': drf_serializers.CharField()})})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint - blacklist refresh token.
    POST /api/auth/logout/
    Header: Authorization: Bearer <access_token>
    """
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'detail': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(responses={200: UserDetailSerializer})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Get current user profile.
    GET /api/auth/me/
    Header: Authorization: Bearer <access_token>
    """
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)


@extend_schema(request=ChangePasswordSerializer, responses={200: inline_serializer('PasswordChangeResponse', fields={'detail': drf_serializers.CharField()})})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Change user password.
    POST /api/auth/change-password/
    Body: { "old_password": "...", "new_password": "...", "new_password_confirm": "..." }
    """
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'detail': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# USER MANAGEMENT (ADMIN ONLY)
# ============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """
    User management - OWNER ONLY.
    Lists users in same company.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Filter users by company"""
        user = self.request.user
        queryset = User.objects.filter(company=user.company)
        
        # Optional filters
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def technicians(self, request):
        """Get all technicians in company"""
        technicians = self.get_queryset().filter(role='TECHNICIAN')
        serializer = self.get_serializer(technicians, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dispatchers(self, request):
        """Get all dispatchers in company"""
        dispatchers = self.get_queryset().filter(role='DISPATCHER')
        serializer = self.get_serializer(dispatchers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def owners(self, request):
        """Get all owners in company"""
        owners = self.get_queryset().filter(role='OWNER')
        serializer = self.get_serializer(owners, many=True)
        return Response(serializer.data)


# ============================================================================
# COMPANY MANAGEMENT
# ============================================================================

class CompanyViewSet(viewsets.ModelViewSet):
    """
    Company management - OWNER ONLY.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Owner can only see their own company"""
        if self.request.user.is_superuser:
            return Company.objects.all()
        return Company.objects.filter(id=self.request.user.company_id)
    
    @action(detail=False, methods=['get'])
    def my_company(self, request):
        """Get current user's company"""
        serializer = self.get_serializer(request.user.company)
        return Response(serializer.data)


class CompanyConfigurationViewSet(viewsets.ModelViewSet):
    """
    Company configuration for white-label setup - OWNER ONLY.
    """
    serializer_class = CompanyConfigurationSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Get configuration for user's company"""
        return CompanyConfiguration.objects.filter(company=self.request.user.company)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def my_config(self, request):
        """Get or update current company config"""
        try:
            config = CompanyConfiguration.objects.get(company=request.user.company)
        except CompanyConfiguration.DoesNotExist:
            return Response(
                {'error': 'Configuration not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        
        serializer = self.get_serializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# SUBSCRIPTION PLAN MANAGEMENT
# ============================================================================

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View available subscription plans.
    Anyone can read, only admins can modify.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]


class CompanyPlanViewSet(viewsets.ModelViewSet):
    """
    Company subscription management - OWNER ONLY.
    Only the business owner can manage billing and subscription.
    """
    serializer_class = CompanyPlanSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Get subscription for user's company"""
        return CompanyPlan.objects.filter(company=self.request.user.company)
    
    @action(detail=False, methods=['get'])
    def current_plan(self, request):
        """Get current active subscription"""
        try:
            plan = CompanyPlan.objects.get(
                company=request.user.company,
                status='ACTIVE'
            )
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        except CompanyPlan.DoesNotExist:
            return Response(
                {'error': 'No active subscription'},
                status=status.HTTP_404_NOT_FOUND
            )
        if status:
            queryset = queryset.filter(status=status)
        return queryset
