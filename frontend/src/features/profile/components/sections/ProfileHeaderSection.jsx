import { Row, Col, Typography } from "antd";
import UserAvatar from "@components/UserAvatar";

const { Title, Paragraph } = Typography;

const ProfileHeaderSection = ({ profile }) => {
  return (
    <Row
      align="middle"
      gutter={32}
      className="mb-8 relative"
    >
      <Col style={{ position: "relative", width: 100, height: 120 }}>
        <UserAvatar
          user={profile}
          size={100}
        />
      </Col>
      <Col flex={1}>
        <Title
          level={2}
          style={{ marginLeft: 16, marginBottom: 10, fontWeight: 600 }}
        >
          Bienvenid@, {profile.name}
        </Title>
        <Paragraph
          type="secondary"
          style={{ marginLeft: 10, marginBottom: 0 }}
        >
          Aqui puedes editar los detalles de tu perfil.
        </Paragraph>
      </Col>
    </Row>
  );
};

export default ProfileHeaderSection;
