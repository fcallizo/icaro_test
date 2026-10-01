import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata = {
  title: 'Aviso legal | Ícaro Studio',
  description: 'Información del titular y condiciones de uso del sitio web de Ícaro Studio.',
};

export default function LegalNoticePage() {
  return (
    <LegalDocument title="Aviso legal">
      <aside className="legal-completion-notice" role="note">
        Antes de publicar, sustituye todos los campos marcados como pendientes por los datos reales del titular y del servicio.
      </aside>

      <section>
        <h2>Titular del sitio</h2>
        <dl className="legal-details-list">
          <div><dt>Marca</dt><dd>Ícaro Studio</dd></div>
          <div><dt>Titular legal</dt><dd className="legal-pending">[PENDIENTE: nombre y apellidos o razón social]</dd></div>
          <div><dt>NIF</dt><dd className="legal-pending">[PENDIENTE: NIF del titular]</dd></div>
          <div><dt>Domicilio profesional</dt><dd className="legal-pending">[PENDIENTE: dirección postal del titular]</dd></div>
          <div><dt>Email</dt><dd><a href="mailto:icarostudio33@gmail.com">icarostudio33@gmail.com</a></dd></div>
          <div><dt>Teléfono</dt><dd><a href="tel:+34633716171">+34 633 716 171</a></dd></div>
          <div><dt>Registro público</dt><dd>[Completar los datos registrales si el titular está inscrito]</dd></div>
        </dl>
        <p>Actividad: producción cinematográfica y audiovisual, fotografía y servicios de filmación de bodas y eventos.</p>
      </section>

      <section>
        <h2>Objeto y uso del sitio</h2>
        <p>Este sitio presenta los servicios de Ícaro Studio y permite solicitar información, disponibilidad y presupuesto. El envío de un formulario no confirma por sí mismo una reserva ni sustituye las condiciones particulares que se acuerden con el cliente.</p>
        <p>El usuario se compromete a facilitar información veraz y a utilizar el sitio conforme a la ley y a los derechos de terceros.</p>
      </section>

      <section>
        <h2>Propiedad intelectual y enlaces</h2>
        <p>Los contenidos, fotografías, vídeos, marcas y demás elementos del sitio pertenecen a sus titulares o se utilizan con autorización. No se permite su reproducción o explotación sin autorización, salvo los usos legalmente permitidos.</p>
        <p>Los enlaces a servicios de terceros conducen a sitios ajenos a Ícaro Studio, que responden de sus propios contenidos y políticas.</p>
      </section>

      <section>
        <h2>Normativa aplicable</h2>
        <p>El sitio se rige por la normativa española y de la Unión Europea que resulte aplicable, incluida la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico.</p>
      </section>
    </LegalDocument>
  );
}