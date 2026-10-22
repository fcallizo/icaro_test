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
          <span className="nav-label">+34 633 716 171</span>
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-mail" aria-hidden="true" />
          <span className="nav-label"><a className={classType} href="mailto:info@icarostudio.es">info@icarostudio.es</a></span>
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-instagram" aria-hidden="true" />
          <span className="nav-label"><a className={classType} href="https://www.instagram.com/icarostudio_/" target="_blank">icarostudio_</a></span>
          
      </p>
      <p className="contact-info">
          <span className="icon-mask icon-pin" aria-hidden="true" />
          <span className="nav-label">C/ Marqués de la ensenada, 10, 30007 Murcia</span>
      </p>
    </div>
  );
}