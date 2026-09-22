import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import ts from "typescript";
const filename = fileURLToPath(new URL("../lib/contracts.ts", import.meta.url));
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(
  fileURLToPath(new URL("..", import.meta.url)),
);
const templateFilename = fileURLToPath(
  new URL("../lib/agreement-template.ts", import.meta.url),
);
const template = new Module(templateFilename);
template.filename = templateFilename;
template.paths = compiled.paths;
template._compile(
  ts.transpileModule(fs.readFileSync(templateFilename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  templateFilename,
);
const originalRequire = compiled.require.bind(compiled);
compiled.require = (request) =>
  request === "./agreement-template"
    ? template.exports
    : originalRequire(request);
compiled._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  filename,
);
const {
  validateContract,
  validateContractEdit,
  contractInput,
  assertContractUnchanged,
  extensionDates,
  contractSections,
  contractParagraphs,
  productContractTerms,
  businessContractTerms,
  defaultPaymentTerms,
  defaultRenewalTerms,
  defaultTermsOfUse,
} = compiled.exports;
const input = {
  businessId: "business",
  clientId: "client",
  clientName: "Client",
  clientEmail: "",
  clientAddress: "",
  contractorName: "Provider",
  productName: "Software",
  currency: "USD",
  amount: 20,
  billingInterval: "monthly",
  customBillingFrequency: "",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  subscriptionDetails: "Team subscription",
  paymentTerms: defaultPaymentTerms,
  renewalTerms: defaultRenewalTerms,
  termsOfUse: defaultTermsOfUse,
  additionalTerms: "",
  extendsContractId: "",
};
test("standard terms allow generation without entering boilerplate", () => {
  assert.doesNotThrow(() => validateContract(input));
  assert.equal(contractSections(input).length, 5);
});
test("rejects invalid dates, fees, missing terms and unsupported frequencies", () => {
  for (const change of [
    { amount: NaN },
    { amount: -1 },
    { endDate: "2025-12-31" },
    { startDate: "2026-02-30" },
    { termsOfUse: "  " },
    { billingInterval: "fortnightly" },
  ])
    assert.throws(() => validateContract({ ...input, ...change }));
});
test("custom frequency requires text and is preserved in the agreement", () => {
  assert.throws(() =>
    validateContract({ ...input, billingInterval: "custom" }),
  );
  const custom = {
    ...input,
    billingInterval: "custom",
    customBillingFrequency: "Every 45 days",
  };
  assert.doesNotThrow(() => validateContract(custom));
  assert.match(contractSections(custom)[1].body, /billed Every 45 days/);
});
test("extensions handle leap years and preserve custom contract duration", () => {
  assert.deepEqual(
    extensionDates({ endDate: "2028-01-31", billingInterval: "monthly" }),
    { startDate: "2028-02-01", endDate: "2028-02-29" },
  );
  assert.deepEqual(
    extensionDates({
      startDate: "2026-01-01",
      endDate: "2026-01-14",
      billingInterval: "custom",
    }),
    { startDate: "2026-01-15", endDate: "2026-01-28" },
  );
});
test("extended documents include their original reference", () => {
  assert.match(
    contractSections({ ...input, extendsContractId: "original-contract" })[1]
      .body,
    /original-contract/,
  );
});
test("new product defaults are complete and custom wording is preserved exactly", () => {
  assert.equal(productContractTerms(""), defaultTermsOfUse);
  const custom =
    "Product-specific terms\n\nIncludes a separately agreed service level.";
  assert.equal(productContractTerms(custom), custom);
  assert.ok(defaultTermsOfUse.length <= 12000);
  for (const heading of [
    "Authorized users",
    "Acceptable use",
    "Product-specific requirements",
  ])
    assert.ok(defaultTermsOfUse.includes(heading));
});
test("rendering old agreements does not substitute newly improved defaults", () => {
  const old = {
    ...input,
    paymentTerms: "Original payment terms",
    renewalTerms: "Original cancellation terms",
    termsOfUse: "Original product terms",
  };
  const sections = contractSections(old);
  assert.equal(sections[2].body, old.paymentTerms);
  assert.equal(sections[3].body, old.renewalTerms);
  assert.equal(sections[4].body, old.termsOfUse);
});
test("paragraph formatting preserves clause content and Windows line breaks", () => {
  assert.deepEqual(
    contractParagraphs(
      "First clause\r\nwith a second line\r\n\r\nSecond clause",
    ),
    ["First clause\r\nwith a second line", "Second clause"],
  );
});
test("editing preserves identity and validates revised subscription details", () => {
  assert.doesNotThrow(() =>
    validateContractEdit(input, {
      ...input,
      amount: 35,
      productName: "Updated software",
      termsOfUse: "Updated terms",
    }),
  );
  for (const key of ["businessId", "clientId", "extendsContractId"]) {
    assert.throws(() =>
      validateContractEdit(input, { ...input, [key]: "different" }),
    );
  }
  assert.throws(() =>
    validateContractEdit(input, { ...input, endDate: "2025-12-31" }),
  );
});
test("edit form copies saved wording without record metadata or new defaults", () => {
  const saved = {
    ...input,
    id: "existing",
    createdAt: { seconds: 1 },
    termsOfUse: "Original saved terms",
  };
  const draft = contractInput(saved);
  assert.equal(draft.termsOfUse, saved.termsOfUse);
  assert.equal("id" in draft, false);
  assert.equal("createdAt" in draft, false);
  assert.notEqual(draft, saved);
});
test("formal agreement contains requested clauses and resolves company and schedule fields", () => {
  const formal = {
    ...input,
    contractorName: "Company from Settings",
    contractorAddress: "Kampala, Uganda",
    clientAddress: "Client address",
    agreementTerms: template.exports.standardAgreementTerms,
  };
  validateContract(formal);
  const sections = contractSections(formal);
  assert.equal(sections.length, 13);
  assert.match(sections[0].body, /Company from Settings/);
  const text = sections
    .map((section) => `${section.title}\n${section.body}`)
    .join("\n");
  for (const phrase of [
    "99.9%",
    "ISO/IEC 27001:2022",
    "ISO/IEC 25010:2023",
    "ISO/IEC 20000-1:2018",
    "Mbarara, Uganda",
    "Schedule A",
    "Schedule B",
    "twelve (12) months",
    "automatically renews",
  ])
    assert.ok(text.includes(phrase), phrase);
  assert.equal(text.includes("Lightbeam"), false);
  assert.equal(text.includes("[Client"), false);
  assert.ok(formal.agreementTerms.length <= 24000);
  assert.deepEqual(
    sections.slice(1, 11).map((section) => parseInt(section.title, 10)),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});
test("concurrent edits detect added template fields as well as changed values", () => {
  assert.doesNotThrow(() => assertContractUnchanged(input, { ...input }));
  assert.throws(() => assertContractUnchanged(input, { ...input, amount: 99 }));
  assert.throws(() =>
    assertContractUnchanged(input, {
      ...input,
      agreementTerms: template.exports.standardAgreementTerms,
    }),
  );
});
test("custom billing and both product and business terms reach the formal document unchanged", () => {
  const business = {
    contractPaymentTerms: "Pay within 14 days of invoice.",
    contractTerms: "Business-wide confidentiality and support terms.",
  };
  const terms = businessContractTerms(business);
  const contract = {
    ...input,
    ...terms,
    termsOfUse: productContractTerms(
      "Product-specific access and use conditions.",
    ),
    billingInterval: "custom",
    customBillingFrequency: "50% on signing; balance after 45 days",
    agreementTerms: template.exports.standardAgreementTerms,
  };
  validateContract(contract);
  const sections = contractSections(contract);
  assert.equal(
    sections.find((section) => section.title.startsWith("4.")).body,
    business.contractPaymentTerms,
  );
  assert.equal(
    sections.find((section) => section.title.startsWith("Schedule B")).body,
    contract.termsOfUse,
  );
  assert.equal(
    sections.find((section) => section.title.startsWith("Schedule C")).body,
    business.contractTerms,
  );
  assert.ok(
    sections
      .find((section) => section.title.startsWith("Schedule A"))
      .body.includes(contract.customBillingFrequency),
  );
  business.contractTerms = "Later settings change";
  assert.equal(
    contract.businessTerms,
    "Business-wide confidentiality and support terms.",
  );
});
test("general business terms are optional and bounded", () => {
  const defaults = businessContractTerms();
  assert.equal(defaults.businessTerms, "");
  assert.equal(defaults.paymentTerms, defaultPaymentTerms);
  assert.throws(() =>
    validateContract({ ...input, businessTerms: "x".repeat(12001) }),
  );
});
