import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import type { Business, Contract } from "./types";
import {
  agreementSections,
  subscriptionPaymentTerms,
  subscriptionRenewalTerms,
  subscriptionProductTerms,
} from "./agreement-template";

export type ContractInput = Omit<Contract, "id" | "createdAt">;
export function contractInput(contract: Contract): ContractInput {
  const { id, createdAt, ...input } = contract;
  void id;
  void createdAt;
  return input;
}
export function validateContractEdit(
  original: ContractInput,
  input: ContractInput,
) {
  validateContract(input);
  if (
    original.businessId !== input.businessId ||
    original.clientId !== input.clientId ||
    original.extendsContractId !== input.extendsContractId
  ) {
    throw new Error(
      "A contract's business, client and extension reference cannot be changed.",
    );
  }
}
export function assertContractUnchanged(
  original: ContractInput,
  current: ContractInput,
) {
  for (const key of new Set([
    ...Object.keys(original),
    ...Object.keys(current),
  ])) {
    if (
      original[key as keyof ContractInput] !==
      current[key as keyof ContractInput]
    )
      throw new Error(
        "This contract was changed elsewhere. Close and reopen the editor to load the latest version.",
      );
  }
}
export const billingIntervals = [
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;
export const defaultPaymentTerms = subscriptionPaymentTerms;
export const defaultRenewalTerms = subscriptionRenewalTerms;
export const defaultTermsOfUse = subscriptionProductTerms;
export function businessContractTerms(
  business?: Pick<Business, "contractPaymentTerms" | "contractTerms">,
) {
  return {
    paymentTerms: business?.contractPaymentTerms?.trim()
      ? business.contractPaymentTerms
      : defaultPaymentTerms,
    businessTerms: business?.contractTerms || "",
  };
}
const previousStarterTerms =
  "License and authorized users\nThe contractor grants the client a non-exclusive right to access and use the named software during the subscription period for the client's internal business purposes, within the agreed features, capacity and user limits. This is a subscription to a service, not a transfer of ownership. The client is responsible for its authorized users, account security and compatible devices and internet access.\n\nAcceptable use\nThe client must not resell or sublicense access, allow unauthorized use, introduce malicious code, interfere with other customers or the service, or use it in violation of law or third-party rights. Copying or attempting to obtain the software's source code is prohibited except where applicable law permits it. Suspected account compromise or misuse must be reported promptly.\n\nService scope, support and changes\nThe subscription details describe the included services and support. Implementation, migration, training, bespoke development and third-party integrations are included only where expressly stated. Extra work and its charges require prior written agreement. The contractor will use reasonable care and skill in providing the subscribed service. Any availability targets, response times, backup commitments or service credits must be expressly agreed; this agreement does not establish a separate service-level guarantee. The contractor will give reasonable notice of planned maintenance or material service changes where practicable.\n\nClient data and privacy\nThe client retains ownership of the data it provides and is responsible for having authority to supply it. The contractor may use that data only to provide, secure and support the agreed service, on the client's documented instructions or as required by law. Each party will apply appropriate safeguards and cooperate in addressing a security incident affecting client data. Any legally required data-processing agreement, including processing details and subprocessors, must be agreed separately before the relevant processing starts. Data export, retention and deletion are subject to those arrangements and the termination terms.\n\nConfidentiality\nEach party must protect non-public business, technical, financial and customer information received from the other, using at least reasonable care. It may use that information only to perform this agreement and disclose it only to people who need it for that purpose and are bound to protect it. This does not cover information already lawfully known, independently developed, lawfully received from another source or made public without breach. Legally required disclosure is permitted, with prior notice where lawful. Neither party may use the other's name or logo for publicity without written consent.\n\nIntellectual property\nThe contractor and its licensors retain their rights in the software, documentation and pre-existing technology. The client retains its rights in its content and data. Any ownership or licensing of separately commissioned work must be set out in a written scope of work. No other rights are transferred by this subscription.\n\nResponsibilities and remedies\nEach party is responsible for performing its obligations and complying with applicable law. The client must assess the software's suitability for its intended use and verify outputs before relying on them. Nothing in these terms excludes a right or liability that cannot lawfully be excluded. Any negotiated liability cap, indemnity or additional warranty must be expressly recorded in the additional terms.\n\nEvents outside reasonable control\nA party affected by an event outside its reasonable control must promptly inform the other, take reasonable steps to reduce its effects and resume performance as soon as practicable. The parties will discuss an appropriate adjustment if the interruption continues. This does not cancel payment obligations already incurred.\n\nNotices, changes and disputes\nContract notices must be in writing to the contact details exchanged by the parties; a change of contact details must be notified in writing. The parties will first seek to resolve a dispute through their authorized representatives, without preventing urgent relief where available. Changes require written agreement by both parties. Any agreed governing law and forum must be recorded in the additional terms.\n\nAgreement documents and priority\nThe subscription schedule, payment terms, renewal and cancellation terms, software terms and any additional terms in this document form the agreement. If they conflict, expressly agreed additional terms take priority, followed by the subscription schedule and payment terms, renewal and cancellation terms, then these software terms. External proposals or service-level documents apply only if expressly incorporated by written agreement. If a provision is unenforceable, the remaining provisions continue to the extent permitted by law.";

// Only upgrade our original starter wording for new drafts. Never replace custom
// product wording, configured payment terms or the text stored on a contract.
const originalStarterTerms =
  "The client may use the software for its internal business activities during the subscription period, within the agreed subscription scope. The client is responsible for its authorized users and for keeping account credentials secure. The client must not resell access, share access with unauthorized parties, interfere with the service, or use it for unlawful purposes. The contractor retains ownership of the software; the client retains ownership of its data. Each party will handle the other party's confidential information with reasonable care. Access ends when the subscription expires or is terminated under the agreed terms.";
export function productContractTerms(value?: string) {
  return !value?.trim() ||
    value.trim() === originalStarterTerms ||
    value.trim() === previousStarterTerms
    ? defaultTermsOfUse
    : value;
}
export function contractParagraphs(body: string) {
  return body.split(/\r?\n\s*\r?\n/).filter((paragraph) => paragraph.trim());
}
export function billingLabel(
  contract: Pick<Contract, "billingInterval" | "customBillingFrequency">,
) {
  return contract.billingInterval === "custom"
    ? contract.customBillingFrequency
    : contract.billingInterval;
}
export function dateLabel(date: string) {
  return format(parseISO(date), "dd MMM yyyy");
}
export function extensionDates(
  contract: Pick<Contract, "endDate" | "billingInterval"> & {
    startDate?: string;
  },
) {
  const start = addDays(parseISO(contract.endDate), 1);
  if (contract.billingInterval === "custom") {
    const days = contract.startDate
      ? differenceInCalendarDays(
          parseISO(contract.endDate),
          parseISO(contract.startDate),
        ) + 1
      : 30;
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(addDays(start, days - 1), "yyyy-MM-dd"),
    };
  }
  const months =
    contract.billingInterval === "yearly"
      ? 12
      : contract.billingInterval === "quarterly"
        ? 3
        : 1;
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(addDays(addMonths(start, months), -1), "yyyy-MM-dd"),
  };
}
export function validateContract(input: ContractInput) {
  if (input.agreementTerms !== undefined && !input.agreementTerms.trim())
    throw new Error("Main agreement clauses cannot be empty.");
  for (const key of [
    "businessId",
    "clientId",
    "clientName",
    "contractorName",
    "productName",
    "subscriptionDetails",
    "paymentTerms",
    "renewalTerms",
    "termsOfUse",
  ] as const) {
    if (!input[key].trim())
      throw new Error("Complete all required contract fields.");
  }
  for (const [key, value] of Object.entries(input)) {
    if (
      typeof value === "string" &&
      value.length >
        (key === "agreementTerms"
          ? 24000
          : [
                "subscriptionDetails",
                "paymentTerms",
                "renewalTerms",
                "termsOfUse",
                "additionalTerms",
                "businessTerms",
              ].includes(key)
            ? 12000
            : 500)
    )
      throw new Error("A contract field exceeds its length limit.");
  }
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e12)
    throw new Error(
      "Enter a valid subscription amount between 0 and 1 trillion.",
    );
  if (!billingIntervals.includes(input.billingInterval))
    throw new Error("Choose a billing frequency.");
  if (
    input.billingInterval === "custom" &&
    !input.customBillingFrequency?.trim()
  )
    throw new Error("Enter your custom billing frequency.");
  if (!/^[A-Z]{3}$/.test(input.currency))
    throw new Error("Enter a three-letter currency code.");
  for (const value of [input.startDate, input.endDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(parseISO(value)))
      throw new Error("Enter valid contract dates.");
  }
  if (input.endDate < input.startDate)
    throw new Error("End date must be on or after the start date.");
}
export function contractSections(contract: ContractInput) {
  if (contract.agreementTerms?.trim()) {
    const main = agreementSections(contract.agreementTerms);
    main.push({
      title: "4. SUBSCRIPTION FEES AND PAYMENT TERMS",
      body: contract.paymentTerms,
    });
    main.push({
      title: "6. TERM, RENEWAL AND TERMINATION",
      body: contract.renewalTerms,
    });
    main.sort((a, b) => parseInt(a.title, 10) - parseInt(b.title, 10));
    return [
      {
        title: "Parties and effective date",
        body: `This Software Subscription Agreement (\"Agreement\") is entered into as of ${dateLabel(contract.startDate)} (\"Effective Date\") between ${contract.contractorName}, with its principal place of business at ${contract.contractorAddress || "the address notified in writing to the Client"} (\"Developer\"), and ${contract.clientName}, with its principal place of business at ${contract.clientAddress || "the address notified in writing to the Developer"} (\"Client\"). The Parties agree to the following terms for ${contract.productName}.`,
      },
      ...main,
      {
        title: "Schedule A - Subscription and commercial terms",
        body: `Developer: ${contract.contractorName}\nDeveloper address: ${contract.contractorAddress || "As notified in writing"}\nClient: ${contract.clientName}\nClient address: ${contract.clientAddress || "As notified in writing"}\nClient email: ${contract.clientEmail || "As notified in writing"}\nSoftware: ${contract.productName}\nEffective date / subscription start: ${dateLabel(contract.startDate)}\nInitial subscription end (inclusive): ${dateLabel(contract.endDate)}\nSubscription fee: ${contract.currency} ${contract.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, billed ${billingLabel(contract)}.\n\nIncluded scope and support:\n${contract.subscriptionDetails}${contract.extendsContractId ? `\n\nExtension reference: ${contract.extendsContractId}. This document sets the terms for the extension period stated above.` : ""}${contract.additionalTerms.trim() ? `\n\nExpressly agreed additional terms or deviations:\n${contract.additionalTerms}` : ""}`,
      },
      { title: "Schedule B - Product terms of use", body: contract.termsOfUse },
      ...(contract.businessTerms?.trim()
        ? [
            {
              title: "Schedule C - Business terms",
              body: contract.businessTerms,
            },
          ]
        : []),
    ];
  }
  return [
    {
      title: "1. Parties and product",
      body: `Contractor: ${contract.contractorName}\nClient: ${contract.clientName}${contract.clientEmail ? `\nEmail: ${contract.clientEmail}` : ""}${contract.clientAddress ? `\nAddress: ${contract.clientAddress}` : ""}\nSoftware product: ${contract.productName}`,
    },
    ...(contract.extendsContractId
      ? [
          {
            title: "Extension reference",
            body: `This agreement extends contract ${contract.extendsContractId} for the subscription period and terms stated below.`,
          },
        ]
      : []),
    {
      title: "2. Subscription",
      body: `Period: ${dateLabel(contract.startDate)} to ${dateLabel(contract.endDate)} (inclusive).\nSubscription fee: ${contract.currency} ${contract.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, billed ${billingLabel(contract)}.\n\n${contract.subscriptionDetails}`,
    },
    { title: "3. Payment terms", body: contract.paymentTerms },
    { title: "4. Renewal and cancellation", body: contract.renewalTerms },
    { title: "5. Software terms of use", body: contract.termsOfUse },
    ...(contract.businessTerms?.trim()
      ? [{ title: "Business terms", body: contract.businessTerms }]
      : []),
    ...(contract.additionalTerms.trim()
      ? [{ title: "6. Additional terms", body: contract.additionalTerms }]
      : []),
  ];
}
