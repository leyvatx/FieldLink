import { Tag } from "antd";

const ReleaseChangeTypeTag = ({ type }) => {
  const tagTypes = {
    feature: {
      color: "blue",
      text: "Funcionalidad",
    },
    improvement: {
      color: "green",
      text: "Mejora",
    },
    bugfix: {
      color: "red",
      text: "Error",
    },
    security: {
      color: "gold",
      text: "Seguridad",
    },
    other: {
      color: "default",
      text: "Otro",
    },
  };

  const color = tagTypes[type]?.color ?? "default";
  const text = tagTypes[type]?.text ?? "Desconocido";

  return <Tag color={color} >{text}</Tag>;
};

export default ReleaseChangeTypeTag;
