import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata = {
  title: 'Política de privacidad | Ícaro Studio',
  description: 'Información sobre el tratamiento de datos personales en Ícaro Studio.',
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Política de privacidad">
      <aside className="legal-completion-notice" role="note">
        Borrador pendiente de completar antes de publicar: confirma la identidad del titular, los proveedores de producción, la ubicación de los servicios y los plazos concretos de conservación.
      </aside>

      <section>
        <h2>Responsable del tratamiento</h2>
        <p>El responsable es el titular legal de Ícaro Studio, cuyos datos completos deben constar en el <a href="/aviso-legal">Aviso legal</a>. Para consultas sobre privacidad puedes escribir a <a href="mailto:icarostudio33@gmail.com">icarostudio33@gmail.com</a>.</p>
      </section>

      <section>
        <h2>Datos tratados y finalidades</h2>
        <p>Al solicitar servicios de producción se pueden tratar nombre o empresa, email, teléfono, fecha, presupuesto, tipo de producción y descripción del proyecto. Para solicitudes de boda se pueden tratar nombres, emails, teléfonos, fecha del enlace, lugares, direcciones de preparativos, horarios y detalles que facilite la pareja.</p>
        <p>Usamos estos datos para responder consultas, comprobar disponibilidad, preparar presupuestos y gestionar la solicitud. Si se acepta el servicio, también se tratarán para organizar y ejecutar la relación contractual y atender obligaciones legales o posibles reclamaciones.</p>
      </section>

      <section>
        <h2>Base jurídica</h2>
        <p>Para responder y preparar una propuesta, la base es la aplicación, a petición de la persona, de medidas precontractuales (artículo 6.1.b del RGPD). Si se contrata el servicio, se aplicará además la ejecución del contrato y, cuando proceda, el cumplimiento de obligaciones legales. Los datos marcados como obligatorios son necesarios para gestionar la solicitud; si no se facilitan, quizá no podamos atenderla.</p>
        <p>Los datos no se usarán para enviar publicidad. Cualquier comunicación promocional requerirá una base jurídica propia y, cuando corresponda, autorización separada.</p>
      </section>

      <section>
        <h2>Destinatarios y proveedores</h2>
        <p>El acceso se limita al titular y a los proveedores necesarios para operar la web, alojar la base de datos y enviar comunicaciones relacionadas con la solicitud. La aplicación utiliza Neon para la base de datos y un proveedor SMTP configurado por el titular para el correo.</p>
        <p className="legal-pending">[PENDIENTE: indicar el proveedor de alojamiento/despliegue, el proveedor SMTP real, las ubicaciones de tratamiento y, si hay transferencias fuera del Espacio Económico Europeo, su destino y las garantías aplicables.]</p>
      </section>

      <section>
        <h2>Conservación</h2>
        <p>Los datos se conservarán mientras se gestiona la consulta o la relación contractual. Después, se suprimirán o bloquearán durante los plazos necesarios para atender obligaciones legales y posibles responsabilidades.</p>
        <p className="legal-pending">[PENDIENTE: definir el plazo concreto para solicitudes que no lleguen a contratarse y los criterios/plazos aplicables a clientes.]</p>
      </section>

      <section>
        <h2>Derechos</h2>
        <p>Puedes solicitar acceso, rectificación, supresión, limitación u oposición al tratamiento y, cuando proceda, portabilidad, escribiendo a <a href="mailto:icarostudio33@gmail.com">icarostudio33@gmail.com</a>. También puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos</a>.</p>
      </section>

      <section>
        <h2>Cookies y almacenamiento técnico</h2>
        <p>El área privada utiliza una cookie técnica de sesión para mantener autenticado al usuario. No se instala para publicidad ni analítica. Si se incorporan herramientas no esenciales, se actualizará esta información y se solicitará consentimiento cuando la normativa lo exija.</p>
      </section>
    </LegalDocument>
  );
}