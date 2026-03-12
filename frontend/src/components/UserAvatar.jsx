import { Avatar, Upload, Spin } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import useAvatarUpload from "../features/profile/hooks/useAvatarUpload";

const getInitials = (name = "", lastname = "") => {
  if (lastname) {
    return `${name?.[0] || ""}${lastname?.[0] || ""}`.toUpperCase();
  }

  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const UserAvatar = ({
  user,
  size = "default",
  editable = false,
  onAvatarChange,
}) => {
  const { name, lastname } = user || {};
  const { loading, beforeUpload, handleChange } = useAvatarUpload(onAvatarChange);
  const initials = getInitials(name, lastname);
  const hasAvatar = !!user?.avatar && String(user.avatar).trim() !== "";

  const renderAvatar = useMemo(
    () => () => (
      <Avatar
        size={size}
        src={hasAvatar ? user.avatar : undefined}
        alt={hasAvatar ? `${name || ""} ${lastname || ""}`.trim() : initials}
        style={{ backgroundColor: !hasAvatar ? "#bfbfbf" : undefined }}
      >
        {!hasAvatar && initials}
      </Avatar>
    ),
    [size, user?.avatar, name, lastname, initials, hasAvatar]
  );

  if (!editable) {
    return renderAvatar();
  }

  return (
    <Upload
      name="picture"
      listType="picture-circle"
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      accept="image/jpeg,image/png"
      multiple={false}
      disabled={loading}
      customRequest={() => {}}
    >
      <div
        className="relative inline-block"
        aria-label="Cambiar foto de perfil"
        style={{ position: "relative", display: "inline-block" }}
      >
        <Spin
          spinning={loading}
          size="large"
        >
          {renderAvatar()}
          <EditOutlined
            className="absolute bottom-1 right-1 text-white bg-opacity-50 rounded-full p-1"
            style={{
              fontSize: typeof size === "number" ? (size > 50 ? 20 : 14) : 14,
              cursor: "pointer",
              pointerEvents: "none",
            }}
          />
        </Spin>
      </div>
    </Upload>
  );
};

export default UserAvatar;
