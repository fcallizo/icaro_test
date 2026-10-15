import { FormEvent, useState } from 'react';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { PrivateRequestUpdate, RequestDetailsModalProps, setDefaultFormValues } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { createFormFields } from '@/components/common/FormFields';
import type { WeddingSheetBlock, WeddingSheetData } from '../pdfs/WeddingContractPdf';
import { PACK_OPTIONS, SERVICE_OPTIONS } from '@/lib/wedding-form';

const findService = (value: string) => SERVICE_OPTIONS.find((service) => service.value === value);

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

  const { input, inputPhone, textarea, select } = createFormFields({
    values,
    idPrefix: 'request',
    onChange: (field, value) => setValues((current) => ({ ...current, [field]: value })),
    wideClassName: 'wide',
    emptyOption: 'Seleccionar...',
  });

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
      pack: PACK_OPTIONS.find((option) => option.value === values.tipoPack)?.label ?? '',
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
      {input('nombre', 'Nombre de la pareja', 'text', true, true, false, '')}
      {input('email', 'Email', 'email', true, false, false, '')}
      {input('fecha', 'Fecha', 'date', true, false, false, '')}
      {inputPhone('telNovio', 'Teléfono del novio', true)}
      {inputPhone('telNovia', 'Teléfono de la novia', true)}
      {input('novio', 'Casa del novio', 'text', false, false, false, '')}
      {input('horaSalidaNovio', 'Salida del novio', 'time', false, false, false, '')}
      {input('novia', 'Casa de la novia', 'text', false, false, false, '')}
      {input('horaSalidaNovia', 'Salida de la novia', 'time', false, false, false, '')}
      {input('ceremonia', 'Ceremonia', 'text', false, false, false, '')}
      {input('horaCeremonia', 'Hora de la ceremonia', 'time', false, false, false, '')}
      {input('lugar', 'Banquete', 'text', false, false, false, '')}
      {input('horaCoctel', 'Hora del cóctel', 'time', false, false, false, '')}
      {input('horaBarraLibre', 'Hora de la barra libre', 'time', false, false, false, '')}

      <section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Desglose técnico</h3>
          <span>Se completa antes de confirmar</span>
        </header>
        <div className="production-contract-grid">
          {select('tipoPack', 'Tipo de pack', PACK_OPTIONS)}
          {select('servicioBoda', 'Servicios', SERVICE_OPTIONS)}
          {textarea('detalles', 'Detalles')}
          {input('extraBoda', 'Extras', 'text', false, false, false, '')}
          {input('precioExtraBoda', 'Precio extras (€)', 'number', false, false, false, '')}
        </div>

        {hasPreWedding && (
          <div>
            <br />
            <header className="production-contract-heading">
              <h3>Información preboda</h3>
            </header>
            <div className="production-contract-grid">
              {select('servicioPreboda', 'Servicios', SERVICE_OPTIONS)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPreboda', 'Fecha preboda', 'date', true, false, false, '')}
              {input('lugarPreboda', 'Lugar preboda', 'text', true, false, false, '')}
              {textarea('detallesPreboda', 'Detalles preboda')}
              {input('extraPreboda', 'Extras', 'text', false, false, false, '')}
              {input('precioExtraPreboda', 'Precio extras (€)', 'number', false, false, false, '')}
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
              {select('servicioPostboda', 'Servicios', SERVICE_OPTIONS)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPostboda', 'Fecha postboda', 'date', true, false, false, '')}
              {input('lugarPostboda', 'Lugar postboda', 'text', true, false, false, '')}
              {textarea('detallesPostboda', 'Detalles postboda')}
              {input('extraPostboda', 'Extras', 'text', false, false, false, '')}
              {input('precioExtraPostboda', 'Precio extras (€)', 'number', false, false, false, '')}
            </div>
          </div>
        )}

        <br />
        <div className="production-contract-grid">
          {input('descuentoBoda', 'Descuento (%)', 'number', false, false, false, '')}
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
