'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';

type WeddingFormValues = {
  nombre: string;
  email: string;
  fecha: string;
  telNovio: string;
  telNovia: string;
  lugar: string;
  novio: string;
  novia: string;
  ceremonia: string;
  horaSalidaNovio: string;
  horaSalidaNovia: string;
  horaCeremonia: string;
  horaCoctel: string;
  horaBarraLibre: string;
  detalles: string;
  tipoPack: string;
  fechaPreboda: string;
  lugarPreboda: string;
  detallesPreboda: string;
  fechaPostboda: string;
  lugarPostboda: string;
  detallesPostboda: string;
  status: string;
};

const emptyValues: WeddingFormValues = {
  nombre: '', email: '', fecha: '', telNovio: '', telNovia: '', lugar: '',
  novio: '', novia: '', ceremonia: '', horaSalidaNovio: '', horaSalidaNovia: '',
  horaCeremonia: '', horaCoctel: '', horaBarraLibre: '', detalles: '', tipoPack: '',
  fechaPreboda: '', lugarPreboda: '', detallesPreboda: '',
  fechaPostboda: '', lugarPostboda: '', detallesPostboda: '', status: ''
};

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export default function CustomerWeddingFormPage({ params }: { params: { token: string } }) {
  const [values, setValues] = useState<WeddingFormValues>(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [disabledForm, setDisable] = useState(false);


  useEffect(() => {
    let isCurrent = true;
    const loadForm = async () => {
      try {
        const response = await fetch(`/api/customer/wedding/${encodeURIComponent(params.token)}`, {
          cache: 'no-store',
        });
        const data: { wedding?: Record<string, unknown>; error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el formulario.');
        if (!data.wedding) throw new Error('No se pudo cargar el formulario.');
        const loadedValues = { ...emptyValues };
        (Object.keys(loadedValues) as Array<keyof WeddingFormValues>).forEach((field) => {
          loadedValues[field] = getString(data.wedding?.[field]);
        });
        if (isCurrent) {
          setValues(loadedValues);
          setDisable(loadedValues.status !== "pending");
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el formulario.');
        }
      } finally {
        if (isCurrent) setLoading(false);
          
        
      }
    };
    void loadForm();
    return () => {
      isCurrent = false;
    };
  }, [params.token]);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const setFieldValue = (field: keyof WeddingFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    const requiredPhones: Array<[keyof WeddingFormValues, string]> = [
      ['telNovio', 'teléfono del novio'],
      ['telNovia', 'teléfono de la novia'],
    ];
    for (const [field, label] of requiredPhones) {
      const val = values[field];
      if (!val) {
        setError(`El ${label} es obligatorio.`);
        setSaving(false);
        return;
      }
      if (!isValidPhoneNumber(val)) {
        setError(`El ${label} no tiene un formato válido.`);
        setSaving(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/customer/wedding/${encodeURIComponent(params.token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar los datos.');
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const input = (field: keyof WeddingFormValues, label: string, type = 'text', required = false) => {
    const fieldInput = (
      <input
        id={`customer-${field}`}
        name={field}
        type={type}
        value={values[field]}
        onChange={updateField}
        required={required}
        readOnly={field === 'fecha'}
        disabled={disabledForm}
      />
    );
    return (
      <div className="field-group" key={field}>
        <label htmlFor={`customer-${field}`}>{label}</label>
        {type === 'date' ? <div className="date-input">{fieldInput}</div> : fieldInput}
      </div>
    );
  };

  const inputPhone = (field: keyof WeddingFormValues, label: string, required = false) => (
    <div className="field-group" key={field}>
      <label htmlFor={`customer-${field}`}>{label}</label>
      <InternationalPhoneInput
        value={values[field] || ''}
        onChange={(next) => setFieldValue(field, next ?? '')}
        placeholder="Teléfono"
        required={required}
        disabled={disabledForm}
      />
    </div>
  );

  const textarea = (field: keyof WeddingFormValues, label: string) => (
    <div className="field-group customer-wedding-wide" key={field}>
      <label htmlFor={`customer-${field}`}>{label}</label>
      <textarea
        id={`customer-${field}`}
        name={field}
        rows={3}
        value={values[field]}
        onChange={updateField}
        disabled={disabledForm}
      />
    </div>
  );

  const hasPreWedding = values.tipoPack === 'duo-pre' || values.tipoPack === 'trio';
  const hasPostWedding = values.tipoPack === 'duo-post' || values.tipoPack === 'trio';

  return (
    <main className="customer-wedding-page page-shell-bodas">
      <section className="customer-wedding-card">
        <div className="brand">
          <img src="/logo_transparente.png" alt="Ícaro Logo" className="brand-logo" />
          <span className="brand-name">ÍCARO <span className="brand-accent">STUDIO</span></span>
        </div>
        <p className="customer-wedding-eyebrow">Vuestra historia, en buenas manos</p>
        <h1>Completemos los detalles de vuestra boda</h1>

        {loading ? (
          <p className="customer-wedding-message" role="status">Cargando vuestro formulario…</p>
        ) : error && !values.nombre && !values.email ? (
          <p className="customer-wedding-message customer-wedding-error" role="alert">{error}</p>
        ) : (
          <form className="customer-wedding-form" onSubmit={handleSubmit}>
            {disabledForm ? (
              <p className="customer-wedding-intro">
                Vuestro servicio está confirmado. El formulario ya no se puede editar, pero podéis consultar aquí toda la información. Para cualquier cambio, contactad con nosotros.
              </p>
            ) : (<div>
              <p className="customer-wedding-intro">
                Gracias por confiarnos vuestra historia. Contadnos lo que ya sabéis de vuestro día. Si hay algo que todavía no tenéis decidido, no pasa nada:
                podréis volver a este enlace cuando queráis.
              </p>

              <div className="customer-form-link-notice" role="note">
                <strong>Antes de empezar</strong>
                <ul>
                  <li>
                    <strong>La fecha de la boda no se puede modificar desde este formulario.</strong> Si necesitáis
                    cambiarla, escribidnos.
                  </li>
                  <li>
                    <strong>una vez confirmemos el servicio, el formulario no será editable.</strong> Podréis seguir
                    entrando para consultar la información, pero cualquier cambio tendréis que poneros en contacto con nosotros.
                  </li>
                </ul>
              </div>
            </div>)}
            <div className="customer-wedding-section">
              <h2>Información de Contactos</h2>
              {input('nombre', 'Nombre de la pareja', 'text', true)}
              <div className="two-col">
                {input('email', 'Correo electrónico', 'email', true)}
                {input('fecha', 'Fecha de la boda', 'date', true)}
                {inputPhone('telNovio', 'Teléfono del novio', true)}
                {inputPhone('telNovia', 'Teléfono de la novia', true)}
              </div>
              {textarea('detalles', 'Detalles que queráis compartir')}
            </div>

            <div className="customer-wedding-section">
              <h2>Horarios</h2>
              <p className="customer-wedding-section-intro">Si todavía no tenéis algún horario, podéis dejarlo sin completar.</p>
              <div className="two-col customer-wedding-schedule">
                {input('novio', 'Casa del novio')}
                {input('horaSalidaNovio', 'Salida del novio', 'time')}

                {input('novia', 'Casa de la novia')}
                {input('horaSalidaNovia', 'Salida de la novia', 'time')}

                {input('ceremonia', 'Lugar de la ceremonia')}
                {input('horaCeremonia', 'Ceremonia', 'time')}

                {input('lugar', 'Lugar del banquete', 'text', true)}
                <div>
                  {input('horaCoctel', 'Cóctel', 'time')}
                  {input('horaBarraLibre', 'Barra libre', 'time')}
                </div>
              </div>
            </div>

            <div className="customer-wedding-section">
              <h2>Servicios incluidos</h2>
              <div className="two-col">
                <div className="field-group customer-wedding-wide">
                  <label htmlFor="customer-tipoPack">Servicio contratado</label>
                  <select id="customer-tipoPack" name="tipoPack" value={values.tipoPack} onChange={updateField} required disabled={disabledForm}>
                    <option value="">Seleccionad una opción</option>
                    <option value="indeciso">Aún no lo sé</option>
                    <option value="boda">Solo boda</option>
                    <option value="duo-pre">Boda + pre-boda</option>
                    <option value="duo-post">Boda + post-boda</option>
                    <option value="trio">Pre-boda + boda + post-boda</option>
                  </select>
                </div>
              </div>
            </div>

            {hasPreWedding && (
              <div className="customer-wedding-section">
                <h2>Preboda</h2>
                <div className="two-col">
                  {input('fechaPreboda', 'Fecha de la preboda', 'date', true)}
                  {input('lugarPreboda', 'Lugar de la preboda', 'text', true)}
                  {textarea('detallesPreboda', 'Detalles de la preboda')}
                </div>
              </div>
            )}

            {hasPostWedding && (
              <div className="customer-wedding-section">
                <h2>Postboda</h2>
                <div className="two-col">
                  {input('fechaPostboda', 'Fecha de la postboda', 'date', true)}
                  {input('lugarPostboda', 'Lugar de la postboda', 'text', true)}
                  {textarea('detallesPostboda', 'Detalles de la postboda')}
                </div>
              </div>
            )}

            {error && <p className="customer-wedding-message customer-wedding-error" role="alert">{error}</p>}
            {saved && <p className="customer-wedding-message customer-wedding-success" role="status">Los datos de vuestra boda se han guardado correctamente.</p>}
            {!disabledForm && <button className="submit-btn" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar los cambios'}
            </button>}
          </form>
        )}
      </section>
    </main>
  );
}