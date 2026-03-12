import { Button, Form, Space, Tooltip } from "antd";
import { PiInfo } from "react-icons/pi";

const FormActions = ({ onCancel, isLoading }) => {
  return (
    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
      <Space>
        <Tooltip title="Los campos marcados con * son obligatorios">
          <Button 
            icon={<PiInfo size={16} />} 
            type="text" 
            size="small"
          />
        </Tooltip>
        <Button
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
        >
          {isLoading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Space>
    </Form.Item>
  );
};

export default FormActions;