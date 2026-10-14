import { ChangeEvent, FormEvent, useState } from 'react';
import { PrivateRequestUpdate, ProductionMaterialCategory, RequestDetailsModalProps, setDefaultFormValues } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';
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

  const updateField = (field: keyof PrivateRequestUpdate) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };
  const input = (field: keyof PrivateRequestUpdate, label: string, type = 'text', required = false, wide = false) => (
    <div className={`field-group${wide ? ' wide' : ''}`} key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <input id={`request-${field}`} type={type} value={values[field]} onChange={updateField(field)} required={required} step={type === 'number' ? 'any' : undefined} />
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
      {input('nombre', 'Nombre / empresa', 'text', true, true)}
      {input('email', 'Email', 'email', true)}
      {input('fecha', 'Fecha', 'date', true)}
      {inputPhone('telefono', 'Teléfono', true)}
      {input('presupuesto', 'Presupuesto (€)', 'number', true)}
      {input('tipo', 'Tipo de producción')}
      {textarea('detalles', 'Idea principal')}
      <section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Desglose técnico</h3>
          <span>Se completa antes de confirmar</span>
        </header>
        <div className="production-contract-grid">
          {materialSelect('camera', 'cameraSetup', 'cameraPrice', 'Cámara principal')}
          {input('cameraPrice', 'Precio cámara (€)', 'number')}
          {materialSelect('drone', 'droneSetup', 'dronePrice', 'Unidad de vuelo')}
          {input('dronePrice', 'Precio dron (€)', 'number')}
          {materialSelect('lighting', 'lightingSetup', 'lightingPrice', 'Set de iluminación')}
          {input('lightingPrice', 'Precio iluminación (€)', 'number')}
          {materialSelect('sound', 'soundSetup', 'soundPrice', 'Tratamiento de sonido')}
          {input('soundPrice', 'Precio sonido (€)', 'number')}
          {materialSelect('format', 'deliveryFormat', 'formatPrice', 'Formato de entrega')}
          {input('formatPrice', 'Precio formato (€)', 'number')}
          {input('extraCrew', 'Personal técnico extra', 'text')}
          {input('extraCrewPrice', 'Precio equipo extra (€)', 'number')}
          {input('logistics', 'Logística y transporte', 'text')}
          {input('logisticsPrice', 'Precio logística (€)', 'number')}
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