export type RequestType = 'wedding' | 'production';
export type RequestStatus = 'pending' | 'confirmed' | 'rejected';
export type RequestAction = 'confirm' | 'reject';
export type CalendarBlockRange = {
  startDate: string;
  endDate: string;
};

export type CalendarBlock = CalendarBlockRange & {
  id: string;
  reason: string | null;
  createdAt: string;
};
export type ProductionMaterialCategory = 'camera' | 'drone' | 'lighting' | 'sound' | 'format';

export type ProductionMaterial = {
  id: string;
  category: ProductionMaterialCategory;
  name: string;
  basePrice: string | null;
  active: boolean;
  sortOrder: number;
};

export type PrivateRequestUpdate = {
  nombre: string;
  email: string;
  fecha: string;
  detalles: string;

  // boda
  telNovio: string;
  telNovia: string;
  novio: string;
  horaSalidaNovio: string;
  novia: string;
  horaSalidaNovia: string;
  ceremonia: string;
  horaCeremonia: string;
  lugar: string;
  horaCoctel: string;
  horaBarraLibre: string;
  tipoPack: string;
  servicioBoda: string;
  extraBoda: string;
  precioExtraBoda: string;
  descuentoBoda: string;

  servicioPreboda: string;
  fechaPreboda: string;
  lugarPreboda: string;
  detallesPreboda: string;
  extraPreboda: string;
  precioExtraPreboda: string;

  servicioPostboda: string;
  fechaPostboda: string;
  lugarPostboda: string;
  detallesPostboda: string;
  extraPostboda: string;
  precioExtraPostboda: string;

  // produccion
  telefono: string;
  tipo: string;
  presupuesto: string;
  setupCamara: string;
  precioCamara: string;
  setupDrone: string;
  precioDrone: string;
  setupIluminacion: string;
  precioIluminacion: string;
  setupSonido: string;
  precioSonido: string;
  formatoEntrega: string;
  precioFormato: string;
  personalExtra: string;
  precioPersonalExtra: string;
  logistica: string;
  precioLogistica: string;
  taxPercent: string;
};

export type RequestDetailsModalProps = {
  request: PrivateRequest;
  materials?: ProductionMaterial[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onAction: (action: RequestAction, values?: PrivateRequestUpdate) => void;
  onSave: (values: PrivateRequestUpdate) => void;
};

export type PrivateRequest = {
  // comunes
  id: string;
  type: RequestType;
  status: RequestStatus;
  nombre?: string;
  email?: string;
  fecha?: string;
  created_at?: string;
  detalles: string;

  // boda
  telNovio?: string;
  telNovia?: string;
  novia?: string;
  horaSalidaNovia?: string;
  novio?: string;
  horaSalidaNovio?: string;
  ceremonia?: string;
  horaCeremonia?: string;
  lugar?: string;
  horaCoctel?: string;
  horaBarraLibre?: string;
  tipoPack?: string;
  servicioBoda?: string;
  extraBoda?: string;
  precioExtraBoda?: string;
  descuentoBoda?: string;

  servicioPreboda?: string;
  fechaPreboda?: string;
  lugarPreboda?: string;
  detallesPreboda?: string;
  extraPreboda?: string;
  precioExtraPreboda?: string;

  servicioPostboda?: string;
  fechaPostboda?: string;
  lugarPostboda?: string;
  detallesPostboda?: string;
  extraPostboda?: string;
  precioExtraPostboda?: string;
  
  // produccion
  telefono?: string;
  presupuesto?: string;
  tipo?: string;
  setupCamara?: string | null;
  precioCamara?: string | null;
  setupDrone?: string | null;
  precioDrone?: string | null;
  setupIluminacion?: string | null;
  precioIluminacion?: string | null;
  setupSonido?: string | null;
  precioSonido?: string | null;
  formatoEntrega?: string | null;
  precioFormato?: string | null;
  personalExtra?: string | null;
  precioPersonalExtra?: string | null;
  logistica?: string | null;
  precioLogistica?: string | null;
  taxPercent?: string | null;
};

export function setDefaultFormValues(request: PrivateRequest) {
return {
    nombre: request.nombre || '',
    email: request.email || '',
    fecha: request.fecha || '',
    detalles: request.detalles || '',
    
    telNovio: request.telNovio || '',
    telNovia: request.telNovia || '',
    novia: request.novia || '',
    horaSalidaNovio: request.horaSalidaNovio || '',
    novio: request.novio || '',
    horaSalidaNovia: request.horaSalidaNovia || '',
    ceremonia: request.ceremonia || '',
    horaCeremonia: request.horaCeremonia || '',
    lugar: request.lugar || '',
    horaCoctel: request.horaCoctel || '',
    horaBarraLibre: request.horaBarraLibre || '',
    tipoPack: request.tipoPack || '',
    servicioBoda: request.servicioBoda || 'duo',
    extraBoda: request.extraBoda || '',
    precioExtraBoda: String(request.precioExtraBoda ?? '0,00'),
    descuentoBoda: String(request.descuentoBoda ?? '0'),

    servicioPreboda: request.servicioPreboda || 'duo',
    fechaPreboda: request.fechaPreboda || '',
    lugarPreboda: request.lugarPreboda || '',
    detallesPreboda: request.detallesPreboda || '',
    extraPreboda: request.extraPreboda || '',
    precioExtraPreboda: String(request.precioExtraPreboda ?? '0,00'),

    servicioPostboda: request.servicioPostboda || 'duo',
    fechaPostboda: request.fechaPostboda || '',
    lugarPostboda: request.lugarPostboda || '',
    detallesPostboda: request.detallesPostboda || '',
    extraPostboda: request.extraPostboda || '',
    precioExtraPostboda: String(request.precioExtraPostboda ?? '0,00'),

    telefono: request.telefono || '',
    tipo: request.tipo || '',
    presupuesto: request.presupuesto || '',
    setupCamara: request.setupCamara || '',
    precioCamara: String(request.precioCamara ?? '0,00'),
    setupDrone: request.setupDrone || '',
    precioDrone: String(request.precioDrone ?? '0,00'),
    setupIluminacion: request.setupIluminacion || '',
    precioIluminacion: String(request.precioIluminacion ?? '0,00'),
    setupSonido: request.setupSonido || '',
    precioSonido: String(request.precioSonido ?? '0,00'),
    formatoEntrega: request.formatoEntrega || '',
    precioFormato: String(request.precioFormato ?? '0,00'),
    personalExtra: request.personalExtra || '',
    precioPersonalExtra: String(request.precioPersonalExtra ?? '0,00'),
    logistica: request.logistica || '',
    precioLogistica: String(request.precioLogistica ?? '0,00'),
    taxPercent: String(request.taxPercent ?? '0,00'),
  }
}
