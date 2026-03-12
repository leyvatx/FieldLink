import { useState } from "react";
import { Button, Divider, Form, Input } from "antd";
import useImportPermissions from "@features/roles-permissions/hooks/useImportPermissions";
import ImportPermissionsResults from "@features/roles-permissions/components/ImportPermissionsResults";
import formatErrors from "@lib/formatErrors";

const { TextArea } = Input;

const ImportPermissions = () => {
  const [form] = Form.useForm();
  const [results, setResults] = useState(null);
  const { mutate: importPermissions, isPending: isImportingPermissions } =
    useImportPermissions();

  const onFinish = (values) => {
    setResults(null);

    importPermissions(
      { payload: { text: values.text } },
      {
        onSuccess: ({ results }) => {
          setResults(results ?? {});
        },
        onError: (err) => {
          if (err.response?.data?.errors) {
            const formattedErrors = formatErrors(err.response.data.errors);
            form.setFields(formattedErrors);
          }
        },
      }
    );
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical">
      <Form.Item
        label="Texto de permisos"
        name="text"
        rules={[{ required: true, message: "Este campo es requerido" }]}>
        <TextArea
          placeholder="Pega aquí el texto de permisos para importar"
          allowClear
          autoSize={{ minRows: 4, maxRows: 10 }}
        />
      </Form.Item>
      <div className="flex justify-end">
        <Button
          type="primary"
          htmlType="submit"
          loading={isImportingPermissions}>
          Importar permisos
        </Button>
      </div>
      {results && (
        <>
          <Divider size="middle" />
          <ImportPermissionsResults results={results} />
        </>
      )}
    </Form>
  );
};

export default ImportPermissions;
