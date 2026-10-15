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
  cameraSetup: string;
  cameraPrice: string;
  droneSetup: string;
  dronePrice: string;
  lightingSetup: string;
  lightingPrice: string;
  soundSetup: string;
  soundPrice: string;
  deliveryFormat: string;
  formatPrice: string;
  extraCrew: string;
  extraCrewPrice: string;
  logistics: string;
  logisticsPrice: string;
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
  cameraSetup?: string | null;
  cameraPrice?: string | null;
  droneSetup?: string | null;
  dronePrice?: string | null;
  lightingSetup?: string | null;
  lightingPrice?: string | null;
  soundSetup?: string | null;
  soundPrice?: string | null;
  deliveryFormat?: string | null;
  formatPrice?: string | null;
  extraCrew?: string | null;
  extraCrewPrice?: string | null;
  logistics?: string | null;
  logisticsPrice?: string | null;
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
    cameraSetup: request.cameraSetup || '',
    cameraPrice: String(request.cameraPrice ?? '0,00'),
    droneSetup: request.droneSetup || '',
    dronePrice: String(request.dronePrice ?? '0,00'),
    lightingSetup: request.lightingSetup || '',
    lightingPrice: String(request.lightingPrice ?? '0,00'),
    soundSetup: request.soundSetup || '',
    soundPrice: String(request.soundPrice ?? '0,00'),
    deliveryFormat: request.deliveryFormat || '',
    formatPrice: String(request.formatPrice ?? '0,00'),
    extraCrew: request.extraCrew || '',
    extraCrewPrice: String(request.extraCrewPrice ?? '0,00'),
    logistics: request.logistics || '',
    logisticsPrice: String(request.logisticsPrice ?? '0,00'),
    taxPercent: String(request.taxPercent ?? '0,00'),
  }
}
