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
import { formatCurrency } from "./currency";
import { PdfStamp as Stamp } from "./pdf-stamp";
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
  receiptAmount: {
    marginTop: 32,
    padding: 24,
    borderRadius: 8,
    backgroundColor: "#c8f23d",
    alignItems: "center",
  },
  receiptAmountLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2,
  },
  receiptAmountValue: { fontSize: 28, fontWeight: 700, marginTop: 8 },
});

export function InvoiceDocument({
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
  const currency = business.currency || "USD";
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Stamp label={invoice.status === "Paid" ? "Paid invoice" : "Invoice"} />
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
            {client?.businessName ? (
              <Text style={{ marginTop: 4 }}>{client.businessName}</Text>
            ) : null}
            <Text style={s.muted}>{client?.email}</Text>
            <Text style={s.muted}>{client?.phone}</Text>
            <Text style={s.muted}>
              {client?.businessAddress || client?.address}
            </Text>
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
              <Text style={s.rate}>{formatCurrency(i.rate, currency)}</Text>
              <Text style={s.amount}>{formatCurrency(i.amount, currency)}</Text>
            </View>
          ))}
        </View>
        <View style={s.total}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(invoice.subtotal, currency)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Tax ({invoice.taxRate}%)</Text>
            <Text>
              {formatCurrency(invoice.totalAmount - invoice.subtotal, currency)}
            </Text>
          </View>
          <View style={[s.totalRow, s.grand]}>
            <Text>Total</Text>
            <Text>{formatCurrency(invoice.totalAmount, currency)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Paid</Text>
            <Text>{formatCurrency(invoice.amountPaid, currency)}</Text>
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
            <Text>{formatCurrency(invoice.balanceDue, currency)}</Text>
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
                  {format(t.paymentDate.toDate(), "dd MMM yyyy")} -{" "}
                  {t.paymentMethod}
                </Text>
                <Text>{formatCurrency(t.amount, currency)}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.footer}>Generated by Beez - {business.name}</Text>
      </Page>
    </Document>
  );
}

export function ReceiptDocument({
  invoice,
  business,
  client,
  transaction,
  balanceRemaining,
}: {
  invoice: Invoice;
  business: Business;
  client?: Client;
  transaction: PaymentTransaction;
  balanceRemaining?: number;
}) {
  const currency = business.currency || "USD";
  const remainingBalance = Math.max(0, balanceRemaining ?? invoice.balanceDue);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Stamp label="Payment received" />
        <View style={s.header}>
          <View>
            {business.logoUrl ? (
              <Image src={business.logoUrl} style={s.logo} />
            ) : null}
            <Text style={s.brand}>{business.name}</Text>
            <Text style={s.headerMuted}>Payment receipt</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text>RECEIPT</Text>
            <Text style={{ fontSize: 15, marginTop: 6 }}>
              {receiptNumber(transaction)}
            </Text>
          </View>
        </View>
        <View style={s.receiptAmount}>
          <Text style={s.receiptAmountLabel}>PAYMENT RECEIVED</Text>
          <Text style={s.receiptAmountValue}>
            {formatCurrency(transaction.amount, currency)}
          </Text>
        </View>
        <View style={[s.row, s.meta]}>
          <View>
            <Text style={s.muted}>RECEIVED FROM</Text>
            <Text style={{ fontSize: 12, marginTop: 6 }}>
              {client?.name || "Client"}
            </Text>
            {client?.businessName ? (
              <Text style={{ marginTop: 4 }}>{client.businessName}</Text>
            ) : null}
            <Text style={s.muted}>{client?.email}</Text>
            <Text style={s.muted}>{client?.phone}</Text>
          </View>
          <View style={{ width: 220 }}>
            <View style={s.totalRow}>
              <Text>Date</Text>
              <Text>
                {format(transaction.paymentDate.toDate(), "dd MMM yyyy")}
              </Text>
            </View>
            <View style={s.totalRow}>
              <Text>Invoice</Text>
              <Text>{invoice.invoiceNumber}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>Method</Text>
              <Text>{transaction.paymentMethod}</Text>
            </View>
            {transaction.reference ? (
              <View style={s.totalRow}>
                <Text>Reference</Text>
                <Text>{transaction.reference}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={[s.section, { width: 300, marginLeft: "auto" }]}>
          <View style={s.totalRow}>
            <Text>Invoice total</Text>
            <Text>{formatCurrency(invoice.totalAmount, currency)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>This payment</Text>
            <Text>{formatCurrency(transaction.amount, currency)}</Text>
          </View>
          <View style={[s.totalRow, s.grand]}>
            <Text>Balance remaining</Text>
            <Text>{formatCurrency(remainingBalance, currency)}</Text>
          </View>
        </View>
        <Text style={s.footer}>
          Receipt issued by {business.name} - Generated by Beez
        </Text>
      </Page>
    </Document>
  );
}

function receiptNumber(transaction: PaymentTransaction) {
  return `RCT-${transaction.id.slice(-8).toUpperCase()}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  downloadBlob(blob, `${invoice.invoiceNumber}.pdf`);
}

export async function downloadReceiptPdf(
  invoice: Invoice,
  business: Business,
  client: Client | undefined,
  transaction: PaymentTransaction,
  balanceRemaining?: number,
) {
  const blob = await pdf(
    <ReceiptDocument
      invoice={invoice}
      business={business}
      client={client}
      transaction={transaction}
      balanceRemaining={balanceRemaining}
    />,
  ).toBlob();
  downloadBlob(
    blob,
    `${receiptNumber(transaction)}-${invoice.invoiceNumber}.pdf`,
  );
}
