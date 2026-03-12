import { memo } from 'react';
import { Form, Input, Button, AutoComplete } from 'antd';
import useErrorHandler from '../../hooks/useErrorHandler';
import usePermissionForm from '../../hooks/usePermissionForm';
import usePermissionAutoComplete from '../../hooks/usePermissionAutoComplete';
import usePermissionHandlers from '../../hooks/usePermissionHandlers';

/**
 * Componente para el modal de creación/edición de permisos
 * Refactorizado para usar hooks personalizados y reducir complejidad
 */
const PermissionsModalSection = memo(({
  onClose,
  onSubmit,
  form,
  initialValues = {},
  modules = [],
  submodules = [],
  readOnlyModule = false,
  readOnlySubmodule = false,
}) => {
  const { handleValidationErrors, processAsyncError } = useErrorHandler();
  
  const {
    formInstance,
    selectedModuleId,
    selectedModuleName,
    dynamicPrefix,
  } = usePermissionForm({
    initialValues,
    modules,
    submodules,
    form,
  });
  const {
    filteredSubmodules,
    moduleOptions,
    submoduleOptions,
    existingModule,
  } = usePermissionAutoComplete({
    modules,
    submodules,
    selectedModuleId,
    selectedModuleName,
  });
  const {
    handleModuleChange,
    handleSubmoduleChange,
    handleModuleSelect,
    handleSubmoduleSelect,
  } = usePermissionHandlers({
    formInstance,
    modules,
    filteredSubmodules,
  });
  /**
   * Maneja el envío del formulario con validación mejorada
   */
  const handleSubmit = async (values) => {
    try {
      let moduleData = values.module_id;
      let submoduleData = values.submodule_id;
      if (!values.module_id && values.module_name) {
        moduleData = { name: values.module_name, isNew: true };
      }
      if (!values.submodule_id && values.submodule_name) {
        submoduleData = { name: values.submodule_name, isNew: true };
      }

      const fullName = dynamicPrefix + values.name;
      const payload = {
        ...values,
        name: fullName,
        module: moduleData,
        submodule: submoduleData,
      };
      if (initialValues?.id) {
        payload.id = initialValues.id;
      }

      await onSubmit(payload);
    } catch (submitError) {
      const errorData = processAsyncError(submitError);
      handleValidationErrors(errorData, formInstance);
    }
  };

  return (
    <Form
      form={formInstance}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Descripción"
        name="description"
        rules={[{ required: true, whitespace: true, message: 'Por favor ingrese la descripción del permiso.' }]}
      >
        <Input placeholder="Descripción del permiso" />
      </Form.Item>
      <Form.Item name="module_id" noStyle>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name="submodule_id" noStyle>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Módulo"
        name="module_name"
        rules={[{ required: true, whitespace: true, message: 'Selecciona o escribe un módulo' }]}
      >
        <AutoComplete
          placeholder="Selecciona o escribe un módulo"
          options={moduleOptions}
          onChange={handleModuleChange}
          onSelect={handleModuleSelect}
          disabled={readOnlyModule}
          filterOption={(inputValue, option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item
        label="Submódulo"
        name="submodule_name"
        rules={[{ required: true, whitespace: true, message: 'Selecciona o escribe un submódulo' }]}
      >
        <AutoComplete
          placeholder="Selecciona o escribe un submódulo"
          options={submoduleOptions}
          onChange={handleSubmoduleChange}
          onSelect={handleSubmoduleSelect}
          disabled={readOnlySubmodule || (!selectedModuleId && !selectedModuleName && !existingModule)}
          filterOption={(inputValue, option) =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item
        label="Nombre"
        name="name"
        rules={[
          { required: true, whitespace: true, message: 'El nombre del permiso no puede estar vacío.' }
        ]}
        normalize={(value) => value?.trim()}
      >
        <Input addonBefore={dynamicPrefix} placeholder="Acción del permiso" />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
});

PermissionsModalSection.displayName = 'PermissionsModalSection';
export default PermissionsModalSection;
