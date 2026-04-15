import { Link } from "react-router-dom";
import LegalShell from "./LegalShell";
import useDocumentTitle from "@hooks/useDocumentTitle";

const TermsOfService = () => {
  useDocumentTitle("Términos de uso");

  return (
    <LegalShell
      kicker="Marco legal"
      title="Términos de uso de FieldLink"
      updatedAt="15 de abril de 2026"
    >
      <p className="legal-lead">
        Estos Términos de uso (los &ldquo;Términos&rdquo;) regulan el acceso y uso de la
        plataforma FieldLink (el &ldquo;Servicio&rdquo;), operada por FieldLink. Al
        registrarte, crear una cuenta o utilizar el Servicio aceptas estos Términos en
        su totalidad. Si no estás de acuerdo, te pedimos no usar la plataforma.
      </p>

      <section>
        <h2>1. Descripción del servicio</h2>
        <p>
          FieldLink es una plataforma SaaS multi-tenant de gestión de servicios de
          campo que permite a las empresas operadoras (&ldquo;Empresas&rdquo;)
          administrar órdenes de trabajo, técnicos, clientes finales, inventarios,
          materiales, rutas, seguimiento en tiempo real, landings públicas de captación
          y solicitudes de servicio. FieldLink actúa como proveedor de la herramienta;
          los servicios operativos de campo son prestados por cada Empresa a sus
          propios clientes.
        </p>
      </section>

      <section>
        <h2>2. Cuentas y roles de usuario</h2>
        <p>
          Para usar el Servicio debes crear una cuenta asociada a una Empresa. Los
          roles disponibles incluyen: <strong>Dueño / Administrador</strong>,{" "}
          <strong>Supervisor</strong>, <strong>Técnico</strong> y otros que FieldLink
          pueda habilitar. Cada usuario es responsable de mantener la confidencialidad
          de sus credenciales y de todas las actividades realizadas desde su cuenta.
        </p>
        <p>
          Al registrar una Empresa, el usuario creador queda designado como
          administrador inicial y es responsable de la gestión de permisos, alta de
          usuarios adicionales y cumplimiento de estos Términos dentro de su
          organización.
        </p>
      </section>

      <section>
        <h2>3. Uso aceptable</h2>
        <p>Al usar FieldLink, te comprometes a:</p>
        <ul>
          <li>No usar el Servicio para fines ilícitos, fraudulentos o engañosos.</li>
          <li>
            No intentar acceder a datos de otras Empresas, vulnerar mecanismos de
            autenticación, ni realizar ingeniería inversa del Servicio.
          </li>
          <li>
            No cargar contenido que infrinja derechos de terceros, incluyendo datos
            personales obtenidos sin consentimiento.
          </li>
          <li>
            No enviar spam, mensajes masivos no solicitados ni comunicaciones
            engañosas a clientes finales a través de la plataforma.
          </li>
          <li>
            Respetar las cuotas de uso, límites de API y capacidades de tu plan de
            suscripción.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Datos de las Empresas y sus clientes</h2>
        <p>
          Los datos que una Empresa carga al Servicio (clientes, órdenes, inventario,
          materiales, ubicaciones de técnicos, evidencias, firmas, etc.) son propiedad
          de dicha Empresa. FieldLink actúa como encargado del tratamiento de dichos
          datos, exclusivamente para prestar el Servicio, conforme a lo establecido en
          el <Link to="/privacidad">Aviso de privacidad</Link>.
        </p>
        <p>
          La Empresa es responsable de contar con base legítima (consentimiento,
          contrato o similar) para tratar los datos de sus clientes finales dentro del
          Servicio, incluidas las solicitudes públicas recibidas vía landings y el
          rastreo en tiempo real de técnicos en ruta.
        </p>
      </section>

      <section>
        <h2>5. Landings públicas y solicitudes de clientes finales</h2>
        <p>
          FieldLink permite a cada Empresa publicar landings (páginas públicas) para
          recibir solicitudes de servicio de clientes finales. La Empresa es la única
          responsable del contenido publicado en sus landings, de los compromisos
          adquiridos frente al cliente final y de la atención de dichas solicitudes.
          FieldLink únicamente facilita la herramienta.
        </p>
      </section>

      <section>
        <h2>6. Seguimiento y ubicación de técnicos</h2>
        <p>
          El Servicio incluye funcionalidades de seguimiento de ubicación de técnicos
          en tiempo real para órdenes activas. Los técnicos deben ser informados por
          su Empresa empleadora sobre esta funcionalidad y otorgar los permisos
          correspondientes en sus dispositivos. El rastreo público al cliente final
          se desactiva automáticamente al llegar el técnico al destino o al completar
          la orden.
        </p>
      </section>

      <section>
        <h2>7. Planes, suscripción y pagos</h2>
        <p>
          El acceso al Servicio puede requerir el pago de una suscripción conforme al
          plan contratado. Los planes, cuotas, límites y periodos de facturación se
          muestran en la sección de suscripción dentro de la cuenta. FieldLink podrá
          suspender o limitar el acceso ante impagos o incumplimientos, previa
          notificación razonable.
        </p>
      </section>

      <section>
        <h2>8. Propiedad intelectual</h2>
        <p>
          FieldLink, su marca, código fuente, interfaces, logotipos y documentación
          son propiedad intelectual de sus titulares y están protegidos por las leyes
          aplicables. Estos Términos no transfieren derechos de propiedad intelectual
          al usuario; únicamente se concede una licencia limitada, no exclusiva, no
          transferible y revocable para usar el Servicio conforme a estos Términos.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidad del servicio</h2>
        <p>
          FieldLink se esfuerza por mantener el Servicio disponible con la mayor
          continuidad posible, pero no garantiza disponibilidad ininterrumpida. Podrán
          existir ventanas de mantenimiento, actualizaciones, interrupciones por causas
          de fuerza mayor o fallas de terceros proveedores (alojamiento, mapas,
          mensajería, etc.). FieldLink no será responsable por daños derivados de
          dichas interrupciones.
        </p>
      </section>

      <section>
        <h2>10. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley aplicable, FieldLink no será
          responsable por daños indirectos, incidentales, especiales, punitivos o
          consecuenciales derivados del uso o la imposibilidad de uso del Servicio,
          incluyendo pérdida de ingresos, datos, clientela o reputación, aun cuando
          hubiera sido advertida de la posibilidad de tales daños. La responsabilidad
          total acumulada de FieldLink frente al usuario, por cualquier concepto,
          quedará limitada al monto efectivamente pagado por el plan de suscripción en
          los últimos doce (12) meses.
        </p>
      </section>

      <section>
        <h2>11. Terminación</h2>
        <p>
          Puedes dejar de usar el Servicio en cualquier momento cancelando tu
          suscripción o eliminando tu cuenta. FieldLink podrá suspender o terminar el
          acceso en caso de incumplimiento de estos Términos, uso abusivo, actividad
          fraudulenta o requerimiento legal. Al terminar, FieldLink conservará o
          eliminará los datos conforme al Aviso de privacidad y a la legislación
          aplicable.
        </p>
      </section>

      <section>
        <h2>12. Cambios a estos Términos</h2>
        <p>
          FieldLink podrá modificar estos Términos para reflejar cambios legales,
          técnicos o de negocio. Cuando los cambios sean relevantes, notificaremos a
          través del Servicio o por correo electrónico con razonable anticipación. El
          uso continuado después de la entrada en vigor implica aceptación de los
          Términos actualizados.
        </p>
      </section>

      <section>
        <h2>13. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para
          cualquier controversia relacionada con el Servicio, las partes se someten
          expresamente a la jurisdicción de los tribunales competentes de Tijuana,
          Baja California, renunciando a cualquier otro fuero que pudiera
          corresponderles.
        </p>
      </section>

      <section>
        <h2>14. Contacto</h2>
        <p>
          Si tienes dudas sobre estos Términos, escríbenos a{" "}
          <a href="mailto:soporte@fieldlink.mx">soporte@fieldlink.mx</a>.
        </p>
      </section>
    </LegalShell>
  );
};

export default TermsOfService;
