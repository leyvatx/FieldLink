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
from .serializers import ROLE_PERMISSIONS
from .permissions import IsOwner, IsDispatcherOrOwner, IsSameCompany, IsTechnician
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers
import threading
from datetime import datetime


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
        if not refresh_token:
            return Response(
                {'refresh': ['Refresh token is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
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


@extend_schema(request=UserSerializer, responses={200: UserDetailSerializer})
@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Get current user profile.
    GET /api/auth/me/
    Header: Authorization: Bearer <access_token>
    """
    if request.method in ['PATCH', 'PUT']:
        allowed_fields = {'name', 'phone', 'email'}
        if request.user.is_superuser:
            allowed_fields.update({'role', 'is_active', 'company'})

        payload = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = UserSerializer(
            request.user,
            data=payload,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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


@extend_schema(
    request=inline_serializer('ValidatePasswordRequest', fields={'password': drf_serializers.CharField()}),
    responses={200: inline_serializer('ValidatePasswordResponse', fields={'detail': drf_serializers.CharField()})}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_password_view(request):
    """
    Validate current user password.
    POST /api/auth/validate-password/
    Body: { "password": "current_password" }
    """
    password = request.data.get('password')
    if not password:
        return Response(
            {'password': ['Password is required.']},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not request.user.check_password(password):
        return Response(
            {'detail': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({'detail': 'Password is valid'}, status=status.HTTP_200_OK)


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


# ============================================================================
# LOCAL-ONLY MOCK ENDPOINTS FOR ROLES/PERMISSIONS/LOG/RELEASE NOTES
# ============================================================================

_DATA_LOCK = threading.Lock()
_IN_MEMORY_DATA = None


def _split_permission_code(code):
    parts = (code or "").split(".")
    if len(parts) >= 3:
        return parts[0], parts[1], ".".join(parts[2:])
    if len(parts) == 2:
        return parts[0], None, parts[1]
    return None, None, code


def _build_initial_data():
    # Roles used across the UI
    roles = [
        {"id": 1, "name": "owner"},
        {"id": 2, "name": "dispatcher"},
        {"id": 3, "name": "technician"},
    ]

    base_permissions = set()
    for perms in ROLE_PERMISSIONS.values():
        base_permissions.update(perms)

    # Extra permissions used by the roles/permissions UI
    base_permissions.update(
        {
            "roles.create",
            "roles.edit",
            "roles.delete",
            "permissions.create",
            "permissions.edit",
            "permissions.delete",
        }
    )

    # Build modules and submodules
    module_names = {}
    submodule_names = {}
    for code in base_permissions:
        module, submodule, _ = _split_permission_code(code)
        if module:
            module_names[module] = True
            if submodule:
                submodule_names.setdefault(module, set()).add(submodule)

    modules = []
    submodules = []
    module_id_map = {}
    submodule_id_map = {}
    next_module_id = 1
    next_submodule_id = 1
    for module in sorted(module_names.keys()):
        module_id_map[module] = next_module_id
        modules.append({"id": next_module_id, "name": module})
        next_module_id += 1
        for submodule in sorted(submodule_names.get(module, [])):
            submodule_id_map[(module, submodule)] = next_submodule_id
            submodules.append(
                {
                    "id": next_submodule_id,
                    "name": submodule,
                    "module_id": module_id_map[module],
                }
            )
            next_submodule_id += 1

    permissions = []
    permission_id_map = {}
    next_permission_id = 1
    for code in sorted(base_permissions):
        module, submodule, name = _split_permission_code(code)
        module_id = module_id_map.get(module) if module else None
        submodule_id = submodule_id_map.get((module, submodule)) if module and submodule else None
        permission = {
            "id": next_permission_id,
            "name": code,
            "description": code,
            "module_id": module_id,
            "submodule_id": submodule_id,
        }
        permission_id_map[code] = next_permission_id
        permissions.append(permission)
        next_permission_id += 1

    # Matrix: role_id -> permission_ids
    matrix = {1: [], 2: [], 3: []}
    role_map = {
        User.Role.OWNER: 1,
        User.Role.DISPATCHER: 2,
        User.Role.TECHNICIAN: 3,
    }
    for role, perms in ROLE_PERMISSIONS.items():
        role_id = role_map.get(role)
        if not role_id:
            continue
        matrix[role_id] = [permission_id_map[p] for p in perms if p in permission_id_map]
    # Give owner the extra permissions by default
    matrix[1] = sorted(set(matrix[1] + [permission_id_map[p] for p in base_permissions]))

    return {
        "roles": roles,
        "modules": modules,
        "submodules": submodules,
        "permissions": permissions,
        "matrix": matrix,
        "next_ids": {
            "roles": 4,
            "modules": next_module_id,
            "submodules": next_submodule_id,
            "permissions": next_permission_id,
            "projects": 2,
            "release_notes": 1,
            "release_modules": 2,
            "release_submodules": 2,
        },
        "projects": [
            {"id": 1, "name": "Default Project", "code": "DEFAULT", "description": ""}
        ],
        "release_modules": [{"id": 1, "name": "General"}],
        "release_submodules": [
            {"id": 1, "name": "General", "release_module_id": 1, "module_name": "General"}
        ],
        "release_notes": [],
    }


def _get_data():
    global _IN_MEMORY_DATA
    with _DATA_LOCK:
        if _IN_MEMORY_DATA is None:
            _IN_MEMORY_DATA = _build_initial_data()
        return _IN_MEMORY_DATA


def _serialize_permission(perm, data):
    module = None
    submodule = None
    if perm.get("module_id"):
        module = next((m for m in data["modules"] if m["id"] == perm["module_id"]), None)
    if perm.get("submodule_id"):
        submodule = next((s for s in data["submodules"] if s["id"] == perm["submodule_id"]), None)
    return {
        "id": perm["id"],
        "name": perm["name"],
        "description": perm.get("description") or "",
        "module_id": perm.get("module_id"),
        "submodule_id": perm.get("submodule_id"),
        "module": module,
        "submodule": submodule,
    }


def _next_id(data, key):
    next_id = data["next_ids"][key]
    data["next_ids"][key] += 1
    return next_id


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def roles_permissions_matrix_view(request):
    data = _get_data()
    permissions = [_serialize_permission(p, data) for p in data["permissions"]]
    matrix = {str(k): v for k, v in data["matrix"].items()}
    return Response({"roles": data["roles"], "permissions": permissions, "matrix": matrix})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def roles_permissions_batch_view(request):
    data = _get_data()
    payload = request.data or {}
    attach = payload.get("attach") or []
    detach = payload.get("detach") or []

    for item in attach:
        role_id = int(item.get("roleId"))
        perm_ids = item.get("permissionIds") or []
        data["matrix"].setdefault(role_id, [])
        for pid in perm_ids:
            if pid not in data["matrix"][role_id]:
                data["matrix"][role_id].append(pid)

    for item in detach:
        role_id = int(item.get("roleId"))
        perm_ids = set(item.get("permissionIds") or [])
        if role_id in data["matrix"]:
            data["matrix"][role_id] = [pid for pid in data["matrix"][role_id] if pid not in perm_ids]

    return Response({"detail": "ok"})


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def role_permission_toggle_view(request, role_id, permission_id):
    data = _get_data()
    role_id = int(role_id)
    permission_id = int(permission_id)
    data["matrix"].setdefault(role_id, [])

    if request.method == "POST":
        if permission_id not in data["matrix"][role_id]:
            data["matrix"][role_id].append(permission_id)
        return Response({"detail": "attached"})

    data["matrix"][role_id] = [pid for pid in data["matrix"][role_id] if pid != permission_id]
    return Response({"detail": "detached"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def roles_collection_view(request):
    data = _get_data()
    if request.method == "GET":
        return Response(data["roles"])

    name = (request.data or {}).get("name") or "role"
    role = {"id": _next_id(data, "roles"), "name": name}
    data["roles"].append(role)
    data["matrix"][role["id"]] = []
    return Response(role, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def roles_detail_view(request, role_id):
    data = _get_data()
    role_id = int(role_id)
    role = next((r for r in data["roles"] if r["id"] == role_id), None)
    if not role:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(role)

    if request.method == "PUT":
        role["name"] = (request.data or {}).get("name") or role["name"]
        return Response(role)

    data["roles"] = [r for r in data["roles"] if r["id"] != role_id]
    data["matrix"].pop(role_id, None)
    return Response({"detail": "deleted"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def permissions_collection_view(request):
    data = _get_data()
    if request.method == "GET":
        return Response([_serialize_permission(p, data) for p in data["permissions"]])

    payload = request.data or {}
    name = payload.get("name") or payload.get("code") or "permission"
    description = payload.get("description") or name
    module_id = payload.get("module_id") or payload.get("module")
    submodule_id = payload.get("submodule_id") or payload.get("submodule")
    perm = {
        "id": _next_id(data, "permissions"),
        "name": name,
        "description": description,
        "module_id": module_id,
        "submodule_id": submodule_id,
    }
    data["permissions"].append(perm)
    return Response(_serialize_permission(perm, data), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def permissions_detail_view(request, permission_id):
    data = _get_data()
    permission_id = int(permission_id)
    perm = next((p for p in data["permissions"] if p["id"] == permission_id), None)
    if not perm:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(_serialize_permission(perm, data))

    if request.method == "PUT":
        payload = request.data or {}
        perm["name"] = payload.get("name") or perm["name"]
        perm["description"] = payload.get("description") or perm.get("description") or perm["name"]
        perm["module_id"] = payload.get("module_id") or payload.get("module") or perm.get("module_id")
        perm["submodule_id"] = payload.get("submodule_id") or payload.get("submodule") or perm.get("submodule_id")
        return Response(_serialize_permission(perm, data))

    data["permissions"] = [p for p in data["permissions"] if p["id"] != permission_id]
    for role_id in list(data["matrix"].keys()):
        data["matrix"][role_id] = [pid for pid in data["matrix"][role_id] if pid != permission_id]
    return Response({"detail": "deleted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def permissions_import_text_view(request):
    data = _get_data()
    text = "\n".join(sorted([p["name"] for p in data["permissions"]]))
    return Response(text)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def permissions_import_view(request):
    data = _get_data()
    text = (request.data or {}).get("text") or ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    created = 0
    for code in lines:
        if any(p["name"] == code for p in data["permissions"]):
            continue
        perm = {
            "id": _next_id(data, "permissions"),
            "name": code,
            "description": code,
            "module_id": None,
            "submodule_id": None,
        }
        data["permissions"].append(perm)
        created += 1
    return Response({"results": {"created": created, "skipped": len(lines) - created}})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def modules_collection_view(request):
    data = _get_data()
    if request.method == "GET":
        return Response(data["modules"])
    name = (request.data or {}).get("name") or "module"
    module = {"id": _next_id(data, "modules"), "name": name}
    data["modules"].append(module)
    return Response(module, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def submodules_collection_view(request):
    data = _get_data()
    if request.method == "GET":
        return Response(data["submodules"])
    payload = request.data or {}
    name = payload.get("name") or "submodule"
    module_id = payload.get("module_id") or payload.get("module") or None
    submodule = {
        "id": _next_id(data, "submodules"),
        "name": name,
        "module_id": module_id,
    }
    data["submodules"].append(submodule)
    return Response(submodule, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def log_data_view(request):
    return Response({"data": {"data": [], "last_page": 1}})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def projects_options_view(request):
    data = _get_data()
    return Response(data["projects"])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def projects_collection_view(request):
    data = _get_data()
    payload = request.data or {}
    project = {
        "id": _next_id(data, "projects"),
        "name": payload.get("name") or "Project",
        "code": payload.get("code") or "CODE",
        "description": payload.get("description") or "",
    }
    data["projects"].append(project)
    return Response(project, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_modules_options_view(request):
    data = _get_data()
    return Response(data["release_modules"])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_modules_collection_view(request):
    data = _get_data()
    name = (request.data or {}).get("name") or "Module"
    module = {"id": _next_id(data, "release_modules"), "name": name}
    data["release_modules"].append(module)
    return Response(module, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_submodules_options_view(request):
    data = _get_data()
    return Response(data["release_submodules"])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_submodules_collection_view(request):
    data = _get_data()
    payload = request.data or {}
    name = payload.get("name") or "Submodule"
    module_id = payload.get("release_module_id")
    module = next((m for m in data["release_modules"] if m["id"] == module_id), None)
    submodule = {
        "id": _next_id(data, "release_submodules"),
        "name": name,
        "release_module_id": module_id,
        "module_name": module["name"] if module else "",
    }
    data["release_submodules"].append(submodule)
    return Response(submodule, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_change_types_options_view(request):
    return Response(
        [
            {"value": "feature", "label": "Feature"},
            {"value": "fix", "label": "Fix"},
            {"value": "improvement", "label": "Improvement"},
        ]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_notes_pagination_view(request):
    data = _get_data()
    return Response({"data": data["release_notes"], "total": len(data["release_notes"])})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_notes_collection_view(request):
    data = _get_data()
    payload = request.data or {}
    project_id = payload.get("project_id")
    project = next((p for p in data["projects"] if p["id"] == project_id), None)
    release_note = {
        "id": _next_id(data, "release_notes"),
        "project_id": project_id,
        "project": project,
        "project_name": project["name"] if project else "",
        "version_number": payload.get("version_number") or "0.0.1",
        "release_date": payload.get("release_date") or datetime.utcnow().strftime("%Y-%m-%d"),
        "title": payload.get("title") or "",
        "summary": payload.get("summary") or "",
        "status": payload.get("status") or "draft",
        "created_by": request.user.email,
        "sections": [],
    }
    data["release_notes"].append(release_note)
    return Response(release_note, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def release_notes_detail_view(request, note_id):
    data = _get_data()
    note_id = int(note_id)
    note = next((n for n in data["release_notes"] if n["id"] == note_id), None)
    if not note:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(note)

    if request.method == "POST":
        payload = request.data or {}
        if payload.get("_method") == "PUT":
            note["version_number"] = payload.get("version_number") or note["version_number"]
            note["release_date"] = payload.get("release_date") or note["release_date"]
            note["title"] = payload.get("title") or note["title"]
            note["summary"] = payload.get("summary") or note["summary"]
            note["status"] = payload.get("status") or note["status"]
            return Response(note)
        return Response({"detail": "Unsupported"}, status=status.HTTP_400_BAD_REQUEST)

    data["release_notes"] = [n for n in data["release_notes"] if n["id"] != note_id]
    return Response({"detail": "deleted"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_notes_current_view(request):
    data = _get_data()
    if not data["release_notes"]:
        return Response(None)
    return Response(data["release_notes"][-1])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_notes_current_version_view(request):
    data = _get_data()
    if not data["release_notes"]:
        return Response({"version_number": "0.0.0"})
    return Response({"version_number": data["release_notes"][-1]["version_number"]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def release_notes_status_options_view(request):
    return Response(
        [
            {"value": "draft", "label": "Draft"},
            {"value": "published", "label": "Published"},
            {"value": "archived", "label": "Archived"},
        ]
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def release_notes_update_status_view(request, note_id):
    data = _get_data()
    note_id = int(note_id)
    note = next((n for n in data["release_notes"] if n["id"] == note_id), None)
    if not note:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    note["status"] = (request.data or {}).get("status") or note["status"]
    return Response(note)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_sections_create_view(request, note_id):
    data = _get_data()
    note_id = int(note_id)
    note = next((n for n in data["release_notes"] if n["id"] == note_id), None)
    if not note:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    section = {
        "id": len(note["sections"]) + 1,
        "title": (request.data or {}).get("title") or "Section",
        "changes": [],
    }
    note["sections"].append(section)
    return Response(section, status=status.HTTP_201_CREATED)
