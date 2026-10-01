import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { requireFirebase } from "./firebase";
import type { ApiKey, Business, Client, Invoice, Product } from "./types";

// The key is the document ID of `apiKeys/{key}`. Firestore rules allow anyone
// to `get` a single key document but never to list the collection, so the key
// itself is the credential.
export function generateApiKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `bz_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function apiKeyBalanceUrl(key: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apiKeys/${key}`;
}

const round = (value: number) => Math.round(value * 100) / 100;

// Active balance = unpaid balance on every non-draft invoice for the client.
// The product balance is that product's share of each invoice's balance.
export function computeBalances(
  invoices: Invoice[],
  clientId: string,
  productId: string,
) {
  let balance = 0;
  let productBalance = 0;
  let openInvoices = 0;
  for (const invoice of invoices) {
    if (invoice.clientId !== clientId || invoice.status === "Draft") continue;
    const due = Number(invoice.balanceDue) || 0;
    if (due <= 0) continue;
    balance += due;
    openInvoices += 1;
    const itemsTotal = invoice.items.reduce((sum, i) => sum + i.amount, 0);
    const productTotal = invoice.items
      .filter((i) => i.productId === productId)
      .reduce((sum, i) => sum + i.amount, 0);
    if (itemsTotal > 0) productBalance += due * (productTotal / itemsTotal);
  }
  return {
    balance: round(balance),
    productBalance: round(productBalance),
    openInvoices,
  };
}

export async function createApiKey(input: {
  businessId: string;
  clientId: string;
  productId: string;
  clientProductId: string;
  clientName: string;
  productName: string;
  currency: string;
  invoices: Invoice[];
}) {
  const { db } = requireFirebase();
  const key = generateApiKey();
  const { invoices, ...rest } = input;
  await setDoc(doc(db, "apiKeys", key), {
    ...rest,
    ...computeBalances(invoices, input.clientId, input.productId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return key;
}

// Recomputes one key's balance from the given invoices and publishes it now.
export async function resyncApiKey(key: ApiKey, invoices: Invoice[]) {
  const { db } = requireFirebase();
  await updateDoc(doc(db, "apiKeys", key.id), {
    ...computeBalances(invoices, key.clientId, key.productId),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApiKey(key: string) {
  const { db } = requireFirebase();
  await deleteDoc(doc(db, "apiKeys", key));
}

// Pushes fresh balances onto any key whose published values are stale.
export async function syncApiKeyBalances(
  keys: ApiKey[],
  context: {
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    businesses: Business[];
  },
) {
  const { db } = requireFirebase();
  const batch = writeBatch(db);
  let changes = 0;
  for (const key of keys) {
    const next = {
      ...computeBalances(context.invoices, key.clientId, key.productId),
      clientName:
        context.clients.find((c) => c.id === key.clientId)?.name ||
        key.clientName,
      productName:
        context.products.find((p) => p.id === key.productId)?.name ||
        key.productName,
      currency:
        context.businesses.find((b) => b.id === key.businessId)?.currency ||
        key.currency,
    };
    const stale = (Object.keys(next) as (keyof typeof next)[]).some(
      (field) => next[field] !== key[field],
    );
    if (!stale) continue;
    batch.update(doc(db, "apiKeys", key.id), {
      ...next,
      updatedAt: serverTimestamp(),
    });
    changes += 1;
  }
  if (changes) await batch.commit();
}
