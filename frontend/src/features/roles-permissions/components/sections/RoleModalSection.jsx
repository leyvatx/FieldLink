import { useEffect, memo } from 'react';
import { Form, Input, Button } from 'antd';
import useErrorHandler from '../../hooks/useErrorHandler';

/**
 * Componente para el modal de creación/edición de roles
 * Utiliza manejo centralizado de errores y context mejorado
 */
const RoleModalSection = memo(({
  onClose,
  onSubmit,
  form,
  initialValues = {},
}) => {
  const [internalForm] = Form.useForm();
  const formInstance = form || internalForm;
  const { handleValidationErrors, processAsyncError } = useErrorHandler();

  useEffect(() => {
    formInstance.resetFields();
    if (initialValues && Object.keys(initialValues).length) {
      formInstance.setFieldsValue({
        name: initialValues.name || '',
        description: initialValues.description || '',
      });
    }
  }, [formInstance, initialValues]);

  /**
   * Maneja el envío del formulario con validación mejorada
   */
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        name: values.name?.toLowerCase(),
      };
      await onSubmit(payload, { onClose });
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
      initialValues={{
        name: initialValues.name || '',
      }}
    >
      <Form.Item
        label="Nombre"
        name="name"
        rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
      >
        <Input placeholder="Nombre del rol" />
      </Form.Item>
      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
});

RoleModalSection.displayName = 'RoleModalSection';
export default RoleModalSection;