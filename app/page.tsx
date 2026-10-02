'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LandingSelector } from '@/components/LandingSelector';
import { CinemaScreen } from '@/components/CinemaScreen';
import { WeddingScreen } from '@/components/WeddingScreen';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { CalendarBlockRange } from '@/components/private/private-types';

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
  const [blockedRanges, setBlockedRanges] = useState<CalendarBlockRange[]>([]);
  const [unifyCalendars, setUnifyCalendars] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone; surface?: 'dark' | 'light' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await fetch('/api/requests');
        const data = await response.json();
        if (Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
        if (Array.isArray(data.blockedRanges)) {
          setBlockedRanges(data.blockedRanges as CalendarBlockRange[]);
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
    setToast(null);

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
      setToast({ message: '¡Solicitud de boda enviada correctamente!', tone: 'success', surface: 'light' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo enviar.', tone: 'error', surface: 'light' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setToast(null);

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
      setToast({ message: '¡Solicitud de producción enviada correctamente!', tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'No se pudo enviar.', tone: 'error' });
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
          blockedRanges={blockedRanges}
          unifyCalendars={unifyCalendars}
          isSubmitting={isSubmitting}
          onProductionSubmit={handleProductionSubmit}
        />
        <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />
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
        blockedRanges={blockedRanges}
        unifyCalendars={unifyCalendars}
        isSubmitting={isSubmitting}
        onWeddingSubmit={handleWeddingSubmit}
      />
      <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />
    </>
  );
}
