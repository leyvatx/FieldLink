from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.utils.text import slugify
from .models import User, Company, SubscriptionPlan, CompanyPlan, CompanyConfiguration
from .validators import normalize_phone_e164


ROLE_PERMISSIONS = {
    User.Role.COMPANY: [
        'view.users.option',
        'view.subscription.option',
    ],
    User.Role.SUPERVISOR: [
        'view.users.option',
    ],
    User.Role.TECHNICIAN: [],
}

PLATFORM_ADMIN_PERMISSIONS = [
    'view.admin.menu',
    'view.companies.option',
    'view.roles.option',
    'view.log.option',
    'view.release_notes.option',
    'release_notes.general.manage_release_notes',
    'view.permissions.both',
    'permissions.view_both',
    'permissions.view_name',
    'roles.create',
    'roles.edit',
    'roles.delete',
    'permissions.create',
    'permissions.edit',
    'permissions.delete',
]


def _get_permissions_for_user(user):
    if getattr(user, 'is_superuser', False) or getattr(user, 'role', None) == User.Role.ADMIN:
        return PLATFORM_ADMIN_PERMISSIONS
    return ROLE_PERMISSIONS.get(user.role, [])


def _build_auth_payload(user):
    tokens = RefreshToken.for_user(user)

    response = {
        'access': str(tokens.access_token),
        'refresh': str(tokens),
        'user': {
            'id': str(user.id),
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'permissions': _get_permissions_for_user(user),
            'is_superuser': user.is_superuser,
        }
    }

    if user.company:
        response['user'].update({
            'company_id': str(user.company.id),
            'company_name': user.company.name,
            'company_slug': user.company.slug,
        })

    return response


class UserSerializer(serializers.ModelSerializer):
    """Basic user info (for lists and profile display)"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    permissions = serializers.SerializerMethodField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'role', 'company',
            'company_name', 'company_slug', 'is_active', 'permissions',
            'password', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company_name', 'company_slug', 'permissions', 'created_at', 'updated_at']
        extra_kwargs = {
            'company': {'required': False, 'allow_null': True},
        }

    def get_permissions(self, obj):
        return _get_permissions_for_user(obj)

    def validate_role(self, value):
        request = self.context.get('request')
        request_user = getattr(request, 'user', None)

        if (
            request_user
            and request_user.is_authenticated
            and not request_user.is_superuser
        ):
            if value == User.Role.ADMIN:
                raise serializers.ValidationError(
                    'Only platform admins can assign the admin role.'
                )

            if request_user.role == User.Role.SUPERVISOR and value != User.Role.TECHNICIAN:
                raise serializers.ValidationError(
                    'Supervisors can only create or manage technicians.'
                )
        return value

    def validate_company(self, value):
        request = self.context.get('request')
        request_user = getattr(request, 'user', None)

        # Non-superusers cannot assign users to another company.
        if (
            request_user
            and request_user.is_authenticated
            and not request_user.is_superuser
            and request_user.role != User.Role.ADMIN
        ):
            if value and request_user.company_id and value.id != request_user.company_id:
                raise serializers.ValidationError('Cannot assign user to a different company.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})

        request = self.context.get('request')
        request_user = getattr(request, 'user', None)

        if (
            request_user
            and request_user.is_authenticated
            and not request_user.is_superuser
            and request_user.role != User.Role.ADMIN
        ):
            validated_data['company'] = request_user.company
        elif validated_data.get('role') == User.Role.ADMIN:
            validated_data['company'] = None

        email = validated_data.pop('email')
        user = User.objects.create_user(email=email, password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        request = self.context.get('request')
        request_user = getattr(request, 'user', None)
        if (
            request_user
            and request_user.is_authenticated
            and not request_user.is_superuser
            and request_user.role != User.Role.ADMIN
        ):
            validated_data.pop('company', None)
        elif validated_data.get('role') == User.Role.ADMIN:
            validated_data['company'] = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user info (self only via /auth/me/)"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    permissions = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'role', 'company',
            'company_name', 'company_slug', 'is_active', 'mobile_id',
            'permissions', 'is_superuser', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_permissions(self, obj):
        return _get_permissions_for_user(obj)


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
            'permissions': _get_permissions_for_user(user),
            'is_superuser': user.is_superuser,
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
        return _build_auth_payload(user)


class RegisterSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=150)
    company_slug = serializers.CharField(max_length=150, required=False, allow_blank=True)
    name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_phone(self, value):
        return normalize_phone_e164(value, allow_blank=True)

    def validate_company_name(self, value):
        normalized_value = value.strip()
        if not normalized_value:
            raise serializers.ValidationError('Company name is required.')
        if Company.objects.filter(name__iexact=normalized_value).exists():
            raise serializers.ValidationError('A company with this name already exists.')
        return normalized_value

    def validate_company_slug(self, value):
        if not value:
            return ''

        normalized_value = slugify(value)
        if not normalized_value:
            raise serializers.ValidationError('Enter a valid company slug.')
        if Company.objects.filter(slug=normalized_value).exists():
            raise serializers.ValidationError('This company slug is already in use.')
        return normalized_value

    def validate_email(self, value):
        normalized_value = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        if Company.objects.filter(email__iexact=normalized_value).exists():
            raise serializers.ValidationError('A company with this contact email already exists.')
        return normalized_value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match'
            })
        return attrs

    def _generate_company_slug(self, company_name):
        base_slug = slugify(company_name) or 'fieldlink-company'
        candidate = base_slug
        suffix = 2

        while Company.objects.filter(slug=candidate).exists():
            candidate = f'{base_slug}-{suffix}'
            suffix += 1

        return candidate

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')

        company_name = validated_data.pop('company_name')
        company_slug = validated_data.pop('company_slug', '')
        owner_name = validated_data.pop('name')
        phone = validated_data.pop('phone', '')
        email = validated_data.pop('email')

        company = Company.objects.create(
            name=company_name,
            slug=company_slug or self._generate_company_slug(company_name),
            email=email,
            phone=phone,
        )

        CompanyConfiguration.objects.create(
            company=company,
            support_email=email,
            support_phone=phone,
        )

        user = User.objects.create_user(
            email=email,
            password=password,
            name=owner_name,
            phone=phone,
            role=User.Role.COMPANY,
            company=company,
        )

        return _build_auth_payload(user)


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
    plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)
    user_count = serializers.IntegerField(read_only=True)
    technician_count = serializers.IntegerField(read_only=True)
    active_orders = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'country',
            'is_active', 'is_trial', 'plan_name', 'user_count', 'technician_count',
            'active_orders', 'subscription_plan', 'plan_start_date', 'plan_end_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_phone(self, value):
        return normalize_phone_e164(value, allow_blank=True)


class CompanyConfigurationSerializer(serializers.ModelSerializer):
    """Company configuration for white-label setup"""
    labor_basic_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    labor_medium_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    labor_advanced_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    transport_near_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    transport_medium_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    transport_far_rate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, coerce_to_string=False)
    repair_pricing_ready = serializers.BooleanField(read_only=True)

    class Meta:
        model = CompanyConfiguration
        fields = [
            'id', 'company', 'logo', 'primary_color', 'secondary_color',
            'whatsapp_number', 'support_email', 'support_phone',
            'enable_customer_tracking', 'enable_offline_mode', 'enable_material_approval',
            'max_offline_sync_days', 'notify_on_completion', 'notify_on_technician_arrived',
            'labor_basic_rate', 'labor_medium_rate', 'labor_advanced_rate',
            'transport_near_rate', 'transport_medium_rate', 'transport_far_rate',
            'repair_pricing_ready', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']


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
