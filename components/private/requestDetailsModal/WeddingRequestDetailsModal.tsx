import { ChangeEvent, FormEvent, useState } from 'react';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { PrivateRequestUpdate, RequestDetailsModalProps, setDefaultFormValues } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
import type { WeddingSheetBlock, WeddingSheetData } from '../pdfs/WeddingContractPdf';

/* =========================================================
   Constantes y utilidades (fuera del componente)
   ========================================================= */
const servicePack = [
  { value: 'fotos', label: 'Sesión fotográfica', price: 250, complementPrice: 100 },
  { value: 'video', label: 'Vídeo documental', price: 300, complementPrice: 150 },
  { value: 'duo', label: 'Sesión fotográfica + vídeo documental', price: 500, complementPrice: 200 },
];

const packOptions = [
  { value: 'indeciso', label: 'Indeciso' },
  { value: 'boda', label: 'Solo boda' },
  { value: 'duo-pre', label: 'Boda + preboda' },
  { value: 'duo-post', label: 'Boda + postboda' },
  { value: 'trio', label: 'Trío (preboda + boda + postboda)' },
];

const findService = (value: string) => servicePack.find((service) => service.value === value);

/** Convierte a número sin dar nunca NaN (campo vacío o texto raro = 0). */
const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const currency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

/** "2026-06-14" -> "14-06-2026" */
const formatDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('-') : value;

const formatPhone = (value: string) => (value ? formatPhoneNumberIntl(value) || value : '');

const toFileName = (name: string) =>
  (name || 'boda')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function downloadWeddingSheet(data: WeddingSheetData) {
  // Import dinámico: la librería solo se descarga al pulsar el botón
  const [{ pdf }, { WeddingSheetPdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pdfs/WeddingContractPdf'),
  ]);

  const blob = await pdf(<WeddingSheetPdf data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `boda-${toFileName(data.nombre)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   Componente
   ========================================================= */
export function WeddingRequestDetailsModal(props: RequestDetailsModalProps) {
  const { request, onSave } = props;
  const [values, setValues] = useState<PrivateRequestUpdate>(setDefaultFormValues(request));
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const title = values.nombre || 'Boda sin nombre';

  const updateField = (field: keyof PrivateRequestUpdate) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };
  const input = (field: keyof PrivateRequestUpdate, label: string, type = 'text', required = false, wide = false) => (
    <div className={`field-group${wide ? ' wide' : ''}`} key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <input
        id={`request-${field}`}
        type={type}
        value={values[field]}
        onChange={updateField(field)}
        required={required}
        step={type === 'number' ? 'any' : undefined}
      />
    </div>
  );
  const textarea = (field: keyof PrivateRequestUpdate, label: string) => (
    <div className="field-group wide" key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <textarea id={`request-${field}`} rows={3} value={values[field]} onChange={updateField(field)} />
    </div>
  );
  const select = (field: keyof PrivateRequestUpdate, label: string, options: Array<string | { value: string; label: string }>) => (
    <div className="field-group" key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <select id={`request-${field}`} value={values[field]} onChange={updateField(field)}>
        <option value="">Seleccionar...</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
    </div>
  );

  const inputPhone = (field: keyof PrivateRequestUpdate, label: string, required = false) => (
    <div className="field-group" key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <InternationalPhoneInput
        value={values[field] || ''}
        onChange={(next) => setValues((current) => ({ ...current, [field]: next ?? '' }))}
        placeholder="Teléfono"
        required={required}
      />
    </div>
  );

  /* ---------- Reglas del pack ---------- */
  const hasPreWedding = values.tipoPack === 'duo-pre' || values.tipoPack === 'trio';
  const hasPostWedding = values.tipoPack === 'duo-post' || values.tipoPack === 'trio';

  const preWeddingFilled = values.fechaPreboda.trim() !== '' && values.lugarPreboda.trim() !== '' && values.detallesPreboda.trim() !== '';
  const postWeddingFilled = values.fechaPostboda.trim() !== '' && values.lugarPostboda.trim() !== '' && values.detallesPostboda.trim() !== '';

  const hasCompleteBreakdown =
    values.tipoPack === 'indeciso' ||
    values.tipoPack === 'boda' ||
    (values.tipoPack === 'duo-pre' && preWeddingFilled) ||
    (values.tipoPack === 'duo-post' && postWeddingFilled) ||
    (values.tipoPack === 'trio' && preWeddingFilled && postWeddingFilled);

  /* ---------- Importes ---------- */
  const bodaService = findService(values.servicioBoda);
  const preService = findService(values.servicioPreboda);
  const postService = findService(values.servicioPostboda);

  const bodaAmount = (bodaService?.price ?? 0) + toNumber(values.precioExtraBoda);
  const preAmount = hasPreWedding ? (preService?.complementPrice ?? 0) + toNumber(values.precioExtraPreboda) : 0;
  const postAmount = hasPostWedding ? (postService?.complementPrice ?? 0) + toNumber(values.precioExtraPostboda) : 0;

  const subtotal = bodaAmount + preAmount + postAmount;
  const discountPercent = toNumber(values.descuentoBoda);
  const discountAmount = (subtotal * discountPercent) / 100;
  const contractTotal = subtotal - discountAmount;

  /* ---------- Datos para el PDF ---------- */
  const buildSheetData = (): WeddingSheetData => {
    const lines = (
      service: ReturnType<typeof findService>,
      servicePrice: number | undefined,
      extras: string,
      extrasPrice: string,
    ) => {
      const result = [
        {
          label: service?.label ?? 'Servicio sin seleccionar',
          amount: currency(servicePrice ?? 0),
        },
      ];
      if (extras.trim() !== '' || toNumber(extrasPrice) > 0) {
        result.push({
          label: `Extras: ${extras.trim() || '—'}`,
          amount: currency(toNumber(extrasPrice)),
        });
      }
      return result;
    };

    const blocks: WeddingSheetBlock[] = [
      {
        title: 'Boda',
        lines: lines(bodaService, bodaService?.price, values.extraBoda, values.precioExtraBoda),
      },
    ];

    if (hasPreWedding) {
      blocks.push({
        title: 'Preboda',
        fecha: formatDate(values.fechaPreboda),
        lugar: values.lugarPreboda,
        detalles: values.detallesPreboda,
        lines: lines(preService, preService?.complementPrice, values.extraPreboda, values.precioExtraPreboda),
      });
    }

    if (hasPostWedding) {
      blocks.push({
        title: 'Postboda',
        fecha: formatDate(values.fechaPostboda),
        lugar: values.lugarPostboda,
        detalles: values.detallesPostboda,
        lines: lines(postService, postService?.complementPrice, values.extraPostboda, values.precioExtraPostboda),
      });
    }

    return {
      nombre: values.nombre,
      email: values.email,
      fecha: formatDate(values.fecha),
      telNovio: formatPhone(values.telNovio),
      telNovia: formatPhone(values.telNovia),
      pack: packOptions.find((option) => option.value === values.tipoPack)?.label ?? '',
      schedule: [
        { label: 'Salida del novio', place: values.novio, time: values.horaSalidaNovio },
        { label: 'Salida de la novia', place: values.novia, time: values.horaSalidaNovia },
        { label: 'Ceremonia', place: values.ceremonia, time: values.horaCeremonia },
        { label: 'Cóctel', place: values.lugar, time: values.horaCoctel },
        { label: 'Barra libre', place: values.lugar, time: values.horaBarraLibre },
      ],
      detalles: values.detalles,
      blocks,
      discountPercent: String(discountPercent),
      subtotal: currency(subtotal),
      discount: currency(discountAmount),
      total: currency(contractTotal),
    };
  };

  const handleDownload = async () => {
    setGenerating(true);
    setPdfError('');
    try {
      await downloadWeddingSheet(buildSheetData());
    } catch (error) {
      console.error('No se pudo generar el PDF de la boda:', error);
      setPdfError('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <RequestDetailsModalFrame
      {...props}
      title={title}
      values={values}
      canConfirm={hasCompleteBreakdown}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave({ ...values });
      }}
      rightAction={request.status !== 'pending' ? (
        <>
          <button
            type="button"
            className="private-download-button"
            disabled={props.busy || generating}
            onClick={() => void handleDownload()}
          >
            {generating ? 'Generando…' : 'Descargar PDF'}
          </button>
          {pdfError && <span role="alert" className="private-download-error">{pdfError}</span>}
        </>
      ) : undefined}
    >
      {input('nombre', 'Nombre de la pareja', 'text', true, true)}
      {input('email', 'Email', 'email', true)}
      {input('fecha', 'Fecha', 'date', true)}
      {inputPhone('telNovio', 'Teléfono del novio', true)}
      {inputPhone('telNovia', 'Teléfono de la novia', true)}
      {input('novio', 'Casa del novio')}
      {input('horaSalidaNovio', 'Salida del novio', 'time')}
      {input('novia', 'Casa de la novia')}
      {input('horaSalidaNovia', 'Salida de la novia', 'time')}
      {input('ceremonia', 'Ceremonia')}
      {input('horaCeremonia', 'Hora de la ceremonia', 'time')}
      {input('lugar', 'Banquete', 'text', true)}
      {input('horaCoctel', 'Hora del cóctel', 'time')}
      {input('horaBarraLibre', 'Hora de la barra libre', 'time')}

      <section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Desglose técnico</h3>
          <span>Se completa antes de confirmar</span>
        </header>
        <div className="production-contract-grid">
          {select('tipoPack', 'Tipo de pack', packOptions)}
          {select('servicioBoda', 'Servicios', servicePack)}
          {textarea('detalles', 'Detalles')}
          {input('extraBoda', 'Extras', 'text')}
          {input('precioExtraBoda', 'Precio extras (€)', 'number')}
        </div>

        {hasPreWedding && (
          <div>
            <br />
            <header className="production-contract-heading">
              <h3>Información preboda</h3>
            </header>
            <div className="production-contract-grid">
              {select('servicioPreboda', 'Servicios', servicePack)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPreboda', 'Fecha preboda', 'date', true)}
              {input('lugarPreboda', 'Lugar preboda', 'text', true)}
              {textarea('detallesPreboda', 'Detalles preboda')}
              {input('extraPreboda', 'Extras', 'text')}
              {input('precioExtraPreboda', 'Precio extras (€)', 'number')}
            </div>
          </div>
        )}

        {hasPostWedding && (
          <div>
            <br />
            <header className="production-contract-heading">
              <h3>Información postboda</h3>
            </header>
            <div className="production-contract-grid">
              {select('servicioPostboda', 'Servicios', servicePack)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPostboda', 'Fecha postboda', 'date', true)}
              {input('lugarPostboda', 'Lugar postboda', 'text', true)}
              {textarea('detallesPostboda', 'Detalles postboda')}
              {input('extraPostboda', 'Extras', 'text')}
              {input('precioExtraPostboda', 'Precio extras (€)', 'number')}
            </div>
          </div>
        )}

        <br />
        <div className="production-contract-grid">
          {input('descuentoBoda', 'Descuento (%)', 'number')}
        </div>

        <div className="production-contract-totals" aria-live="polite">
          <p>Subtotal <strong>{currency(subtotal)}</strong></p>
          <p>Descuento ({discountPercent} %) <strong>{currency(discountAmount)}</strong></p>
          <p className="production-contract-total">Total del contrato <strong>{currency(contractTotal)}</strong></p>
        </div>
      </section>
    </RequestDetailsModalFrame>
  );
}
