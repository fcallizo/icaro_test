'use client';

import { FormEvent, useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { createFormFields } from '@/components/common/FormFields';
import { PACK_OPTIONS, SERVICE_OPTIONS, WeddingFormValues } from '@/lib/wedding-form';


const emptyValues: WeddingFormValues = {
  nombre: '', email: '', fecha: '', telNovio: '', telNovia: '', lugar: '',
  novio: '', novia: '', ceremonia: '', horaSalidaNovio: '', horaSalidaNovia: '',
  horaCeremonia: '', horaCoctel: '', horaBarraLibre: '', detalles: '', tipoPack: '',
  fechaPreboda: '', lugarPreboda: '', detallesPreboda: '',
  fechaPostboda: '', lugarPostboda: '', detallesPostboda: '',
  servicioBoda: '', servicioPreboda: '', servicioPostboda: '', status: '',
};

const getString = (value: unknown) => (typeof value === 'string' ? value : '');

export default function CustomerWeddingFormPage({ params }: { params: { token: string } }) {
  const [values, setValues] = useState<WeddingFormValues>(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [disabledForm, setDisabledForm] = useState(false);

  const LOAD_ERROR = 'No se pudo cargar el formulario.';
  const SAVE_ERROR = 'No se pudieron guardar los datos.';

  useEffect(() => {
    let isCurrent = true;
    const loadForm = async () => {
      try {
        const response = await fetch(`/api/customer/wedding/${encodeURIComponent(params.token)}`, { cache: 'no-store' });
        const data: { wedding?: Record<string, unknown>; error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || LOAD_ERROR);
        if (!data.wedding) throw new Error(LOAD_ERROR);

        const loadedValues = { ...emptyValues };
        (Object.keys(loadedValues) as Array<keyof WeddingFormValues>).forEach((field) => {
          loadedValues[field] = getString(data.wedding?.[field]);
        });

        (['servicioBoda', 'servicioPreboda', 'servicioPostboda'] as const).forEach((f) => {
          if (data.wedding?.[f] == null) loadedValues[f] = 'duo';
        });

        if (isCurrent) {
          setValues(loadedValues);
          setDisabledForm(loadedValues.status !== 'pending');
        }
      } catch (loadError) {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : LOAD_ERROR);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    void loadForm();
    return () => {
      isCurrent = false;
    };
  }, [params.token]);

  const setFieldValue = (field: keyof WeddingFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const { input, inputPhone, textarea, select } = createFormFields({
    values,
    idPrefix: 'customer',
    onChange: setFieldValue,
    wrapperClassName: 'field-group',
    wideClassName: 'customer-wedding-wide',
    dateInputWrapper: true,
    disabled: disabledForm,
    readOnlyFields: ['fecha'],
  });

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
      if (!response.ok) throw new Error(data.error || SAVE_ERROR);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const hasPreWedding = values.tipoPack === 'duo-pre' || values.tipoPack === 'trio';
  const hasPostWedding = values.tipoPack === 'duo-post' || values.tipoPack === 'trio';

  return (
    <main className="customer-wedding-page page-shell-bodas">
      <section className="customer-wedding-card">
        <div className="brand">
          <img src="/logo_sf_c.png" alt="Ícaro Logo" className="brand-logo" />
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
                Vuestro servicio está confirmado. El formulario ya no se puede editar, pero podéis consultar aquí toda la
                información. Para cualquier cambio, contactad con nosotros.
              </p>
            ) : (
              <>
                <p className="customer-wedding-intro">
                  Gracias por confiarnos vuestra historia. Contadnos lo que ya sabéis de vuestro día. Si hay algo que
                  todavía no tenéis decidido, no pasa nada: podréis volver a este enlace cuando queráis.
                </p>
                <div className="customer-form-link-notice" role="note">
                  <strong>Antes de empezar</strong>
                  <ul>
                    <li><strong>La fecha de la boda no se puede modificar desde este formulario.</strong> Si necesitáis cambiarla, escribidnos.</li>
                    <li><strong>Una vez confirmemos el servicio, el formulario no será editable.</strong> Podréis seguir entrando para consultar la información, pero cualquier cambio tendréis que poneros en contacto con nosotros.</li>
                  </ul>
                </div>
              </>
            )}

            <div className="customer-wedding-section">
              <h2>Información de Contactos</h2>
              {input('nombre', 'Nombre de la pareja', 'text', true, false, false, '')}
              <div className="two-col">
                {input('email', 'Correo electrónico', 'email', true, false, false, '')}
                {input('fecha', 'Fecha de la boda', 'date', true, false, false, '')}
                {inputPhone('telNovio', 'Teléfono del novio', true)}
                {inputPhone('telNovia', 'Teléfono de la novia', true)}
              </div>
              {textarea('detalles', 'Detalles que queráis compartir')}
            </div>

            <div className="customer-wedding-section">
              <h2>Horarios</h2>
              <p className="customer-wedding-section-intro">Si todavía no tenéis algún horario, podéis dejarlo sin completar.</p>
              <div className="two-col customer-wedding-schedule">
                {input('novio', 'Casa del novio', 'text', false, false, false, '')}
                {input('horaSalidaNovio', 'Salida del novio', 'time', false, false, false, '')}
                {input('novia', 'Casa de la novia', 'text', false, false, false, '')}
                {input('horaSalidaNovia', 'Salida de la novia', 'time', false, false, false, '')}
                {input('ceremonia', 'Lugar de la ceremonia', 'text', false, false, false, '')}
                {input('horaCeremonia', 'Ceremonia', 'time', false, false, false, '')}
                {input('lugar', 'Lugar del banquete', 'text', false, false, false, '')}
                <div>
                  {input('horaCoctel', 'Cóctel', 'time', false, false, false, '')}
                  {input('horaBarraLibre', 'Barra libre', 'time', false, false, false, '')}
                </div>
              </div>
            </div>

            <div className="customer-wedding-section">
              <h2>Servicios incluidos</h2>
              <div className="two-col">
                {select('tipoPack', 'Servicio contratado', PACK_OPTIONS, true, true)}
                {select('servicioBoda', 'Incluido en la boda', SERVICE_OPTIONS, true, true)}
              </div>
            </div>

            {hasPreWedding && (
              <div className="customer-wedding-section">
                <h2>Preboda</h2>
                <div className="two-col">
                  {select('servicioPreboda', 'Incluido en la preboda', SERVICE_OPTIONS, true, true)}
                  {input('fechaPreboda', 'Fecha de la preboda', 'date', true, false, false, '')}
                  {input('lugarPreboda', 'Lugar de la preboda', 'text', true, false, false, '')}
                  {textarea('detallesPreboda', 'Detalles de la preboda')}
                </div>
              </div>
            )}

            {hasPostWedding && (
              <div className="customer-wedding-section">
                <h2>Postboda</h2>
                <div className="two-col">
                  {select('servicioPostboda', 'Incluido en la postboda', SERVICE_OPTIONS, true, true)}
                  {input('fechaPostboda', 'Fecha de la postboda', 'date', true, false, false, '')}
                  {input('lugarPostboda', 'Lugar de la postboda', 'text', true, false, false, '')}
                  {textarea('detallesPostboda', 'Detalles de la postboda')}
                </div>
              </div>
            )}

            {error && <p className="customer-wedding-message customer-wedding-error" role="alert">{error}</p>}
            {saved && <p className="customer-wedding-message customer-wedding-success" role="status">Los datos de vuestra boda se han guardado correctamente.</p>}
            {!disabledForm && (
              <button className="submit-btn" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar los cambios'}
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  );
}