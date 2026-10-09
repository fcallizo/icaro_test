import { ChangeEvent, FormEvent, useState } from 'react';
import { PrivateRequestUpdate, RequestDetailsModalProps } from '../private-types';
import { RequestDetailsModalFrame } from './RequestDetailsModalFrame';
import { InternationalPhoneInput } from '@/components/common/InternationalPhoneInput';

function getScheduleTime(value: string | undefined, cronograma: string | undefined, label: string) {
  if (value) return value;
  const legacyEntry = cronograma?.split('|').find((entry) => entry.trim().startsWith(`${label}:`));
  const legacyValue = legacyEntry?.split(': ').slice(1).join(': ').trim() || '';
  return /^\d{2}:\d{2}$/.test(legacyValue) ? legacyValue : '';
}

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
    horaSalidaNovio: getScheduleTime(request.horaSalidaNovio, request.cronograma, 'Salida Novio'),
    horaSalidaNovia: getScheduleTime(request.horaSalidaNovia, request.cronograma, 'Salida Novia'),
    horaCeremonia: getScheduleTime(request.horaCeremonia, request.cronograma, 'Ceremonia'),
    horaCoctel: getScheduleTime(request.horaCoctel, request.cronograma, 'Cóctel'),
    horaBarraLibre: getScheduleTime(request.horaBarraLibre, request.cronograma, 'Barra Libre'),
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
    status: '',
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


  const hasPreWeddingFilled = values.fechaPreboda.trim() !== '' && values.lugarPreboda.trim() !== '' && values.detallesPreboda.trim() !== '';
  const hasPostWeddingFilled = values.fechaPostboda.trim() !== '' && values.lugarPostboda.trim() !== '' && values.detallesPostboda.trim() !== '';
  const hasCompleteBreakdown = values.tipoPack === 'Indeciso' || values.tipoPack === 'boda' ||
    (values.tipoPack === 'duo-pre' && hasPreWeddingFilled) ||
    (values.tipoPack === 'duo-post' && hasPostWeddingFilled) ||
    (values.tipoPack === 'trio' && hasPreWeddingFilled && hasPostWeddingFilled)
    ;

  return (
    <RequestDetailsModalFrame
      {...props}
      title={title}
      values={values}
      canConfirm={hasCompleteBreakdown}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const cronograma = [
          `Salida Novio: ${values.horaSalidaNovio || '--:--'}`,
          `Salida Novia: ${values.horaSalidaNovia || '--:--'}`,
          `Ceremonia: ${values.horaCeremonia || '--:--'}`,
          `Cóctel: ${values.horaCoctel || '--:--'}`,
          `Barra Libre: ${values.horaBarraLibre || '--:--'}`,
        ].join(' | ');
        onSave({ ...values, cronograma });
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