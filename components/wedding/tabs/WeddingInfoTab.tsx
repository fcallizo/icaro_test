type WeddingInfoTabProps = {
  onReserve: () => void;
};

export function WeddingInfoTab({onReserve}: WeddingInfoTabProps) {

  const weddingPrices = {
    photo: 250,
    video: 300,
    complete: 500
  };
  
  const complementaryPrices = {
    photo: 100,
    video: 150,
    complete: 200
  };

  const duoPercentage = 5;
  const trioPercentage = 15;

  function discountedPrice(originalPrice: number, discountPercentage: number): number {
    const discountAmount = (originalPrice * discountPercentage) / 100;
    return originalPrice - discountAmount;
  }

  return (
    <div className="tab-panel" role="tabpanel">
      <section aria-labelledby="wedding-planning-title">
        <div className="hero-block light">
          <h1>Cada detalle merece su momento</h1>
          <p>Empezamos por lo que hace único vuestro día. Conocemos los lugares, los momentos importantes y el estilo que imagináis para dar forma a una cobertura natural y personal.</p>
        </div>

        <div className="hero-crop">
          <img
          className="hero-img"
            src="https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Boda"/>
        </div>

        <div className="divider-block light">
          <div className="divider-title" >
            <h2>Aportamos nuestro granito de arena</h2>
          </div>
          <p>Esto es lo que podemos hacer por vosotros en ese día tan especial</p>
        </div>

        <div className="wedding-story-list">
          <div className="wedding-story-row">
            <div className="wedding-story-image card-three-wedding" role="img" aria-label="Pareja celebrando su boda" />
            <article>
              <h4>Una historia que recordar</h4>
              <p>Compartid las personas, gestos y cariño que queréis volver a sentir cada vez que veáis vuestra boda.</p>
            </article>
          </div>
          <div className="wedding-story-row">
            <article>
              <h4>Un día sin prisas</h4>
              <p>Coordinamos los horarios junto al resto de equipos para estar siempre presentes y capturar cada minuto desde el principio hasta el final de su día especial.</p>
            </article>
            <div className="wedding-story-image card-four-wedding" role="img" aria-label="Novios durante su celebración" />
          </div>
          <div className="wedding-story-row">
            <div className="wedding-story-image card-two-wedding" role="img" aria-label="Celebración al aire libre" />
            <article>
              <h4>Recuerdos a vuestra medida</h4>
              <p>Podemos orientar la cobertura hacia película documental, reportaje fotográfico o una combinación de ambos.</p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="divider-block light">
          <div className="divider-title" >
            <h2>Nuestras Tarifas</h2>
          </div>
          <p> Precios por servicio. ¡Combinadlos y ahorrad! </p>
        </div>

        <div className="cards-grid">
          <div className="booking-form combo-card wedding-panel">
            <div className="card-title">Pre-boda</div>
            <div className="price-row">
              <div><strong>Sesión Fotográfica</strong><span>Conócenos antes del gran día, sesión relajada.</span></div>
              <b className="single-price">{complementaryPrices.photo} €</b>
            </div>
            <div className="price-row">
              <div><strong>Película documental</strong><span>Grabación y edición del evento.</span></div>
              <b className="single-price">{complementaryPrices.video} €</b>
            </div>
            <div className="price-row no-border">
              <div><strong>Pack Completo</strong><span>Sesión Fotográfica + Película.</span></div>
              <b className="package-price">{complementaryPrices.complete} €</b>
            </div>
          </div>

          <div className="booking-form combo-card featured wedding-panel">
            <div className="card-title">Boda</div>
            <div className="price-row">
              <div><strong>Sesión Fotográfica</strong><span>Cobertura completa de ceremonia y fiesta.</span></div>
              <b className="single-price">{weddingPrices.photo} €</b>
            </div>
            <div className="price-row">
              <div><strong>Película documental</strong><span>Grabación y edición del evento.</span></div>
              <b className="single-price">{weddingPrices.video} €</b>
            </div>
            <div className="price-row no-border">
              <div><strong>Pack Completo</strong><span>Sesión Fotográfica + Película.</span></div>
              <b className="package-price">{weddingPrices.complete} €</b>
            </div>
          </div>

          <div className="booking-form combo-card wedding-panel">
            <div className="card-title">Post-boda</div>
            <div className="price-row">
              <div><strong>Sesión Fotográfica</strong><span>Una sesión después de la boda, a vuestra elección.</span></div>
              <b className="single-price" >{complementaryPrices.photo} €</b>
            </div>
            <div className="price-row">
              <div><strong>Película documental</strong><span>Grabación y edición del evento.</span></div>
              <b className="single-price">{complementaryPrices.video} €</b>
            </div>
            <div className="price-row no-border">
              <div><strong>Pack Completo</strong><span>Sesión Fotográfica + Película.</span></div>
              <b className="package-price">{complementaryPrices.complete} €</b>
            </div>
          </div>
        </div>

        {/* Packs combinados destacados */}
        <div className="combo-block">
          <h2 className="combo-heading">Packs combinados</h2>
          <div className="cards-grid combo-grid">
            <div className="info-card combo-card wedding-panel centred-card">
              <span className="discount-badge">{duoPercentage}% dto.</span>
              <div className="card-title">Dúo · Boda + Pre-boda o Post-boda</div>
              <p className="combo-desc">Combinad vuestra boda con uno de los complementos y consegid un {duoPercentage}% de descuento.</p>
              <div className="combo-price">
                <span className="old-price">{complementaryPrices.complete + weddingPrices.complete} €</span>
                <span className="new-price">{discountedPrice(complementaryPrices.complete + weddingPrices.complete, duoPercentage)} €</span>
              </div>
            </div>

            <div className="info-card combo-card featured wedding-panel centred-card">
              <span className="discount-badge">{trioPercentage}% dto.</span>
              <span className="popular-tag">Más elegido</span>
              <div className="card-title">Trío · Experiencia Completa</div>
              <p className="combo-desc">Pre-boda + Boda + Post-boda. Todo con un {trioPercentage}% de descuento.</p>
              <div className="combo-price">
                <span className="old-price">{2 * complementaryPrices.complete + weddingPrices.complete} €</span>
                <span className="new-price">{discountedPrice(2 * complementaryPrices.complete + weddingPrices.complete, trioPercentage)} €</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider-block light">
          <div className="divider-title" >
            <h2>¿Hablamos de vuestra boda?</h2>
          </div>
          <p> Contadnos la fecha y el lugar y os respondemos en menos de 24 h con una propuesta sin compromiso. </p>
          <button className="submit-btn" onClick={() => onReserve()}>Consultar Disponibilidad</button>
        </div>
    </div>
  );
}
