"""
Custom permission classes for role-based access control (RBAC).
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only allow admins"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsTechnician(permissions.BasePermission):
    """Only allow technicians"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'TECHNICIAN')


class IsManager(permissions.BasePermission):
    """Only allow managers"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'MANAGER')


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can do everything.
    Others can only read.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'ADMIN'


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Admin or the object owner can access.
    """
    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == 'ADMIN':
            return True
        # User can access their own profile
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        return False


class IsSameCompany(permissions.BasePermission):
    """
    CRITICAL: Tenant isolation.
    Users can only access data from their own company.
    """
    def has_object_permission(self, request, view, obj):
        # Check if object has company field
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        if hasattr(obj, 'company_id'):
            return obj.company_id == request.user.company_id
        return False


class IsSameCompanyQueryset(permissions.BasePermission):
    """
    Filter QuerySet by company.
    Used at view level to filter all queries.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        return True


class IsAdminOrSameCompany(permissions.BasePermission):
    """
    Admin can access everything.
    Others can only access their own company data.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if hasattr(obj, 'company'):
            return obj.company == request.user.company
        return False
