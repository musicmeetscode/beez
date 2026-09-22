"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Plus,
  Phone,
  Receipt,
  Search,
  Settings,
  TrendingDown,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useBusiness } from "@/contexts/business-context";
import { useBusinessCollection } from "@/hooks/use-business-collection";
import { useExpenses } from "@/hooks/use-expenses";
import { useCurrencyExchange } from "@/contexts/currency-context";
import { formatCurrency } from "@/lib/currency";
import type {
  Business,
  Client,
  ClientProductLink,
  Expense,
  Invoice,
  PaymentTransaction,
  Product,
} from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { EmptyState } from "./empty-state";
import {
  ClientDialog,
  EditClientDialog,
  ProductDialog,
} from "./entity-dialogs";
import { InvoiceComposer } from "./invoice-composer";
import { InvoiceDetail } from "./invoice-detail";
import { downloadReceiptPdf } from "@/lib/invoice-pdf";
import { deleteInvoice } from "@/lib/data";
import { materializeDueRecurringInvoices } from "@/lib/invoices";
import { ClientProductsCard } from "./client-products";
import { SettingsView } from "./settings-view";
import { ExpensesView } from "./expenses-view";
import { FinancialChart } from "./financial-chart";
import { ContractsView } from "./contracts-view";
type View =
  | "dashboard"
  | "invoices"
  | "contracts"
  | "clients"
  | "products"
  | "expenses"
  | "settings";
const nav = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices" as const, label: "Invoices", icon: FileText },
  { id: "contracts" as const, label: "Contracts", icon: FilePlus2 },
  { id: "clients" as const, label: "Clients", icon: Users },
  { id: "products" as const, label: "Products", icon: Package },
  { id: "expenses" as const, label: "Expenses", icon: TrendingDown },
  { id: "settings" as const, label: "Settings", icon: Settings },
];
export function Workspace() {
  const { logout, user } = useAuth();
  const userName = user?.displayName || nameFromEmail(user?.email);
  const {
    businesses,
    activeBusinessId,
    setActiveBusinessId,
    activeBusiness,
    error: businessError,
  } = useBusiness();
  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
  } = useBusinessCollection<Client>("clients");
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
  } = useBusinessCollection<Product>("products");
  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useBusinessCollection<Invoice>("invoices");
  const { data: clientProducts, error: clientProductsError } =
    useBusinessCollection<ClientProductLink>("clientProducts");
  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useBusinessCollection<PaymentTransaction>("transactions");
  const {
    data: expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();
  const dataError =
    businessError ||
    clientsError ||
    productsError ||
    invoicesError ||
    clientProductsError ||
    transactionsError ||
    expensesError;
  const [view, setView] = useState<View>("dashboard");
  const [mobile, setMobile] = useState(false);
  const [composer, setComposer] = useState(false);
  const [composerClientId, setComposerClientId] = useState<string>();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [prefillItem, setPrefillItem] = useState<
    | {
        productId: string;
        description: string;
        quantity: number;
        rate: number;
        issueDate?: string;
        dueDate?: string;
      }
    | undefined
  >();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contractClientId, setContractClientId] = useState("");
  const selectedClient = clients.find(
    (client) => client.id === selectedClientId,
  );
  const isAllBusinesses = activeBusinessId === "all";
  const targetCurrency = isAllBusinesses
    ? businesses[0]?.currency || "USD"
    : activeBusiness?.currency || "USD";
  const go = (v: View) => {
    setView(v);
    setMobile(false);
    setSelected(null);
    setSelectedClientId("");
    setContractClientId("");
  };
  const openComposer = (clientId?: string) => {
    setComposerClientId(clientId);
    setEditingInvoice(null);
    setPrefillItem(undefined);
    setComposer(true);
  };
  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setPrefillItem(undefined);
    setComposer(true);
  };
  const openGenerateInvoice = (
    clientId: string,
    link: ClientProductLink,
    product: Product,
  ) => {
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth(), link.paymentDay);
    if (due < today) due.setMonth(due.getMonth() + 1);
    const issue = new Date(due);
    issue.setDate(issue.getDate() - 14);
    setPrefillItem({
      productId: product.id,
      description: product.description,
      quantity: 1,
      rate: link.amount,
      issueDate: issue.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
    });
    setEditingInvoice(null);
    setComposerClientId(clientId);
    setComposer(true);
  };
  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await deleteInvoice(invoice.id);
      toast.success(`${invoice.invoiceNumber} deleted`);
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete invoice");
    }
  };
  const materializedRef = useRef(false);
  useEffect(() => {
    materializedRef.current = false;
  }, [activeBusinessId]);
  useEffect(() => {
    if (invoicesLoading || materializedRef.current || !invoices.length)
      return;
    materializedRef.current = true;
    materializeDueRecurringInvoices(invoices).catch(() => {
      materializedRef.current = false;
    });
  }, [invoicesLoading, invoices, activeBusinessId]);
  return (
    <div className="min-h-screen bg-[var(--background)] lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[var(--border)] bg-[var(--dark)] p-5 text-white lg:flex">
        <Brand />
        <nav className="mt-10 space-y-1">
          {nav.map((n) => (
            <NavButton
              key={n.id}
              item={n}
              active={view === n.id}
              onClick={() => go(n.id)}
            />
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl bg-white/6 p-4">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="mt-1 text-xs text-[#9ca5a6]">Signed in</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-[#c5cdce] hover:bg-white/8 hover:text-white"
            onClick={logout}
          >
            <LogOut size={17} />
            Sign out
          </Button>
        </div>
      </aside>
      {mobile && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobile(false)}
        >
          <aside
            className="h-full w-[82%] max-w-[300px] bg-[var(--dark)] p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                aria-label="Close navigation"
                onClick={() => setMobile(false)}
              >
                <X />
              </button>
            </div>
            <nav className="mt-10 space-y-1">
              {nav.map((n) => (
                <NavButton
                  key={n.id}
                  item={n}
                  active={view === n.id}
                  onClick={() => go(n.id)}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}
      <main className="min-w-0 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-[var(--border)] bg-[rgba(246,247,244,.92)] px-4 backdrop-blur-xl md:px-8">
          <button
            className="focus-ring rounded-xl p-2 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-[var(--foreground)]">
              {isAllBusinesses ? "All businesses" : activeBusiness?.name}
            </p>
            <h1 className="truncate text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">
              {view[0].toUpperCase() + view.slice(1)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {targetCurrency}
              <span className="text-[10px] text-[var(--muted)] font-normal">
                rates active
              </span>
            </span>
            <Select
              value={activeBusinessId}
              onValueChange={setActiveBusinessId}
            >
              <SelectTrigger
                aria-label="Switch business"
                className="h-10 w-auto min-w-[200px] md:min-w-[240px] max-w-[340px] px-3 font-semibold gap-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2 truncate text-sm font-semibold">
                  <Building2
                    size={16}
                    className="shrink-0 text-[var(--muted)]"
                  />
                  <span className="truncate">
                    {isAllBusinesses
                      ? "All businesses"
                      : activeBusiness?.name || "Select business"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All businesses</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="font-semibold">{b.name}</span>
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      ({b.currency || "USD"})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={!businesses.length}
            onClick={() => openComposer()}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New invoice</span>
          </Button>
        </header>
        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {dataError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              Could not load all business records. {dataError}
            </div>
          )}
          {view === "dashboard" && (
            <Dashboard
              invoices={invoices}
              transactions={transactions}
              clients={clients}
              businesses={businesses}
              expenses={expenses}
              targetCurrency={targetCurrency}
              loading={
                invoicesLoading || transactionsLoading || expensesLoading
              }
            />
          )}{" "}
          {view === "invoices" &&
            (selected ? (
              <InvoiceDetail
                invoice={selected}
                business={businesses.find(
                  (business) => business.id === selected.businessId,
                )}
                client={clients.find((c) => c.id === selected.clientId)}
                transactions={transactions.filter(
                  (t) => t.invoiceId === selected.id,
                )}
                targetCurrency={targetCurrency}
                onBack={() => setSelected(null)}
                onEdit={() => openEditInvoice(selected)}
                onDelete={() => handleDeleteInvoice(selected)}
              />
            ) : (
              <InvoicesView
                invoices={invoices}
                clients={clients}
                businesses={businesses}
                targetCurrency={targetCurrency}
                loading={invoicesLoading}
                onSelect={setSelected}
                onNew={() => openComposer()}
                canCreate={businesses.length > 0}
              />
            ))}{" "}
          {view === "clients" &&
            (selectedClient ? (
              <ClientDetail
                client={selectedClient}
                invoices={invoices.filter(
                  (invoice) => invoice.clientId === selectedClient.id,
                )}
                transactions={transactions.filter(
                  (transaction) => transaction.clientId === selectedClient.id,
                )}
                businesses={businesses}
                products={products}
                clientProducts={clientProducts.filter(
                  (link) => link.clientId === selectedClient.id,
                )}
                targetCurrency={targetCurrency}
                onBack={() => setSelectedClientId("")}
                onNewInvoice={() => openComposer(selectedClient.id)}
                onContracts={() => {
                  setContractClientId(selectedClient.id);
                  setView("contracts");
                }}
                onSelectInvoice={(invoice) => {
                  setView("invoices");
                  setSelectedClientId("");
                  setSelected(invoice);
                }}
                onGenerateInvoice={(link, product) =>
                  openGenerateInvoice(selectedClient.id, link, product)
                }
              />
            ) : (
              <ClientsView
                clients={clients}
                invoices={invoices}
                businesses={businesses}
                targetCurrency={targetCurrency}
                loading={clientsLoading}
                canCreate={businesses.length > 0}
                onSelect={setSelectedClientId}
              />
            ))}{" "}
          {view === "contracts" && (
            <ContractsView
              products={products}
              key={activeBusinessId}
              clients={clients.filter(
                (client) =>
                  isAllBusinesses || client.businessId === activeBusinessId,
              )}
              businesses={
                isAllBusinesses
                  ? businesses
                  : businesses.filter(
                      (business) => business.id === activeBusinessId,
                    )
              }
              initialClientId={contractClientId}
            />
          )}
          {view === "products" && (
            <ProductsView
              products={products}
              businesses={businesses}
              loading={productsLoading}
              canCreate={!isAllBusinesses}
            />
          )}{" "}
          {view === "expenses" && (
            <ExpensesView
              expenses={expenses}
              targetCurrency={targetCurrency}
              loading={expensesLoading}
            />
          )}{" "}
          {view === "settings" &&
            (isAllBusinesses ? (
              <EmptyState
                title="Choose a business to manage settings"
                detail="Settings and logo uploads apply to one business at a time."
              />
            ) : (
              <SettingsView />
            ))}
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-around border-t border-[var(--border)] bg-white/95 px-2 backdrop-blur lg:hidden">
        {nav
          .filter((item) => item.id !== "settings" && item.id !== "products")
          .map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`focus-ring flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium ${view === n.id ? "text-black" : "text-[var(--muted)]"}`}
            >
              <n.icon size={20} strokeWidth={view === n.id ? 2.5 : 1.8} />
              {n.label}
            </button>
          ))}
      </nav>
      <InvoiceComposer
        open={composer}
        onOpenChange={(value) => {
          setComposer(value);
          if (!value) {
            setComposerClientId(undefined);
            setEditingInvoice(null);
            setPrefillItem(undefined);
          }
        }}
        clients={clients}
        products={products}
        initialClientId={composerClientId}
        invoice={editingInvoice || undefined}
        prefillItem={prefillItem}
      />
    </div>
  );
}
function Brand() {
  return (
    <div className="flex items-center gap-3 text-lg font-semibold">
      <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl" />
      Beez
    </div>
  );
}

function nameFromEmail(email?: string | null) {
  if (!email) return "Account owner";
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof nav)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[#aeb7b9] hover:bg-white/7 hover:text-white"}`}
    >
      <item.icon size={18} />
      {item.label}
    </button>
  );
}
function Dashboard({
  invoices,
  transactions,
  clients,
  businesses,
  expenses,
  targetCurrency,
  loading,
}: {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  clients: Client[];
  businesses: Business[];
  expenses: Expense[];
  targetCurrency: string;
  loading: boolean;
}) {
  const { convert } = useCurrencyExchange();
  const paid = invoices.filter((i) => i.status === "Paid").length;
  const recent = invoices.slice(0, 3);
  if (loading) return <Loading />;
  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-sm text-[var(--muted)]">
          A live view of billing across this business. Reflected in{" "}
          {targetCurrency}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={WalletCards}
          label="Outstanding"
          value={formatGroupedTotals(
            invoices,
            businesses,
            (invoice) => invoice.balanceDue,
            targetCurrency,
            convert,
          )}
        />
        <Metric
          icon={Receipt}
          label="Lifetime net revenue"
          value={formatLifetimeNetRevenue(
            transactions,
            businesses,
            expenses,
            targetCurrency,
            convert,
          )}
        />
        <Metric
          icon={TrendingDown}
          label="Lifetime expenses"
          value={formatLifetimeExpenses(expenses, targetCurrency, convert)}
        />
        <Metric
          icon={CheckCircle2}
          label="Paid invoices"
          value={String(paid)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 xl:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <h2 className="font-semibold text-base">Recent invoices</h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Latest billing activity
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {recent.length ? (
                <InvoiceRows
                  invoices={recent}
                  clients={clients}
                  businesses={businesses}
                  targetCurrency={targetCurrency}
                />
              ) : (
                <EmptyState
                  title="No invoices yet"
                  detail="Create your first invoice to start tracking what you’re owed."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 xl:col-span-7">
          <FinancialChart
            invoices={invoices}
            transactions={transactions}
            expenses={expenses}
            businesses={businesses}
            targetCurrency={targetCurrency}
          />
        </div>
      </div>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-.035em]">
              {value}
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
            <Icon size={18} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
function InvoicesView({
  invoices,
  clients,
  businesses,
  targetCurrency,
  loading,
  canCreate,
  onSelect,
  onNew,
}: {
  invoices: Invoice[];
  clients: Client[];
  businesses: Business[];
  targetCurrency: string;
  loading: boolean;
  canCreate: boolean;
  onSelect: (invoice: Invoice) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const upcomingCutoff = new Date();
  upcomingCutoff.setDate(upcomingCutoff.getDate() + 30);
  const matchesStatus = (i: Invoice) => {
    if (status === "All") return true;
    if (status === "Upcoming")
      return (
        i.status !== "Paid" &&
        (!i.dueDate?.toMillis ||
          i.dueDate.toMillis() <= upcomingCutoff.getTime())
      );
    return i.status === status;
  };
  const rows = invoices.filter(
    (i) =>
      matchesStatus(i) &&
      (i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        clients
          .find((c) => c.id === i.clientId)
          ?.name.toLowerCase()
          .includes(search.toLowerCase())),
  );
  if (loading) return <Loading />;
  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-3.5 text-[var(--muted)]"
            size={17}
          />
          <Input
            className="pl-10"
            placeholder="Search number or client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["All", "Upcoming", "Draft", "Sent", "Partial", "Paid"].map(
              (s) => (
                <SelectItem value={s} key={s}>
                  {s}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {rows.length ? (
        <Card>
          <CardContent className="p-2 md:p-3">
            <InvoiceRows
              invoices={rows}
              clients={clients}
              businesses={businesses}
              targetCurrency={targetCurrency}
              onSelect={onSelect}
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No invoices found"
          detail={
            invoices.length
              ? "Try a different search or status filter."
              : "Create the first invoice for this business."
          }
          action={
            !invoices.length && canCreate ? (
              <Button onClick={onNew}>
                <FilePlus2 size={17} />
                Create invoice
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
function InvoiceRows({
  invoices,
  clients,
  businesses,
  targetCurrency,
  onSelect,
}: {
  invoices: Invoice[];
  clients: Client[];
  businesses: Business[];
  targetCurrency?: string;
  onSelect?: (i: Invoice) => void;
}) {
  const { convert } = useCurrencyExchange();
  return (
    <div className="divide-y divide-[var(--border)]">
      {invoices.map((i) => {
        const invoiceCurrency = currencyForBusiness(i.businessId, businesses);
        const displayCurrency = targetCurrency || invoiceCurrency;
        const convertedTotal = convert(
          i.totalAmount,
          invoiceCurrency,
          displayCurrency,
        );
        const convertedBalance = convert(
          i.balanceDue,
          invoiceCurrency,
          displayCurrency,
        );
        const isDifferent =
          invoiceCurrency.toUpperCase() !== displayCurrency.toUpperCase();

        return (
          <button
            key={i.id}
            onClick={() => onSelect?.(i)}
            className="focus-ring grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-4 text-left hover:bg-[var(--surface-2)] md:grid-cols-[1fr_1fr_140px_140px_24px]"
          >
            <div>
              <p className="font-semibold">{i.invoiceNumber}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Due{" "}
                {i.dueDate?.toDate
                  ? format(i.dueDate.toDate(), "dd MMM yyyy")
                  : "—"}
              </p>
            </div>
            <p className="hidden text-sm md:block">
              {clients.find((c) => c.id === i.clientId)?.name ||
                "Deleted client"}
            </p>
            <Status value={i.status} />
            <div className="text-right">
              <p className="font-semibold">
                {formatCurrency(convertedTotal, displayCurrency)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {formatCurrency(convertedBalance, displayCurrency)} due
                {isDifferent && (
                  <span className="block text-[10px] text-[var(--muted)]">
                    (orig: {formatCurrency(i.balanceDue, invoiceCurrency)})
                  </span>
                )}
              </p>
            </div>
            {onSelect && (
              <ChevronRight
                className="hidden text-[var(--muted)] md:block"
                size={18}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
function Status({ value }: { value: Invoice["status"] }) {
  const c =
    value === "Paid"
      ? "bg-emerald-50 text-emerald-700"
      : value === "Partial"
        ? "bg-amber-50 text-amber-700"
        : value === "Sent"
          ? "bg-blue-50 text-blue-700"
          : "bg-[var(--surface-2)] text-[var(--muted)]";
  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${c}`}
    >
      {value}
    </span>
  );
}
function ClientsView({
  clients,
  invoices,
  businesses,
  targetCurrency,
  loading,
  canCreate,
  onSelect,
}: {
  clients: Client[];
  invoices: Invoice[];
  businesses: Business[];
  targetCurrency: string;
  loading: boolean;
  canCreate: boolean;
  onSelect: (clientId: string) => void;
}) {
  const { convert } = useCurrencyExchange();
  if (loading) return <Loading />;
  return (
    <div className="space-y-5">
      {canCreate && (
        <div className="flex justify-end">
          <ClientDialog />
        </div>
      )}
      {clients.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const clientInvoices = invoices.filter((i) => i.clientId === c.id);
            const totalOutstanding = clientInvoices.reduce((sum, inv) => {
              const invCur = currencyForBusiness(inv.businessId, businesses);
              return sum + convert(inv.balanceDue, invCur, targetCurrency);
            }, 0);

            return (
              <button
                key={c.id}
                className="focus-ring rounded-2xl text-left"
                onClick={() => onSelect(c.id)}
              >
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-[var(--dark)] font-semibold text-white">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {clientInvoices.length} invoices
                      </span>
                    </div>
                    <h3 className="mt-4 font-semibold">{c.name}</h3>
                    {c.businessName && (
                      <p className="mt-1 truncate text-sm font-medium">
                        {c.businessName}
                      </p>
                    )}
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {c.email || c.phone || "No contact details"}
                    </p>
                    <p className="mt-4 text-sm font-semibold">
                      {formatCurrency(totalOutstanding, targetCurrency)}{" "}
                      outstanding
                    </p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No clients yet"
          detail={
            canCreate
              ? "Add a client once, then reuse their details across invoices and receipts."
              : "There are no clients across your businesses yet. Select a business to add one."
          }
          action={canCreate ? <ClientDialog /> : undefined}
        />
      )}
    </div>
  );
}

function ClientDetail({
  client,
  invoices,
  transactions,
  businesses,
  products,
  clientProducts,
  targetCurrency,
  onBack,
  onNewInvoice,
  onContracts,
  onSelectInvoice,
  onGenerateInvoice,
}: {
  client: Client;
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  businesses: Business[];
  products: Product[];
  clientProducts: ClientProductLink[];
  targetCurrency: string;
  onBack: () => void;
  onNewInvoice: () => void;
  onContracts: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onGenerateInvoice: (link: ClientProductLink, product: Product) => void;
}) {
  const { convert } = useCurrencyExchange();
  const business = businesses.find((row) => row.id === client.businessId);
  const displayCurrency = targetCurrency || business?.currency || "USD";

  const outstanding = invoices.reduce((total, invoice) => {
    const invCur = currencyForBusiness(invoice.businessId, businesses);
    return total + convert(invoice.balanceDue, invCur, displayCurrency);
  }, 0);

  const received = transactions.reduce((total, transaction) => {
    const txnCur = currencyForBusiness(transaction.businessId, businesses);
    return total + convert(transaction.amount, txnCur, displayCurrency);
  }, 0);

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to clients"
          onClick={onBack}
        >
          <ArrowLeft size={19} />
        </Button>
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--dark)] font-semibold text-white">
          {client.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="mr-auto min-w-0">
          <h2 className="truncate text-xl font-semibold">{client.name}</h2>
          <p className="truncate text-sm text-[var(--muted)]">
            {client.businessName || business?.name}
          </p>
        </div>
        {client.email && (
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${client.email}`}>
              <Mail size={15} />
              Email
            </a>
          </Button>
        )}
        {client.phone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${client.phone}`}>
              <Phone size={15} />
              Call
            </a>
          </Button>
        )}
        <EditClientDialog client={client} />
        <Button variant="outline" onClick={onContracts}>
          <FilePlus2 size={17} />
          Contracts
        </Button>
        <Button onClick={onNewInvoice}>
          <FilePlus2 size={17} />
          New invoice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={FileText}
          label="Invoices"
          value={String(invoices.length)}
        />
        <Metric
          icon={WalletCards}
          label="Outstanding"
          value={formatCurrency(outstanding, displayCurrency)}
        />
        <Metric
          icon={Receipt}
          label="Payments received"
          value={formatCurrency(received, displayCurrency)}
        />
      </div>

      

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <ClientProductsCard
        businessId={client.businessId}
        clientId={client.id}
        products={products}
        links={clientProducts}
        currency={displayCurrency}
        onGenerateInvoice={onGenerateInvoice}
      />
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Invoices</h3>
          </CardHeader>
          <CardContent>
            {invoices.length ? (
              <InvoiceRows
                invoices={invoices}
                clients={[client]}
                businesses={businesses}
                targetCurrency={displayCurrency}
                onSelect={onSelectInvoice}
              />
            ) : (
              <EmptyState
                title="No invoices for this client"
                detail="Create an invoice to begin their billing history."
                action={
                  <Button onClick={onNewInvoice}>
                    <FilePlus2 size={17} />
                    Create invoice
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Receipts</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Every recorded payment has a stamped receipt.
            </p>
          </CardHeader>
          <CardContent>
            {transactions.length ? (
              <div className="divide-y divide-[var(--border)]">
                {transactions.map((transaction) => {
                  const invoice = invoices.find(
                    (row) => row.id === transaction.invoiceId,
                  );
                  const txnCur = currencyForBusiness(
                    transaction.businessId,
                    businesses,
                  );
                  const convertedAmount = convert(
                    transaction.amount,
                    txnCur,
                    displayCurrency,
                  );
                  const isDifferent =
                    txnCur.toUpperCase() !== displayCurrency.toUpperCase();

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                        <Receipt size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {formatCurrency(convertedAmount, displayCurrency)}
                          {isDifferent && (
                            <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">
                              (orig:{" "}
                              {formatCurrency(transaction.amount, txnCur)})
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {invoice?.invoiceNumber || "Invoice"} ·{" "}
                          {format(
                            transaction.paymentDate.toDate(),
                            "dd MMM yyyy",
                          )}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="Download receipt"
                        disabled={!invoice || !business}
                        onClick={async () => {
                          if (!invoice || !business) return;
                          try {
                            await downloadReceiptPdf(
                              invoice,
                              business,
                              client,
                              transaction,
                            );
                          } catch {
                            toast.error("Could not generate receipt");
                          }
                        }}
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No receipts yet"
                detail="Receipts appear here after a payment is recorded."
              />
            )}
          </CardContent>
        </Card>
        <Card>
        <CardHeader>
          <h3 className="font-semibold">Client information</h3>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Contact" value={client.name} />
          <Info label="Email" value={client.email || "Not provided"} />
          <Info label="Phone" value={client.phone || "Not provided"} />
          <Info
            label="Business address"
            value={client.businessAddress || client.address || "Not provided"}
          />
        </CardContent>
      </Card>
      </div>

      
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 font-medium leading-6">{value}</p>
    </div>
  );
}

function ProductsView({
  products,
  businesses,
  loading,
  canCreate,
}: {
  products: Product[];
  businesses: Business[];
  loading: boolean;
  canCreate: boolean;
}) {
  if (loading) return <Loading />;
  return (
    <div className="space-y-5">
      {canCreate && (
        <div className="flex justify-end">
          <ProductDialog />
        </div>
      )}
      {products.length ? (
        <Card>
          <CardContent className="divide-y divide-[var(--border)] p-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[44px_1fr_auto] items-center gap-3 p-3"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <Package size={18} />
                </span>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-[var(--muted)]">{p.description}</p>
                </div>
                <p className="font-semibold flex items-center gap-2">
                  {formatCurrency(
                    p.rate,
                    currencyForBusiness(p.businessId, businesses),
                  )}
                  <span className="mt- block">
                    <ProductDialog product={p} />
                  </span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No products yet"
          detail="Create products with reusable invoice descriptions and default rates."
          action={canCreate ? <ProductDialog /> : undefined}
        />
      )}
    </div>
  );
}
function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function currencyForBusiness(businessId: string, businesses: Business[]) {
  return (
    businesses.find((business) => business.id === businessId)?.currency || "USD"
  );
}

function formatGroupedTotals<T extends { businessId: string }>(
  rows: T[],
  businesses: Business[],
  amount: (row: T) => number,
  targetCurrency: string,
  convert: (amount: number, from: string, to: string) => number,
) {
  let total = 0;
  for (const row of rows) {
    const currency = currencyForBusiness(row.businessId, businesses);
    total += convert(amount(row), currency, targetCurrency);
  }
  return formatCurrency(total, targetCurrency);
}

function formatLifetimeExpenses(
  expenses: Expense[],
  targetCurrency: string,
  convert: (amount: number, from: string, to: string) => number,
) {
  let total = 0;
  for (const expense of expenses) {
    total += convert(expense.amount, expense.currency, targetCurrency);
  }
  return formatCurrency(total, targetCurrency);
}

function formatLifetimeNetRevenue(
  transactions: PaymentTransaction[],
  businesses: Business[],
  expenses: Expense[],
  targetCurrency: string,
  convert: (amount: number, from: string, to: string) => number,
) {
  let totalRevenue = 0;
  for (const transaction of transactions) {
    const currency = currencyForBusiness(transaction.businessId, businesses);
    totalRevenue += convert(transaction.amount, currency, targetCurrency);
  }
  let totalExpense = 0;
  for (const expense of expenses) {
    totalExpense += convert(expense.amount, expense.currency, targetCurrency);
  }
  const net = totalRevenue - totalExpense;
  return formatCurrency(net, targetCurrency);
}
