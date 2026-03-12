import { useState } from "react";
import { Button, Col, DatePicker, Form, Input, Row, Spin } from "antd";
import { useDrawer } from "@context/DialogProvider";
import useCreateReleaseNote from "@features/releases-notes/hooks/useCreateReleaseNote";
import ProjectSelect from "@features/releases-notes/components/ProjectSelect";
import useProjectsOptions from "@features/releases-notes/hooks/useProjectsOptions";
import CreateProjectAlert from "@features/releases-notes/components/CreateProjectAlert";
import Loader from "@components/Loader";
import { dayjsToStrings } from "@lib/formatDates";
import formatErrors from "@lib/formatErrors";
const { TextArea } = Input;

const CreateReleaseNoteForm = () => {
  const [status, setStatus] = useState(null);
  const [form] = Form.useForm();
  const { closeDrawer } = useDrawer();
  const projectsQuery = useProjectsOptions();
  const { mutate: createReleaseNote, isPending: creatingReleaseNote } =
    useCreateReleaseNote();

  if (projectsQuery?.isLoading) {
    return <Loader />;
  }

  if (!projectsQuery?.data?.length) {
    return <CreateProjectAlert />;
  }

  const setStatusAndFinish = (status) => {
    setStatus(status);
    form.submit();
  };

  const onFinish = (values) => {
    values.release_date = dayjsToStrings(values.release_date, "YYYY-MM-DD");
    values.status = status;

    const payload = Object.entries(values).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
        return acc;
      }

      return acc;
    }, {});

    createReleaseNote(payload, {
      onSuccess: closeDrawer,
      onError: (err) => {
        if (err?.response?.data?.errors) {
          const formattedErrors = formatErrors(err.response.data.errors);
          form.setFields(formattedErrors);
        }
      },
    });
  };

  return (
    <Spin spinning={creatingReleaseNote}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Proyecto"
              name="project_id"
              rules={[{ required: true, message: "Este campo es obligatorio" }]}
            >
              <ProjectSelect query={projectsQuery} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Número de versión"
              name="version_number"
              rules={[{ required: true, message: "Este campo es obligatorio" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Fecha de liberación" name="release_date">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Título" name="title">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Resumen" name="summary">
              <TextArea rows={5} />
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end gap-3">
          <Button
            color="default"
            variant="filled"
            htmlType="button"
            onClick={() => setStatusAndFinish("draft")}
          >
            Guardar como borrador
          </Button>
          <Button
            type="primary"
            htmlType="button"
            onClick={() => setStatusAndFinish("published")}
          >
            Publicar nota
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default CreateReleaseNoteForm;
