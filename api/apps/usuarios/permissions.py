"""
Custom permission classes for Role-Based Access Control (RBAC).

Hierarchy:
    ADMIN -> platform/dev admin
    COMPANY -> company-level admin
    SUPERVISOR -> operations lead
    TECHNICIAN -> field technician
"""
from rest_framework import permissions


def _is_platform_admin(user):
    return bool(
        user
        and user.is_authenticated
        and (getattr(user, 'is_superuser', False) or getattr(user, 'role', None) == 'ADMIN')
    )


class IsPlatformAdmin(permissions.BasePermission):
    message = 'Only platform admins can access this resource.'

    def has_permission(self, request, view):
        return _is_platform_admin(request.user)


class IsCompanyAdmin(permissions.BasePermission):
    message = 'Only company admins can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'COMPANY'
        )


class IsSupervisor(permissions.BasePermission):
    message = 'Only supervisors can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SUPERVISOR'
        )


class IsPlatformAdminOrCompanyAdmin(permissions.BasePermission):
    message = 'Only platform admins or company admins can access this resource.'

    def has_permission(self, request, view):
        return _is_platform_admin(request.user) or IsCompanyAdmin().has_permission(request, view)


class IsTechnician(permissions.BasePermission):
    message = 'Only field technicians can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'TECHNICIAN'
        )


class IsCompanyOrSupervisor(permissions.BasePermission):
    message = 'Only company admins or supervisors can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('COMPANY', 'SUPERVISOR')
        )


class IsCompanyStaff(permissions.BasePermission):
    message = 'Only company staff can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('COMPANY', 'SUPERVISOR', 'TECHNICIAN')
        )


class IsSameCompany(permissions.BasePermission):
    message = 'You can only access data from your own company.'

    def has_object_permission(self, request, view, obj):
        if _is_platform_admin(request.user):
            return True
        if not request.user.company:
            return False
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        if hasattr(obj, 'company_id'):
            return obj.company_id == request.user.company_id
        return False


class IsCompanyAdminOrReadOnly(permissions.BasePermission):
    message = 'Only company admins can modify this resource.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return IsCompanyAdmin().has_permission(request, view)


class IsOwnProfileOrCompanyAdmin(permissions.BasePermission):
    message = 'You can only access your own profile or be a company admin.'

    def has_object_permission(self, request, view, obj):
        if _is_platform_admin(request.user) or request.user.role == 'COMPANY':
            return True
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        return False


# Backward-compatible aliases used elsewhere in the codebase.
IsOwner = IsCompanyAdmin
IsDispatcher = IsSupervisor
IsDispatcherOrOwner = IsCompanyOrSupervisor
IsFieldStaff = IsCompanyStaff
IsOwnerOrReadOnly = IsCompanyAdminOrReadOnly
IsOwnProfileOrOwner = IsOwnProfileOrCompanyAdmin
