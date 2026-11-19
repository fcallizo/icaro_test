import { LegalDocument } from '@/components/legal/LegalDocument';
import { STUDIO } from '@/lib/properties';

export const metadata = {
  title: 'Política de privacidad | Ícaro Studio',
  description: 'Información sobre el tratamiento de datos personales en Ícaro Studio.',
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Política de privacidad">
      <section>
        <h2>Responsable del tratamiento</h2>
        <p>El responsable es <strong>{STUDIO.legal}</strong>, titular de la marca Ícaro Studio. Puedes consultar los datos públicos disponibles en el <a href="/aviso-legal">Aviso legal</a>. Para ejercer derechos o plantear consultas sobre privacidad, escribe a <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>.</p>
      </section>

      <section>
        <h2>Datos tratados y finalidades</h2>
        <p>Al solicitar servicios de producción se pueden tratar nombre o empresa, email, teléfono, fecha, presupuesto, tipo de producción y descripción del proyecto. Para solicitudes de boda se pueden tratar nombres, emails, teléfonos, fecha del enlace, lugares, direcciones de preparativos, horarios y detalles que facilite la pareja.</p>
        <p>Usamos estos datos para responder consultas, comprobar disponibilidad, preparar presupuestos y gestionar la solicitud. Si se acepta el servicio, también se tratarán para organizar y ejecutar la relación contractual y atender obligaciones legales o posibles reclamaciones.</p>
        <p>En el área privada se tratan las credenciales técnicas necesarias para identificar a usuarios autorizados y gestionar solicitudes, calendario, ofertas, materiales y clientes. La contraseña se almacena cifrada y los enlaces temporales se gestionan mediante tokens.</p>
      </section>

      <section>
        <h2>Base jurídica</h2>
        <p>Para responder y preparar una propuesta, la base es la aplicación, a petición de la persona, de medidas precontractuales (artículo 6.1.b del RGPD). Si se contrata el servicio, se aplicará además la ejecución del contrato y, cuando proceda, el cumplimiento de obligaciones legales. Los datos marcados como obligatorios son necesarios para gestionar la solicitud; si no se facilitan, quizá no podamos atenderla.</p>
        <p>Los datos no se usarán para enviar publicidad. Cualquier comunicación promocional requerirá una base jurídica propia y, cuando corresponda, autorización separada.</p>
        <p>El acceso al área privada y las medidas de seguridad tienen como base el cumplimiento de obligaciones y el interés legítimo de proteger la aplicación y los datos gestionados.</p>
      </section>

      <section>
        <h2>Destinatarios y proveedores</h2>
        <p>El acceso se limita al responsable y a las personas autorizadas. Los datos pueden ser tratados por los proveedores técnicos necesarios para prestar el servicio: Vercel para el alojamiento de la aplicación, Neon para la base de datos, Cloudinary para el almacenamiento y entrega de imágenes, y Resend para el envío de correos de solicitudes y gestión de cuentas.</p>
        <p>Google Fonts puede recibir la dirección IP del navegador al cargar las tipografías del sitio. La ubicación concreta de los servidores de estos proveedores y las posibles transferencias internacionales deberán verificarse en la documentación vigente de cada proveedor y en las garantías aplicables.</p>
      </section>

      <section>
        <h2>Conservación</h2>
        <p>Los datos se conservarán mientras se gestiona la consulta o la relación contractual. Después, se suprimirán o bloquearán durante los plazos necesarios para atender obligaciones legales y posibles responsabilidades.</p>
        <p>Las solicitudes que no lleguen a contratarse se conservarán durante <strong>1 año desde la última interacción</strong>. Los datos de clientes se conservarán <strong>durante la relación contractual y cinco años después</strong> para atender responsabilidades derivadas de la prestación del servicio y otros plazos legales aplicables.</p>
        <p>Los tokens temporales de sesión, invitación y recuperación caducan conforme a su finalidad y se conservan únicamente el tiempo técnico necesario.</p>
      </section>

      <section>
        <h2>Derechos</h2>
        <p>Puedes solicitar acceso, rectificación, supresión, limitación u oposición al tratamiento y, cuando proceda, portabilidad, escribiendo a <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>. También puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos</a>.</p>
      </section>

      <section>
        <h2>Cookies y almacenamiento técnico</h2>
        <p>El área privada utiliza la cookie técnica <strong>icaro_private_session</strong> para mantener autenticada la sesión del usuario durante un máximo de ocho horas. Es HTTP Only, utiliza SameSite=Lax y Secure en producción, y se elimina al cerrar sesión. No se utiliza para publicidad ni analítica.</p>
        <p>La aplicación no instala actualmente cookies publicitarias ni herramientas de seguimiento. También pueden utilizarse medios técnicos estrictamente necesarios para limitar abusos y proteger los formularios. Si se incorporan herramientas no esenciales, esta política se actualizará y se solicitará consentimiento cuando la normativa lo exija.</p>
      </section>

      <section>
        <h2>Actualización de esta política</h2>
        <p>Esta política puede actualizarse para reflejar cambios legales, técnicos o de proveedores. Última actualización: <strong>18 de noviembre de 2026</strong>.</p>
      </section>
    </LegalDocument>
  );
}