from rest_framework import serializers
from django.utils.text import slugify
from django.conf import settings
from .models import Customer, ServiceRequest, Blacklist, PublicLanding
from apps.usuarios.validators import normalize_phone_e164


def _normalize_host(raw_host):
    host = (raw_host or '').strip().lower()
    if ':' in host:
        host = host.split(':', 1)[0]
    return host


def _build_share_links(request, company_slug, landing_slug):
    web_base_url = (getattr(settings, 'PUBLIC_WEB_BASE_URL', '') or '').strip().rstrip('/')
    if web_base_url:
        base_url = web_base_url
    else:
        host = _normalize_host(request.get_host()) if request else '127.0.0.1'
        scheme = 'https' if request and request.is_secure() else 'http'
        base_url = f'{scheme}://{host}'

    path_url = f'{base_url}/solicitud/{company_slug}/l/{landing_slug}'

    subdomain_url = None
    root_domain = (getattr(settings, 'PUBLIC_ROOT_DOMAIN', '') or '').strip().lower()
    if root_domain:
        subdomain_url = f'https://{company_slug}.{root_domain}/solicitud/l/{landing_slug}'

    return {
        'path_url': path_url,
        'subdomain_url': subdomain_url,
    }


def _generate_unique_landing_slug(company, source_text, exclude_pk=None):
    base_slug = slugify(source_text or '') or 'landing'
    candidate = base_slug
    suffix = 2

    queryset = PublicLanding.objects.filter(company=company)
    if exclude_pk:
        queryset = queryset.exclude(pk=exclude_pk)

    while queryset.filter(slug=candidate).exists():
        candidate = f'{base_slug}-{suffix}'
        suffix += 1

    return candidate


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def validate_phone(self, value):
        return normalize_phone_e164(value, allow_blank=False, field_label='El teléfono')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('latitude') is not None:
            data['latitude'] = float(data['latitude'])
        if data.get('longitude') is not None:
            data['longitude'] = float(data['longitude'])
        return data


class PublicLandingSerializer(serializers.ModelSerializer):
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True)
    share_links = serializers.SerializerMethodField(read_only=True)
    slug = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PublicLanding
        fields = [
            'id', 'company', 'company_slug',
            'name', 'slug', 'headline', 'subtitle', 'cta_text',
            'is_active', 'is_default',
            'created_by', 'created_by_name', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at', 'share_links',
        ]
        read_only_fields = [
            'id', 'company', 'company_slug',
            'created_by', 'created_by_name', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at', 'share_links',
        ]

    def validate_slug(self, value):
        if value == '':
            return ''
        normalized = slugify(value or '')
        if not normalized:
            raise serializers.ValidationError('Ingresa un slug válido para la landing.')
        return normalized

    def _resolve_company(self):
        request = self.context.get('request')
        if request and getattr(request, 'user', None):
            return getattr(request.user, 'company', None)
        return getattr(self.instance, 'company', None)

    def validate(self, attrs):
        company = self._resolve_company()
        raw_slug = attrs.get('slug', None)

        if raw_slug is None:
            # Partial updates may omit slug; keep current value.
            if self.instance is not None:
                attrs['slug'] = self.instance.slug
            else:
                attrs['slug'] = _generate_unique_landing_slug(
                    company=company,
                    source_text=attrs.get('name', ''),
                )
        elif raw_slug == '':
            attrs['slug'] = _generate_unique_landing_slug(
                company=company,
                source_text=attrs.get('name') or getattr(self.instance, 'name', ''),
                exclude_pk=getattr(self.instance, 'pk', None),
            )

        slug_candidate = attrs.get('slug')
        if company and slug_candidate:
            queryset = PublicLanding.objects.filter(company=company, slug=slug_candidate)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({'slug': 'Este slug de landing ya está en uso.'})

        is_default = attrs.get('is_default', getattr(self.instance, 'is_default', False))
        is_active = attrs.get('is_active', getattr(self.instance, 'is_active', True))
        if is_default and not is_active:
            raise serializers.ValidationError(
                {'is_active': 'La landing principal debe estar activa.'}
            )
        return attrs

    def get_share_links(self, obj):
        request = self.context.get('request')
        return _build_share_links(request, obj.company.slug, obj.slug)


class ServiceRequestSerializer(serializers.ModelSerializer):
    is_suspicious = serializers.SerializerMethodField(read_only=True)
    suspicious_reasons = serializers.SerializerMethodField(read_only=True)
    work_order_id = serializers.UUIDField(source='work_order.id', read_only=True)
    work_order_status = serializers.CharField(source='work_order.status', read_only=True)
    technician_name = serializers.CharField(source='work_order.technician.name', read_only=True)
    landing_name = serializers.CharField(source='landing.name', read_only=True)
    landing_slug = serializers.CharField(source='landing.slug', read_only=True)
    customer_name = serializers.CharField(
        max_length=150,
        trim_whitespace=True,
        allow_blank=False,
        error_messages={
            'blank': 'El nombre es obligatorio.',
            'required': 'El nombre es obligatorio.',
            'max_length': 'El nombre no puede exceder 150 caracteres.',
        },
    )
    phone = serializers.CharField(
        max_length=20,
        trim_whitespace=True,
        allow_blank=False,
        error_messages={
            'blank': 'El teléfono es obligatorio.',
            'required': 'El teléfono es obligatorio.',
            'max_length': 'El teléfono no puede exceder 20 caracteres.',
        },
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        error_messages={
            'invalid': 'Ingresa un correo electrónico válido.',
            'max_length': 'El correo electrónico no puede exceder 254 caracteres.',
        },
    )
    address = serializers.CharField(
        trim_whitespace=True,
        allow_blank=False,
        error_messages={
            'blank': 'La dirección es obligatoria.',
            'required': 'La dirección es obligatoria.',
        },
    )
    service_type = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        error_messages={
            'max_length': 'El tipo de servicio no puede exceder 100 caracteres.',
        },
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    class Meta:
        model = ServiceRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'otp_validated']

    def validate_phone(self, value):
        return normalize_phone_e164(value, allow_blank=False, field_label='El teléfono')

    def _get_suspicious_reasons(self, obj):
        if obj.status == ServiceRequest.Status.VALIDATED:
            return []

        reasons = []
        if not obj.otp_validated:
            reasons.append('otp_unvalidated')
        if obj.company_id and Blacklist.objects.filter(
            company_id=obj.company_id,
            phone=obj.phone
        ).exists():
            reasons.append('blacklisted_phone')
        return reasons

    def get_is_suspicious(self, obj):
        return len(self._get_suspicious_reasons(obj)) > 0

    def get_suspicious_reasons(self, obj):
        return self._get_suspicious_reasons(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure coordinates are always returned as floats
        if data.get('latitude') is not None:
            data['latitude'] = float(data['latitude'])
        if data.get('longitude') is not None:
            data['longitude'] = float(data['longitude'])
        return data


class BlacklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blacklist
        fields = '__all__'
        read_only_fields = ['id', 'blocked_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Blacklist doesn't have coordinates, but maintaining consistent pattern
        return data
