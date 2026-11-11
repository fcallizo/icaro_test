import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import { GOLD, INK, LINE, MUTED, SOFT } from '@/lib/properties';

/* ==========================================================================
 * Contrato / desglose técnico — Ícaro Studio
 * --------------------------------------------------------------------------
 * Estructura del documento:
 *   1. Cabecera de marca + nº de documento (solo en la 1ª página).
 *   2. Datos del cliente.
 *   3. Desglose técnico: PARTIDAS (servicios contratados, con precio).
 *   4. EQUIPAMIENTO: material con el que se trabaja. NO es una partida
 *      vendible, por eso va en un bloque aparte y sin columna de importe.
 *   5. Totales.
 *   6. Términos y condiciones.
 *   7. Firmas y pie con paginación.
 *
 * Diferencia clave entre los dos bloques:
 *   · PARTIDAS   → servicios que el cliente contrata y paga.
 *   · MATERIAL   → equipamiento propio del estudio con el que se realiza
 *                  el trabajo. No se factura ni se ofrece como extra.
 * ======================================================================== */

export type ContractRow = {
  /** Nombre de la partida (servicio contratado). */
  label: string;
  /** Detalle / configuración / duración. */
  setup: string;
  /** Importe con formato ("1.500 €"). */
  price: string;
};

export type ProductionContractData = {
  nombre: string;
  email: string;
  telefono: string;
  clienteTipoDocumento: string;
  clienteCif: string;
  presupuestoNumero?: string;
  fecha: string;
  proyecto: string;
  descipcionTrabajo: string;
  presupuesto: string;
  rows: ContractRow[];
  taxPercent: string;
  subtotal: string;
  iva: string;
  total: string;
  terminos?: string[];
};


/* --- Helpers ------------------------------------------------------------- */

/** Normaliza un importe a número. Devuelve null si no es un número válido. */
function parseAmount(value: string): number | null {
  if (typeof value !== 'string') return null;

  const normalized = value
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.');

  if (normalized === '' || normalized === '-' || normalized === '—') return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Devuelve true si la fila debe ocultarse.
 * Se ocultan las filas con precio 0, vacías o "a consultar".
 */
function shouldHideRow(row: { price: string }): boolean {
  const amount = parseAmount(row.price);

  if (amount === null) {
    const normalized = (row.price ?? '').trim().toLowerCase();
    return normalized === '' || normalized === '—' || normalized === '-';
  }

  return amount === 0;
}

/** Construye el número de documento: PR-2026-0001 a partir del presupuesto. */
function buildDocumentNumber(presupuesto: string): string {
  const digits = (presupuesto ?? '').replace(/\D/g, '');

  if (!digits) return 'PR-2026-0000';

  return `PR-${new Date().getFullYear()}-${digits.padStart(4, '0').slice(-4)}`;
}

/** Número de página con el total (React-PDF lo resuelve con renderPage). */
function formatPageNumber(pageNumber: number, totalPages: number): string {
  return `${pageNumber} / ${totalPages}`;
}

const s = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 42,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: INK,
    lineHeight: 1.45,
  },

  /* --- Cabecera ---------------------------------------------------------- */

  headerBand: {
    marginHorizontal: -40,
    marginBottom: 22,
    backgroundColor: INK,
  },
  headerBandInner: {
    paddingVertical: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBrand: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: GOLD,
    letterSpacing: 3,
  },
  headerTagline: {
    fontSize: 7.5,
    color: '#b9bec7',
    letterSpacing: 1.4,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  headerMeta: { alignItems: 'flex-end' },
  headerMetaLabel: {
    fontSize: 6.5,
    color: '#8b9099',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerMetaValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#ffffff',
    marginTop: 2,
  },

  docTitle: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  docSubtitle: {
    fontSize: 10,
    color: MUTED,
    marginTop: 10,
    marginBottom: 5,
  },
  /* Bloque del título (primera página). */
  docTitleBlock: {
    marginBottom: 2,
  },

  /* --- Secciones --------------------------------------------------------- */

  section: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 5,
    borderBottom: `1pt solid ${GOLD}`,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  
  sectionTerm: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 15,
    marginBottom: 5,
    borderBottom: `1pt solid ${GOLD}`,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* --- Datos del cliente ------------------------------------------------- */

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  infoCell: {
    width: '50%',
    paddingRight: 14,
    marginBottom: 9,
  },
  infoCellFull: {
    width: '100%',
    paddingRight: 14,
    marginBottom: 9,
  },
  infoLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  /* --- Tabla de partidas ------------------------------------------------- */

/* --- Tabla de partidas ------------------------------------------------- */

  table: {
    border: `0.5pt solid ${LINE}`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    backgroundColor: SOFT,
    borderBottom: `1pt solid ${GOLD}`,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
  },
  headDense: {
    flexDirection: 'row',
    backgroundColor: SOFT,
    borderBottom: `1pt solid ${GOLD}`,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  row: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
  },
  rowDense: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
    fontSize: 6.5,
  },
  rowAlt: {
    flexDirection: 'row',
    backgroundColor: '#fbfbfc',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
  },
  rowAltDense: {
    flexDirection: 'row',
    backgroundColor: '#fbfbfc',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
    fontSize: 6.5,
  },
  rowLast: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10 },
  rowLastDense: {
    flexDirection: 'row',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    fontSize: 6.5,
  },
  c1: { width: '30%', paddingRight: 10, fontFamily: 'Helvetica-Bold' },
  c2: { width: '52%', paddingRight: 10 },
  c3: { width: '18%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  emptyTable: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: MUTED,
    fontSize: 9,
    fontStyle: 'italic',
  },

  /* --- Descripción del trabajo -------------------------------------------- */

  briefBox: {
    border: `0.5pt solid ${LINE}`,
    borderRadius: 4,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: '#fcfcfd',
  },
  briefText: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.55,
  },
  briefMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  briefMetaCell: {
    width: '50%',
    paddingRight: 12,
    marginBottom: 6,
  },
  briefMetaLabel: {
    fontSize: 6.5,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  briefMetaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  /* --- Bloque de material / equipamiento -------------------------------- */

  materialBox: {
    border: `0.5pt solid ${LINE}`,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fcfcfd',
  },
  materialIntro: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 9,
    fontStyle: 'italic',
  },
  materialGroup: {
    marginBottom: 7,
  },
  materialGroupLast: {
    marginBottom: 0,
  },
  materialCategory: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: INK,
    marginBottom: 2,
  },
  materialDetail: {
    fontSize: 8.5,
    color: '#3f3f46',
    lineHeight: 1.45,
  },
  materialEmpty: {
    fontSize: 8.5,
    color: MUTED,
    fontStyle: 'italic',
  },

  /* --- Totales ----------------------------------------------------------- */

  totalsWrap: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '46%',
    border: `0.5pt solid ${LINE}`,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { color: MUTED, fontSize: 9 },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 9.5 },
  totalDivider: {
    borderTop: `0.5pt solid ${LINE}`,
    marginVertical: 4,
  },
  totalGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  totalGrandLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  totalGrandValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: GOLD,
  },
  totalNote: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 5,
    textAlign: 'right',
  },

  /* --- Condiciones ------------------------------------------------------- */

  termsList: { marginTop: 2 },
  termRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  termNumber: {
    width: 18,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    fontSize: 9,
  },
  termText: {
    flex: 1,
    fontSize: 8.5,
    color: '#333333',
    lineHeight: 1.5,
  },
  termTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
  },

  noteBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffdf5',
    borderLeft: `2pt solid ${GOLD}`,
    borderRadius: 3,
  },
  noteText: {
    fontSize: 8.5,
    color: '#4b5563',
    lineHeight: 1.5,
  },

  /* --- Firmas ------------------------------------------------------------ */

  sign: {
    marginTop: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signBox: { width: '44%' },
  signLine: {
    borderBottom: `0.75pt solid ${INK}`,
    height: 26,
    marginBottom: 5,
  },
  signLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  signHint: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
  },

  /* --- Pie --------------------------------------------------------------- */

  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `0.5pt solid ${LINE}`,
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: MUTED },
  footerPage: { fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold' },
});

/* --- Contenido ------------------------------------------------------------ */

const DEFAULT_TERMS: string[] = [
  'Objeto del contrato. Este documento recoge el detalle técnico y económico de los servicios contratados para la ejecución del proyecto indicado, así como las condiciones de contratación, entrega y pago.',
  'Presupuesto y vigencia. Los importes indicados constituyen un presupuesto cerrado y vinculante durante 30 días naturales desde su emisión. Cualquier modificación del alcance requerirá un presupuesto adicional firmado por ambas partes.',
  'Forma de pago. El 50 % se abonará en el momento de la confirmación de la reserva y el 50 % restante antes del inicio de la cobertura. Los métodos de pago aceptados se acordarán con el cliente.',
  'Plazos de entrega. El plazo estimado de entrega del material editado se indica en la tabla anterior y cuenta desde la fecha de la sesión. Los retrasos imputables a la no entrega de material o a la falta de aprobaciones del cliente ampliarán dicho plazo de forma proporcional.',
  'Reservas y cancelación. La reserva de fecha se mantiene mediante el anticipo. Las cancelaciones con más de 30 días de antelación se devuelven íntegramente; las realizadas con menos de 15 días no se reembolsan y el anticipo abonado se descuenta del importe pendiente. Las cancelaciones entre 15 y 30 días devuelven el 50 % del importe.',
  'Equipamiento de trabajo. El material y el equipamiento con el que se ejecuta la cobertura son de propiedad de Ícaro Studio y se detallan en el apartado correspondiente de este documento. Este material no constitutes una partida facturable ni se encuentra a la venta: forma parte del servicio contratado. La custodia, la calidad y el resultado final dependen del uso de dicho equipamiento en las condiciones profesionales habituales.',
  'Material aportado por el cliente. Cuando el cliente aporte material propio —por ejemplo, material de archivo o cintas que deban digitalizarse—, Ícaro Studio custodiará dicho material hasta su entrega o montaje. No se ofrece garantía sobre el material aportado por el cliente y no se responde por su pérdida o deterioro salvo dolo o culpa grave.',
  'Propiedad intelectual. El cliente adquiere la plena propiedad de las imágenes y vídeos entregados una vez abonado el importe total. Hasta ese momento, Ícaro Studio conserva los derechos de uso sobre el material pendiente de pago.',
  'Uso y publicación del material. El cliente autoriza expresamente a Ícaro Studio a utilizar, publicar y difundir las imágenes y vídeos resultantes del proyecto —incluidos fragmentos destacados— en su página web, redes sociales, portfolio y cualquier canal comercial propio o de terceros, tanto antes como después de la entrega del material. Esta autorización es irrevocable y se considera concedida con la firma de este documento.',
  'Unidad aérea (dron). Cuando el presupuesto incluya una toma aérea con dron, su ejecución queda condicionada a las condiciones meteorológicas, al espacio aéreo disponible, a la normativa vigente y a la ausencia de restricciones por parte de la autoridad competente o de los propietarios del lugar. Si la unidad aérea no pudiera realizarse por condiciones climatológicas adversas, viento, lluvia, niebla, falta de permisos, restricciones de espacio aéreo o cualquier otra causa ajena a la voluntad de Ícaro Studio, se ofrecerán al cliente las siguientes opciones, a elección de este: (a) realizar la toma aérea en otra fecha, antes o después de la fecha del evento, sin coste adicional; (b) sustituirla por una toma equivalente realizada desde el suelo con el mismo equipamiento, sin coste adicional; o (c) aceptar la cancelación de la partida, en cuyo caso se descontará del importe total el precio de la unidad aérea tal y como figura en el desglose técnico. La comunicación de esta situación se realizará con la mayor antelación posible y, en todo caso, antes del inicio de la cobertura.',
  'Exclusión de responsabilidad. Ícaro Studio no se hace responsable de la pérdida, deterioro o retraso del material filmado ni de las incidencias imputables a terceros, a causa de fuerza mayor o al material aportado por el cliente, salvo dolo o culpa grave.',
];

export function ProductionContractPdf({
  data,
}: {
  data: ProductionContractData;
}) {
  const visibleRows = data.rows.filter((row) => !shouldHideRow(row));
  const documentNumber =
    data.presupuestoNumero ?? buildDocumentNumber(data.presupuesto);
  const terms = data.terminos?.length ? data.terminos : DEFAULT_TERMS;

console.log('ProductionContractPdf: data', data);
  return (
    <Document
      title={`Contrato · ${data.nombre}`}
      author="Ícaro Studio"
      subject={`Desglose técnico y contrato — ${data.proyecto}`}
      keywords="contrato, presupuesto, fotografía, vídeo, Ícaro Studio"
      creator="Ícaro Studio"
    >
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerBand}>
          <View style={s.headerBandInner}>
            <View>
              <Text style={s.headerBrand}>ÍCARO STUDIO</Text>
              <Text style={s.headerTagline}>
                Producción audiovisual premium
              </Text>
            </View>
            <View style={s.headerMeta}>
              <Text style={s.headerMetaLabel}>Documento</Text>
              <Text style={s.headerMetaValue}>{documentNumber}</Text>
            </View>
          </View>
        </View>

        <View style={s.docTitleBlock}>
          <Text style={s.docTitle}>Desglose técnico y contrato</Text>
          <Text style={s.docSubtitle}>
            {data.proyecto} · {data.fecha}
          </Text>
        </View>

        {/* Datos del cliente */}
        <Text style={s.section}>Datos del cliente</Text>
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Cliente</Text>
            <Text style={s.infoValue}>{data.nombre}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Email</Text>
            <Text style={s.infoValue}>{data.email}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Teléfono</Text>
            <Text style={s.infoValue}>{data.telefono}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>{data.clienteTipoDocumento === 'passport' ? 'Pasaporte' : 'NIF'}</Text>
            <Text style={s.infoValue}>{data.clienteCif}</Text>
          </View>
        </View>

        {data.descipcionTrabajo ? (
          <>
            <Text style={s.section}>Descripción del trabajo</Text>
            <View style={s.briefBox} wrap={false}>
              <Text style={s.briefText}>{data.descipcionTrabajo}</Text>
            </View>
          </>
        ) : null}

        {/* Desglose técnico: partidas contratadas */}
        <Text style={s.section}>Desglose técnico</Text>
        <View style={s.table}>
          <View style={s.head} fixed>
            <Text style={s.c1}>Partida</Text>
            <Text style={s.c2}>Configuración</Text>
            <Text style={s.c3}>Importe</Text>
          </View>

          {visibleRows.length === 0 ? (
            <Text style={s.emptyTable}>
              No hay partidas con importe en este documento.
            </Text>
          ) : (
            visibleRows.map((row, index) => {
              const isLast = index === visibleRows.length - 1;

              const rowStyle = isLast
                ? s.rowLast
                : index % 2 === 1
                  ? s.rowAlt
                  : s.row;

              return (
                <View
                  key={`${row.label}-${index}`}
                  style={rowStyle}
                  wrap={false}
                >
                  <Text style={s.c1}>{row.label}</Text>
                  <Text style={s.c2}>{row.setup}</Text>
                  <Text style={s.c3}>{row.price}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Totales */}
        <View style={s.totalsWrap} wrap={false}>
          <View style={s.totalsBox}>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{data.subtotal}</Text>
            </View>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>IVA ({data.taxPercent} %)</Text>
              <Text style={s.totalValue}>{data.iva}</Text>
            </View>
            <View style={s.totalDivider} />
            <View style={s.totalGrand}>
              <Text style={s.totalGrandLabel}>Total</Text>
              <Text style={s.totalGrandValue}>{data.total}</Text>
            </View>
            <Text style={s.totalNote}>
              Presupuesto {data.presupuesto} · {documentNumber}
            </Text>
          </View>
        </View>

        {/* Términos y condiciones */}
        <Text style={s.sectionTerm} break>
          Términos y condiciones
        </Text>

        <View style={s.termsList}>
          {terms.map((term, index) => (
            <View key={index} style={s.termRow} wrap={false}>
              <Text style={s.termNumber}>{`${index + 1}.`}</Text>
              <Text style={s.termText}>{term}</Text>
            </View>
          ))}
        </View>

        <View style={s.noteBox} wrap={false}>
          <Text style={s.noteText}>
            Al firmar este documento, el cliente declara haber leído y aceptado
            en su totalidad el desglose técnico, los importes y las condiciones
            aquí recogidas.
          </Text>
        </View>

        {/* Firmas */}
        <View style={s.sign} wrap={false}>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Ícaro Studio</Text>
            <Text style={s.signHint}>Firma y sello</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>{data.nombre}</Text>
            <Text style={s.signHint}>Conformidad del cliente</Text>
          </View>
        </View>

        {/* Pie de página: se repite en todas las páginas */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Ícaro Studio · {documentNumber} · Presupuesto {data.presupuesto}
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              formatPageNumber(pageNumber, totalPages)
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export default ProductionContractPdf;
