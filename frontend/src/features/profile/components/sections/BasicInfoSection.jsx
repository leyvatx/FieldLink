import { Input, Button, Form, Typography } from "antd";
import { useState } from "react";
import { PiUserCircle, PiPhone, PiEnvelope, PiKey } from "react-icons/pi";
import PasswordChangeModal from "../PasswordChangeModal";

const { Title } = Typography;

const BasicInfoSection = ({ formData, fieldErrors, handleChange, isEditing }) => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  return (
    <div className="w-full lg:w-1/3">
      <Title
        level={3}
        style={{ marginBottom: 24, fontWeight: 600 }}
      >
        Informacion basica
      </Title>
      <Form layout="vertical">
        <Form.Item
          label="Nombre"
          help={fieldErrors.name}
          validateStatus={fieldErrors.name ? "error" : ""}
        >
          <Input
            prefix={<PiUserCircle className="text-gray-400" size={18} />}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Telefono"
          help={fieldErrors.phone}
          validateStatus={fieldErrors.phone ? "error" : ""}
        >
          <Input
            prefix={<PiPhone className="text-gray-400" size={18} />}
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Correo"
          help={fieldErrors.email}
          validateStatus={fieldErrors.email ? "error" : ""}
        >
          <Input
            prefix={<PiEnvelope className="text-gray-400" size={18} />}
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={!isEditing}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="default"
            danger
            icon={<PiKey className="mr-1" size={18} />}
            onClick={() => setPasswordModalVisible(true)}
          >
            Cambiar contrasena
          </Button>
        </Form.Item>
      </Form>

      <PasswordChangeModal
        isOpen={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </div>
  );
};

export default BasicInfoSection;
