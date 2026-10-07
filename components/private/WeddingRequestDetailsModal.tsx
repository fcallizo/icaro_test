import { ChangeEvent, FormEvent, useState } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps } from './private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';

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
    `Horarios: ${values.cronograma || 'No indicados'}`,
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
    tipo: request.tipo || '',
    presupuesto: request.presupuesto || '',
    descripcion: request.descripcion || '',
    fechaPreboda: request.fechaPreboda || '',
    lugarPreboda: request.lugarPreboda || '',
    detallesPreboda: request.detallesPreboda || '',
    fechaPostboda: request.fechaPostboda || '',
    lugarPostboda: request.lugarPostboda || '',
    detallesPostboda: request.detallesPostboda || '',
    cameraSetup: '',
    cameraPrice: '',
    droneSetup: '',
    dronePrice: '',
    lightingSetup: '',
    lightingPrice: '',
    soundSetup: '',
    soundPrice: '',
    deliveryFormat: '',
    formatPrice: '',
    extraCrew: '',
    extraCrewPrice: '',
    logistics: '',
    logisticsPrice: '',
    taxPercent: '',
  }));
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

  return (
    <RequestDetailsModalFrame
      {...props}
      title={title}
      values={values}
      onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(values); }}
      rightAction={request.status !== 'pending' ? (
        <button type="button" className="private-download-button" disabled={props.busy} onClick={() => downloadWeddingSheet(request, values)}>
          Descargar ficha de rodaje
        </button>
      ) : undefined}
    >
      {input('nombre', 'Nombre de la pareja', 'text', true, true)}
      {input('email', 'Email', 'email', true)}
      {input('fecha', 'Fecha', 'date', true)}
      {input('telNovio', 'Teléfono del novio', 'tel', true)}
      {input('novio', 'Casa del novio')}
      {input('telNovia', 'Teléfono de la novia', 'tel', true)}
      {input('novia', 'Casa de la novia')}
      {input('ceremonia', 'Ceremonia')}
      {input('lugar', 'Banquete', 'text', true)}
      {textarea('cronograma', 'Horarios')}
      {textarea('detalles', 'Detalles')}
      {select('tipoPack', 'Tipo de Pack', [
        { value: 'indeciso', label: 'Indeciso' },
        { value: 'boda', label: 'Solo boda' },
        { value: 'duo-pre', label: 'Boda + pre-boda' },
        { value: 'duo-post', label: 'Boda + post-boda' },
        { value: 'trio', label: 'Trío (pre-boda + boda + post-boda)' },
      ])}
      {(values.tipoPack === 'duo-pre' || values.tipoPack === 'trio') && (<section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Información Post-boda</h3>
        </header>
        <div className="production-contract-grid">
          {input('fechaPreboda', 'Fecha Pre-boda', 'date', true)}
          {input('lugarPreboda', 'Lugar Pre-boda', 'text', true)}
          {textarea('detallesPreboda', 'Detalles Pre-boda')}
        </div>
      </section>)}
      {(values.tipoPack === 'duo-post' || values.tipoPack === 'trio') && (<section className="production-contract-section wide">
        <header className="production-contract-heading">
          <h3>Información Post-boda</h3>
        </header>
        <div className="production-contract-grid">
          {input('fechaPostboda', 'Fecha Post-boda', 'date', true)}
          {input('lugarPostboda', 'Lugar Post-boda', 'text', true)}
          {textarea('detallesPostboda', 'Detalles Post-boda')}
        </div>
      </section>)}
    </RequestDetailsModalFrame>
  );
}