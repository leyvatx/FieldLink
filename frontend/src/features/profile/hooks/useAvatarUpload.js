import { useState } from "react";
import { useMessage } from "@context/MessageProvider";

export default function useAvatarUpload(onAvatarChange) {
  const [loading, setLoading] = useState(false);
  const { error } = useMessage();

  const beforeUpload = async (file) => {
    setLoading(true);
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      error("Solo puedes subir archivos JPG/PNG");
      setLoading(false);
      return false;
    }
    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      error("La imagen debe ser menor a 20MB");
      setLoading(false);
      return false;
    }
    const maxDim = 4000;
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      img.onload = () => {
        if (img.width > maxDim || img.height > maxDim) {
          error(`La imagen no debe superar ${maxDim}x${maxDim} píxeles`);
          URL.revokeObjectURL(objectUrl);
          setLoading(false);
          reject(false);
        } else {
          URL.revokeObjectURL(objectUrl);
          resolve(true);
        }
      };
      img.onerror = () => {
        error("No se pudo validar la resolución de la imagen");
        URL.revokeObjectURL(objectUrl);
        setLoading(false);
        reject(false);
      };
      img.src = objectUrl;
    });
  };

  const handleChange = (info) => {
    if (info.file.originFileObj instanceof File) {
      const imageUrl = URL.createObjectURL(info.file.originFileObj);
      if (onAvatarChange) {
        onAvatarChange({
          file: info.file.originFileObj,
          url: imageUrl,
        });
      }
      setLoading(false);
    } else {
      error("Error al procesar el archivo");
      setLoading(false);
    }
  };

  return {
    loading,
    beforeUpload,
    handleChange,
  };
}
