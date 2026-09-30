'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LandingSelector } from '@/components/LandingSelector';
import { CinemaScreen } from '@/components/CinemaScreen';
import { WeddingScreen } from '@/components/WeddingScreen';

type View = 'selector' | 'cinema' | 'wedding';
type TabMode = 'video' | 'foto' | 'produccion';

type RequestItem = {
  id: string;
  type: 'wedding' | 'production';
  nombre?: string;
  nombre_cliente?: string;
  nombre_empresa?: string;
  email?: string;
  telefono?: string;
  fecha?: string;
  status?: string;
  lugar?: string;
  descripcion?: string;
  tipo?: string;
  presupuesto?: string;
  created_at?: string;
};

const initialWeddingForm = {
  nombre: '',
  email: '',
  telNovio: '',
  telNovia: '',
  fecha: '',
  lugar: '',
  novia: '',
  novio: '',
  ceremonia: '',
  horaSalidaNovio: '',
  horaSalidaNovia: '',
  horaCeremonia: '',
  horaCoctel: '',
  horaBarraLibre: '',
  detalles: '',
};

const initialProductionForm = {
  nombre: '',
  email: '',
  telefono: '',
  fecha: '',
  tipo: '',
  presupuesto: '',
  descripcion: '',
};

export default function HomePage() {
  const [view, setView] = useState<View>('selector');
  const [tab, setTab] = useState<TabMode>('video');
  const [weddingForm, setWeddingForm] = useState(initialWeddingForm);
  const [productionForm, setProductionForm] = useState(initialProductionForm);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [unifyCalendars, setUnifyCalendars] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await fetch('/api/requests');
        const data = await response.json();
        if (Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
        setUnifyCalendars(Boolean(data.unifyCalendars));
      } catch (error) {
        console.warn('No se pudieron cargar las solicitudes:', error);
      }
    };

    loadRequests();
  }, []);

  const handleWeddingSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wedding',
          ...weddingForm,
          cronograma: [
            `Salida Novio: ${weddingForm.horaSalidaNovio || '--:--'}`,
            `Salida Novia: ${weddingForm.horaSalidaNovia || '--:--'}`,
            `Ceremonia: ${weddingForm.horaCeremonia || '--:--'}`,
            `Cóctel: ${weddingForm.horaCoctel || '--:--'}`,
            `Barra Libre: ${weddingForm.horaBarraLibre || '--:--'}`,
          ].join(' | '),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la solicitud');
      }

      setRequests((current) => [data.request, ...current]);
      setWeddingForm(initialWeddingForm);
      setMessage('¡Solicitud de boda enviada correctamente!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'production', ...productionForm }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la producción');
      }

      setRequests((current) => [data.request, ...current]);
      setProductionForm(initialProductionForm);
      setMessage('¡Solicitud de producción enviada correctamente!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'selector') {
    return <LandingSelector onSelect={setView} />;
  }

  if (view === 'cinema') {
    return (
      <>
        <CinemaScreen
          onBackToHome={() => setView('selector')}
          onShowWedding={() => setView('wedding')}
          tab={tab}
          setTab={setTab}
          productionForm={productionForm}
          setProductionForm={setProductionForm}
          requests={requests}
          unifyCalendars={unifyCalendars}
          isSubmitting={isSubmitting}
          onProductionSubmit={handleProductionSubmit}
        />
        {message && <div className="floating-message">{message}</div>}
      </>
    );
  }

  return (
    <>
      <WeddingScreen
        onBackToHome={() => setView('selector')}
        onShowCinema={() => setView('cinema')}
        weddingForm={weddingForm}
        setWeddingForm={setWeddingForm}
        requests={requests}
        unifyCalendars={unifyCalendars}
        isSubmitting={isSubmitting}
        onWeddingSubmit={handleWeddingSubmit}
      />
      {message && <div className="floating-message">{message}</div>}
    </>
  );
}
