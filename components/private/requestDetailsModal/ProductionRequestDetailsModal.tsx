import { FormEvent, useState } from 'react';
import { PrivateRequestUpdate, ProductionMaterialCategory, RequestDetailsModalProps, setDefaultFormValues } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { createFormFields } from '@/components/common/FormFields';
import type { ProductionContractData } from '../pdfs/ProductionContractPdf';

const productionItems = [
  { setup: 'cameraSetup', price: 'cameraPrice', label: 'Cámara principal' },
  { setup: 'droneSetup', price: 'dronePrice', label: 'Unidad aérea' },
  { setup: 'lightingSetup', price: 'lightingPrice', label: 'Iluminación' },
  { setup: 'soundSetup', price: 'soundPrice', label: 'Sonido' },
  { setup: 'deliveryFormat', price: 'formatPrice', label: 'Formato de entrega' },
  { setup: 'extraCrew', price: 'extraCrewPrice', label: 'Equipo extra' },
  { setup: 'logistics', price: 'logisticsPrice', label: 'Logística y transporte' },
] as const;

const currency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

/** "2026-06-14" -> "14-06-2026" */
const formatDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('-') : value;

const toFileName = (name: string) =>
  (name || 'produccion')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function downloadProductionContract(data: ProductionContractData) {
  // Import dinámico: la librería solo se descarga al pulsar el botón
  const [{ pdf }, { ProductionContractPdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../pdfs/ProductionContractPdf'),
  ]);

  const blob = await pdf(<ProductionContractPdf data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contrato-${toFileName(data.nombre)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProductionRequestDetailsModal(props: RequestDetailsModalProps) {
  const { request, onSave } = props;
  const materials = props.materials || [];
  const [values, setValues] = useState<PrivateRequestUpdate>(setDefaultFormValues(request));
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const title = values.nombre || 'Evento cinematográfico';

  const { input, inputPhone, textarea, select, inputPrice } = createFormFields({
    values,
    idPrefix: 'request',
    onChange: (field, value) => setValues((current) => ({ ...current, [field]: value })),
    wideClassName: 'wide',
    emptyOption: 'Seleccionar...',
  });

  const materialSelect = (
    category: ProductionMaterialCategory,
    field: keyof PrivateRequestUpdate,
    priceField: keyof PrivateRequestUpdate,
    label: string,
  ) => {
    const options = materials.filter((material) => material.category === category && material.active);
    const currentValue = values[field];
    const hasCurrentOption = options.some((material) => material.name === currentValue);

    return (
      <div className="field-group" key={field}>
        <label htmlFor={`request-${field}`}>{label}</label>
        <select
          id={`request-${field}`}
          value={currentValue}
          onChange={(event) => {
            const material = options.find((option) => option.name === event.target.value);
            setValues((current) => ({
              ...current,
              [field]: event.target.value,
              [priceField]: material?.basePrice ?? '',
            }));
          }}
        >
          <option value="">Seleccionar material...</option>
          {currentValue && !hasCurrentOption && <option value={currentValue}>{currentValue} (retirado)</option>}
          {options.map((material) => <option key={material.id} value={material.name}>{material.name}</option>)}
        </select>
      </div>
    );
  };

  const subtotal = productionItems.reduce((total, item) => total + (Number(values[item.price]) || 0), 0);
  const taxRate = Number(values.taxPercent) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const contractTotal = subtotal + taxAmount;
  const hasCompleteBreakdown = productionItems.every((item) => values[item.setup].trim() !== ''
    && values[item.price].trim() !== ''
    && Number.isFinite(Number(values[item.price]))
    && Number(values[item.price]) >= 0)
    && ['0', '21'].includes(values.taxPercent);

  const handleDownloadContract = async () => {
    setGenerating(true);
    setPdfError('');
    try {
      await downloadProductionContract({
        nombre: values.nombre,
        email: values.email,
        telefono: values.telefono,
        fecha: formatDate(values.fecha),
        proyecto: values.tipo || 'Producción audiovisual',
        presupuesto: currency(Number(values.presupuesto) || 0),
        rows: productionItems.map((item) => ({
          label: item.label,
          setup: values[item.setup],
          price: currency(Number(values[item.price]) || 0),
        })),
        taxPercent: String(taxRate),
        subtotal: currency(subtotal),
        iva: currency(taxAmount),
        total: currency(contractTotal),
      });
    } catch (error) {
      console.error('No se pudo generar el contrato:', error);
      setPdfError('No se pudo generar el contrato. Inténtalo de nuevo.');
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
      onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(values); }}
      rightAction={hasCompleteBreakdown ? (
        <>
          <button
            type="button"
            className="private-download-button"
            disabled={props.busy || generating}
            onClick={() => void handleDownloadContract()}
          >
            {generating ? 'Generando…' : 'Generar contrato PDF'}
          </button>
          {pdfError && <span role="alert" className="private-download-error">{pdfError}</span>}
        </>
      ) : undefined}
    >
      {input('nombre', 'Nombre / empresa', 'text', true, true, false, '')}
      {input('email', 'Email', 'email', true, false, false, '')}
      {input('fecha', 'Fecha', 'date', true, false, false, '')}
      {inputPhone('telefono', 'Teléfono', true)}
      {inputPrice('presupuesto', 'Presupuesto', true, false, false)}
      {input('tipo', 'Tipo de producción','text', true, false, false, '')}
      {textarea('detalles', 'Idea principal')}
      <section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Desglose técnico</h3>
          <span>Se completa antes de confirmar</span>
        </header>
        <div className="production-contract-grid">
          {materialSelect('camera', 'cameraSetup', 'cameraPrice', 'Cámara principal')}
          {inputPrice('cameraPrice', 'Precio cámara', true, false, false)}

          {materialSelect('drone', 'droneSetup', 'dronePrice', 'Unidad de vuelo')}
          {inputPrice('dronePrice', 'Precio dron', true, false, false)}

          {materialSelect('lighting', 'lightingSetup', 'lightingPrice', 'Set de iluminación')}
          {inputPrice('lightingPrice', 'Precio iluminación', true, false, false)}

          {materialSelect('sound', 'soundSetup', 'soundPrice', 'Tratamiento de sonido')}
          {inputPrice('soundPrice', 'Precio sonido', true, false, false)}

          {materialSelect('format', 'deliveryFormat', 'formatPrice', 'Formato de entrega')}
          {inputPrice('formatPrice', 'Precio formato', true, false, false)}

          {input('extraCrew', 'Personal técnico extra', 'text', true, false, false, '')}
          {inputPrice('extraCrewPrice', 'Precio equipo extra', true, false, false)}

          {input('logistics', 'Logística y transporte', 'text', true, false, false, '')}
          {inputPrice('logisticsPrice', 'Precio logística', true, false, false)}

          {select('taxPercent', 'IVA', [
            { value: '0', label: 'Sin IVA (0 %)' },
            { value: '21', label: 'Con IVA (21 %)' },
          ])}
        </div>
        <div className="production-contract-totals" aria-live="polite">
          <p>Subtotal <strong>{currency(subtotal)}</strong></p>
          <p>IVA ({taxRate} %) <strong>{currency(taxAmount)}</strong></p>
          <p className="production-contract-total">Total del contrato <strong>{currency(contractTotal)}</strong></p>
        </div>
      </section>
    </RequestDetailsModalFrame>
  );
}