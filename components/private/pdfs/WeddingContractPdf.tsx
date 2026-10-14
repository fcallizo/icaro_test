import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type WeddingSheetLine = { label: string; amount: string };

export type WeddingSheetBlock = {
  title: string; // "Boda", "Preboda", "Postboda"
  fecha?: string;
  lugar?: string;
  detalles?: string;
  lines: WeddingSheetLine[];
};

export type WeddingSheetData = {
  nombre: string;
  email: string;
  fecha: string;
  telNovio: string;
  telNovia: string;
  pack: string;
  schedule: { label: string; place: string; time: string }[];
  detalles: string;
  blocks: WeddingSheetBlock[];
  discountPercent: string;
  subtotal: string;
  discount: string;
  total: string;
};

const GOLD = '#8c7533';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#181818', lineHeight: 1.4 },
  brand: { fontSize: 9, letterSpacing: 2, color: GOLD, marginBottom: 4 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 6 },
  section: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1pt solid #bbb',
  },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 110, color: '#666' },
  infoValue: { flex: 1 },
  head: { flexDirection: 'row', borderBottom: `1pt solid ${GOLD}`, paddingVertical: 6, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottom: '1pt solid #ddd', paddingVertical: 6 },
  s1: { width: '30%' },
  s2: { width: '50%', paddingRight: 8 },
  s3: { width: '20%', textAlign: 'right' },
  blockTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GOLD, marginTop: 12, marginBottom: 4 },
  blockMeta: { color: '#444', marginBottom: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1pt solid #ddd', paddingVertical: 5 },
  lineLabel: { flex: 1, paddingRight: 10 },
  lineAmount: { textAlign: 'right' },
  details: { marginTop: 4 },
  totals: { marginTop: 14, alignItems: 'flex-end' },
  totalLine: { marginBottom: 3 },
  total: { marginTop: 4, fontSize: 13, fontFamily: 'Helvetica-Bold' },
  sign: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%' },
  signLine: { borderBottom: '1pt solid #181818', height: 24, marginBottom: 4 },
  signLabel: { fontSize: 9, color: '#666' },
});

const dash = (value: string) => (value && value.trim() ? value : '—');

export function WeddingSheetPdf({ data }: { data: WeddingSheetData }) {
  return (
    <Document title={`Boda · ${data.nombre}`} author="Ícaro Studio">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>ÍCARO STUDIO</Text>
        <Text style={s.title}>Hoja de boda y contrato</Text>
        <Text style={s.subtitle}>{dash(data.nombre)}</Text>

        {/* Datos de contacto */}
        <Text style={s.section}>Datos de contacto</Text>
        {[
          ['Fecha de la boda', data.fecha],
          ['Email', data.email],
          ['Teléfono del novio', data.telNovio],
          ['Teléfono de la novia', data.telNovia],
          ['Servicio contratado', data.pack],
        ].map(([label, value]) => (
          <View key={label} style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{dash(value)}</Text>
          </View>
        ))}

        {data.detalles.trim() !== '' && (
          <>
            <Text style={s.section}>Detalles</Text>
            <Text>{data.detalles}</Text>
          </>
        )}

        {/* Servicios y presupuesto */}
        <Text style={s.section}>Servicios y presupuesto</Text>
        {data.blocks.map((block) => (
          <View key={block.title} wrap={false}>
            <Text style={s.blockTitle}>{block.title}</Text>
            {block.fecha !== undefined && <Text style={s.blockMeta}>Fecha: {dash(block.fecha)}</Text>}
            {block.lugar !== undefined && <Text style={s.blockMeta}>Lugar: {dash(block.lugar)}</Text>}
            {block.detalles && block.detalles.trim() !== '' && (
              <Text style={[s.blockMeta, s.details]}>Detalles: {block.detalles}</Text>
            )}
            {block.lines.map((line) => (
              <View key={line.label} style={s.line}>
                <Text style={s.lineLabel}>{line.label}</Text>
                <Text style={s.lineAmount}>{line.amount}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <Text style={s.totalLine}>Subtotal: {data.subtotal}</Text>
          <Text style={s.totalLine}>
            Descuento ({data.discountPercent} %): −{data.discount}
          </Text>
          <Text style={s.total}>Total del contrato: {data.total}</Text>
        </View>

        <View style={s.sign} wrap={false}>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Dirección de Ícaro Studio</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Conformidad de los novios</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
