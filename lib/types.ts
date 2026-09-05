import type { Timestamp } from "firebase/firestore";
export type InvoiceStatus = "Draft" | "Sent" | "Partial" | "Paid";
export type RecurringInterval = "weekly" | "monthly" | "yearly" | null;
export interface AppUser {
  uid: string;
  email: string;
  createdAt: Timestamp;
}
export interface Business {
  id: string;
  ownerUid: string;
  name: string;
  logoUrl: string;
  paymentInstructions: string;
  currency: string;
  createdAt: Timestamp;
}
export interface Client {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  businessAddress: string;
  createdAt: Timestamp;
}
export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  rate: number;
  createdAt: Timestamp;
}
export interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}
export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  issueDate: Timestamp;
  dueDate: Timestamp;
  isRecurring: boolean;
  recurringInterval: RecurringInterval;
  createdAt: Timestamp;
}
export interface PaymentTransaction {
  id: string;
  businessId: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  paymentDate: Timestamp;
}
export interface Expense {
  id: string;
  ownerUid: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  startsOn: Timestamp;
  isRecurring: boolean;
  recurringInterval: RecurringInterval;
  createdAt: Timestamp;
}
