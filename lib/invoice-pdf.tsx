import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import type { Business, Client, Invoice, PaymentTransaction } from "./types";
const s = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", fontSize: 9, color: "#20251f" },
  header: {
    backgroundColor: "#171d20",
    color: "#fff",
    padding: 22,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: { width: 42, height: 42, objectFit: "contain", marginBottom: 8 },
  brand: { fontSize: 18, fontWeight: 700 },
  muted: { color: "#768079", marginTop: 4 },
  headerMuted: { color: "#bac2c1", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  meta: { paddingVertical: 22, borderBottom: "1 solid #e1e5de" },
  title: { fontSize: 22, fontWeight: 700 },
  section: { marginTop: 24 },
  th: {
    flexDirection: "row",
    backgroundColor: "#f1f3ee",
    padding: 9,
    fontWeight: 700,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderBottom: "1 solid #e7eae4",
  },
  desc: { width: "50%" },
  qty: { width: "15%", textAlign: "right" },
  rate: { width: "17.5%", textAlign: "right" },
  amount: { width: "17.5%", textAlign: "right" },
  total: { marginLeft: "auto", marginTop: 18, width: 220 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  grand: {
    fontSize: 13,
    fontWeight: 700,
    borderTop: "1 solid #cbd0c7",
    paddingTop: 8,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 30,
    borderTop: "1 solid #e1e5de",
    paddingTop: 10,
    color: "#768079",
  },
});
function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
function InvoiceDocument({
  invoice,
  business,
  client,
  transactions,
}: {
  invoice: Invoice;
  business: Business;
  client?: Client;
  transactions: PaymentTransaction[];
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {business.logoUrl ? (
              <Image src={business.logoUrl} style={s.logo} />
            ) : null}
            <Text style={s.brand}>{business.name}</Text>
            <Text style={s.headerMuted}>{business.paymentInstructions}</Text>
          </View>
          <View>
            <Text>INVOICE</Text>
            <Text style={{ fontSize: 15, marginTop: 6 }}>
              {invoice.invoiceNumber}
            </Text>
          </View>
        </View>
        <View style={[s.row, s.meta]}>
          <View>
            <Text style={s.muted}>BILLED TO</Text>
            <Text style={{ fontSize: 12, marginTop: 6 }}>
              {client?.name || "Client"}
            </Text>
            <Text style={s.muted}>{client?.email}</Text>
            <Text style={s.muted}>{client?.address}</Text>
          </View>
          <View>
            <Text>
              Issued: {format(invoice.issueDate.toDate(), "dd MMM yyyy")}
            </Text>
            <Text style={{ marginTop: 6 }}>
              Due: {format(invoice.dueDate.toDate(), "dd MMM yyyy")}
            </Text>
            <Text style={{ marginTop: 6 }}>Status: {invoice.status}</Text>
          </View>
        </View>
        <View style={s.section}>
          <View style={s.th}>
            <Text style={s.desc}>Description</Text>
            <Text style={s.qty}>Qty</Text>
            <Text style={s.rate}>Rate</Text>
            <Text style={s.amount}>Amount</Text>
          </View>
          {invoice.items.map((i, n) => (
            <View key={n} style={s.tr}>
              <Text style={s.desc}>{i.description}</Text>
              <Text style={s.qty}>{i.quantity}</Text>
              <Text style={s.rate}>{money(i.rate)}</Text>
              <Text style={s.amount}>{money(i.amount)}</Text>
            </View>
          ))}
        </View>
        <View style={s.total}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(invoice.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Tax ({invoice.taxRate}%)</Text>
            <Text>{money(invoice.totalAmount - invoice.subtotal)}</Text>
          </View>
          <View style={[s.totalRow, s.grand]}>
            <Text>Total</Text>
            <Text>{money(invoice.totalAmount)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Paid</Text>
            <Text>{money(invoice.amountPaid)}</Text>
          </View>
          <View
            style={[
              s.totalRow,
              {
                backgroundColor: "#c8f23d",
                padding: 8,
                marginTop: 4,
                fontWeight: 700,
              },
            ]}
          >
            <Text>Balance due</Text>
            <Text>{money(invoice.balanceDue)}</Text>
          </View>
        </View>
        {transactions.length > 0 && (
          <View style={s.section}>
            <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Payment history
            </Text>
            {transactions.map((t) => (
              <View key={t.id} style={s.totalRow}>
                <Text>
                  {format(t.paymentDate.toDate(), "dd MMM yyyy")} ·{" "}
                  {t.paymentMethod}
                </Text>
                <Text>{money(t.amount)}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.footer}>Generated by Ledgerly · {business.name}</Text>
      </Page>
    </Document>
  );
}
export async function downloadInvoicePdf(
  invoice: Invoice,
  business: Business,
  client: Client | undefined,
  transactions: PaymentTransaction[],
) {
  const blob = await pdf(
    <InvoiceDocument
      invoice={invoice}
      business={business}
      client={client}
      transactions={transactions}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoiceNumber}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
