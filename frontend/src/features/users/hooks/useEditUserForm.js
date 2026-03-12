import { useState, useMemo } from "react";
import { useMessage } from "@context/MessageProvider";
import { changeUserPassword } from "@api/userService";
import useUser from "./useUser";
import useUpdateUser from "./useUpdateUser";
import queryClient from "@lib/queryClient";
import formatErrors from "@lib/formatErrors";

const useEditUserForm = (id, onClose) => {
  const userQuery = useUser(id);
  const updateUserMutation = useUpdateUser();
  const { success } = useMessage();

  const [adminValidationVisible, setAdminValidationVisible] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);
  const [changing, setChanging] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const initialValues = useMemo(() => {
    const user = userQuery.data;
    return {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "TECHNICIAN",
    };
  }, [userQuery.data]);

  const handleFormSubmit = async (values, form) => {
    try {
      const payload = {
        name: values.name?.trim() || "",
        phone: values.phone?.trim() || "",
        email: values.email?.trim() || "",
        role: values.role || "TECHNICIAN",
      };

      updateUserMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ["user", id] });
            success("Usuario actualizado exitosamente");
          },
          onError: (error) => {
            if (error.response?.data) {
              form.setFields(formatErrors(error.response.data));
            }
          },
        }
      );
    } catch (error) {
      console.error("Error en la validacion del formulario:", error);
    }
  };

  const handleAdminValidationSuccess = (form) => {
    setPasswordSection(true);
    form.resetFields(["newPassword", "confirmPassword"]);
    setPasswordError("");
  };

  const handleChangePassword = async (form) => {
    try {
      setChanging(true);
      setPasswordError("");
      await form.validateFields(["newPassword", "confirmPassword"]);
      const values = form.getFieldsValue(["newPassword", "confirmPassword"]);

      if (values.newPassword !== values.confirmPassword) {
        form.setFields([
          {
            name: "confirmPassword",
            errors: ["Las contrasenas no coinciden"],
          },
        ]);
        return;
      }

      const result = await changeUserPassword(id, values.newPassword);

      if (result.success) {
        success("Contrasena actualizada exitosamente");
        setPasswordSection(false);
        form.resetFields(["newPassword", "confirmPassword"]);
      } else {
        const passwordErrors = result.errors?.password;
        if (passwordErrors && passwordErrors.length > 0) {
          form.setFields([
            { name: "newPassword", errors: [" "] },
            { name: "confirmPassword", errors: passwordErrors },
          ]);
          setPasswordError("");
        } else {
          setPasswordError(result.message || "Error al cambiar la contrasena");
        }
      }
    } catch (formErr) {
      console.error("Error de validacion del formulario:", formErr);
    } finally {
      setChanging(false);
    }
  };

  const handleCancelPasswordChange = (form) => {
    setPasswordSection(false);
    form.resetFields(["newPassword", "confirmPassword"]);
    setPasswordError("");
  };

  return {
    userQuery,
    updateUserMutation,
    initialValues,
    adminValidationVisible,
    setAdminValidationVisible,
    passwordSection,
    changing,
    passwordError,
    handleFormSubmit,
    handleAdminValidationSuccess,
    handleChangePassword,
    handleCancelPasswordChange,
  };
};

export default useEditUserForm;
