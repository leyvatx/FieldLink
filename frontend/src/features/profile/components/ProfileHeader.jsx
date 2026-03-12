import { Row, Col, Typography, Card } from "antd";
import UserAvatar from "@components/UserAvatar";

const { Title } = Typography;

const ProfileHeader = ({ profile }) => {
  return (
    <Card className="mb-6" style={{ padding: 24 }}>
      <Row align="middle" gutter={24}>
        <Col>
          <UserAvatar user={profile} size={100} />
        </Col>
        <Col flex={1}>
          <Title level={2} style={{ marginBottom: 0, fontWeight: 600 }}>
            Bienvenido, {profile.name}
          </Title>
        </Col>
      </Row>
    </Card>
  );
};

export default ProfileHeader;