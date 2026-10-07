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
  telNovio: string;
  telNovia: string;
  telefono: string;
  lugar: string;
  novia: string;
  novio: string;
  ceremonia: string;
  cronograma: string;
  detalles: string;
  tipoPack: string;
  tipo: string;
  fechaPreboda: string;
  lugarPreboda: string;
  detallesPreboda: string;
  fechaPostboda: string;
  lugarPostboda: string;
  detallesPostboda: string;
  presupuesto: string;
  descripcion: string;
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
  id: string;
  type: RequestType;
  status: RequestStatus;
  nombre?: string;
  email?: string;
  telNovio?: string;
  telNovia?: string;
  telefono?: string;
  fecha?: string;
  lugar?: string;
  novia?: string;
  novio?: string;
  ceremonia?: string;
  cronograma?: string;
  detalles?: string;
  tipoPack?: string;
  tipo?: string;
  fechaPreboda?: string | null;
  lugarPreboda?: string | null;
  detallesPreboda?: string | null;
  fechaPostboda?: string | null;
  lugarPostboda?: string | null;
  detallesPostboda?: string | null;
  presupuesto?: string;
  descripcion?: string;
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
  created_at?: string;
};