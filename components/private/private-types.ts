export type RequestType = 'wedding' | 'production';
export type RequestStatus = 'pending' | 'confirmed' | 'rejected';
export type RequestAction = 'confirm' | 'reject';

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
  tipo?: string;
  presupuesto?: string;
  descripcion?: string;
  created_at?: string;
};