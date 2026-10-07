import { ChangeEvent, FormEvent, useState } from 'react';
import { PrivateRequestUpdate, ProductionMaterialCategory, RequestDetailsModalProps } from './private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';

const productionItems = [
  { setup: 'cameraSetup', price: 'cameraPrice', label: 'Cámara principal' },
  { setup: 'droneSetup', price: 'dronePrice', label: 'Unidad aérea' },
  { setup: 'lightingSetup', price: 'lightingPrice', label: 'Iluminación' },
  { setup: 'soundSetup', price: 'soundPrice', label: 'Sonido' },
  { setup: 'deliveryFormat', price: 'formatPrice', label: 'Formato de entrega' },
  { setup: 'extraCrew', price: 'extraCrewPrice', label: 'Equipo extra' },
  { setup: 'logistics', price: 'logisticsPrice', label: 'Logística y transporte' },
] as const;

function printProductionContract(
  values: PrivateRequestUpdate,
  subtotal: number,
  taxAmount: number,
  total: number,
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato de producción</title><style>
    body{font:14px Arial,sans-serif;color:#181818;margin:48px;line-height:1.5}h1,h2{margin:0 0 12px}h1{font-size:24px}h2{font-size:17px;margin-top:28px;border-bottom:1px solid #bbb;padding-bottom:8px}p{margin:5px 0}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{text-align:left;padding:9px;border-bottom:1px solid #ddd}td:last-child,th:last-child{text-align:right}.total{font-size:18px;font-weight:bold;margin-top:16px;text-align:right}
  </style></head><body></body></html>`);
  printWindow.document.close();

  const document = printWindow.document;
  const heading = document.createElement('h1');
  heading.textContent = 'ÍCARO STUDIO | DESGLOSE TÉCNICO Y CONTRATO';
  document.body.append(heading);
  const client = document.createElement('p');
  client.textContent = `Cliente: ${values.nombre} | Email: ${values.email} | Teléfono: ${values.telefono} | Fecha: ${values.fecha} | Proyecto: ${values.tipo || 'Producción audiovisual'} | Presupuesto cliente: ${values.presupuesto} €`;
  document.body.append(client);

  const table = document.createElement('table');
  const head = document.createElement('tr');
  head.innerHTML = '<th>Partida</th><th>Configuración</th><th>Importe</th>';
  table.append(head);
  for (const item of productionItems) {
    const row = document.createElement('tr');
    const name = document.createElement('td');
    const setup = document.createElement('td');
    const price = document.createElement('td');
    name.textContent = item.label;
    setup.textContent = values[item.setup];
    price.textContent = `${Number(values[item.price]).toFixed(2)} €`;
    row.append(name, setup, price);
    table.append(row);
  }
  document.body.append(table);

  const totals = document.createElement('div');
  const currency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  totals.innerHTML = `<p>Subtotal: ${currency(subtotal)}</p><p>IVA (${values.taxPercent}%): ${currency(taxAmount)}</p><p class="total">Total de contrato: ${currency(total)}</p>`;
  document.body.append(totals);

  const signature = document.createElement('p');
  signature.style.marginTop = '72px';
  signature.textContent = 'Dirección de Ícaro Studio: ____________________     Conformidad del cliente: ____________________';
  document.body.append(signature);
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 150);
}

export function ProductionRequestDetailsModal(props: RequestDetailsModalProps) {
  const { request, onSave } = props;
  const materials = props.materials || [];
  const [values, setValues] = useState<PrivateRequestUpdate>(() => ({
    nombre: request.nombre || '',
    email: request.email || '',
    fecha: request.fecha || '',
    telNovio: request.telNovio || '',
    telNovia: request.telNovia || '',
    telefono: request.telefono || '',
    lugar: request.lugar || '',
    novia: request.novia || '',
    novio: request.novio || '',
    ceremonia: request.ceremonia || '',
    cronograma: request.cronograma || '',
    detalles: request.detalles || '',
    tipoPack: request.tipoPack || '',
    fechaPreboda: request.fechaPreboda || '',
    lugarPreboda: request.lugarPreboda || '',
    detallesPreboda: request.detallesPreboda || '',
    fechaPostboda: request.fechaPostboda || '',
    lugarPostboda: request.lugarPostboda || '',
    detallesPostboda: request.detallesPostboda || '',
    tipo: request.tipo || '',
    presupuesto: request.presupuesto || '',
    descripcion: request.descripcion || '',
    cameraSetup: request.cameraSetup || '',
    cameraPrice: String(request.cameraPrice ?? ''),
    droneSetup: request.droneSetup || '',
    dronePrice: String(request.dronePrice ?? ''),
    lightingSetup: request.lightingSetup || '',
    lightingPrice: String(request.lightingPrice ?? ''),
    soundSetup: request.soundSetup || '',
    soundPrice: String(request.soundPrice ?? ''),
    deliveryFormat: request.deliveryFormat || '',
    formatPrice: String(request.formatPrice ?? ''),
    extraCrew: request.extraCrew || '',
    extraCrewPrice: String(request.extraCrewPrice ?? ''),
    logistics: request.logistics || '',
    logisticsPrice: String(request.logisticsPrice ?? ''),
    taxPercent: String(request.taxPercent ?? ''),
  }));
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
  const currency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <RequestDetailsModalFrame
      {...props}
      title={title}
      values={values}
      canConfirm={hasCompleteBreakdown}
      onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(values); }}
      rightAction={hasCompleteBreakdown ? (
        <button type="button" className="private-download-button" disabled={props.busy} onClick={() => printProductionContract(values, subtotal, taxAmount, contractTotal)}>
          Generar contrato PDF
        </button>
      ) : undefined}
    >
      {input('nombre', 'Nombre / empresa', 'text', true, true)}
      {input('email', 'Email', 'email', true)}
      {input('fecha', 'Fecha', 'date', true)}
      {input('telefono', 'Teléfono', 'tel', true)}
      {input('presupuesto', 'Presupuesto (€)', 'number', true)}
      {input('tipo', 'Tipo de producción')}
      {textarea('descripcion', 'Idea principal')}
      <section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Desglose técnico y contrato</h3>
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