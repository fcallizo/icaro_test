import { FormEvent, useState } from 'react';
import { PrivateRequestUpdate, ProductionMaterialCategory, RequestDetailsModalProps, setDefaultFormValues } from '@/lib/private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { createFormFields } from '@/components/common/FormFields';
import { SpanishTaxIdField } from '@/components/common/SpanishTaxIdField';
import type { ProductionContractData } from '../../pdfs/ProductionContractPdf';
import { isValidIdentityDocument, normalizeSpanishTaxId } from '@/lib/spanish-tax-id';

const productionItems = [
  { setup: 'setupCamara', price: 'precioCamara', label: 'Cámara principal' },
  { setup: 'setupDrone', price: 'precioDrone', label: 'Unidad aérea' },
  { setup: 'setupIluminacion', price: 'precioIluminacion', label: 'Iluminación' },
  { setup: 'setupSonido', price: 'precioSonido', label: 'Sonido' },
  { setup: 'formatoEntrega', price: 'precioFormato', label: 'Formato de entrega' },
  { setup: 'personalExtra', price: 'precioPersonalExtra', label: 'Equipo extra' },
  { setup: 'logistica', price: 'precioLogistica', label: 'Logística y transporte' },
] as const;

const currency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

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
    import('../../pdfs/ProductionContractPdf'),
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
  const [initialValues] = useState(() => setDefaultFormValues(request));
  const [values, setValues] = useState<PrivateRequestUpdate>(initialValues);
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const title = values.nombre || 'Evento cinematográfico';
  const hasValidIdentity = !values.documentoIdentidad.trim()
    || isValidIdentityDocument(values.tipoDocumentoIdentidad, values.documentoIdentidad);

  const { input, inputPhone, textarea, select, inputSuffix } = createFormFields({
    values,
    idPrefix: 'request',
    onChange: (field, value) => setValues((current) => ({ ...current, [field]: value })),
    wideClassName: 'col-100',
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
      <div className="field-group col-75" key={field}>
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
        clienteTipoDocumento: values.tipoDocumentoIdentidad,
        clienteCif: normalizeSpanishTaxId(values.documentoIdentidad),
        fecha: formatDate(values.fecha),
        proyecto: values.tipo || 'Producción audiovisual',
        descipcionTrabajo: values.detalles,
        rows: productionItems.map((item) => ({
          label: item.label,
          setup: values[item.setup],
          price: currency(Number(values[item.price]) || 0),
        })),
        presupuesto: currency(Number(values.presupuesto) || 0),
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
      canConfirm={hasCompleteBreakdown && hasValidIdentity}
      canSave={hasValidIdentity}
      isDirty={isDirty}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (hasValidIdentity) onSave(values);
      }}
      rightAction={request.status !== 'pending' ? (
        <>
          <button
            type="button"
            className="pvm__submit"
            disabled={props.busy || generating || !hasValidIdentity}
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
      {inputPhone('telefono', 'Teléfono', true)}
      <SpanishTaxIdField
        idPrefix="request"
        type={values.tipoDocumentoIdentidad}
        value={values.documentoIdentidad}
        onTypeChange={(tipoDocumentoIdentidad) => setValues((current) => ({ ...current, tipoDocumentoIdentidad }))}
        onValueChange={(documentoIdentidad) => setValues((current) => ({ ...current, documentoIdentidad }))}
      />
      {input('fecha', 'Fecha', 'date', true, false, false, '')}
      {input('lugar', 'Lugar del evento', 'text', true, false, false, '')}
      {input('tipo', 'Tipo de producción','text', true, false, false, '', undefined, 'col-75')}
      {inputSuffix('presupuesto', 'Presupuesto', true, false, false, '€', '', 'col-25')}
      {textarea('detalles', 'Descripción del trabajo')}
      <section className="production-contract-section col-100">
        <header className="production-contract-heading">
          <h3>Desglose técnico</h3>
          <span>Se completa antes de confirmar</span>
        </header>
        <div className="production-contract-grid">
          {materialSelect('camera', 'setupCamara', 'precioCamara', 'Cámara principal')}
          {inputSuffix('precioCamara', 'Precio cámara', true, false, false, '€', '', 'col-25' )}

          {materialSelect('drone', 'setupDrone', 'precioDrone', 'Unidad de vuelo')}
          {inputSuffix('precioDrone', 'Precio dron', true, false, false, '€', '', 'col-25')}

          {materialSelect('lighting', 'setupIluminacion', 'precioIluminacion', 'Set de iluminación')}
          {inputSuffix('precioIluminacion', 'Precio iluminación', true, false, false, '€', '', 'col-25')}

          {materialSelect('sound', 'setupSonido', 'precioSonido', 'Tratamiento de sonido')}
          {inputSuffix('precioSonido', 'Precio sonido', true, false, false, '€', '', 'col-25')}

          {materialSelect('format', 'formatoEntrega', 'precioFormato', 'Formato de entrega')}
          {inputSuffix('precioFormato', 'Precio formato', true, false, false, '€', '', 'col-25')}

          {input('personalExtra', 'Personal técnico extra', 'text', true, false, false, '', undefined, 'col-75')}
          {inputSuffix('precioPersonalExtra', 'Precio equipo extra', true, false, false, '€', '', 'col-25')}

          {input('logistica', 'Logística y transporte', 'text', true, false, false, '', undefined, 'col-75')}
          {inputSuffix('precioLogistica', 'Precio logística', true, false, false, '€', '', 'col-25')}

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