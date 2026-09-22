"use client";
import { useState } from "react";
import { addDays, addYears, format } from "date-fns";
import { Download, FilePlus2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Business, Client, Contract, Product } from "@/lib/types";
import { useBusinessCollection } from "@/hooks/use-business-collection";
import {
  billingIntervals,
  billingLabel,
  defaultRenewalTerms,
  defaultTermsOfUse,
  productContractTerms,
  businessContractTerms,
  contractSections,
  contractInput,
  dateLabel,
  extensionDates,
  validateContract,
  type ContractInput,
} from "@/lib/contracts";
import { createContract, updateContract } from "@/lib/contract-data";
import { standardAgreementTerms } from "@/lib/agreement-template";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

const control =
  "w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm";
async function download(contract: Contract) {
  const { downloadContractPdf } = await import("@/lib/contract-pdf");
  await downloadContractPdf(contract);
}

export function ContractsView({
  clients,
  products,
  businesses,
  initialClientId = "",
}: {
  clients: Client[];
  products: Product[];
  businesses: Business[];
  initialClientId?: string;
}) {
  const { data, loading, error } = useBusinessCollection<Contract>("contracts");
  const [filter, setFilter] = useState(initialClientId);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState(false);
  const [extension, setExtension] = useState<Contract>();
  const [editing, setEditing] = useState<Contract>();
  const [selected, setSelected] = useState<Contract>();
  const [downloading, setDownloading] = useState("");
  const rows = data.filter(
    (row) =>
      businesses.some((business) => business.id === row.businessId) &&
      (!filter || row.clientId === filter) &&
      `${row.productName} ${row.clientName} ${row.contractorName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function downloadSaved(contract: Contract) {
    setDownloading(contract.id);
    try {
      await download(contract);
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading("");
    }
  }
  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Contracts</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Software subscriptions, client agreements and extensions.
          </p>
        </div>
        <Button
          disabled={!clients.length}
          onClick={() => {
            setExtension(undefined);
            setEditing(undefined);
            setCompose(true);
          }}
        >
          <Plus size={17} />
          New contract
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          className="sm:max-w-sm"
          aria-label="Search contracts"
          placeholder="Search product, client or contractor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by client"
          className={`${control} sm:max-w-xs`}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.businessName || client.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load contracts. {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading contracts...</p>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <FilePlus2 className="mx-auto mb-3" />
          <h3 className="font-semibold">
            {data.length
              ? "No matching contracts"
              : "Your client agreements, in one place"}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {!clients.length
              ? "Add a client first, then create their software subscription contract."
              : "Create a contract, review the terms and download a PDF for signing."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((contract) => (
            <article
              key={contract.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5"
            >
              <div className="min-w-0 flex-1">
                <button
                  className="text-left font-semibold hover:underline"
                  onClick={() => setSelected(contract)}
                >
                  {contract.productName}
                </button>
                <p className="text-sm text-[var(--muted)]">
                  {contract.clientName} · {contract.currency}{" "}
                  {contract.amount.toLocaleString()} / {billingLabel(contract)}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {dateLabel(contract.startDate)} –{" "}
                  {dateLabel(contract.endDate)} · Unsigned
                  {contract.extendsContractId ? " · Extension" : ""}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelected(contract)}>
                View
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(contract);
                  setExtension(undefined);
                  setCompose(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                disabled={!!downloading}
                onClick={() => downloadSaved(contract)}
              >
                <Download size={16} />
                {downloading === contract.id ? "Generating..." : "PDF"}
              </Button>
              <Button
                variant="outline"
                disabled={
                  !clients.some((client) => client.id === contract.clientId)
                }
                onClick={() => {
                  setExtension(contract);
                  setEditing(undefined);
                  setCompose(true);
                }}
              >
                Extend
              </Button>
            </article>
          ))}
        </div>
      )}
      {compose && (
        <ContractComposer
          products={products}
          clients={clients}
          businesses={businesses}
          initialClientId={filter}
          extension={extension}
          editing={editing}
          onClose={() => setCompose(false)}
        />
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle>{selected?.productName}</DialogTitle>
          <DialogDescription>
            Unsigned software subscription agreement · {selected?.id}
          </DialogDescription>
          {selected && (
            <>
              <AgreementPreview contract={selected} />
              <Button
                className="mt-5 mr-3"
                variant="outline"
                onClick={() => {
                  setEditing(
                    data.find((row) => row.id === selected.id) || selected,
                  );
                  setExtension(undefined);
                  setSelected(undefined);
                  setCompose(true);
                }}
              >
                Edit contract
              </Button>
              <Button
                className="mt-5"
                disabled={!!downloading}
                onClick={() => downloadSaved(selected)}
              >
                <Download size={16} />
                Download PDF
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgreementPreview({ contract }: { contract: ContractInput }) {
  return (
    <div className="mt-6 space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
      {contractSections(contract).map((section) => (
        <section key={section.title}>
          <h3 className="mb-2 font-semibold">{section.title}</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {section.body}
          </p>
        </section>
      ))}
      <p className="border-t pt-4 text-sm">
        Signature and date lines for both parties are included in the PDF.
      </p>
    </div>
  );
}

function ContractComposer({
  clients,
  products,
  businesses,
  initialClientId,
  extension,
  editing,
  onClose,
}: {
  clients: Client[];
  products: Product[];
  businesses: Business[];
  initialClientId: string;
  extension?: Contract;
  editing?: Contract;
  onClose: () => void;
}) {
  const [input, setInput] = useState<ContractInput>(() => {
    if (editing) return contractInput(editing);
    if (extension) {
      const { id, createdAt: _createdAt, ...original } = extension;
      void _createdAt;
      return {
        ...original,
        ...extensionDates(extension),
        extendsContractId: id,
      };
    }
    const client =
      clients.find((row) => row.id === initialClientId) || clients[0];
    const business = businesses.find((row) => row.id === client?.businessId);
    return {
      businessId: client?.businessId || "",
      clientId: client?.id || "",
      clientName: client?.businessName || client?.name || "",
      clientEmail: client?.email || "",
      clientAddress: client?.businessAddress || client?.address || "",
      contractorName: business?.name || "",
      contractorAddress: business?.contractAddress || "Uganda",
      agreementTerms: standardAgreementTerms,
      productName: "",
      currency: business?.currency || "USD",
      amount: 0,
      billingInterval: "monthly",
      customBillingFrequency: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addDays(addYears(new Date(), 1), -1), "yyyy-MM-dd"),
      subscriptionDetails: "",
      ...businessContractTerms(business),
      renewalTerms: defaultRenewalTerms,
      termsOfUse: defaultTermsOfUse,
      additionalTerms: "",
      extendsContractId: "",
    };
  });
  const [review, setReview] = useState(false);
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = <K extends keyof ContractInput>(
    key: K,
    value: ContractInput[K],
  ) => setInput((current) => ({ ...current, [key]: value }));
  async function save() {
    setSaving(true);
    setError("");
    try {
      if (editing) await updateContract(editing, input);
      else await createContract(input);
      toast.success(
        editing
          ? "Contract updated. Its PDF now uses the saved changes."
          : extension
            ? "Contract extension saved. Download its PDF from the list."
            : "Contract saved. Download its PDF from the list.",
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the contract.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogTitle>
          {editing
            ? "Edit contract"
            : extension
              ? "Extend contract"
              : "New software contract"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? "Update the saved agreement, review your changes and save. Previously downloaded PDFs remain unchanged."
            : extension
              ? "Create a linked agreement with new dates and terms. The original agreement stays available."
              : "Choose a product and enter subscription details. The Uganda software agreement, payment terms and product terms are included automatically."}
        </DialogDescription>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {review ? (
          <>
            <AgreementPreview contract={input} />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setReview(false)}
              >
                Back to edit
              </Button>
              <Button disabled={saving} onClick={save}>
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Save contract"}
              </Button>
            </div>
          </>
        ) : (
          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                validateContract(input);
                if (extension && input.startDate <= extension.endDate)
                  throw new Error(
                    "An extension must start after the original contract ends.",
                  );
                setError("");
                setReview(true);
              } catch (cause) {
                setError((cause as Error).message);
              }
            }}
          >
            <label className="block space-y-2 text-sm font-medium">
              <span>Client</span>
              <select
                className={control}
                required
                disabled={!!extension || !!editing}
                value={input.clientId}
                onChange={(event) => {
                  const client = clients.find(
                    (row) => row.id === event.target.value,
                  )!;
                  const business = businesses.find(
                    (row) => row.id === client.businessId,
                  );
                  setInput((current) => ({
                    ...current,
                    clientId: client.id,
                    businessId: client.businessId,
                    clientName: client.businessName || client.name,
                    clientEmail: client.email,
                    clientAddress: client.businessAddress || client.address,
                    contractorName: business?.name || "",
                    contractorAddress: business?.contractAddress || "Uganda",
                    currency: business?.currency || "USD",
                    ...businessContractTerms(business),
                    ...(client.businessId !== current.businessId
                      ? {
                          productName: "",
                          amount: 0,
                          subscriptionDetails: "",
                          termsOfUse: defaultTermsOfUse,
                        }
                      : {}),
                  }));
                  if (client.businessId !== input.businessId) setProductId("");
                }}
              >
                {editing &&
                  !clients.some((client) => client.id === editing.clientId) && (
                    <option value={editing.clientId}>
                      {editing.clientName}
                    </option>
                  )}
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName || client.name} —{" "}
                    {
                      businesses.find(
                        (business) => business.id === client.businessId,
                      )?.name
                    }
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>Saved product</span>
              <select
                className={control}
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  const product = products.find(
                    (row) =>
                      row.id === event.target.value &&
                      row.businessId === input.businessId,
                  );
                  if (product)
                    setInput((current) => ({
                      ...current,
                      productName: product.name,
                      amount: product.rate,
                      subscriptionDetails: product.description,
                      termsOfUse: productContractTerms(product.termsOfUse),
                    }));
                  else if (extension || editing)
                    setInput((current) => ({
                      ...current,
                      productName: (extension || editing)!.productName,
                      amount: (extension || editing)!.amount,
                      subscriptionDetails: (extension || editing)!
                        .subscriptionDetails,
                      termsOfUse: (extension || editing)!.termsOfUse,
                    }));
                  else
                    setInput((current) => ({
                      ...current,
                      productName: "",
                      amount: 0,
                      subscriptionDetails: "",
                      termsOfUse: defaultTermsOfUse,
                    }));
                }}
              >
                <option value="">
                  {extension || editing
                    ? "Keep original product and terms"
                    : "Enter a product name manually"}
                </option>
                {products
                  .filter((product) => product.businessId === input.businessId)
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
              <span className="block text-xs text-[var(--muted)]">
                Product terms are managed in Products. A manually entered
                product uses standard terms.
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {input.agreementTerms && (
                <label className="space-y-2 text-sm font-medium">
                  <span>Developer address / place of business</span>
                  <Input
                    value={input.contractorAddress || ""}
                    maxLength={500}
                    onChange={(event) =>
                      update("contractorAddress", event.target.value)
                    }
                  />
                </label>
              )}
              {(
                [
                  ["productName", "Product name"],
                  ["contractorName", "Contractor / software provider"],
                  ["clientName", "Client legal name"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <Input
                    required
                    readOnly={key === "productName" && !!productId}
                    maxLength={500}
                    value={input[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                </label>
              ))}
              <label className="space-y-2 text-sm font-medium">
                <span>Currency</span>
                <Input
                  required
                  pattern="[A-Z]{3}"
                  maxLength={3}
                  value={input.currency}
                  onChange={(event) =>
                    update("currency", event.target.value.toUpperCase())
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Subscription fee per billing period</span>
                <Input
                  type="number"
                  required
                  min="0"
                  max="1000000000000"
                  step="0.01"
                  value={Number.isNaN(input.amount) ? "" : input.amount}
                  onChange={(event) =>
                    update(
                      "amount",
                      event.target.value === ""
                        ? NaN
                        : Number(event.target.value),
                    )
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Billing frequency</span>
                <select
                  className={control}
                  value={input.billingInterval}
                  onChange={(event) =>
                    update(
                      "billingInterval",
                      event.target.value as Contract["billingInterval"],
                    )
                  }
                >
                  {billingIntervals.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval === "custom"
                        ? "Custom — type your billing schedule"
                        : interval[0].toUpperCase() + interval.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              {input.billingInterval === "custom" && (
                <label className="space-y-2 text-sm font-medium">
                  <span>Custom billing frequency</span>
                  <textarea
                    className={control}
                    rows={3}
                    required
                    maxLength={500}
                    placeholder="e.g. Every 6 months, or 50% upfront and 50% on delivery"
                    value={input.customBillingFrequency}
                    onChange={(event) =>
                      update("customBillingFrequency", event.target.value)
                    }
                  />
                </label>
              )}
              {(
                [
                  ["startDate", "Effective / start date"],
                  ["endDate", "Initial end date (inclusive)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <Input
                    type="date"
                    required
                    min={
                      key === "endDate"
                        ? input.startDate
                        : extension
                          ? extensionDates(extension).startDate
                          : undefined
                    }
                    value={input[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            {(
              [
                [
                  "subscriptionDetails",
                  "Subscription details",
                  "Plan, included features, user limits, support and service scope.",
                ],
                [
                  "additionalTerms",
                  "Additional terms (optional)",
                  "Any other terms agreed with this client.",
                ],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="block space-y-2 text-sm font-medium">
                <span>{label}</span>
                <textarea
                  className={control}
                  rows={3}
                  required={key !== "additionalTerms"}
                  maxLength={12000}
                  placeholder={placeholder}
                  value={input[key]}
                  onChange={(event) => update(key, event.target.value)}
                />
              </label>
            ))}
            <details className="rounded-xl border border-[var(--border)] p-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Included product and business terms
              </summary>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() =>
                  setInput((current) => ({
                    ...current,
                    agreementTerms: standardAgreementTerms,
                    contractorAddress:
                      current.contractorAddress ||
                      businesses.find(
                        (business) => business.id === current.businessId,
                      )?.contractAddress ||
                      "Uganda",
                    renewalTerms: defaultRenewalTerms,
                    ...businessContractTerms(
                      businesses.find(
                        (business) => business.id === current.businessId,
                      ),
                    ),
                  }))
                }
              >
                Use latest software agreement
              </Button>
              <Button
                type="button"
                variant="outline"
                className="mt-3 ml-2"
                onClick={() =>
                  setInput((current) => ({
                    ...current,
                    ...businessContractTerms(
                      businesses.find(
                        (business) => business.id === current.businessId,
                      ),
                    ),
                  }))
                }
              >
                Reload business terms
              </Button>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Includes 99.9% monthly uptime, ISO-aligned practices, automatic
                renewal, a twelve-month fee liability cap and Uganda law with
                arbitration in Mbarara. Updating the template keeps your product
                terms and uses payment terms from Settings.
              </p>
              {input.agreementTerms && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Main agreement clauses
                  </summary>
                  {editing ? (
                    <textarea
                      aria-label="Main agreement clauses"
                      className={`${control} mt-2`}
                      rows={14}
                      maxLength={24000}
                      value={input.agreementTerms}
                      onChange={(event) =>
                        update("agreementTerms", event.target.value)
                      }
                    />
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {input.agreementTerms}
                    </p>
                  )}
                </details>
              )}
              <p className="mt-3 text-xs text-[var(--muted)]">
                Payment terms come from Settings; software terms come from the
                selected product. Extensions keep their original terms unless
                you select a product.
              </p>
              {(
                [
                  ["paymentTerms", "Payment terms"],
                  ["businessTerms", "Business terms from Settings"],
                  ["renewalTerms", "Renewal and cancellation"],
                  ["termsOfUse", "Software terms of use"],
                ] as const
              ).map(([key, label]) => (
                <section key={key} className="mt-4">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  {editing ? (
                    <textarea
                      aria-label={label}
                      className={`${control} mt-2`}
                      rows={key === "termsOfUse" ? 10 : 4}
                      required={key !== "businessTerms"}
                      maxLength={12000}
                      value={input[key] || ""}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                      {input[key] || "No additional business terms configured."}
                    </p>
                  )}
                </section>
              ))}
            </details>
            <div className="flex justify-end">
              <Button type="submit">Review generated contract</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
