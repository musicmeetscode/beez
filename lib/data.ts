import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { requireFirebase } from "./firebase";
import { nextOccurrence } from "./expenses";
import type {
  Business,
  Client,
  Expense,
  Invoice,
  PaymentTransaction,
  Product,
} from "./types";
const mapDoc = <T extends { id: string }>(d: {
  id: string;
  data(): DocumentData;
}) => ({ id: d.id, ...d.data() }) as T;
export async function ensureUser(uid: string, email: string) {
  const { db } = requireFirebase();
  const r = doc(db, "users", uid);
  if (!(await getDoc(r)).exists())
    await setDoc(r, { uid, email, createdAt: serverTimestamp() });
}
export function listenBusinesses(
  uid: string,
  next: (rows: Business[]) => void,
  error: (e: Error) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  return onSnapshot(
    query(collection(db, "businesses"), where("ownerUid", "==", uid)),
    (s) =>
      next(
        s.docs
          .map((d) => mapDoc<Business>(d))
          .sort(
            (a, b) =>
              timestampMillis(a.createdAt) - timestampMillis(b.createdAt),
          ),
      ),
    error,
  );
}
export function listenExpenses(
  ownerUid: string,
  next: (rows: Expense[]) => void,
  error: (e: Error) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  return onSnapshot(
    query(collection(db, "expenses"), where("ownerUid", "==", ownerUid)),
    (snapshot) =>
      next(
        snapshot.docs
          .map((document) => mapDoc<Expense>(document))
          .sort(
            (a, b) => timestampMillis(b.startsOn) - timestampMillis(a.startsOn),
          ),
      ),
    error,
  );
}
export function listenByBusiness<T extends { id: string }>(
  name: "clients" | "products" | "invoices" | "transactions",
  businessId: string,
  next: (rows: T[]) => void,
  error: (e: Error) => void,
): Unsubscribe {
  const { db } = requireFirebase();
  return onSnapshot(
    query(collection(db, name), where("businessId", "==", businessId)),
    (s) =>
      next(
        s.docs
          .map((d) => {
            const row = mapDoc<T>(d);
            return name === "invoices"
              ? (normalizeInvoice(row as unknown as Invoice) as unknown as T)
              : row;
          })
          .sort((a, b) => {
            const aData = a as DocumentData;
            const bData = b as DocumentData;
            const field = name === "transactions" ? "paymentDate" : "createdAt";
            return (
              timestampMillis(bData[field]) - timestampMillis(aData[field])
            );
          }),
      ),
    error,
  );
}

function timestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function normalizeInvoice(invoice: Invoice): Invoice {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        amount:
          Number(item.amount) ||
          (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      }))
    : [];
  const itemSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const storedSubtotal = Number(invoice.subtotal) || 0;
  const subtotal = storedSubtotal > 0 ? storedSubtotal : itemSubtotal;
  const taxRate = Number(invoice.taxRate) || 0;
  const calculatedTotal = subtotal * (1 + taxRate / 100);
  const storedTotal = Number(invoice.totalAmount) || 0;
  const totalAmount = storedTotal > 0 ? storedTotal : calculatedTotal;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const storedBalance = Number(invoice.balanceDue) || 0;
  const balanceDue =
    invoice.status === "Paid"
      ? 0
      : storedBalance > 0
        ? storedBalance
        : Math.max(0, totalAmount - amountPaid);
  return {
    ...invoice,
    items,
    subtotal,
    taxRate,
    totalAmount,
    amountPaid,
    balanceDue,
  };
}
export async function createBusiness(
  ownerUid: string,
  input: Pick<Business, "name" | "paymentInstructions"> & { currency?: string },
) {
  const { db } = requireFirebase();
  const r = doc(collection(db, "businesses"));
  await setDoc(r, {
    id: r.id,
    ownerUid,
    name: input.name,
    logoUrl: "",
    paymentInstructions: input.paymentInstructions,
    currency: input.currency || "USD",
    createdAt: serverTimestamp(),
  });
  return r;
}
export async function updateBusiness(
  id: string,
  input: Partial<
    Pick<Business, "name" | "paymentInstructions" | "logoUrl" | "currency">
  >,
) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "businesses", id), input);
}
export async function uploadBusinessLogo(businessId: string, file: File) {
  const { storage } = requireFirebase();
  const ext = file.name.split(".").pop() || "png";
  const objectRef = ref(storage, `businesses/${businessId}/logo.${ext}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}
export async function createClient(
  businessId: string,
  input: Omit<Client, "id" | "businessId" | "createdAt">,
) {
  const { db } = requireFirebase();
  const r = doc(collection(db, "clients"));
  await setDoc(r, {
    id: r.id,
    ...input,
    businessId,
    createdAt: serverTimestamp(),
  });
  return r;
}
export async function updateClient(
  id: string,
  input: Partial<
    Pick<
      Client,
      | "name"
      | "email"
      | "phone"
      | "address"
      | "businessName"
      | "businessAddress"
    >
  >,
) {
  const { db } = requireFirebase();
  return updateDoc(doc(db, "clients", id), input);
}
export async function createProduct(
  businessId: string,
  input: Omit<Product, "id" | "businessId" | "createdAt">,
) {
  const { db } = requireFirebase();
  const r = doc(collection(db, "products"));
  await setDoc(r, {
    id: r.id,
    ...input,
    businessId,
    createdAt: serverTimestamp(),
  });
  return r;
}
export async function createInvoice(
  businessId: string,
  input: Omit<Invoice, "id" | "businessId" | "createdAt">,
) {
  const { db } = requireFirebase();
  const r = doc(collection(db, "invoices"));
  await setDoc(r, {
    id: r.id,
    ...input,
    businessId,
    createdAt: serverTimestamp(),
  });
  return r;
}
export async function createExpense(
  ownerUid: string,
  input: Omit<Expense, "id" | "ownerUid" | "createdAt">,
) {
  const { db } = requireFirebase();
  const expenseRef = doc(collection(db, "expenses"));
  await setDoc(expenseRef, {
    id: expenseRef.id,
    ownerUid,
    ...input,
    createdAt: serverTimestamp(),
  });
  return expenseRef;
}

export async function createRecurringExpenseSeries(
  ownerUid: string,
  input: Omit<Expense, "id" | "ownerUid" | "createdAt">,
  occurrences: number,
) {
  const { db } = requireFirebase();
  const batch = writeBatch(db);
  const groupId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let currentDate = input.startsOn.toDate();

  const count = Math.max(1, Math.min(occurrences, 60));
  for (let i = 0; i < count; i++) {
    const expenseRef = doc(collection(db, "expenses"));
    batch.set(expenseRef, {
      id: expenseRef.id,
      ownerUid,
      ...input,
      startsOn: Timestamp.fromDate(new Date(currentDate)),
      isRecurring: false,
      recurringInterval: input.recurringInterval,
      recurringGroupId: groupId,
      recurringIndex: i + 1,
      recurringTotal: count,
      createdAt: serverTimestamp(),
    });
    if (input.recurringInterval) {
      currentDate = nextOccurrence(currentDate, input.recurringInterval);
    }
  }

  await batch.commit();
  return groupId;
}

export async function deleteExpense(
  id: string,
  recurringGroupId?: string,
  deleteAllInSeries: boolean = false,
) {
  const { db } = requireFirebase();
  if (deleteAllInSeries && recurringGroupId) {
    const q = query(
      collection(db, "expenses"),
      where("recurringGroupId", "==", recurringGroupId),
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } else {
    await deleteDoc(doc(db, "expenses", id));
  }
}

export async function generateMissingRecurringRecords(
  ownerUid: string,
  legacyExpense: Expense,
  totalOccurrences: number = 12,
) {
  if (!legacyExpense.recurringInterval) return;
  const { db } = requireFirebase();
  const groupId =
    legacyExpense.recurringGroupId ||
    `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const batch = writeBatch(db);

  // Update legacy record to be index 1 in series
  batch.update(doc(db, "expenses", legacyExpense.id), {
    isRecurring: false,
    recurringGroupId: groupId,
    recurringIndex: 1,
    recurringTotal: totalOccurrences,
  });

  let currentDate = legacyExpense.startsOn.toDate();
  for (let i = 1; i < totalOccurrences; i++) {
    currentDate = nextOccurrence(currentDate, legacyExpense.recurringInterval);
    const expenseRef = doc(collection(db, "expenses"));
    batch.set(expenseRef, {
      id: expenseRef.id,
      ownerUid,
      name: legacyExpense.name,
      category: legacyExpense.category,
      amount: legacyExpense.amount,
      currency: legacyExpense.currency,
      startsOn: Timestamp.fromDate(new Date(currentDate)),
      isRecurring: false,
      recurringInterval: legacyExpense.recurringInterval,
      recurringGroupId: groupId,
      recurringIndex: i + 1,
      recurringTotal: totalOccurrences,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
export async function recordPayment(
  invoice: Invoice,
  input: {
    amount: number;
    paymentMethod: string;
    reference: string;
    paymentDate: Date;
  },
) {
  const { db } = requireFirebase();
  const invoiceRef = doc(db, "invoices", invoice.id);
  const paymentRef = doc(collection(db, "transactions"));
  const paymentDate = Timestamp.fromDate(input.paymentDate);
  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(invoiceRef);
    if (!fresh.exists()) throw new Error("Invoice no longer exists.");
    const current = normalizeInvoice({
      id: fresh.id,
      ...fresh.data(),
    } as Invoice);
    if (input.amount <= 0 || input.amount > current.balanceDue)
      throw new Error(
        "Payment must be greater than zero and no more than the balance due.",
      );
    const amountPaid = current.amountPaid + input.amount;
    const balanceDue = Math.max(0, current.totalAmount - amountPaid);
    tx.set(paymentRef, {
      id: paymentRef.id,
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      paymentDate,
    });
    tx.update(invoiceRef, {
      amountPaid,
      balanceDue,
      status: balanceDue === 0 ? "Paid" : "Partial",
    });
  });
  return {
    id: paymentRef.id,
    businessId: invoice.businessId,
    invoiceId: invoice.id,
    clientId: invoice.clientId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    reference: input.reference,
    paymentDate,
  } satisfies PaymentTransaction;
}
