import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { requireFirebase } from "./firebase";
import type { Business, Client, Invoice, Product } from "./types";
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
          .sort((a, b) => timestampMillis(a.createdAt) - timestampMillis(b.createdAt)),
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
        s.docs.map((d) => mapDoc<T>(d)).sort((a, b) => {
          const aData = a as DocumentData;
          const bData = b as DocumentData;
          const field = name === "transactions" ? "paymentDate" : "createdAt";
          return timestampMillis(bData[field]) - timestampMillis(aData[field]);
        }),
      ),
    error,
  );
}

function timestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}
export async function createBusiness(
  ownerUid: string,
  input: Pick<Business, "name" | "paymentInstructions">,
) {
  const { db } = requireFirebase();
  const r = doc(collection(db, "businesses"));
  await setDoc(r, {
    id: r.id,
    ownerUid,
    name: input.name,
    logoUrl: "",
    paymentInstructions: input.paymentInstructions,
    createdAt: serverTimestamp(),
  });
  return r;
}
export async function updateBusiness(
  id: string,
  input: Partial<Pick<Business, "name" | "paymentInstructions" | "logoUrl">>,
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
  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(invoiceRef);
    if (!fresh.exists()) throw new Error("Invoice no longer exists.");
    const current = fresh.data() as Invoice;
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
      paymentDate: Timestamp.fromDate(input.paymentDate),
    });
    tx.update(invoiceRef, {
      amountPaid,
      balanceDue,
      status: balanceDue === 0 ? "Paid" : "Partial",
    });
  });
  return paymentRef.id;
}
