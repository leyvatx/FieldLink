"""
Custom permission classes for Role-Based Access Control (RBAC).

Roles hierarchy:
    OWNER      → Full access: web dashboard + finances + subscription + operations
    DISPATCHER → Operations access: dashboard, map, inventory, assign orders. NO finances.
    TECHNICIAN → Mobile app only: agenda, photos, evidence, signatures.

Screen mapping:
    Web Public:  Landing (/), Company landing (/<slug>/), Tracking (/tracking/<id>/) → AllowAny
    Web Private: Dashboard, Inventory, Subscription → IsOwner / IsDispatcherOrOwner
    Mobile App:  Technician views → IsTechnician / IsFieldStaff
"""
from rest_framework import permissions


# ============================================================================
# ROLE-BASED PERMISSIONS
# ============================================================================

class IsOwner(permissions.BasePermission):
    """
    Only OWNER can access.
    Protects: Subscription/billing, finances, company settings, user management.
    """
    message = 'Only business owners can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'OWNER'
        )


class IsDispatcher(permissions.BasePermission):
    """
    Only DISPATCHER can access.
    """
    message = 'Only dispatchers can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'DISPATCHER'
        )


class IsTechnician(permissions.BasePermission):
    """
    Only TECHNICIAN can access.
    Protects: Mobile-exclusive endpoints (start_transit, arrive, complete, log_usage).
    """
    message = 'Only field technicians can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'TECHNICIAN'
        )


class IsDispatcherOrOwner(permissions.BasePermission):
    """
    DISPATCHER or OWNER can access.
    Protects: Dashboard, map view, inventory management, order assignment,
    customer management — all operational web screens.
    """
    message = 'Only owners or dispatchers can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('OWNER', 'DISPATCHER')
        )


class IsFieldStaff(permissions.BasePermission):
    """
    Any authenticated company member can access (OWNER, DISPATCHER, or TECHNICIAN).
    Protects: Shared endpoints like viewing materials, own profile, etc.
    """
    message = 'Only company staff can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('OWNER', 'DISPATCHER', 'TECHNICIAN')
        )


# ============================================================================
# TENANT ISOLATION PERMISSIONS
# ============================================================================

class IsSameCompany(permissions.BasePermission):
    """
    CRITICAL: Multi-tenant data isolation.
    Users can only access objects belonging to their own company.
    """
    message = 'You can only access data from your own company.'

    def has_object_permission(self, request, view, obj):
        if not request.user.company:
            return request.user.is_superuser
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        if hasattr(obj, 'company_id'):
            return obj.company_id == request.user.company_id
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    OWNER can do everything.
    Others (DISPATCHER, TECHNICIAN) can only read.
    Protects: Resources that anyone can view but only owners can modify.
    """
    message = 'Only owners can modify this resource.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'OWNER'
        )


class IsOwnProfileOrOwner(permissions.BasePermission):
    """
    Users can access their own profile.
    OWNER can access any user in their company.
    Protects: User detail/update endpoints.
    """
    message = 'You can only access your own profile or be an owner.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'OWNER':
            return True
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        return False
