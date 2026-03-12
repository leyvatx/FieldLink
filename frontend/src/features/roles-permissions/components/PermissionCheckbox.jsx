import { Checkbox } from 'antd';
import { memo } from 'react';

const PermissionCheckbox = memo(({ checked, disabled, onToggle, stopPropagation = true, roleName, permissionName }) => {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      onClick={(e) => stopPropagation && e.stopPropagation()}
      onChange={(e) => onToggle && onToggle(e.target.checked)}
      style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}
      aria-label={`Permiso ${permissionName} para el rol ${roleName}`}
    />
  );
});

PermissionCheckbox.displayName = 'PermissionCheckbox';

export default PermissionCheckbox;
