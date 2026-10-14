import { ChangeEvent, FormEvent, useState } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps, setDefaultFormValues } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';

function downloadWeddingSheet(request: RequestDetailsModalProps['request'], values: PrivateRequestUpdate) {
  const content = [
    'FICHA DE RODAJE - ICARO STUDIO',
    `Pareja: ${values.nombre || 'Sin nombre'}`,
    `Fecha: ${values.fecha || 'Por confirmar'}`,
    `Email: ${values.email || 'No indicado'}`,
    `Telefono novio: ${values.telNovio || 'No indicado'}`,
    `Telefono novia: ${values.telNovia || 'No indicado'}`,
    `Banquete: ${values.lugar || 'No indicado'}`,
    `Ceremonia: ${values.ceremonia || 'No indicada'}`,
    `Casa novia: ${values.novia || 'No indicada'}`,
    `Casa novio: ${values.novio || 'No indicado'}`,
    `Salida novio: ${values.horaSalidaNovio || 'No indicada'}`,
    `Salida novia: ${values.horaSalidaNovia || 'No indicada'}`,
    `Ceremonia: ${values.horaCeremonia || 'No indicada'}`,
    `Cóctel: ${values.horaCoctel || 'No indicado'}`,
    `Barra libre: ${values.horaBarraLibre || 'No indicada'}`,
    `Detalles: ${values.detalles || 'Sin detalles'}`,
  ].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ficha-boda-${values.fecha || request.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function WeddingRequestDetailsModal(props: RequestDetailsModalProps) {
  const { request, onSave } = props;
   const [values, setValues] = useState<PrivateRequestUpdate>(setDefaultFormValues(request));

  const servicePack = [
    { value: 'fotos', label: 'Sesión Fotográfica', price: 250, complementPrice: 100 },
    { value: 'video', label: 'Video Documental', price: 300, complementPrice: 150 },
    { value: 'duo', label: 'Sesión Fotográfica + Video Documental', price: 500, complementPrice: 200 },
  ];

  const title = values.nombre || 'Boda sin nombre';
  const updateField = (field: keyof PrivateRequestUpdate) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };
  const input = (field: keyof PrivateRequestUpdate, label: string, type = 'text', required = false, wide = false) => (
    <div className={`field-group${wide ? ' wide' : ''}`} key={field}>
      <label htmlFor={`request-${field}`}>{label}</label>
      <input id={`request-${field}`} type={type} value={values[field]} onChange={updateField(field)} required={required} />
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
      <label htmlFor={`customer-${field}`}>{label}</label>
      <InternationalPhoneInput
        value={values[field] || ''}
        onChange={(next) => setValues((current) => ({ ...current, [field]: next ?? '' }))}
        placeholder="Teléfono"
        required={required}
      />
    </div>
  );

  const hasPreWedding = values.tipoPack === 'duo-pre' || values.tipoPack === 'trio';
  const preWeddingFilled = values.fechaPreboda.trim() !== '' && values.lugarPreboda.trim() !== '' && values.detallesPreboda.trim() !== '';

  const hasPostWedding = values.tipoPack === 'duo-post' || values.tipoPack === 'trio';
  const postWeddingFilled = values.fechaPostboda.trim() !== '' && values.lugarPostboda.trim() !== '' && values.detallesPostboda.trim() !== '';

  const hasCompleteBreakdown = values.tipoPack === 'Indeciso' || values.tipoPack === 'boda' ||
    (values.tipoPack === 'duo-pre' && preWeddingFilled) ||
    (values.tipoPack === 'duo-post' && postWeddingFilled) ||
    (values.tipoPack === 'trio' && preWeddingFilled && postWeddingFilled)

  const subtotal = (servicePack.find((service) => service.value === values.servicioBoda)?.price ?? 0) + parseFloat(values.precioExtraBoda ?? 0)
    + (hasPreWedding ? 
      ((servicePack.find((service) => service.value === values.servicioPreboda)?.complementPrice ?? 0) + parseFloat(values.precioExtraPreboda ?? 0)) : 0)
    + (hasPostWedding ? 
      ((servicePack.find((service) => service.value === values.servicioPostboda)?.complementPrice ?? 0) + parseFloat(values.precioExtraPostboda ?? 0)) : 0);
  const discountAmount = (subtotal * parseFloat(values.descuentoBoda ?? 0)) / 100;
  const contractTotal = subtotal - discountAmount;
  const currency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

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
        <button type="button" className="private-download-button" disabled={props.busy} onClick={() => downloadWeddingSheet(request, values)}>
          Descargar ficha de rodaje
        </button>
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
          {select('tipoPack', 'Tipo de Pack', [
            { value: 'indeciso', label: 'Indeciso' },
            { value: 'boda', label: 'Solo boda' },
            { value: 'duo-pre', label: 'Boda + pre-boda' },
            { value: 'duo-post', label: 'Boda + post-boda' },
            { value: 'trio', label: 'Trío (pre-boda + boda + post-boda)' },
          ])}
          {select('servicioBoda', 'Servicios', servicePack)}
          {textarea('detalles', 'Detalles')}
          {input('extraBoda', 'Extras', 'text')}
          {input('precioExtraBoda', 'Precio extras (€)', 'number')}
        </div>
        {hasPreWedding && (
          <div>
            <br />
            <header className="production-contract-heading">
              <h3>Información Pre-boda</h3>
            </header>
            <div className="production-contract-grid">
              {select('servicioPreboda', 'Servicios', servicePack)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPreboda', 'Fecha Pre-boda', 'date', true)}
              {input('lugarPreboda', 'Lugar Pre-boda', 'text', true)}
              {textarea('detallesPreboda', 'Detalles Pre-boda')}
              {input('extraPreboda', 'Extras', 'text')}
              {input('precioExtraPreboda', 'Precio extras (€)', 'number')}
            </div>
          </div>
        )}
        {hasPostWedding && (
          <div>
            <br />
            <header className="production-contract-heading">
              <h3>Información Post-boda</h3>
            </header>
            <div className="production-contract-grid">
              {select('servicioPostboda', 'Servicios', servicePack)}
            </div>
            <div className="production-contract-grid">
              {input('fechaPostboda', 'Fecha Post-boda', 'date', true)}
              {input('lugarPostboda', 'Lugar Post-boda', 'text', true)}
              {textarea('detallesPostboda', 'Detalles Post-boda')}
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
          <p>descuento ({values.descuentoBoda} %) <strong>{currency(discountAmount)}</strong></p>
          <p className="production-contract-total">Total del contrato <strong>{currency(contractTotal)}</strong></p>
        </div>
      </section>
    </RequestDetailsModalFrame>
  );
}