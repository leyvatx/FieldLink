from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Company, SubscriptionPlan, CompanyPlan, CompanyConfiguration


class UserSerializer(serializers.ModelSerializer):
    """Basic user info (for lists and profile display)"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role', 'company', 'company_name', 'company_slug', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user info (self only via /auth/me/)"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role', 'company', 'company_name', 'company_slug', 'is_active', 'mobile_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer.
    Returns user info along with tokens.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user information to response
        user = self.user
        user_data = {
            'id': str(user.id),
            'email': user.email,
            'name': user.name,
            'role': user.role,
        }
        # Add company info (superusers may not have company)
        if user.company:
            user_data.update({
                'company_id': str(user.company.id),
                'company_name': user.company.name,
                'company_slug': user.company.slug,
            })
        data['user'] = user_data
        
        return data
    
    @classmethod
    def get_token(cls, user):
        """Add custom claims to JWT token"""
        token = super().get_token(user)
        
        # Custom claims for frontend routing
        token['user_id'] = str(user.id)
        token['email'] = user.email
        token['role'] = user.role
        if user.company:
            token['company_id'] = str(user.company.id)
            token['company_slug'] = user.company.slug
        
        return token


class LoginSerializer(serializers.Serializer):
    """
    Email + password login.
    Returns JWT tokens and user data.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password required')
        
        # Authenticate user
        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User is inactive')
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')
        
        attrs['user'] = user
        return attrs
    
    def create(self, validated_data):
        """Generate tokens with user + company data for frontend routing"""
        user = validated_data['user']
        tokens = RefreshToken.for_user(user)
        
        response = {
            'access': str(tokens.access_token),
            'refresh': str(tokens),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.name,
                'role': user.role,
            }
        }
        # Add company info (superusers may not have company)
        if user.company:
            response['user'].update({
                'company_id': str(user.company.id),
                'company_name': user.company.name,
                'company_slug': user.company.slug,
            })
        return response


class ChangePasswordSerializer(serializers.Serializer):
    """Change user password"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match'})
        
        user = self.context['request'].user
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({'old_password': 'Current password is incorrect'})
        
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class CompanySerializer(serializers.ModelSerializer):
    """Company/Tenant information"""
    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'country', 'is_active', 'is_trial', 'created_at']
        read_only_fields = ['id', 'created_at']


class CompanyConfigurationSerializer(serializers.ModelSerializer):
    """Company configuration for white-label setup"""
    class Meta:
        model = CompanyConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Subscription plan details"""
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompanyPlanSerializer(serializers.ModelSerializer):
    """Active subscription for company"""
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = CompanyPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
