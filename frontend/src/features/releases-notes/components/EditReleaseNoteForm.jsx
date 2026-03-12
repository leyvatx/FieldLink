import { useEffect } from "react";
import { Button, Card, Flex, Form, Col, DatePicker, Input, Row } from "antd";
import { PiFloppyDiskBackFill, PiMinusBold, PiPlusBold } from "react-icons/pi";
import useProjectsOptions from "@features/releases-notes/hooks/useProjectsOptions";
import ProjectSelect from "@features/releases-notes/components/ProjectSelect";
import useReleaseSubmodulesOptions from "@features/releases-notes/hooks/useReleaseSubmodulesOptions";
import useReleaseNote from "@features/releases-notes/hooks/useReleaseNote";
import useUpdateReleaseNote from "@features/releases-notes/hooks/useUpdateReleaseNote";
import ReleaseChangeTypeSelect from "@features/releases-notes/components/ReleaseChangeTypeSelect";
import ReleaseSubmoduleSelect from "@features/releases-notes/components/ReleaseSubmoduleSelect";
import ReleaseNoteStatusSelect from "@features/releases-notes/components/ReleaseNoteStatusSelect";
import BaseDragger from "@components/BaseDragger";
import Loader from "@components/Loader";
import { dayjsToStrings, stringsToDayjs } from "@lib/formatDates";
import formatErrors from "@lib/formatErrors";

const { TextArea } = Input;

const EditReleaseNoteForm = ({ id }) => {
  const [form] = Form.useForm();
  const projectsQuery = useProjectsOptions();
  const submodulesQuery = useReleaseSubmodulesOptions();
  const { data: releaseNote, isLoading: loadingReleaseNote } =
    useReleaseNote(id);
  const { mutate: updateReleaseNote, isPending: updatingReleaseNote } =
    useUpdateReleaseNote();

  useEffect(() => {
    if (releaseNote) {
      form.setFieldsValue({
        project_id: releaseNote?.project_id,
        version_number: releaseNote?.version_number,
        release_date: stringsToDayjs(releaseNote?.release_date, "DD/MM/YYYY"),
        title: releaseNote?.title,
        summary: releaseNote?.summary,
        status: releaseNote?.status,
        sections:
          releaseNote?.sections?.map((section) => ({
            id: section?.id,
            title: section?.title,
            changes:
              section?.changes?.map((change) => ({
                id: change?.id,
                title: change?.title,
                type: change?.type,
                submodules_ids:
                  change?.submodules?.map((submodule) => submodule?.id) ?? [],
                description: change?.description,
                files:
                  change?.files?.map((file) => ({
                    id: file?.id,
                    uid: file?.id,
                    name: file?.name,
                    url: file?.url,
                    status: "done",
                  })) ?? [],
              })) ?? [],
          })) ?? [],
      });
    }
  }, [form, releaseNote]);

  if (loadingReleaseNote) {
    return <Loader />;
  }

  const handleChangeFiles = (fileList, sectionName, changeName) => {
    form.setFieldValue(
      ["sections", sectionName, "changes", changeName, "files"],
      fileList
    );
  };

  const onFinish = (values) => {
    const formData = new FormData();
    console.log(values);

    // Recorrer cada propiedad del objeto values
    Object.entries(values).forEach(([key, value]) => {
      // Si la key es sections, recorrer cada sección
      if (key === "sections") {
        value.forEach((section, sectionIndex) => {
          // Recorrer cada propiedad del objeto section
          Object.entries(section).forEach(([sectionKey, sectionValue]) => {
            // Si la key es changes, recorrer cada cambio
            if (sectionKey === "changes") {
              sectionValue.forEach((change, changeIndex) => {
                // Recorrer cada propiedad del objeto
                Object.entries(change).forEach(([changeKey, changeValue]) => {
                  // Si la key es files, recorrer cada archivo
                  if (changeKey === "files") {
                    //Filtrar y agregar los archivos ya existentes por medio de su id
                    changeValue.forEach((file, fileIndex) => {
                      if (file.id) {
                        formData.append(
                          `sections[${sectionIndex}][changes][${changeIndex}][files][${fileIndex}]`,
                          file.id
                        );
                      } else if (file.originFileObj) {
                        formData.append(
                          `sections[${sectionIndex}][changes][${changeIndex}][files][${fileIndex}]`,
                          file.originFileObj
                        );
                      }
                    });
                  }

                  // Si la key es submodules_ids, agregarlo al formData
                  else if (changeKey === "submodules_ids") {
                    changeValue.forEach((submodule, submoduleIndex) => {
                      formData.append(
                        `sections[${sectionIndex}][changes][${changeIndex}][submodules_ids][${submoduleIndex}]`,
                        submodule
                      );
                    });
                  }

                  // Si la key es cualquier otra y value no es null, agregarlo al formData
                  else if (changeValue) {
                    formData.append(
                      `sections[${sectionIndex}][changes][${changeIndex}][${changeKey}]`,
                      changeValue
                    );
                  }
                });
              });
            }

            //Si la key es cualquier otra y value no es null, agregarlo al formData
            else if (sectionValue) {
              formData.append(
                `sections[${sectionIndex}][${sectionKey}]`,
                sectionValue
              );
            }
          });
        });
      }

      // Si la key es release_date, agregarlo al formData
      else if (key === "release_date") {
        formData.append("release_date", dayjsToStrings(value, "YYYY-MM-DD"));
      }

      // Si la key es cualquier otra y value no es null, agregarlo al formData
      else if (value) {
        formData.append(key, value);
      }
    });

    updateReleaseNote(
      { id, formData },
      {
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
      <h1 className="text-xl font-semibold mb-2">Información general</h1>
      <Card className="elevation-1 !mb-5">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Título"
              name="title">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Resumen"
              name="summary">
              <TextArea autoSize />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Proyecto"
              name="project_id"
              rules={[
                { required: true, message: "Este campo es obligatorio" },
              ]}>
              <ProjectSelect query={projectsQuery} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Número de versión"
              name="version_number"
              rules={[
                { required: true, message: "Este campo es obligatorio" },
              ]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Fecha de liberación"
              name="release_date">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Estado"
              name="status">
              <ReleaseNoteStatusSelect />
            </Form.Item>
          </Col>
        </Row>
      </Card>
      <h1 className="text-xl font-semibold mb-2">Secciones</h1>
      <Form.List name="sections">
        {(fields, { add, remove }) => (
          <Flex
            vertical
            gap={24}>
            {fields.map((field) => (
              <Card
                key={field.key}
                className="elevation-1 relative">
                <Form.Item
                  label="Título de la sección"
                  name={[field.name, "title"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Cambios">
                  <Form.List name={[field.name, "changes"]}>
                    {(subfields, { add, remove }) => (
                      <Flex
                        vertical
                        gap={24}>
                        {subfields.map((subfield) => (
                          <Card
                            key={subfield.key}
                            className="elevation-2 relative">
                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item
                                  label="Título del cambio"
                                  name={[subfield.name, "title"]}
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
                                  name={[subfield.name, "type"]}>
                                  <ReleaseChangeTypeSelect allowClear />
                                </Form.Item>
                              </Col>

                              <Col span={18}>
                                <Form.Item
                                  label="Submodulos"
                                  name={[subfield.name, "submodules_ids"]}>
                                  <ReleaseSubmoduleSelect
                                    query={submodulesQuery}
                                    allowCreate
                                    mode="multiple"
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={24}>
                                <Form.Item
                                  label="Descripción"
                                  name={[subfield.name, "description"]}>
                                  <TextArea
                                    autoSize
                                    allowClear
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={24}>
                                <Form.Item
                                  name={[subfield.name, "files"]}
                                  label="Imágenes"
                                  valuePropName="fileList">
                                  <BaseDragger
                                    fileList={
                                      form.getFieldValue([
                                        "sections",
                                        field.name,
                                        "changes",
                                        subfield.name,
                                        "files",
                                      ]) ?? []
                                    }
                                    onChange={({ fileList }) =>
                                      handleChangeFiles(
                                        fileList,
                                        field.name,
                                        subfield.name
                                      )
                                    }
                                    beforeUpload={() => false}
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
                              onClick={() => remove(subfield.name)}
                              icon={<PiMinusBold />}
                              danger
                            />
                          </Card>
                        ))}
                        <Button
                          block
                          onClick={() => add({ submodules_ids: [], files: [] })}
                          icon={<PiPlusBold size={16} />}>
                          Agregar cambio
                        </Button>
                      </Flex>
                    )}
                  </Form.List>
                </Form.Item>
                <Button
                  className="!absolute top-3 right-3 z-1"
                  type="primary"
                  size="small"
                  onClick={() => remove(field.name)}
                  icon={<PiMinusBold />}
                  danger
                />
              </Card>
            ))}
            <Button
              block
              onClick={() => add({ changes: [] })}
              icon={<PiPlusBold size={16} />}>
              Agregar sección
            </Button>
          </Flex>
        )}
      </Form.List>
      <Button
        className="!absolute right-5 bottom-5"
        size="large"
        shape="circle"
        type="primary"
        htmlType="submit"
        loading={updatingReleaseNote}
        icon={<PiFloppyDiskBackFill size={20} />}
      />
    </Form>
  );
};

export default EditReleaseNoteForm;
