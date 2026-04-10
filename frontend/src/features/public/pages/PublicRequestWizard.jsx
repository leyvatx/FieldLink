import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Form, Input, Result, Select, Spin, Steps } from "@/lib/antd-compat";
import {
  createPublicServiceRequest,
  createPublicServiceRequestByHost,
  createPublicServiceRequestByLanding,
  getPublicLanding,
} from "@api/serviceRequestService";
import PublicLayout from "@layouts/public-layout/PublicLayout";
import useDocumentTitle from "@hooks/useDocumentTitle";

const SERVICE_TYPES = [
  { value: "instalacion", label: "Instalacion" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "reparacion", label: "Reparacion" },
  { value: "diagnostico", label: "Diagnostico" },
];

const RESERVED_SUBDOMAINS = new Set(["www", "api", "admin", "app", "auth"]);

const normalizeHost = (hostname = "") => {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return normalized.split(":")[0];
};

const inferCompanySlugFromHost = (hostname = "") => {
  const host = normalizeHost(hostname);
  if (!host) {
    return "";
  }

  const rootDomain = String(import.meta.env.VITE_PUBLIC_ROOT_DOMAIN || "")
    .trim()
    .toLowerCase();

  if (rootDomain) {
    if (host === rootDomain) {
      return "";
    }

    const suffix = `.${rootDomain}`;
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, -suffix.length);
      if (subdomain && !subdomain.includes(".") && !RESERVED_SUBDOMAINS.has(subdomain)) {
        return subdomain;
      }
      return "";
    }
  }

  if (host.endsWith(".localhost")) {
    const subdomain = host.slice(0, -".localhost".length);
    if (subdomain && !subdomain.includes(".") && !RESERVED_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }

  return "";
};

const PublicRequestWizard = () => {
  const { companySlug: companySlugParam, landingSlug: landingSlugParam } = useParams();
  const routeCompanySlug = String(companySlugParam || "").trim().toLowerCase();
  const routeLandingSlug = String(landingSlugParam || "").trim().toLowerCase();

  const inferredCompanySlug = useMemo(() => {
    if (routeCompanySlug) {
      return routeCompanySlug;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return inferCompanySlugFromHost(window.location.hostname);
  }, [routeCompanySlug]);

  useDocumentTitle("Solicitud de visita");
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const {
    data: landing,
    isLoading: loadingLanding,
    isError: isLandingError,
    error: landingErrorResponse,
  } = useQuery({
    queryKey: ["public-landing", inferredCompanySlug || "__host__", routeLandingSlug || "__default__"],
    queryFn: () => getPublicLanding(inferredCompanySlug, routeLandingSlug),
    retry: false,
  });

  const landingErrorMessage =
    landingErrorResponse?.response?.data?.error || "No pudimos cargar la landing.";
  const resolvedCompanySlug = landing?.company_slug || inferredCompanySlug;
  const resolvedLandingSlug = landing?.landing_slug || routeLandingSlug;
  const ctaText = landing?.cta_text || "Enviar solicitud";

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
        title: "Confirmacion",
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
        ...(resolvedLandingSlug ? { landing_slug: resolvedLandingSlug } : {}),
      };

      let response;
      if (routeCompanySlug && routeLandingSlug) {
        response = await createPublicServiceRequestByLanding(
          routeCompanySlug,
          routeLandingSlug,
          payload
        );
      } else if (routeCompanySlug) {
        response = await createPublicServiceRequest(routeCompanySlug, payload);
      } else {
        response = await createPublicServiceRequestByHost(payload, inferredCompanySlug);
      }

      setResult(response);
    } catch (err) {
      setSubmitError(err?.response?.data?.error || "No pudimos enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <div className="portal-hero">
      <span className="portal-kicker">
        {landing?.company_name ? `Solicitud para ${landing.company_name}` : "Solicitud express"}
      </span>
      <h1 className="portal-title">
        {landing?.headline ||
          (landing?.company_name
            ? `Agenda tu visita con ${landing.company_name}`
            : "Agenda tu visita tecnica en minutos")}
      </h1>
      <p className="portal-subtitle">
        {landing?.subtitle ||
          "Completa este formulario rapido. No necesitas registrarte y recibiras confirmacion por WhatsApp."}
      </p>
    </div>
  );

  if (loadingLanding && !result) {
    return (
      <PublicLayout header={header}>
        <Card className="portal-card" bordered={false}>
          <div className="grid place-items-center py-14">
            <Spin />
          </div>
        </Card>
      </PublicLayout>
    );
  }

  if (isLandingError && !result) {
    return (
      <PublicLayout header={header}>
        <Card className="portal-card" bordered={false}>
          <Result status="warning" title="Landing no disponible" subTitle={landingErrorMessage} />
        </Card>
      </PublicLayout>
    );
  }

  if (!resolvedCompanySlug) {
    return (
      <PublicLayout header={header}>
        <Card className="portal-card" bordered={false}>
          <Result
            status="warning"
            title="Empresa no identificada"
            subTitle="Revisa el enlace o usa el subdominio correcto de la empresa."
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
            <Result status="success" title="Solicitud enviada" subTitle={`ID de referencia: ${result.id}`} />
          ) : (
            <>
              {submitError ? <div className="mb-4 text-sm portal-error">{submitError}</div> : null}
              <Steps current={current} items={steps.map((step) => ({ title: step.title }))} />
              <div className="portal-divider" />
              <Form form={form} layout="vertical" autoComplete="off">
                {current === 0 ? (
                  <>
                    <Form.Item
                      label="Nombre completo"
                      name="customer_name"
                      rules={[{ required: true, message: "Ingresa tu nombre." }]}
                    >
                      <Input placeholder="Nombre y apellido" />
                    </Form.Item>
                    <Form.Item
                      label="Telefono"
                      name="phone"
                      rules={[{ required: true, message: "Ingresa tu telefono." }]}
                    >
                      <Input placeholder="Ej: +52 55 1234 5678" />
                    </Form.Item>
                    <Form.Item label="Correo" name="email">
                      <Input placeholder="correo@ejemplo.com" />
                    </Form.Item>
                  </>
                ) : null}
                {current === 1 ? (
                  <>
                    <Form.Item
                      label="Direccion de servicio"
                      name="address"
                      rules={[{ required: true, message: "Ingresa la direccion." }]}
                    >
                      <Input placeholder="Calle, numero, colonia, ciudad" />
                    </Form.Item>
                    <Form.Item
                      label="Tipo de servicio"
                      name="service_type"
                      rules={[{ required: true, message: "Selecciona un tipo." }]}
                    >
                      <Select options={SERVICE_TYPES} placeholder="Selecciona" />
                    </Form.Item>
                    <Form.Item label="Descripcion" name="description">
                      <Input.TextArea rows={3} placeholder="Describe el problema" />
                    </Form.Item>
                  </>
                ) : null}
                {current === 2 ? (
                  <div className="grid gap-3 text-sm portal-muted">
                    <p>
                      Revisa la informacion antes de enviar. Nuestro equipo te confirmara la
                      visita y compartira el enlace de rastreo.
                    </p>
                  </div>
                ) : null}
              </Form>
              <div className="mt-6 flex items-center justify-between">
                <Button disabled={current === 0} onClick={handleBack} type="text">
                  Atras
                </Button>
                {current < steps.length - 1 ? (
                  <Button type="primary" onClick={handleNext}>
                    Continuar
                  </Button>
                ) : (
                  <Button type="primary" loading={submitting} onClick={handleSubmit}>
                    {ctaText}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
        <Card className="portal-card" bordered={false}>
          <div className="portal-pill">Seguro y sin registro</div>
          <h2 className="mt-4 text-xl font-semibold">Que ocurre despues de enviar</h2>
          <div className="portal-divider" />
          <div className="grid gap-4 text-sm portal-muted">
            {landing?.company_name ? (
              <div>
                <strong className="text-base">Empresa</strong>
                <p>
                  {landing.company_name} ({landing.company_slug})
                </p>
              </div>
            ) : null}
            {landing?.landing_name ? (
              <div>
                <strong className="text-base">Landing</strong>
                <p>
                  {landing.landing_name} ({landing.landing_slug})
                </p>
              </div>
            ) : null}
            <div>
              <strong className="text-base">Validacion rapida</strong>
              <p>Revisamos tu solicitud y confirmamos disponibilidad.</p>
            </div>
            <div>
              <strong className="text-base">Tecnico asignado</strong>
              <p>Recibiras por WhatsApp el enlace de seguimiento en tiempo real.</p>
            </div>
            <div>
              <strong className="text-base">Seguimiento seguro</strong>
              <p>El rastreo se desactiva automaticamente al llegar el tecnico.</p>
            </div>
          </div>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicRequestWizard;
