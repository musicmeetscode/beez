"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useBusiness } from "@/contexts/business-context";
import { useBusinessCollection } from "@/hooks/use-business-collection";
import type { Client, Invoice, PaymentTransaction, Product } from "@/lib/types";
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
import { ClientDialog, ProductDialog } from "./entity-dialogs";
import { InvoiceComposer } from "./invoice-composer";
import { InvoiceDetail } from "./invoice-detail";
import { SettingsView } from "./settings-view";
type View = "dashboard" | "invoices" | "clients" | "products" | "settings";
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const nav = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices" as const, label: "Invoices", icon: FileText },
  { id: "clients" as const, label: "Clients", icon: Users },
  { id: "products" as const, label: "Products", icon: Package },
  { id: "settings" as const, label: "Settings", icon: Settings },
];
export function Workspace() {
  const { logout, user } = useAuth();
  const {
    businesses,
    activeBusinessId,
    setActiveBusinessId,
    activeBusiness,
    error: businessError,
  } = useBusiness();
  const { data: clients, loading: clientsLoading, error: clientsError } =
    useBusinessCollection<Client>("clients");
  const { data: products, loading: productsLoading, error: productsError } =
    useBusinessCollection<Product>("products");
  const { data: invoices, loading: invoicesLoading, error: invoicesError } =
    useBusinessCollection<Invoice>("invoices");
  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } =
    useBusinessCollection<PaymentTransaction>("transactions");
  const dataError =
    businessError ||
    clientsError ||
    productsError ||
    invoicesError ||
    transactionsError;
  const [view, setView] = useState<View>("dashboard");
  const [mobile, setMobile] = useState(false);
  const [composer, setComposer] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const go = (v: View) => {
    setView(v);
    setMobile(false);
    setSelected(null);
  };
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[248px_1fr]">
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
            <p className="truncate text-sm font-medium">{user?.email}</p>
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
            <p className="truncate text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">
              {activeBusiness?.name}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-[-.02em]">
              {view[0].toUpperCase() + view.slice(1)}
            </h1>
          </div>
          <Select value={activeBusinessId} onValueChange={setActiveBusinessId}>
            <SelectTrigger
              aria-label="Switch business"
              className="w-[150px] md:w-[220px]"
            >
              <Building2 size={16} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setComposer(true)}>
            <Plus size={16} />
            <span className="hidden sm:inline">New invoice</span>
          </Button>
        </header>
        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {dataError && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Could not load all business records. {dataError}
            </div>
          )}
          {view === "dashboard" && (
            <Dashboard
              invoices={invoices}
              transactions={transactions}
              clients={clients}
              loading={invoicesLoading || transactionsLoading}
            />
          )}{" "}
          {view === "invoices" &&
            (selected ? (
              <InvoiceDetail
                invoice={selected}
                client={clients.find((c) => c.id === selected.clientId)}
                transactions={transactions.filter(
                  (t) => t.invoiceId === selected.id,
                )}
                onBack={() => setSelected(null)}
              />
            ) : (
              <InvoicesView
                invoices={invoices}
                clients={clients}
                loading={invoicesLoading}
                onSelect={setSelected}
                onNew={() => setComposer(true)}
              />
            ))}{" "}
          {view === "clients" && (
            <ClientsView
              clients={clients}
              invoices={invoices}
              loading={clientsLoading}
            />
          )}{" "}
          {view === "products" && (
            <ProductsView products={products} loading={productsLoading} />
          )}{" "}
          {view === "settings" && <SettingsView />}
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-around border-t border-[var(--border)] bg-white/95 px-2 backdrop-blur lg:hidden">
        {nav.slice(0, 4).map((n) => (
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
        onOpenChange={setComposer}
        clients={clients}
        products={products}
      />
    </div>
  );
}
function Brand() {
  return (
    <div className="flex items-center gap-3 text-lg font-semibold">
      <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
        <FileText size={20} />
      </span>
      Ledgerly
    </div>
  );
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
  loading,
}: {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  clients: Client[];
  loading: boolean;
}) {
  const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0),
    paid = invoices.filter((i) => i.status === "Paid").length,
    revenue = transactions
      .filter(
        (t) => t.paymentDate?.toDate().getMonth() === new Date().getMonth(),
      )
      .reduce((s, t) => s + t.amount, 0),
    recent = invoices.slice(0, 5);
  if (loading) return <Loading />;
  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-sm text-[var(--muted)]">
          A live view of billing across this business.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={WalletCards}
          label="Outstanding"
          value={money.format(outstanding)}
        />
        <Metric
          icon={Receipt}
          label="Revenue this month"
          value={money.format(revenue)}
        />
        <Metric
          icon={CheckCircle2}
          label="Paid invoices"
          value={String(paid)}
        />
        <Metric
          icon={Users}
          label="Active clients"
          value={String(clients.length)}
        />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold">Recent invoices</h2>
        </CardHeader>
        <CardContent>
          {recent.length ? (
            <InvoiceRows invoices={recent} clients={clients} />
          ) : (
            <EmptyState
              title="No invoices yet"
              detail="Create your first invoice to start tracking what you’re owed."
            />
          )}
        </CardContent>
      </Card>
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
  loading,
  onSelect,
  onNew,
}: {
  invoices: Invoice[];
  clients: Client[];
  loading: boolean;
  onSelect: (i: Invoice) => void;
  onNew: () => void;
}) {
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const rows = invoices.filter(
    (i) =>
      (status === "All" || i.status === status) &&
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
            {["All", "Draft", "Sent", "Partial", "Paid"].map((s) => (
              <SelectItem value={s} key={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rows.length ? (
        <Card>
          <CardContent className="p-2 md:p-3">
            <InvoiceRows
              invoices={rows}
              clients={clients}
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
            !invoices.length ? (
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
  onSelect,
}: {
  invoices: Invoice[];
  clients: Client[];
  onSelect?: (i: Invoice) => void;
}) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {invoices.map((i) => (
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
            {clients.find((c) => c.id === i.clientId)?.name || "Deleted client"}
          </p>
          <Status value={i.status} />
          <div className="text-right">
            <p className="font-semibold">{money.format(i.totalAmount)}</p>
            <p className="text-xs text-[var(--muted)]">
              {money.format(i.balanceDue)} due
            </p>
          </div>
          {onSelect && (
            <ChevronRight
              className="hidden text-[var(--muted)] md:block"
              size={18}
            />
          )}
        </button>
      ))}
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
  loading,
}: {
  clients: Client[];
  invoices: Invoice[];
  loading: boolean;
}) {
  if (loading) return <Loading />;
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ClientDialog />
      </div>
      {clients.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--dark)] font-semibold text-white">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {invoices.filter((i) => i.clientId === c.id).length}{" "}
                    invoices
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{c.name}</h3>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">
                  {c.email || c.phone || "No contact details"}
                </p>
                <p className="mt-4 text-sm font-semibold">
                  {money.format(
                    invoices
                      .filter((i) => i.clientId === c.id)
                      .reduce((s, i) => s + i.balanceDue, 0),
                  )}{" "}
                  outstanding
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clients yet"
          detail="Add a client once, then reuse their details across invoices and receipts."
          action={<ClientDialog />}
        />
      )}
    </div>
  );
}
function ProductsView({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  if (loading) return <Loading />;
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ProductDialog />
      </div>
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
                <p className="font-semibold">{money.format(p.rate)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No products yet"
          detail="Create products with reusable invoice descriptions and default rates."
          action={<ProductDialog />}
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
