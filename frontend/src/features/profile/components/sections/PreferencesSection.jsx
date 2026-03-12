import { Segmented, Select, Typography, Form } from "antd";
import { PiTranslate, PiPaintBrush } from "react-icons/pi";

const { Title } = Typography;

const PreferencesSection = ({ profile, mode, toggleTheme }) => {
  return (
    <div className="w-full lg:w-1/3">
      <Title level={3} style={{ marginBottom: 24, fontWeight: 600 }}>
        Preferencias
      </Title>
      <Form layout="vertical">
        <Form.Item
          label={
            <span>
              <PiTranslate className="mr-2 text-gray-400" size={18} />
              Idioma
            </span>
          }
        >
          <Select
            value={profile.language || "Español"}
            disabled
            style={{ width: "100%" }}
          >
            <Select.Option value="Español">Español</Select.Option>
            <Select.Option value="Inglés">Inglés</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <span>
              <PiPaintBrush className="mr-2 text-gray-400" size={18} />
              Tema
            </span>
          }
        >
          <Segmented
            block
            style={{ width: "100%" }}
            value={mode === "dark" ? "Oscuro" : "Claro"}
            onChange={(value) => {
              if (
                (value === "Oscuro" && mode === "light") ||
                (value === "Claro" && mode === "dark")
              ) {
                toggleTheme();
              }
            }}
            options={[
              { label: "Claro", value: "Claro" },
              { label: "Oscuro", value: "Oscuro" },
            ]}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default PreferencesSection;
