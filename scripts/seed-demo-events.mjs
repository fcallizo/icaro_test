// scripts/seed.mjs
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { neon } from '@neondatabase/serverless';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), true);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Define DATABASE_URL en el entorno o en .env.local.');
}

const sql = neon(databaseUrl);
const now = Date.now();
const nowIso = new Date(now).toISOString();
const uuid = (n) => `8ac77bc3-c701-4b13-95da-${String(n).padStart(12, '0')}`;

const madrid = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function madridDate(ms) {
  const parts = Object.fromEntries(
    madrid.formatToParts(ms).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function timestamp(iso) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(iso)) {
    throw new Error(`Timestamp inválido o sin zona horaria: ${iso}`);
  }
  return ms;
}

const confirm = (at) => ({ status: 'confirmed', at });
const reject = (at) => ({ status: 'rejected', at });
const session = (n, date, location, service, details) => ({
  n, date, location, service, details,
});

// Si la confirmación de ejemplo aún es futura, desplaza también el alta y
// la edición para conservar el orden. No adelanta la fecha de cierre.
function confirmationForAlerts({ createdAt, editedAt = createdAt, at }, latest = now) {
  const shift = Math.max(0, timestamp(at) - latest);
  const move = (iso) => shift === 0
    ? iso
    : new Date(timestamp(iso) - shift).toISOString();

  return {
    createdAt: move(createdAt),
    editedAt: move(editedAt),
    decision: confirm(move(at)),
  };
}

const P = {
  catedral: 'Catedral de Murcia, Plaza del Cardenal Belluga, Murcia',
  santoDomingo: 'Iglesia de Santo Domingo, Plaza de Santo Domingo, Murcia',
  aytoMurcia: 'Ayuntamiento de Murcia, Glorieta de España 1, Murcia',
  nelva: 'Hotel Nelva, Avenida Primero de Mayo 5, Murcia',
  hesperia: 'Hesperia Murcia Centro, Calle Madre de Dios 4, Murcia',
  coronas: 'Barceló Murcia Siete Coronas, Paseo de Garay 5, Murcia',
  casino: 'Real Casino de Murcia, Calle Trapería 18, Murcia',
  malecon: 'Paseo del Malecón, Murcia',
  floridablanca: 'Jardín de Floridablanca, Alameda de Colón, Murcia',
  fuensanta: 'Santuario de la Fuensanta, Algezares, Murcia',
  villegas: 'Auditorio Víctor Villegas, Avenida Primero de Mayo, Murcia',
  cuartel: 'Cuartel de Artillería, Calle Madre Elisea Oliver Molina, Murcia',

  palacio: 'Palacio Consistorial, Plaza del Ayuntamiento, Cartagena, Murcia',
  santaMaria: 'Iglesia de Santa María de Gracia, Calle del Aire, Cartagena, Murcia',
  nh: 'NH Cartagena, Calle Real 2, Cartagena, Murcia',
  alfonso: 'Sercotel Alfonso XIII, Paseo Alfonso XIII 40, Cartagena, Murcia',
  batel: 'Auditorio El Batel, Paseo Alfonso XII, Cartagena, Murcia',
  parqueTorres: 'Parque Torres, Cartagena, Murcia',
  calaCortina: 'Playa de Cala Cortina, Cartagena, Murcia',

  basilica: 'Basílica de Santa María, Plaça de Santa Maria, Elche, Alicante',
  hotelHuerto: 'Hotel Huerto del Cura, Porta de la Morera 14, Elche, Alicante',
  jardinHuerto: 'Jardín Huerto del Cura, Porta de la Morera 49, Elche, Alicante',
  milenio: 'Hotel Jardín Milenio, Carrer de Curtidors 17, Elche, Alicante',
  parqueElche: "Parque Municipal de Elche, Passeig de l'Estació, Elche, Alicante",
  pinet: 'Playa del Pinet, La Marina, Elche, Alicante',

  concatedral: 'Concatedral de San Nicolás, Plaza del Abad Penalva, Alicante',
  aytoAlicante: 'Ayuntamiento de Alicante, Plaza del Ayuntamiento 1, Alicante',
  melia: 'Meliá Alicante, Plaza del Puerto 3, Alicante',
  granSol: 'Hotel Alicante Gran Sol, Rambla de Méndez Núñez 3, Alicante',
  postiguet: 'Playa del Postiguet, Alicante',
  cigarreras: 'Centro Cultural Las Cigarreras, Calle San Carlos 78, Alicante',
  adda: 'Auditorio de la Diputación de Alicante, Avenida de Jijona 5, Alicante',

  jardinesLorca: 'Hotel Spa Jardines de Lorca, Alameda de Rafael Méndez, Lorca, Murcia',
  parador: 'Parador de Lorca, Castillo de Lorca, Lorca, Murcia',
  patricio: 'Colegiata de San Patricio, Plaza de España, Lorca, Murcia',
  plazaLorca: 'Plaza de España, Lorca, Murcia',
};

const weddings = [
  {
    n: 1, bride: 'Clara Martín', groom: 'Daniel Vega',
    email: 'clara.martin@example.com', eventDate: '2026-11-21',
    groomLocation: P.nelva, brideLocation: P.hesperia,
    ceremony: P.catedral, location: P.coronas,
    details: 'Ceremonia religiosa y cóctel en la terraza si acompaña el tiempo.',
    // Caso de alerta: confirmed el mismo día que Alba Ríos (pending).
    ...confirmationForAlerts({
      createdAt: '2026-08-06T09:00:00+02:00',
      editedAt: '2026-08-19T11:00:00+02:00',
      at: '2026-08-24T10:30:00+02:00',
    }),
  },
  {
    n: 2, bride: 'Lucía Romero', groom: 'Marcos Gil',
    email: 'lucia.romero@example.com', eventDate: '2026-11-28',
    groomLocation: P.nh, brideLocation: P.alfonso,
    ceremony: P.palacio, ceremonyTime: '13:30',
    location: P.alfonso, cocktailTime: '15:00',
    details: 'Preparativos en dos hoteles, ceremonia civil y banquete.',
    pre: session(6, '2026-11-14', P.parqueTorres, 'duo',
      'Fotos y vídeo de pareja al atardecer.'),
    createdAt: '2026-09-04T10:45:00+02:00',
  },
  {
    n: 3, bride: 'Eva Torres', groom: 'Pablo León',
    email: 'eva.torres@example.com', passport: 'AB123456C', eventDate: '2026-12-12',
    groomLocation: P.milenio, brideLocation: P.hotelHuerto,
    ceremony: P.basilica, ceremonyTime: '12:30', location: P.hotelHuerto,
    details: 'Reportaje completo de boda, con preboda de fotos y postboda de vídeo.',
    pre: session(7, '2026-12-05', P.jardinHuerto, 'fotos',
      'Retratos en el jardín a primera hora.'),
    post: session(8, '2026-12-19', P.pinet, 'video',
      'Pieza de pareja junto a las dunas y la orilla.'),
    createdAt: '2026-09-15T09:20:00+02:00',
    editedAt: '2026-09-21T09:20:00+02:00',
  },
  {
    n: 9, bride: 'Rocío Méndez', groom: 'Héctor Cano',
    email: 'rocio.mendez@example.com', eventDate: '2027-01-16',
    groomLocation: P.granSol, brideLocation: P.melia,
    ceremony: P.concatedral, location: P.melia,
    details: 'Reportaje de boda y una segunda sesión con luz de mañana.',
    post: session(13, '2027-01-30', P.postiguet, 'duo',
      'Fotos y vídeo de pareja junto al mar.'),
    createdAt: '2026-10-06T17:00:00+02:00',
  },
  {
    n: 10, bride: 'Marta Soler', groom: 'Adrián Blanco',
    email: 'marta.soler@example.com', passport: 'P12345678', eventDate: '2027-02-20',
    groomLocation: P.jardinesLorca, brideLocation: P.parador,
    ceremony: P.parador, ceremonyTime: '12:00', location: P.parador,
    packageType: 'indeciso',
    details: 'Ceremonia civil en el hotel. La pareja aún está valorando fotografía y vídeo.',
    // Caso de alerta: pending el mismo día que Samuel Ortega (pending).
    createdAt: '2026-11-10T12:20:00+01:00',
  },
  {
    n: 22, bride: 'Nuria Vidal', groom: 'Álvaro Costa',
    email: 'nuria.vidal@example.com', eventDate: '2026-10-17',
    groomLocation: P.nelva, brideLocation: P.coronas,
    ceremony: P.santoDomingo, location: P.nelva,
    details: 'Boda de otoño con ceremonia religiosa y banquete en salón.',
    pre: session(34, '2026-10-04', P.malecon, 'fotos',
      'Paseo y retratos informales al final de la tarde.'),
    post: session(35, '2026-10-24', P.fuensanta, 'duo',
      'Retratos y planos de pareja en los alrededores del santuario.'),
    createdAt: '2026-08-26T10:00:00+02:00',
    editedAt: '2026-09-01T10:00:00+02:00',
    decision: confirm('2026-09-03T10:30:00+02:00'),
    finishedAt: '2026-10-26T10:00:00+01:00',
  },
  {
    n: 23, bride: 'Paula Serrano', groom: 'Miguel Soto',
    email: 'paula.serrano@example.com', eventDate: '2026-11-07',
    groomLocation: P.alfonso, brideLocation: P.nh,
    ceremony: P.santaMaria, location: P.alfonso,
    details: 'Reportaje centrado en los preparativos, la entrada y los discursos.',
    pre: session(36, '2026-10-31', P.parqueTorres, 'video',
      'Grabación breve con vistas a la ciudad.'),
    post: session(37, '2026-11-15', P.calaCortina, 'fotos',
      'Retratos con luz suave a primera hora.'),
    createdAt: '2026-09-09T11:00:00+02:00',
    decision: confirm('2026-09-18T12:00:00+02:00'),
  },
  {
    n: 24, bride: 'Irene Molina', groom: 'Jorge Beltrán',
    email: 'irene.molina@example.com', eventDate: '2026-12-20',
    groomLocation: P.jardinesLorca, brideLocation: P.parador,
    ceremony: P.patricio, location: P.parador,
    details: 'Boda de invierno con retratos en el casco histórico de Lorca.',
    pre: session(38, '2026-12-03', P.plazaLorca, 'fotos',
      'Retratos urbanos y recorrido a pie por el centro.'),
    post: session(39, '2027-01-09', P.parador, 'duo',
      'Sesión exterior en el entorno del castillo después de Reyes.'),
    createdAt: '2026-09-23T09:30:00+02:00',
    editedAt: '2026-10-05T11:00:00+02:00',
    decision: confirm('2026-10-08T09:30:00+02:00'),
    finishedAt: '2027-01-11T09:45:00+01:00',
  },
  {
    n: 25, bride: 'Elena Ruiz', groom: 'Sergio Campos',
    email: 'elena.ruiz@example.com', eventDate: '2027-02-06',
    groomLocation: P.milenio, brideLocation: P.hotelHuerto,
    ceremony: P.hotelHuerto, location: P.hotelHuerto,
    details: 'Ceremonia civil y banquete en el mismo recinto, con plan interior si llueve.',
    pre: session(40, '2027-01-24', P.parqueElche, 'fotos',
      'Retratos de pareja entre las palmeras.'),
    post: session(41, '2027-02-14', P.pinet, 'duo',
      'Sesión en la playa al final de la tarde si el tiempo lo permite.'),
    createdAt: '2026-12-17T12:00:00+01:00',
    editedAt: '2026-12-18T10:00:00+01:00',
    decision: confirm('2026-12-21T12:00:00+01:00'),
  },
  {
    n: 26, bride: 'Beatriz Lara', groom: 'Óscar Lozano',
    email: 'beatriz.lara@example.com', eventDate: '2027-02-13',
    groomLocation: P.hesperia, brideLocation: P.coronas,
    ceremony: P.aytoMurcia, location: P.coronas,
    details: 'Consulta para una ceremonia civil pequeña y una preboda en el centro.',
    pre: session(42, '2027-02-07', P.floridablanca, 'fotos',
      'Retratos junto a los ficus del jardín.'),
    createdAt: '2026-12-10T11:30:00+01:00',
    decision: reject('2027-01-12T10:30:00+01:00'),
  },
  {
    n: 27, bride: 'Alicia Navarro', groom: 'Rubén Sáez',
    email: 'alicia.navarro@example.com', eventDate: '2027-02-21',
    groomLocation: P.granSol, brideLocation: P.melia,
    ceremony: P.aytoAlicante, location: P.melia,
    details: 'Ceremonia civil y comida familiar. Prefieren hacer los retratos otro día.',
    post: session(43, '2027-02-27', P.postiguet, 'video',
      'Pieza corta de pareja por el paseo marítimo.'),
    createdAt: '2026-12-15T11:00:00+01:00',
  },
];

function kit(camera, lighting, sound, delivery, staff, logistics) {
  return {
    camera_setup: camera[0], camera_price: camera[1],
    lighting_setup: lighting[0], lighting_price: lighting[1],
    sound_setup: sound[0], sound_price: sound[1],
    delivery_format: delivery[0], delivery_price: delivery[1],
    extra_staff: staff[0], extra_staff_price: staff[1],
    logistics: logistics[0], logistics_price: logistics[1],
  };
}

const kits = {
  spot: kit(
    ['Sony FX3 II', 500], ['Iluminación básica (Paneles LED)', 120],
    ['Sonido profesional (Pértiga y Lavaliers)', 180], ['Spot Comercial', 200],
    ['Ayudante de produccion', 180], ['Desplazamiento local', 60],
  ),
  video: kit(
    ['Sony Alpha 7 V', 350], ['Iluminación cinematográfica (Aputure/Nanlite)', 300],
    ['Sonido directo a cámara', 80], ['Paquete Completo (Largo + Reels)', 450],
    ['Auxiliar de camara', 160], ['Alquiler y transporte de equipo', 220],
  ),
  foto: kit(
    ['Sony Alpha 7 V', 250], ['Iluminación básica (Paneles LED)', 100],
    ['Sin sonido', 0], ['Solo brutos', 80],
    ['Sin personal adicional', 0], ['Desplazamiento local', 40],
  ),
  corporativo: kit(
    ['Sony FX3 II', 600], ['Iluminación cinematográfica (Aputure/Nanlite)', 350],
    ['Sonido profesional (Pértiga y Lavaliers)', 220], ['Vídeo corporativo largo', 600],
    ['Ayudante de produccion', 200], ['Equipo y desplazamiento', 250],
  ),
  musical: kit(
    ['Sony FX3 II', 600], ['Iluminación cinematográfica (Aputure/Nanlite)', 350],
    ['Sonido profesional (Pértiga y Lavaliers)', 220], ['Paquete Completo (Largo + Reels)', 450],
    ['-', 0], ['-', 0],
  ),
};

const productions = [
  {
    n: 4, name: 'Alba Ríos', email: 'alba.rios@example.com',
    eventDate: '2026-11-21', eventTime: '10:00',
    projectType: 'Spot comercial', budget: '1800', kit: 'spot',
    location: P.casino, drone: ['DJI Mini 4 Pro', 150],
    details: 'Spot para una marca local de café. Rodaje de producto en una sala reservada.',
    createdAt: '2026-09-24T10:00:00+02:00',
  },
  {
    n: 5, name: 'Nicolás Fuentes', email: 'nicolas.fuentes@example.com',
    eventDate: '2026-12-11', eventTime: '18:30',
    projectType: 'Videoclip cinematográfico', budget: '2200', kit: 'video',
    location: P.cuartel,
    details: 'Videoclip nocturno con iluminación de color y planos de interpretación.',
    createdAt: '2026-10-09T12:00:00+02:00',
  },
  {
    n: 11, name: 'Daniela Pardo', email: 'daniela.pardo@example.com',
    passport: 'C98765432', eventDate: '2027-01-23', eventTime: '11:00',
    projectType: 'Sesión fotográfica', budget: '650', kit: 'foto',
    location: P.hotelHuerto,
    details: 'Retrato editorial y fotografía de producto en una sala reservada.',
    createdAt: '2026-11-26T10:15:00+01:00',
  },
  {
    n: 12, name: 'Samuel Ortega', email: 'samuel.ortega@example.com',
    eventDate: '2027-02-20', eventTime: '09:00',
    projectType: 'Producción completa', budget: '3500', kit: 'corporativo',
    location: P.adda, drone: ['DJI Mavic 3 Cine', 300],
    details: 'Pieza corporativa con entrevistas en sala y recursos del exterior.',
    createdAt: '2026-12-09T10:45:00+01:00',
  },
  {
    n: 20, name: 'Sarah Martínez', email: 'sarah.martinez@example.com',
    eventDate: '2026-11-20', eventTime: '09:00',
    projectType: 'Videoclip musical', budget: '3500', kit: 'musical',
    location: P.cigarreras, drone: ['DJI Mavic 3 Cine', 300],
    details: 'Videoclip para presentar a una audición, con una pieza principal y cortes cortos.',
    // Sarah se confirma antes que Clara, incluso si se adelantan ambas fechas.
    ...confirmationForAlerts({
      createdAt: '2026-08-11T10:00:00+02:00',
      at: '2026-08-18T10:00:00+02:00',
    }, now - 1000),
    finishedAt: '2026-11-23T10:30:00+01:00',
  },
  {
    n: 28, name: 'Celia Ortega', email: 'celia.ortega@example.com',
    eventDate: '2026-10-09', eventTime: '09:30',
    projectType: 'Spot comercial', budget: '1800', kit: 'spot',
    location: P.nelva,
    details: 'Anuncio de 30 segundos para promocionar un congreso gastronómico.',
    createdAt: '2026-09-01T11:00:00+02:00',
    decision: confirm('2026-09-10T12:00:00+02:00'),
    finishedAt: '2026-10-13T10:30:00+02:00',
  },
  {
    n: 29, name: 'Javier Costa', email: 'javier.costa@example.com',
    eventDate: '2026-10-29', eventTime: '09:30',
    projectType: 'Producción completa', budget: '3500', kit: 'corporativo',
    location: P.villegas,
    details: 'Entrevistas a ponentes y vídeo resumen de una jornada empresarial.',
    createdAt: '2026-09-15T10:00:00+02:00',
    decision: confirm('2026-10-02T10:45:00+02:00'),
  },
  {
    n: 30, name: 'Miriam Rubio', email: 'miriam.rubio@example.com',
    eventDate: '2026-11-25', eventTime: '10:30',
    projectType: 'Sesión fotográfica', budget: '650', kit: 'foto',
    location: P.hesperia,
    details: 'Solicitud para fotografiar una colección de accesorios para una tienda en línea.',
    createdAt: '2026-10-20T10:00:00+02:00',
    decision: reject('2026-11-04T11:30:00+01:00'),
  },
  {
    n: 31, name: 'Hugo Navarro', email: 'hugo.navarro@example.com',
    eventDate: '2026-12-22', eventTime: '17:00',
    projectType: 'Videoclip cinematográfico', budget: '2200', kit: 'video',
    location: P.batel,
    details: 'Grabación en sala de una versión acústica, con un plano secuencia y planos de apoyo.',
    createdAt: '2026-10-22T09:30:00+02:00',
    decision: confirm('2026-11-05T09:30:00+01:00'),
    finishedAt: '2027-01-07T10:00:00+01:00',
  },
  {
    n: 32, name: 'Laura Paredes', email: 'laura.paredes@example.com',
    eventDate: '2027-01-28', eventTime: '10:00',
    projectType: 'Spot comercial', budget: '1800', kit: 'spot',
    location: P.melia,
    details: 'Pieza promocional sobre la oferta del hotel para reuniones de empresa.',
    createdAt: '2026-12-16T12:00:00+01:00',
    decision: confirm('2027-01-04T12:00:00+01:00'),
    finishedAt: '2027-02-01T12:00:00+01:00',
  },
  {
    n: 33, name: 'Iván Marín', email: 'ivan.marin@example.com',
    eventDate: '2027-02-25', eventTime: '09:00',
    projectType: 'Producción completa', budget: '3500', kit: 'corporativo',
    location: P.batel,
    details: 'Cobertura de un congreso, entrevistas a asistentes y montaje del vídeo resumen.',
    createdAt: '2027-01-13T11:00:00+01:00',
    decision: confirm('2027-02-02T11:45:00+01:00'),
  },
];

const blocks = [
  { id: uuid(14), start_date: '2026-11-11', end_date: '2026-11-11', reason: 'Huelga general' },
  { id: uuid(15), start_date: '2026-12-24', end_date: '2027-01-02', reason: 'Vacaciones de Navidad' },
  { id: uuid(16), start_date: '2027-01-17', end_date: '2027-01-19', reason: 'Descanso personal' },
];

const members = [
  { id: uuid(17), name: 'Sofía Navarro - Fotografía' },
  { id: uuid(18), name: 'Mateo Ruiz - Vídeo' },
  { id: uuid(19), name: 'Inés Campos - Producción' },
  { id: uuid(21), name: 'Guillermo Callizo - Dron' },
];

function primaryEvent(fixture, type) {
  const { createdAt, editedAt = createdAt, decision, finishedAt } = fixture;
  const created = timestamp(createdAt);
  const edited = timestamp(editedAt);
  const decided = decision ? timestamp(decision.at) : null;
  const finished = finishedAt ? timestamp(finishedAt) : null;
  const lastSessionDate = fixture.post?.date ?? fixture.eventDate;

  if (
    edited < created ||
    (decision && (decided < created || !['confirmed', 'rejected'].includes(decision.status))) ||
    (fixture.pre && fixture.pre.date >= fixture.eventDate) ||
    (fixture.post && fixture.post.date <= fixture.eventDate) ||
    (finished !== null && (
      decision?.status !== 'confirmed' ||
      finished < decided ||
      finished < edited ||
      madridDate(finished) <= lastSessionDate
    ))
  ) {
    throw new Error(`Cronología incoherente en el evento ${fixture.n}.`);
  }

  // Si la fecha de alta de ejemplo aún es futura, crea la solicitud ahora.
  const created_at = created <= now ? createdAt : nowIso;
  const updated_at = edited <= now ? editedAt : created_at;
  const decided_at = decided !== null && decided <= now ? decision.at : null;
  const finished_at = finished !== null && finished < now ? finishedAt : null;

  return {
    id: uuid(fixture.n),
    type,
    event_date: fixture.eventDate,
    status: finished_at ? 'finished' : (decided_at ? decision.status : 'pending'),
    budget_id: null,
    parent_event_id: null,
    created_at,
    updated_at,
    decided_at,
    finished_at,
  };
}

const couples = weddings.map((w) => ({ w, parent: primaryEvent(w, 'wedding') }));

const primary = [
  ...couples.map(({ parent }) => parent),
  ...productions.map((p) => primaryEvent(p, 'production')),
];

// Las sesiones no tienen decisión ni presupuesto propios.
// La aplicación las bloquea cuando finaliza la boda padre.
const secondary = couples.flatMap(({ w, parent }) =>
  [['prewedding', w.pre], ['postwedding', w.post]]
    .filter(([, s]) => s)
    .map(([type, s]) => ({
      id: uuid(s.n),
      type,
      event_date: s.date,
      status: 'pending',
      budget_id: null,
      parent_event_id: parent.id,
      created_at: parent.created_at,
      updated_at: parent.updated_at,
      decided_at: null,
      finished_at: null,
    })),
);

const seen = new Set();
for (const { id, event_date: date } of [...primary, ...secondary]) {
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(ms) ||
    new Date(ms).toISOString().slice(0, 10) !== date ||
    date < '2026-10-01' ||
    date > '2027-02-28'
  ) {
    throw new Error(`Fecha de evento inválida o fuera de rango: ${id} (${date}).`);
  }
  if (seen.has(id)) {
    throw new Error(`UUID de evento duplicado: ${id}.`);
  }
  if (blocks.some((b) => b.start_date <= date && date <= b.end_date)) {
    throw new Error(`El evento ${id} coincide con un bloqueo (${date}).`);
  }
  seen.add(id);
}

// El año del presupuesto es el de la confirmación en Europe/Madrid,
// no el de la celebración ni el del cierre.
const lastNumberByYear = new Map();
const withBudget = primary
  .filter((e) => e.status === 'confirmed' || e.status === 'finished')
  .sort((a, b) =>
    timestamp(a.decided_at) - timestamp(b.decided_at) || a.id.localeCompare(b.id),
  );

for (const event of withBudget) {
  const year = Number(madridDate(timestamp(event.decided_at)).slice(0, 4));
  const number = (lastNumberByYear.get(year) ?? 0) + 1;
  if (number > 9999) {
    throw new Error(`Contador de presupuestos agotado para ${year}.`);
  }

  event.budget_id = `${year}-${String(number).padStart(4, '0')}`;
  lastNumberByYear.set(year, number);
}

function identity(fixture) {
  if (fixture.passport) {
    return {
      identity_document_type: 'passport',
      identity_document: fixture.passport,
    };
  }

  const n = 99_999_000 + fixture.n;
  return {
    identity_document_type: 'nif',
    identity_document: `${n}${'TRWAGMYFPDXBNJZSQVHLCKE'[n % 23]}`,
  };
}

const phone = (n, suffix = 0) => `+34600${String(n * 10 + suffix).padStart(6, '0')}`;

function weddingRow(w) {
  const packageType = w.pre && w.post ? 'trio'
    : w.pre ? 'duo-pre'
    : w.post ? 'duo-post'
    : 'boda';

  return {
    event_id: uuid(w.n),
    name: `${w.bride} y ${w.groom}`,
    email: w.email,
    ...identity(w),
    bride_phone: phone(w.n, 1),
    groom_phone: phone(w.n, 2),
    groom_location: w.groomLocation,
    groom_departure_time: '11:15',
    bride_location: w.brideLocation,
    bride_departure_time: '11:45',
    package_type: w.packageType ?? packageType,
    ceremony_location: w.ceremony,
    ceremony_time: w.ceremonyTime ?? '13:00',
    location: w.location,
    cocktail_time: w.cocktailTime ?? '14:30',
    open_bar_time: '21:00',
    details: w.details,
    wedding_service: 'duo',
    prewedding_service: w.pre?.service ?? null,
    prewedding_location: w.pre?.location ?? null,
    prewedding_details: w.pre?.details ?? null,
    postwedding_service: w.post?.service ?? null,
    postwedding_location: w.post?.location ?? null,
    postwedding_details: w.post?.details ?? null,
  };
}

function productionRow(p) {
  const [drone_setup, drone_price] = p.drone ?? ['Sin dron', 0];
  if (!kits[p.kit]) {
    throw new Error(`Configuración de producción desconocida: ${p.kit}.`);
  }

  return {
    event_id: uuid(p.n),
    name: p.name,
    email: p.email,
    ...identity(p),
    phone: phone(p.n),
    project_type: p.projectType,
    budget: p.budget,
    location: p.location,
    event_time: p.eventTime,
    details: p.details,
    ...kits[p.kit],
    drone_setup,
    drone_price,
    tax_percent: 21,
  };
}

// Los identificadores de tabla y columna son internos al script.
// Los valores se pasan siempre como parámetros.
function upsert(table, key, row, ignoreConflict = false) {
  const columns = Object.keys(row);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const assignments = columns
    .filter((column) => column !== key)
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(', ');

  const onConflict = ignoreConflict
    ? 'DO NOTHING'
    : `DO UPDATE SET ${assignments}`;

  return sql.query(
    `INSERT INTO ${table} (${columns.join(', ')})
     VALUES (${placeholders})
     ON CONFLICT (${key}) ${onConflict}`,
    columns.map((column) => row[column]),
  );
}

const statements = [
  ...primary.map((row) => upsert('events', 'id', row)),
  ...weddings.map((w) => upsert('wedding_requests', 'event_id', weddingRow(w))),
  ...productions.map((p) => upsert('production_requests', 'event_id', productionRow(p))),
  ...secondary.map((row) => upsert('events', 'id', row)),
  ...blocks.map((row) => upsert('calendar_blocks', 'id', row)),
  ...members.map((member) => upsert('event_members', 'id', {
    ...member,
    token_hash: createHash('sha256')
      .update(randomBytes(32).toString('base64url'))
      .digest('hex'),
  }, true)),
  ...Array.from(lastNumberByYear, ([year, lastNumber]) => sql.query(
    `INSERT INTO annual_budget_counters (year, last_number)
     VALUES ($1, $2)
     ON CONFLICT (year) DO UPDATE
       SET last_number = GREATEST(annual_budget_counters.last_number, EXCLUDED.last_number)`,
    [year, lastNumber],
  )),
];

await sql.transaction(statements);

const count = (type) => secondary.filter((e) => e.type === type).length;
console.log(
  `Carga completada: ${weddings.length} bodas, ${productions.length} producciones, ` +
  `${count('prewedding')} prebodas, ${count('postwedding')} postbodas, ` +
  `${blocks.length} bloqueos y ${members.length} colaboradores.`,
);
console.log('Últimos números de presupuesto del seed:', Object.fromEntries(lastNumberByYear));