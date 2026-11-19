import { STUDIO } from "@/lib/properties";

type ContactPanelProps = {
  classType: string;
};

export function ContactPanel({
  classType
}: ContactPanelProps) {
  return (
    <div >
      <h4>Contacta con nosotros</h4>

      <p className="contact-info">
          <span className="icon-mask icon-phone" aria-hidden="true" />
          <span className="nav-label">{STUDIO.phone}</span>
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-mail" aria-hidden="true" />
          <span className="nav-label"><a className={classType} href={STUDIO.email}>{STUDIO.email}</a></span>
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-instagram" aria-hidden="true" />
          <span className="nav-label"><a className={classType} href="https://www.instagram.com/icarostudio_/" target="_blank">icarostudio_</a></span>
          
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-pin" aria-hidden="true" />
          <span className="nav-label">{STUDIO.address}</span>
      </p>
    </div>
  );
}