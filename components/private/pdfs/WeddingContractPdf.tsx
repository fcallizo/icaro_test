import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { GOLD, INK, LINE, MUTED, SOFT } from '@/lib/properties';
import { WeddingSheetBlock, WeddingSheetData, WeddingSheetLine } from '@/lib/wedding-form';


/* ==========================================================================
 * Hoja de boda y contrato — Ícaro Studio
 * --------------------------------------------------------------------------
 * Comparte identidad visual con el contrato de producción:
 *   · Banda de marca oscura con el nº de documento.
 *   · Secciones con filete dorado y versalitas.
 *   · Recuadros con borde fino, zebra striping y recuadro de totales.
 *   · Términos y condiciones, firmas y pie con paginación.
 *
 * Estructura:
 *   1. Cabecera de marca + nº de documento.
 *   2. Datos de contacto.
 *   3. Detalles de la celebración.
 *   4. Servicios y presupuesto (bloques Boda / Preboda / Postboda).
 *   5. Totales.
 *   6. Términos y condiciones.
 *   7. Firmas y pie.
 * ======================================================================== */

/* --- Helpers ------------------------------------------------------------- */

/** Devuelve el valor o un guion si está vacío. */
function dash(value?: string | null): string {
  return value && value.trim() ? value : '—';
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

  /* --- Datos de contacto ------------------------------------------------- */

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

  /* --- Cronograma -------------------------------------------------------- */

  scheduleBox: {
    border: `0.5pt solid ${LINE}`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scheduleHead: {
    flexDirection: 'row',
    backgroundColor: SOFT,
    borderBottom: `1pt solid ${GOLD}`,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontFamily: 'Helvetica-Bold',
  },
  scheduleRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  scheduleRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#fbfbfc',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  scheduleRowLast: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sc1: { width: '34%', paddingRight: 10, fontFamily: 'Helvetica-Bold' },
  sc2: { width: '46%', paddingRight: 10 },
  sc3: { width: '20%', textAlign: 'right' },
  emptySchedule: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: MUTED,
    fontSize: 9,
    fontStyle: 'italic',
  },

  /* --- Detalles ---------------------------------------------------------- */

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

  /* --- Bloques de servicios ---------------------------------------------- */

  block: {
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 4,
    borderBottom: `0.75pt solid ${GOLD}`,
    marginBottom: 6,
  },
  blockTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: INK,
    letterSpacing: 0.4,
  },
  blockMeta: {
    color: MUTED,
    fontSize: 8,
    marginTop: 2,
  },
  blockDate: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: GOLD,
  },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: `0.5pt solid ${LINE}`,
    paddingVertical: 5,
  },
  lineLabel: { flex: 1, paddingRight: 10, fontSize: 9 },
  lineAmount: { textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  blockDetails: {
    marginTop: 5,
    fontSize: 8.5,
    color: '#3f3f46',
    lineHeight: 1.45,
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
  'Objeto del contrato. Este documento recoge el detalle técnico y económico de los servicios contratados para la celebración del evento indicado, así como las condiciones de contratación, entrega y pago.',
  'Presupuesto y vigencia. Los importes indicados constituyen un presupuesto cerrado y vinculante durante 30 días naturales desde su emisión. Cualquier modificación del alcance requerirá un presupuesto adicional firmado por ambas partes.',
  'Forma de pago. El 50 % se abonará en el momento de la confirmación de la reserva y el 50 % restante antes del inicio de la cobertura. Los métodos de pago aceptados se acordarán con los novios.',
  'Plazos de entrega. El plazo estimado de entrega del material editado se indica en el apartado correspondiente y cuenta desde la fecha de la sesión. Los retrasos imputables a la no entrega de material o a la falta de aprobaciones ampliarán dicho plazo de forma proporcional.',
  'Reservas y cancelación. La reserva de fecha se mantiene mediante el anticipo. Las cancelaciones con más de 30 días de antelación se devuelven íntegramente; las realizadas con menos de 15 días no se reembolsan y el anticipo abonado se descuenta del importe pendiente. Las cancelaciones entre 15 y 30 días devuelven el 50 % del importe.',
  'Equipamiento de trabajo. El material y el equipamiento con el que se ejecuta la cobertura son de propiedad de Ícaro Studio. Este material no constituye una partida facturable ni se encuentra a la venta: forma parte del servicio contratado. La custodia, la calidad y el resultado final dependen del uso de dicho equipamiento en las condiciones profesionales habituales.',
  'Material aportado por los novios. Cuando los novios aporten material propio, Ícaro Studio custodiará dicho material hasta su entrega o montaje. No se ofrece garantía sobre el material aportado por el cliente y no se responde por su pérdida o deterioro salvo dolo o culpa grave.',
  'Propiedad intelectual. Los novios adquieren la plena propiedad de las imágenes y vídeos entregados una vez abonado el importe total. Hasta ese momento, Ícaro Studio conserva los derechos de uso sobre el material pendiente de pago.',
  'Uso y publicación del material. Los novios autorizan expresamente a Ícaro Studio a utilizar, publicar y difundir las imágenes y vídeos resultantes del proyecto —incluidos fragmentos destacados— en su página web, redes sociales, portfolio y cualquier canal comercial propio o de terceros, tanto antes como después de la entrega del material. Esta autorización es irrevocable y se considera concedida con la firma de este documento.',
  'Unidad aérea (dron). Cuando el presupuesto incluya una toma aérea con dron, su ejecución queda condicionada a las condiciones meteorológicas, al espacio aéreo disponible, a la normativa vigente y a la ausencia de restricciones por parte de la autoridad competente o de los propietarios del lugar. Si la unidad aérea no pudiera realizarse por condiciones climatológicas adversas, viento, lluvia, niebla, falta de permisos, restricciones de espacio aéreo o cualquier otra causa ajena a la voluntad de Ícaro Studio, se ofrecerán a los novios las siguientes opciones, a elección de estos: (a) realizar la toma aérea en otra fecha, antes o después de la fecha del evento, sin coste adicional; (b) sustituirla por una toma equivalente realizada desde el suelo con el mismo equipamiento, sin coste adicional; o (c) aceptar la cancelación de la partida, en cuyo caso se descontará del importe total el precio de la unidad aérea tal y como figura en el desglose. La comunicación de esta situación se realizará con la mayor antelación posible y, en todo caso, antes del inicio de la cobertura.',
  'Exclusión de responsabilidad. Ícaro Studio no se hace responsable de la pérdida, deterioro o retraso del material filmado ni de las incidencias imputables a terceros, a causa de fuerza mayor o al material aportado por los novios, salvo dolo o culpa grave.',
];

/* --- Sub-componentes ------------------------------------------------------ */

function ScheduleTable({
  schedule,
}: {
  schedule: WeddingSheetData['schedule'];
}) {
  if (schedule.length === 0) {
    return <Text style={s.emptySchedule}>No se ha indicado cronograma.</Text>;
  }

  return (
    <View style={s.scheduleBox}>
      <View style={s.scheduleHead} fixed>
        <Text style={s.sc1}>Momento</Text>
        <Text style={s.sc2}>Lugar</Text>
        <Text style={s.sc3}>Hora</Text>
      </View>

      {schedule.map((item, index) => {
        const isLast = index === schedule.length - 1;

        const rowStyle = isLast
          ? s.scheduleRowLast
          : index % 2 === 1
            ? s.scheduleRowAlt
            : s.scheduleRow;

        return (
          <View key={`${item.label}-${index}`} style={rowStyle} wrap={false}>
            <Text style={s.sc1}>{dash(item.label)}</Text>
            <Text style={s.sc2}>{dash(item.place)}</Text>
            <Text style={s.sc3}>{dash(item.time)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ServiceBlock({ block }: { block: WeddingSheetBlock }) {
  const lines: WeddingSheetLine[] = block.lines ?? [];

  return (
    <View style={s.block} wrap={false}>
      <View style={s.blockHeader}>
        <View>
          <Text style={s.blockTitle}>{block.title}</Text>
        </View>
        {block.fecha ? <Text style={s.blockDate}>{block.fecha}</Text> : null}
      </View>

      {block.detalles && block.detalles.trim() !== '' ? (
        <Text style={s.blockDetails}>{block.detalles}</Text>
      ) : null}

      {lines.length === 0 ? (
        <Text style={s.emptySchedule}>Sin partidas en este bloque.</Text>
      ) : (
        lines.map((line, index) => (
          <View key={`${line.label}-${index}`} style={s.line}>
            <Text style={s.lineLabel}>{dash(line.label)}</Text>
            <Text style={s.lineAmount}>{dash(line.amount)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

/* --- Componente ----------------------------------------------------------- */

export function WeddingSheetPdf({ data }: { data: WeddingSheetData }) {
  const documentNumber = data.presupuestoNumero ?? '—';
  const terms = DEFAULT_TERMS;

  return (
    <Document
      title={`Boda · ${data.nombre}`}
      author="Ícaro Studio"
      subject={`Hoja de boda y contrato — ${data.nombre}`}
      keywords="boda, contrato, presupuesto, fotografía, vídeo, Ícaro Studio"
      creator="Ícaro Studio"
    >
      <Page size="A4" style={s.page} wrap>
        {/* Cabecera de marca */}
        <View style={s.headerBand}>
          <View style={s.headerBandInner}>
            <View>
              <Text style={s.headerBrand}>ÍCARO STUDIO</Text>
              <Text style={s.headerTagline}>Producción audiovisual premium</Text>
            </View>
            <View style={s.headerMeta}>
              <Text style={s.headerMetaLabel}>Documento</Text>
              <Text style={s.headerMetaValue}>{documentNumber}</Text>
            </View>
          </View>
        </View>

        <View style={s.docTitleBlock}>
          <Text style={s.docTitle}>Hoja de boda y contrato</Text>
          <Text style={s.docSubtitle}>
            {dash(data.nombre)} · {dash(data.fecha)}
          </Text>
        </View>

        {/* Datos de contacto */}
        <Text style={s.section}>Datos de contacto</Text>
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Novios</Text>
            <Text style={s.infoValue}>{dash(data.nombre)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Email</Text>
            <Text style={s.infoValue}>{dash(data.email)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Teléfonos de contacto</Text>
            <Text style={s.infoValue}>{dash(data.telNovio)} / {dash(data.telNovia)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Servicio contratado</Text>
            <Text style={s.infoValue}>{dash(data.pack)}</Text>
          </View>
          {data.documentoIdentidad ? (
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>
                {data.tipoDocumentoIdentidad === 'passport'
                  ? 'Pasaporte'
                  : 'NIF'}
              </Text>
              <Text style={s.infoValue}>{data.documentoIdentidad}</Text>
            </View>
          ) : null}
        </View>

        {/* Detalles */}
        {data.detalles && data.detalles.trim() !== '' ? (
          <>
            <Text style={s.section}>Detalles de la celebración</Text>
            <View style={s.briefBox} wrap={false}>
              <Text style={s.briefText}>{data.detalles}</Text>
            </View>
          </>
        ) : null}

        {/* Servicios y presupuesto */}
        <Text style={s.section}>Servicios y presupuesto</Text>
        {data.blocks.length === 0 ? (
          <Text style={s.emptySchedule}>
            No hay partidas registradas en este documento.
          </Text>
        ) : (
          data.blocks.map((block, index) => (
            <ServiceBlock
              key={`${block.title}-${index}`}
              block={block}
            />
          ))
        )}

        {/* Totales */}
        <View style={s.totalsWrap} wrap={false}>
          <View style={s.totalsBox}>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{dash(data.subtotal)}</Text>
            </View>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>
                Descuento ({dash(data.discountPercent)} %)
              </Text>
              <Text style={s.totalValue}>−{dash(data.discount)}</Text>
            </View>
            <View style={s.totalDivider} />
            <View style={s.totalGrand}>
              <Text style={s.totalGrandLabel}>Total del contrato</Text>
              <Text style={s.totalGrandValue}>{dash(data.total)}</Text>
            </View>
            <Text style={s.totalNote}>
              Hoja de boda · {documentNumber}
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
            Al firmar este documento, los novios declaran haber leído y aceptado
            en su totalidad el desglose, los importes y las condiciones aquí
            recogidas.
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
            <Text style={s.signLabel}>{dash(data.nombre)}</Text>
            <Text style={s.signHint}>Conformidad de los novios</Text>
          </View>
        </View>

        {/* Pie de página */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Ícaro Studio · {documentNumber} · Boda {dash(data.nombre)}
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

export default WeddingSheetPdf;
