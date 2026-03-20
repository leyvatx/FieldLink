import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Form, Input, Result, Select, Steps } from "@/lib/antd-compat";
import { createPublicServiceRequest } from "@api/serviceRequestService";
import PublicLayout from "@layouts/public-layout/PublicLayout";
import useDocumentTitle from "@hooks/useDocumentTitle";

const SERVICE_TYPES = [
  { value: "instalacion", label: "Instalación" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "reparacion", label: "Reparación" },
  { value: "diagnostico", label: "Diagnóstico" },
];

const PublicRequestWizard = () => {
  const { companySlug } = useParams();
  useDocumentTitle("Solicitud de visita");
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const steps = useMemo(
    () => [
      {
        title: "Contacto",
        fields: ["customer_name", "phone", "email"],
      },
      {
        title: "Servicio",
        fields: ["address", "service_type", "description"],
      },
      {
        title: "Confirmación",
        fields: [],
      },
    ],
    []
  );

  const handleNext = async () => {
    const step = steps[current];
    if (step.fields.length > 0) {
      await form.validateFields(step.fields);
    }
    setCurrent((prev) => prev + 1);
  };

  const handleBack = () => setCurrent((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const values = await form.validateFields();
      const payload = {
        customer_name: values.customer_name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        service_type: values.service_type,
        description: values.description,
      };
      const response = await createPublicServiceRequest(companySlug, payload);
      setResult(response);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.error || "No pudimos enviar la solicitud."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <div className="portal-hero">
      <span className="portal-kicker">Solicitud exprés</span>
      <h1 className="portal-title">Agenda tu visita técnica en minutos</h1>
      <p className="portal-subtitle">
        Completa este formulario rápido. No necesitas registrarte y recibirás
        confirmación por WhatsApp.
      </p>
    </div>
  );

  if (!companySlug) {
    return (
      <PublicLayout header={header}>
        <Card className="portal-card" bordered={false}>
          <Result
            status="warning"
            title="Empresa no identificada"
            subTitle="Revisa el enlace de solicitud proporcionado."
          />
        </Card>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout header={header}>
      <div className="portal-grid">
        <Card className="portal-card" bordered={false}>
          {result ? (
            <Result
              status="success"
              title="Solicitud enviada"
              subTitle={`ID de referencia: ${result.id}`}
            />
          ) : (
            <>
              {submitError && (
                <div className="mb-4 text-sm portal-error">{submitError}</div>
              )}
              <Steps current={current} items={steps.map((step) => ({ title: step.title }))} />
              <div className="portal-divider" />
              <Form form={form} layout="vertical" autoComplete="off">
                {current === 0 && (
                  <>
                    <Form.Item
                      label="Nombre completo"
                      name="customer_name"
                      rules={[{ required: true, message: "Ingresa tu nombre." }]}
                    >
                      <Input placeholder="Nombre y apellido" />
                    </Form.Item>
                    <Form.Item
                      label="Teléfono"
                      name="phone"
                      rules={[{ required: true, message: "Ingresa tu teléfono." }]}
                    >
                      <Input placeholder="Ej: +52 55 1234 5678" />
                    </Form.Item>
                    <Form.Item label="Correo" name="email">
                      <Input placeholder="correo@ejemplo.com" />
                    </Form.Item>
                  </>
                )}
                {current === 1 && (
                  <>
                    <Form.Item
                      label="Dirección de servicio"
                      name="address"
                      rules={[{ required: true, message: "Ingresa la dirección." }]}
                    >
                      <Input placeholder="Calle, número, colonia, ciudad" />
                    </Form.Item>
                    <Form.Item
                      label="Tipo de servicio"
                      name="service_type"
                      rules={[{ required: true, message: "Selecciona un tipo." }]}
                    >
                      <Select options={SERVICE_TYPES} placeholder="Selecciona" />
                    </Form.Item>
                    <Form.Item label="Descripción" name="description">
                      <Input.TextArea rows={3} placeholder="Describe el problema" />
                    </Form.Item>
                  </>
                )}
                {current === 2 && (
                  <div className="grid gap-3 text-sm portal-muted">
                    <p>
                      Revisa la información antes de enviar. Nuestro equipo te
                      confirmará la visita y compartirá el enlace de rastreo.
                    </p>
                  </div>
                )}
              </Form>
              <div className="mt-6 flex items-center justify-between">
                <Button
                  disabled={current === 0}
                  onClick={handleBack}
                  type="text"
                >
                  Atrás
                </Button>
                {current < steps.length - 1 ? (
                  <Button type="primary" onClick={handleNext}>
                    Continuar
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    loading={submitting}
                    onClick={handleSubmit}
                  >
                    Enviar solicitud
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
        <Card className="portal-card" bordered={false}>
          <div className="portal-pill">Seguro y sin registro</div>
          <h2 className="mt-4 text-xl font-semibold">
            Qué ocurre después de enviar
          </h2>
          <div className="portal-divider" />
          <div className="grid gap-4 text-sm portal-muted">
            <div>
              <strong className="text-base">Validación rápida</strong>
              <p>Revisamos tu solicitud y confirmamos disponibilidad.</p>
            </div>
            <div>
              <strong className="text-base">Técnico asignado</strong>
              <p>Recibirás por WhatsApp el enlace de seguimiento en tiempo real.</p>
            </div>
            <div>
              <strong className="text-base">Seguimiento seguro</strong>
              <p>El rastreo se desactiva automáticamente al llegar el técnico.</p>
            </div>
          </div>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicRequestWizard;
