'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const fotos = [
  'https://images.unsplash.com/photo-1741969494307-55394e3e4071?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1661693758705-4fa65572bced?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
];

type CinemaInfoTabProps = {
  onReserve: () => void;
};

export function CinemaInfoTab({onReserve}: CinemaInfoTabProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = () => setIndex(i => (i === 0 ? fotos.length - 1 : i - 1));
  const next = () => setIndex(i => (i === fotos.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % fotos.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="tab-panel">
      <div className="tech-header">
        <div>
          <span className="eyebrow">FOTOGRAFÍA • VÍDEO • CUALQUIER EVENTO</span>
          <h3>Cada evento es distinto. Nuestra forma de contarlo, también.</h3>
          <p>Nos adaptamos a vuestro evento, a vuestro ritmo y a vuestro estilo. Os asesoramos desde el primer día y cuidamos cada detalle: planificación, rodaje y entrega. Contadnos qué necesitáis y os preparamos una propuesta a medida.</p>
        </div>
        <div className="stats-box">
          <div className="stat-card"><strong>HD / 4K</strong><span>Resoluciones</span></div>
          <div className="stat-card"><strong>24h</strong><span>Respuesta Garantizada</span></div>
          <div className="stat-card"><strong>+12</strong><span>Servicios Integrables</span></div>
        </div>
      </div>

      <div className="gestion-card">
        <div className="info-card">
          <div className="card-title">Gestión Técnica</div>
          <div className="tech-list">
            <div className="tech-item">
              <strong>Cámaras de cine digital</strong>
              <p>Uso de cámaras de gran calidadcomo la Sony Alpha 7 V o la FX3 II.</p></div>
            <div className="tech-item">
              <strong>Iluminación profesional</strong>
              <p>Desde un foco discreto hasta un set completo. Adaptamos la luz al espacio y al ambiente.</p></div>
            <div className="tech-item">
              <strong>Tomas aéreas con dron</strong>
              <p>Con el DJI Mini 5 Pro captamos planos aéreos espectaculares. Sujeto a normativa y meteorología.</p></div>
            <div className="tech-item">
              <strong>Sonido directo o editado</strong>
              <p>Captamos el sonido ambiente o lo trabajamos en postproducción, según lo que busquéis.</p></div>
            <div className="tech-item">
              <strong>Personal técnico extra</strong>
              <p>Si el proyecto necesita más manos, ampliamos el equipo. Lo veremos juntos en el presupuesto.</p></div>
            <div className="tech-item">
              <strong>Logística y transporte</strong>
              <p>Nos movemos hasta donde sea el evento. Los desplazamientos se indican siempre antes de reservar.</p>
            </div>
          </div>
        </div>
        <div>
          <div className="img-card-div">
            <img
              className="img-card"
              src="https://images.unsplash.com/photo-1543242594-c8bae8b9e708?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Boda" />
          </div>
          <div className="img-card-div">
            <img
              className="img-card"
              src="https://images.unsplash.com/photo-1640262653848-adea46405e9f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Boda" />
          </div>
        </div>
      </div>

      <div className="cinema-div">
        <h3>Cómo trabajamos</h3>
      </div>

      <div className="process-strip">
        {[
          ['01', 'Conversamos', 'Nos contáis qué queréis y cómo lo imagináis.'],
          ['02', 'Planificamos', 'Visitamos el lugar, definimos horarios y guion.'],
          ['03', 'Grabamos', 'Un equipo discreto y atento, sin interrumpir el momento.'],
          ['04', 'Entregamos', 'Edición cuidada y entrega en el plazo acordado.'],
        ].map(([n, title, text]) => (
          <div key={n} className="process-step">
            <span className="process-num">{n}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>

      {/*-- CAROUSEL --*/}

      <div
        className="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button className="nav prev" onClick={prev} aria-label="Anterior">‹</button>

        <div className="slide">
          <Image
            src={fotos[index]}
            alt={`Foto ${index + 1}`}
            fill
            sizes="100vw"
            className="slide-img"
            priority={index === 0}
          />
        </div>

        <button className="nav next" onClick={next} aria-label="Siguiente">›</button>

        <div className="dots">
          {fotos.map((_, i) => (
            <button
              key={i}
              className={i === index ? 'dot active' : 'dot'}
              onClick={() => setIndex(i)}
              aria-label={`Ir a la foto ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="cinema-div">
        <h3>¿Tenéis algo en mente?</h3>
        <p>No hace falta tenerlo todo claro. Cuéntanos la fecha, el lugar y la idea, y te respondemos en menos de 24 horas con una propuesta sin compromiso.</p>
        
        <button className="submit-btn" onClick={() => onReserve()}>Solicitar presupuesto</button>
        
        <span className="eyebrow">Cumpleaños · Bautizos · Graduaciones · Eventos de empresa · Videoclips · Sesiones de marca</span>
      </div>

    </div>
  );
}
