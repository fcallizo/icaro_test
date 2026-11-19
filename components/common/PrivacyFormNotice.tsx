import Link from 'next/link';

export function PrivacyFormNotice() {
  return (
    <p className="privacy-form-notice">
      Ícaro Studio utilizará estos datos para atender tu solicitud, comprobar disponibilidad y contactarte sobre el servicio. La base del tratamiento es gestionar las medidas precontractuales que solicitas. Las solicitudes no contratadas se conservarán durante 1 año desde la última interacción. No se usarán para enviarte publicidad sin una autorización separada. Consulta el resto de información en la <Link href="/privacidad">Política de Privacidad</Link>.
    </p>
  );
}