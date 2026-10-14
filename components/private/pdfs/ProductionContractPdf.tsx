import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type ProductionContractData = {
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  proyecto: string;
  presupuesto: string;
  rows: { label: string; setup: string; price: string }[];
  taxPercent: string;
  subtotal: string;
  iva: string;
  total: string;
};

const GOLD = '#8c7533';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#181818', lineHeight: 1.4 },
  brand: { fontSize: 9, letterSpacing: 2, color: GOLD, marginBottom: 4 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 16 },
  section: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 8, paddingBottom: 4, borderBottom: '1pt solid #bbb' },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 110, color: '#666' },
  infoValue: { flex: 1 },
  head: { flexDirection: 'row', borderBottom: `1pt solid ${GOLD}`, paddingVertical: 6, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottom: '1pt solid #ddd', paddingVertical: 6 },
  c1: { width: '30%' },
  c2: { width: '50%', paddingRight: 8 },
  c3: { width: '20%', textAlign: 'right' },
  totals: { marginTop: 14, alignItems: 'flex-end' },
  totalLine: { marginBottom: 3 },
  total: { marginTop: 4, fontSize: 13, fontFamily: 'Helvetica-Bold' },
  sign: { marginTop: 70, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%' },
  signLine: { borderBottom: '1pt solid #181818', height: 24, marginBottom: 4 },
  signLabel: { fontSize: 9, color: '#666' },
});

export function ProductionContractPdf({ data }: { data: ProductionContractData }) {
  return (
    <Document title={`Contrato · ${data.nombre}`} author="Ícaro Studio">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>ÍCARO STUDIO</Text>
        <Text style={s.title}>Desglose técnico y contrato</Text>

        <Text style={s.section}>Datos del cliente</Text>
        {[
          ['Cliente', data.nombre],
          ['Email', data.email],
          ['Teléfono', data.telefono],
          ['Fecha', data.fecha],
        ].map(([label, value]) => (
          <View key={label} style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
          </View>
        ))}

        <Text style={s.section}>Desglose técnico</Text>
        <View style={s.head}>
          <Text style={s.c1}>Partida</Text>
          <Text style={s.c2}>Configuración</Text>
          <Text style={s.c3}>Importe</Text>
        </View>
        {data.rows.map((r) => (
          <View key={r.label} style={s.row} wrap={false}>
            <Text style={s.c1}>{r.label}</Text>
            <Text style={s.c2}>{r.setup}</Text>
            <Text style={s.c3}>{r.price}</Text>
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <Text style={s.totalLine}>Subtotal: {data.subtotal}</Text>
          <Text style={s.totalLine}>IVA ({data.taxPercent} %): {data.iva}</Text>
          <Text style={s.total}>Total de contrato: {data.total}</Text>
        </View>

        <View style={s.sign} wrap={false}>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Dirección de Ícaro Studio</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Conformidad del cliente</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}