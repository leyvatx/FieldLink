from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, login_view, logout_view, me_view,
    validate_password_view,
    change_password_view, UserViewSet, CompanyViewSet, CompanyConfigurationViewSet,
    SubscriptionPlanViewSet, CompanyPlanViewSet,
    roles_permissions_matrix_view, roles_permissions_batch_view, role_permission_toggle_view,
    roles_collection_view, roles_detail_view,
    permissions_collection_view, permissions_detail_view,
    permissions_import_text_view, permissions_import_view,
    modules_collection_view, submodules_collection_view,
    log_data_view, projects_options_view, projects_collection_view,
    release_modules_options_view, release_modules_collection_view,
    release_submodules_options_view, release_submodules_collection_view,
    release_change_types_options_view,
    release_notes_pagination_view, release_notes_collection_view, release_notes_detail_view,
    release_notes_current_view, release_notes_current_version_view,
    release_notes_status_options_view, release_notes_update_status_view,
    release_sections_create_view
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
    path('auth/validate-password/', validate_password_view, name='validate_password'),
    path('auth/change-password/', change_password_view, name='change_password'),

    # Roles & permissions
    path('roles-permissions-matrix', roles_permissions_matrix_view, name='roles_permissions_matrix'),
    path('roles-permissions/batch', roles_permissions_batch_view, name='roles_permissions_batch'),
    path('roles/<int:role_id>/permissions/<int:permission_id>', role_permission_toggle_view, name='role_permission_toggle'),
    path('roles', roles_collection_view, name='roles_collection'),
    path('roles/<int:role_id>', roles_detail_view, name='roles_detail'),
    path('permissions', permissions_collection_view, name='permissions_collection'),
    path('permissions/<int:permission_id>', permissions_detail_view, name='permissions_detail'),
    path('permissions/import-text', permissions_import_text_view, name='permissions_import_text'),
    path('permissions/import', permissions_import_view, name='permissions_import'),
    path('modules', modules_collection_view, name='modules_collection'),
    path('submodules', submodules_collection_view, name='submodules_collection'),

    # Log
    path('admin/log/data', log_data_view, name='log_data'),

    # Release notes
    path('projects/options', projects_options_view, name='projects_options'),
    path('projects', projects_collection_view, name='projects_collection'),
    path('release-modules/options', release_modules_options_view, name='release_modules_options'),
    path('release-modules', release_modules_collection_view, name='release_modules_collection'),
    path('release-submodules/options', release_submodules_options_view, name='release_submodules_options'),
    path('release-submodules', release_submodules_collection_view, name='release_submodules_collection'),
    path('release-changes/types/options', release_change_types_options_view, name='release_changes_types_options'),
    path('release-notes/pagination', release_notes_pagination_view, name='release_notes_pagination'),
    path('release-notes/current', release_notes_current_view, name='release_notes_current'),
    path('release-notes/current-version-number', release_notes_current_version_view, name='release_notes_current_version'),
    path('release-notes/status/options', release_notes_status_options_view, name='release_notes_status_options'),
    path('release-notes/<int:note_id>/status', release_notes_update_status_view, name='release_notes_update_status'),
    path('release-notes/<int:note_id>/release-sections', release_sections_create_view, name='release_sections_create'),
    path('release-notes/<int:note_id>', release_notes_detail_view, name='release_notes_detail'),
    path('release-notes', release_notes_collection_view, name='release_notes_collection'),
    
    # Router endpoints
    path('', include(router.urls)),
]
