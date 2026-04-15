import { Link } from "react-router-dom";
import LegalShell from "./LegalShell";
import useDocumentTitle from "@hooks/useDocumentTitle";

const PrivacyPolicy = () => {
  useDocumentTitle("Aviso de privacidad");

  return (
    <LegalShell
      kicker="Protección de datos"
      title="Aviso de privacidad de FieldLink"
      updatedAt="15 de abril de 2026"
    >
      <p className="legal-lead">
        En FieldLink valoramos y protegemos tu información personal. Este Aviso de
        privacidad describe qué datos recabamos, con qué finalidades los tratamos,
        con quién los compartimos y cuáles son tus derechos, conforme a la Ley
        Federal de Protección de Datos Personales en Posesión de los Particulares
        (LFPDPPP) y su Reglamento.
      </p>

      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          FieldLink (el &ldquo;Responsable&rdquo;) es quien recaba y trata los datos
          personales de los usuarios que se registran y utilizan la plataforma. Para
          cualquier asunto relacionado con este Aviso puedes contactarnos en{" "}
          <a href="mailto:privacidad@fieldlink.mx">privacidad@fieldlink.mx</a>.
        </p>
      </section>

      <section>
        <h2>2. Datos personales que recabamos</h2>
        <p>Recabamos las siguientes categorías de datos:</p>
        <ul>
          <li>
            <strong>Identificación y contacto:</strong> nombre, correo electrónico,
            teléfono, cargo dentro de la Empresa.
          </li>
          <li>
            <strong>Cuenta y autenticación:</strong> contraseña cifrada, rol,
            sesiones activas, preferencias de interfaz (tema, recordar sesión).
          </li>
          <li>
            <strong>Datos de la Empresa:</strong> nombre comercial, slug, ciudad,
            número de contacto, configuración de tarifas y operación.
          </li>
          <li>
            <strong>Datos operativos:</strong> clientes dados de alta, órdenes de
            trabajo, solicitudes recibidas, materiales usados, aprobaciones, rutas,
            ubicaciones de técnicos durante el servicio, evidencias fotográficas y
            firmas de conformidad.
          </li>
          <li>
            <strong>Datos de ubicación:</strong> coordenadas geográficas de los
            técnicos en ruta y de los puntos de servicio, con fines de asignación,
            seguimiento y rastreo público al cliente final.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo,
            sistema operativo, navegador, logs de acceso y uso.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades del tratamiento</h2>
        <p>Tratamos tus datos para las siguientes finalidades primarias:</p>
        <ul>
          <li>Crear, mantener y autenticar tu cuenta en el Servicio.</li>
          <li>
            Proporcionar las funcionalidades de gestión de campo: órdenes, clientes,
            inventario, materiales, asignación, agenda, rastreo y aprobaciones.
          </li>
          <li>
            Permitir la recepción y validación de solicitudes de clientes finales
            desde landings públicas.
          </li>
          <li>
            Habilitar el seguimiento en tiempo real de técnicos durante órdenes
            activas, con desactivación automática al llegar al destino.
          </li>
          <li>Brindar soporte técnico y atender reportes de incidentes.</li>
          <li>
            Facturación, cobro y gestión de la suscripción al plan contratado.
          </li>
          <li>
            Cumplir obligaciones legales, contables y fiscales aplicables.
          </li>
        </ul>

        <p>
          Finalidades secundarias que <strong>no son</strong> necesarias para el
          Servicio (puedes negarlas en cualquier momento escribiendo a la dirección
          de contacto):
        </p>
        <ul>
          <li>Envío de comunicaciones sobre nuevas funciones y mejoras.</li>
          <li>Encuestas de satisfacción y uso del producto.</li>
          <li>
            Analítica agregada y anonimizada para mejorar la experiencia de usuario.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Datos de clientes finales tratados en nombre de las Empresas</h2>
        <p>
          Cuando una Empresa utiliza FieldLink para gestionar a sus propios clientes,
          FieldLink actúa como <strong>encargado del tratamiento</strong> de los
          datos personales de dichos clientes finales (nombre, teléfono, dirección,
          coordenadas, historial de servicio). En esos casos, la Empresa es la
          responsable del tratamiento y es quien debe recabar el consentimiento y
          proporcionar el aviso correspondiente a sus clientes. FieldLink únicamente
          procesa esos datos conforme a las instrucciones de la Empresa y a estos
          términos.
        </p>
      </section>

      <section>
        <h2>5. Transferencias de datos</h2>
        <p>
          FieldLink podrá compartir datos personales con proveedores que apoyan la
          operación del Servicio, bajo acuerdos de confidencialidad y protección de
          datos:
        </p>
        <ul>
          <li>Proveedores de infraestructura en la nube y bases de datos.</li>
          <li>
            Servicios de mapas, geocodificación y rutas (para el funcionamiento del
            rastreo y las direcciones).
          </li>
          <li>
            Proveedores de mensajería (correo, WhatsApp, SMS) para notificaciones
            transaccionales.
          </li>
          <li>Pasarelas de pago, cuando apliquen a la suscripción.</li>
          <li>Autoridades competentes, cuando exista requerimiento legal válido.</li>
        </ul>
        <p>
          No vendemos tus datos personales a terceros ni los compartimos con fines
          publicitarios ajenos al Servicio.
        </p>
      </section>

      <section>
        <h2>6. Derechos ARCO</h2>
        <p>
          Tienes derecho a conocer qué datos personales tenemos de ti, para qué los
          usamos y las condiciones del uso que les damos (<strong>Acceso</strong>).
          Asimismo, es tu derecho solicitar la corrección de tu información en caso
          de que esté desactualizada, sea inexacta o incompleta (
          <strong>Rectificación</strong>); que la eliminemos cuando consideres que no
          está siendo utilizada conforme a los principios, deberes y obligaciones
          previstas en la normativa (<strong>Cancelación</strong>); así como
          oponerte al uso de tus datos personales para fines específicos (
          <strong>Oposición</strong>).
        </p>
        <p>
          Para ejercer estos derechos, envía tu solicitud a{" "}
          <a href="mailto:privacidad@fieldlink.mx">privacidad@fieldlink.mx</a>{" "}
          indicando tu nombre completo, correo registrado y descripción clara del
          derecho que deseas ejercer. Responderemos dentro de los plazos marcados por
          la LFPDPPP.
        </p>
      </section>

      <section>
        <h2>7. Conservación y seguridad</h2>
        <p>
          Los datos personales se conservan mientras exista una relación activa con
          el Servicio y durante los plazos que la normativa aplicable nos obligue a
          retenerlos (p. ej. contables y fiscales). Implementamos medidas de
          seguridad técnicas, administrativas y físicas razonables para proteger los
          datos contra acceso no autorizado, pérdida, alteración o divulgación,
          incluyendo cifrado en tránsito (TLS), autenticación con JWT, segmentación
          multi-tenant y respaldos periódicos.
        </p>
      </section>

      <section>
        <h2>8. Cookies y tecnologías similares</h2>
        <p>
          El Servicio utiliza almacenamiento local del navegador para mantener tu
          sesión (opción &ldquo;Recordarme&rdquo;), preferencias de tema y
          configuración de interfaz. No utilizamos cookies de rastreo publicitario de
          terceros.
        </p>
      </section>

      <section>
        <h2>9. Menores de edad</h2>
        <p>
          El Servicio está dirigido a personas mayores de edad que actúan en nombre
          propio o de una empresa. No recabamos de forma intencional datos de menores
          de edad. Si identificas que un menor nos ha proporcionado datos, avísanos
          para proceder con su eliminación.
        </p>
      </section>

      <section>
        <h2>10. Cambios al Aviso de privacidad</h2>
        <p>
          Podremos actualizar este Aviso para reflejar cambios normativos, técnicos o
          de operación. La versión vigente siempre estará disponible en esta página,
          indicando la fecha de última actualización. Cuando los cambios sean
          sustanciales, te lo notificaremos por los medios de contacto registrados.
        </p>
      </section>

      <section>
        <h2>11. Contacto</h2>
        <p>
          Para cualquier duda, aclaración o solicitud relacionada con este Aviso de
          privacidad, contáctanos en{" "}
          <a href="mailto:privacidad@fieldlink.mx">privacidad@fieldlink.mx</a> o
          consulta nuestros{" "}
          <Link to="/terminos">Términos de uso</Link>.
        </p>
      </section>
    </LegalShell>
  );
};

export default PrivacyPolicy;
