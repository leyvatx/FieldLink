import { Input, Tag, Typography, Form } from "antd";
import { PiCalendar, PiClock } from "react-icons/pi";
import dayjs from "dayjs";

const { Title } = Typography;

const ROLE_LABELS = {
  OWNER: "Owner",
  DISPATCHER: "Dispatcher",
  TECHNICIAN: "Technician",
};

const AdditionalDetailsSection = ({ profile }) => {
  return (
    <div className="w-full lg:w-1/3">
      <Title
        level={3}
        style={{ marginBottom: 24, fontWeight: 600 }}
      >
        Detalles adicionales
      </Title>
      <Form layout="vertical">
        <Form.Item label="Rol">
          <div className="flex flex-wrap gap-2">
            <Tag>{ROLE_LABELS[profile.role] || profile.role || "N/A"}</Tag>
          </div>
        </Form.Item>

        <Form.Item label="Fecha de registro">
          <Input
            prefix={<PiCalendar className="text-gray-400" size={18} />}
            value={
              profile.created_at
                ? dayjs(profile.created_at).format("DD/MM/YYYY HH:mm")
                : "Sin fecha"
            }
            disabled
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item label="Ultima modificacion">
          <Input
            prefix={<PiClock className="text-gray-400" size={18} />}
            value={
              profile.updated_at
                ? dayjs(profile.updated_at).format("DD/MM/YYYY HH:mm")
                : "Sin fecha"
            }
            disabled
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdditionalDetailsSection;
