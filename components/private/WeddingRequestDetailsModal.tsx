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
    tipo: request.tipo || '',
    presupuesto: request.presupuesto || '',
    descripcion: request.descripcion || '',
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
  const updateField = (field: keyof PrivateRequestUpdate) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <RequestDetailsModalFrame
      {...props}
      title={title}
      values={values}
      onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(values); }}
      primaryAction={request.status !== 'pending' ? (
        <button type="button" className="private-download-button" disabled={props.busy} onClick={() => downloadWeddingSheet(request, values)}>
          Descargar ficha de rodaje
        </button>
      ) : undefined}
    >
      {input('nombre', 'Nombre de la pareja', 'text', true, true)}
      {input('email', 'Email', 'email', true)}
      {input('fecha', 'Fecha', 'date', true)}
      {input('telNovio', 'Teléfono del novio', 'tel', true)}
      {input('telNovia', 'Teléfono de la novia', 'tel', true)}
      {input('lugar', 'Banquete', 'text', true)}
      {input('ceremonia', 'Ceremonia')}
      {input('novia', 'Casa de la novia')}
      {input('novio', 'Casa del novio')}
      {textarea('cronograma', 'Horarios')}
      {textarea('detalles', 'Detalles')}
    </RequestDetailsModalFrame>
  );
}