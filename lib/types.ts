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
  contractPaymentTerms?: string;
  contractTerms?: string;
  contractAddress?: string;
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
  termsOfUse?: string;
  createdAt: Timestamp;
}
export interface Contract {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  contractorName: string;
  contractorAddress?: string;
  agreementTerms?: string;
  businessTerms?: string;
  productName: string;
  currency: string;
  amount: number;
  billingInterval: "monthly" | "quarterly" | "yearly" | "custom";
  customBillingFrequency: string;
  startDate: string;
  endDate: string;
  subscriptionDetails: string;
  paymentTerms: string;
  renewalTerms: string;
  termsOfUse: string;
  additionalTerms: string;
  extendsContractId: string;
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
  recurringGroupId?: string;
  createdAt: Timestamp;
}
export interface ClientProductLink {
  id: string;
  businessId: string;
  clientId: string;
  productId: string;
  amount: number;
  paymentDay: number;
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
  recurringGroupId?: string;
  recurringIndex?: number;
  recurringTotal?: number;
  createdAt: Timestamp;
}
