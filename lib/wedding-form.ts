
export type WeddingFormValues = {
  nombre: string;
  email: string;
  fecha: string;
  telNovio: string;
  telNovia: string;
  tipoPack: string;
  detalles: string;  
  novio: string;
  horaSalidaNovio: string;
  novia: string;
  horaSalidaNovia: string;
  ceremonia: string;
  horaCeremonia: string;
  lugar: string;
  horaCoctel: string;
  horaBarraLibre: string;
  servicioBoda: string;

  servicioPreboda: string;
  fechaPreboda: string;
  lugarPreboda: string;
  detallesPreboda: string;

  servicioPostboda: string;
  fechaPostboda: string;
  lugarPostboda: string;
  detallesPostboda: string;

  status: string;
};

/* ---------- Opciones de los desplegables ---------- */

export const PACK_OPTIONS = [
  { value: 'indeciso', label: 'Aún no lo sabemos' },
  { value: 'boda', label: 'Solo boda' },
  { value: 'duo-pre', label: 'Boda + preboda' },
  { value: 'duo-post', label: 'Boda + postboda' },
  { value: 'trio', label: 'Preboda + boda + postboda' },
];

export const SERVICE_OPTIONS = [
  { value: 'fotos', label: 'Sesión fotográfica', price: 250, complementPrice: 100 },
  { value: 'video', label: 'Vídeo documental', price: 300, complementPrice: 150 },
  { value: 'duo', label: 'Sesión fotográfica + vídeo documental', price: 500, complementPrice: 200 },
];