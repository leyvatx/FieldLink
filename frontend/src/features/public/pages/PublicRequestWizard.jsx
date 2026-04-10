import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Result, Select, Spin, Steps } from "@/lib/antd-compat";
import {
  createPublicServiceRequest,
  createPublicServiceRequestByHost,
  createPublicServiceRequestByLanding,
  getPublicLanding,
} from "@api/serviceRequestService";
import LocationPicker from "@/common/components/location/LocationPicker";
import formatErrors from "@lib/formatErrors";
import PublicLayout from "@layouts/public-layout/PublicLayout";
import useDocumentTitle from "@hooks/useDocumentTitle";

const SERVICE_TYPES = [
  { value: "instalacion", label: "Instalación" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "reparacion", label: "Reparación" },
  { value: "diagnostico", label: "Diagnóstico" },
];

const RESERVED_SUBDOMAINS = new Set(["www", "api", "admin", "app", "auth"]);
const PHONE_ALLOWED_PATTERN = /^[0-9+\s()\-]+$/;

const trimValue = (value) => (typeof value === "string" ? value.trim() : value);
const countDigits = (value) => String(value || "").replace(/\D/g, "").length;

const PUBLIC_REQUEST_RULES = {
  customer_name: [
    {
      required: true,
      transform: trimValue,
      message: "Ingresa tu nombre completo.",
    },
    {
      max: 150,
      message: "El nombre no puede exceder 150 caracteres.",
    },
  ],
  phone: [
    {
      required: true,
      transform: trimValue,
      message: "Ingresa tu teléfono.",
    },
    {
      max: 20,
      message: "El teléfono no puede exceder 20 caracteres.",
    },
    {
      validator(_, value) {
        const normalized = trimValue(value);
        if (!normalized) {
          return Promise.resolve();
        }

        if (!PHONE_ALLOWED_PATTERN.test(normalized) || countDigits(normalized) < 7) {
          return Promise.reject(new Error("Ingresa un teléfono válido."));
        }

        return Promise.resolve();
      },
    },
  ],
  email: [
    {
      type: "email",
      transform: trimValue,
      message: "Ingresa un correo electrónico válido.",
    },
    {
      max: 254,
      message: "El correo electrónico no puede exceder 254 caracteres.",
    },
  ],
  address: [
    {
      required: true,
      transform: trimValue,
      message: "Ingresa la dirección del servicio.",
    },
  ],
  service_type: [
    {
      required: true,
      transform: trimValue,
      message: "Selecciona el tipo de servicio.",
    },
    {
      max: 100,
      message: "El tipo de servicio no puede exceder 100 caracteres.",
    },
  ],
};

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
  const address = Form.useWatch("address", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);

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
        title: "Confirmación",
        fields: [],
      },
    ],
    []
  );

  const clearFormFeedback = (fieldNames = []) => {
    const normalizedNames = Array.from(
      new Set(
        fieldNames
          .map((fieldName) => String(fieldName || "").trim())
          .filter(Boolean)
      )
    );

    const fieldsToClear = [
      { name: "non_field_errors", errors: [] },
      ...normalizedNames.map((fieldName) => ({ name: fieldName, errors: [] })),
    ];

    form.setFields(fieldsToClear);
  };

  const handleNext = async () => {
    const step = steps[current];
    if (step.fields.length > 0) {
      clearFormFeedback(step.fields);
      await form.validateFields(step.fields);
    }
    setCurrent((prev) => prev + 1);
  };

  const handleBack = () => setCurrent((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      clearFormFeedback(["customer_name", "phone", "email", "address", "service_type", "description"]);
      const values = await form.validateFields();
      const payload = {
        customer_name: trimValue(values.customer_name) || "",
        phone: trimValue(values.phone) || "",
        email: trimValue(values.email) || "",
        address: trimValue(values.address) || "",
        latitude: values.latitude !== "" && values.latitude != null ? Number(values.latitude) : undefined,
        longitude: values.longitude !== "" && values.longitude != null ? Number(values.longitude) : undefined,
        service_type: trimValue(values.service_type) || "",
        description: trimValue(values.description) || "",
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
      if (err?.errorFields) {
        return;
      }

      if (err?.response?.data) {
        const formattedErrors = formatErrors(err.response.data);
        const hasNonFieldErrors = formattedErrors.some(
          (field) => field.name === "non_field_errors"
        );

        form.setFields(
          hasNonFieldErrors
            ? formattedErrors
            : [
                ...formattedErrors,
                {
                  name: "non_field_errors",
                  errors: ["Revisa los campos marcados e intenta de nuevo."],
                },
              ]
        );
        return;
      }

      form.setFields([
        {
          name: "non_field_errors",
          errors: ["No pudimos enviar la solicitud."],
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <div className="portal-hero">
      <span className="portal-kicker">
        {landing?.company_name ? `Solicitud para ${landing.company_name}` : "Solicitud exprés"}
      </span>
      <h1 className="portal-title">
        {landing?.headline ||
          (landing?.company_name
            ? `Agenda tu visita con ${landing.company_name}`
            : "Agenda tu visita técnica en minutos")}
      </h1>
      <p className="portal-subtitle">
        {landing?.subtitle ||
          "Completa este formulario rápido. No necesitas registrarte y recibirás confirmación por WhatsApp."}
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
              <Steps current={current} items={steps.map((step) => ({ title: step.title }))} />
              <div className="portal-divider" />
              <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                onValuesChange={(changedValues) => clearFormFeedback(Object.keys(changedValues))}
              >
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const errors = form.getFieldError("non_field_errors");
                    if (!errors.length) {
                      return null;
                    }

                    return <Alert className="mb-4" message={errors[0]} type="error" showIcon />;
                  }}
                </Form.Item>
                {current === 0 ? (
                  <>
                    <Form.Item
                      label="Nombre completo"
                      name="customer_name"
                      rules={PUBLIC_REQUEST_RULES.customer_name}
                    >
                      <Input placeholder="Nombre y apellido" maxLength={150} />
                    </Form.Item>
                    <Form.Item
                      label="Teléfono"
                      name="phone"
                      rules={PUBLIC_REQUEST_RULES.phone}
                    >
                      <Input
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="Ej: +52 55 1234 5678"
                        maxLength={20}
                      />
                    </Form.Item>
                    <Form.Item label="Correo" name="email" rules={PUBLIC_REQUEST_RULES.email}>
                      <Input autoComplete="email" placeholder="correo@ejemplo.com" maxLength={254} />
                    </Form.Item>
                  </>
                ) : null}
                {current === 1 ? (
                  <>
                    <Form.Item
                      label="Dirección del servicio"
                      name="address"
                      rules={PUBLIC_REQUEST_RULES.address}
                      extra="Busca la dirección y ajusta el punto exacto en el mapa."
                    >
                      <LocationPicker
                        value={address}
                        latitude={latitude}
                        longitude={longitude}
                        onLocationSelect={(location) => {
                          form.setFieldsValue({
                            latitude: location?.latitude ?? "",
                            longitude: location?.longitude ?? "",
                          });
                        }}
                      />
                    </Form.Item>
                    <Form.Item hidden name="latitude">
                      <input type="hidden" />
                    </Form.Item>
                    <Form.Item hidden name="longitude">
                      <input type="hidden" />
                    </Form.Item>
                    <Form.Item
                      label="Tipo de servicio"
                      name="service_type"
                      rules={PUBLIC_REQUEST_RULES.service_type}
                    >
                      <Select options={SERVICE_TYPES} placeholder="Selecciona" />
                    </Form.Item>
                    <Form.Item label="Descripción" name="description">
                      <Input.TextArea rows={3} placeholder="Describe el problema" maxLength={1000} showCount />
                    </Form.Item>
                  </>
                ) : null}
                {current === 2 ? (
                  <div className="grid gap-3 text-sm portal-muted">
                    <p>
                      Revisa la información antes de enviar. Nuestro equipo te confirmará la
                      visita y compartirá el enlace de rastreo.
                    </p>
                  </div>
                ) : null}
              </Form>
              <div className="mt-6 flex items-center justify-between">
                <Button disabled={current === 0} onClick={handleBack} type="text">
                  Atrás
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
          <h2 className="mt-4 text-xl font-semibold">Qué ocurre después de enviar</h2>
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
