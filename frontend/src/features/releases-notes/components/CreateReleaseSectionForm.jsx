import { Button, Col, Flex, Form, Input, Row } from "antd";
import { PiFloppyDiskBackFill, PiMinusBold, PiPlusBold } from "react-icons/pi";
import { useDialog } from "@context/DialogProvider";
import BaseDragger from "@components/BaseDragger";
import ReleaseChangeTypeSelect from "@features/releases-notes/components/ReleaseChangeTypeSelect";
import ReleaseSubmoduleSelect from "@features/releases-notes/components/ReleaseSubmoduleSelect";
import useCreateReleaseSection from "@features/releases-notes/hooks/useCreateReleaseSection";
import useReleaseSubmodulesOptions from "@features/releases-notes/hooks/useReleaseSubmodulesOptions";
import formatErrors from "@lib/formatErrors";

const { TextArea } = Input;

const CreateReleaseSectionForm = ({ id }) => {
  const [form] = Form.useForm();
  const { closeDrawer } = useDialog();
  const querySubmodules = useReleaseSubmodulesOptions();
  const { mutate: createReleaseSection, isPending: creatingReleaseSection } =
    useCreateReleaseSection();

  const onFinish = (values) => {
    const formData = new FormData();
    formData.append("title", values.title);

    values?.changes?.forEach((change, changeIndex) => {
      formData.append(`changes[${changeIndex}][title]`, change.title);
      if (change?.type) {
        formData.append(`changes[${changeIndex}][type]`, change.type);
      }
      if (change?.description) {
        formData.append(
          `changes[${changeIndex}][description]`,
          change.description
        );
      }

      change?.submodules_ids?.forEach((submoduleId, submoduleIndex) => {
        formData.append(
          `changes[${changeIndex}][submodules_ids][${submoduleIndex}]`,
          submoduleId
        );
      });

      change?.files?.forEach((file, fileIndex) => {
        formData.append(`changes[${changeIndex}][files][${fileIndex}]`, file);
      });
    });

    createReleaseSection(
      { id, formData },
      {
        onSuccess: () => {
          closeDrawer();
        },
        onError: (err) => {
          if (err?.response?.data?.errors) {
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
        name="title"
        label="Título de la sección"
        rules={[{ required: true, message: "Este campo es requerido" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Cambios">
        <Form.List name="changes">
          {(fields, { add, remove }) => (
            <Flex
              vertical
              gap="middle">
              {fields.map((field) => (
                <div className="dark:bg-[#242334] border border-neutral-300 dark:border-none rounded-lg p-5 relative">
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Título"
                        name={[field.name, "title"]}
                        rules={[
                          {
                            required: true,
                            message: "Este campo es requerido",
                          },
                        ]}>
                        <Input allowClear />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item
                        label="Tipo"
                        name={[field.name, "type"]}>
                        <ReleaseChangeTypeSelect
                          allowClear
                          mode="multiple"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={18}>
                      <Form.Item
                        label="Submodulos"
                        name={[field.name, "submodules_ids"]}>
                        <ReleaseSubmoduleSelect
                          query={querySubmodules}
                          allowCreate
                          mode="multiple"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        label="Descripción"
                        name={[field.name, "description"]}>
                        <TextArea
                          rows={2}
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        name={[field.name, "files"]}
                        label="Imágenes"
                        getValueFromEvent={(e) =>
                          e?.fileList?.map((file) => file.originFileObj) ?? []
                        }>
                        <BaseDragger
                          beforeUpload={() => false}
                          showUploadList={{
                            showRemoveIcon: true,
                            showDownloadIcon: false,
                            showPreviewIcon: false,
                          }}
                          listType="picture"
                          accept="image/jpg,image/jpeg,image/png,image/webp,image/svg,image/gif"
                          multiple
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    className="!absolute top-3 right-3 z-1"
                    type="primary"
                    size="small"
                    onClick={() => remove(field.name)}
                    icon={<PiMinusBold />}
                    danger
                  />
                </div>
              ))}
              <Button
                onClick={() => add({ submodules_ids: [], files: [] })}
                icon={<PiPlusBold size={16} />}
                block
              />
            </Flex>
          )}
        </Form.List>
      </Form.Item>
      <Button
        className="!absolute bottom-5 right-5 z-2"
        size="large"
        shape="circle"
        type="primary"
        htmlType="submit"
        loading={creatingReleaseSection}
        icon={<PiFloppyDiskBackFill size={20} />}
      />
    </Form>
  );
};

export default CreateReleaseSectionForm;
