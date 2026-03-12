import { useEffect } from "react";
import { Form, Alert } from "antd";
import { useDialog } from "@context/DialogProvider";
import useEditUserForm from "@features/users/hooks/useEditUserForm";
import Loader from "@components/Loader";
import AdminValidationModal from "./AdminValidationModal";
import UserBasicFields from "./UserBasicFields";
import PasswordSection from "./PasswordSection";
import FormActions from "./FormActions";

const EditUserForm = ({ id, onClose }) => {
  const { closeModal, closeDrawer } = useDialog();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeModal();
      closeDrawer();
    }
  };

  const {
    userQuery,
    updateUserMutation,
    initialValues,
    adminValidationVisible,
    setAdminValidationVisible,
    changing,
    passwordSection,
    passwordError,
    handleFormSubmit,
    handleAdminValidationSuccess,
    handleChangePassword,
    handleCancelPasswordChange,
  } = useEditUserForm(id, handleClose);

  const [form] = Form.useForm();

  useEffect(() => {
    if (userQuery.data) {
      form.setFieldsValue(initialValues);
    }
  }, [userQuery.data, initialValues, form]);

  if (userQuery.isLoading) {
    return <Loader />;
  }

  if (userQuery.error) {
    return (
      <Alert
        message="Error"
        description="No se pudo cargar la informacion del usuario. Intentelo de nuevo."
        type="error"
        showIcon
      />
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => handleFormSubmit(values, form)}
      initialValues={initialValues}
    >
      <UserBasicFields />

      <PasswordSection
        passwordSection={passwordSection}
        passwordError={passwordError}
        changing={changing}
        onAdminValidation={() => setAdminValidationVisible(true)}
        onChangePassword={() => handleChangePassword(form)}
        onCancelPasswordChange={() => handleCancelPasswordChange(form)}
      />

      <FormActions
        onCancel={handleClose}
        isLoading={updateUserMutation.isPending}
      />

      <AdminValidationModal
        open={adminValidationVisible}
        onClose={() => setAdminValidationVisible(false)}
        onSuccess={() => handleAdminValidationSuccess(form)}
      />
    </Form>
  );
};

export default EditUserForm;
