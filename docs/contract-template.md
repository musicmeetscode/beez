# Software subscription template

The agreement follows the user's expanded software subscription outline, using the selected company's name and principal business address from Settings. It uses numbered main clauses, Schedule A for commercial details and Schedule B for product terms. There is no hard-coded developer company.

## Defaults and saved agreements

- Settings supplies payment terms. Configured wording is preserved.
- Settings also supplies optional general business terms, included as Schedule C. Product terms appear in Schedule B, and custom billing text is preserved in Schedule A. Reload business terms in the editor explicitly refreshes both business payment and general terms without changing product wording.
- Products supplies software terms. An empty value or the exact original Beez starter text uses the improved template for new drafts. Custom wording is preserved.
- New drafts include 99.9% monthly uptime with a measurement formula, ISO-aligned documented practices, a 30-day invoice deadline, and simple late interest at the lower of 1.5% monthly and the lawful maximum. Configured payment terms are preserved.
- Renewal is automatic for the same subscription duration unless 30 days' notice is given. There is a 30-day material-breach cure period and a 15-day data-export request period following termination. Contractual renewal does not automatically create database records or charge a client.
- Liability is capped at fees paid in the preceding 12 months, with stated exceptions and a warning that the cap may be zero before fees are paid. Uganda law and arbitration seated in Mbarara apply.
- Extensions retain their saved terms. Choosing a product explicitly loads that product's current software terms.
- Saved agreements continue to render their stored text. Template changes do not add new legal obligations to old contracts.
- The Edit action pre-fills a saved contract, including its original terms. Explicit saves update that contract and future PDF downloads; existing downloaded files do not change. The business, client reference, extension reference and creation timestamp remain fixed. Concurrent edits are detected before saving.

The example PDF uses fictional parties and illustrative pricing. It is an unsigned draft. Review the wording with Ugandan counsel and confirm that the company can meet the operational commitments before execution. ISO alignment is a contractual commitment, not proof of certification or a completed external audit. The service wording is not a substitute for a legally required data-processing schedule. The contract uses the same stamp styling as invoices and receipts, labelled AGREEMENT / UNSIGNED COPY; a watermark is not a signature.

Main agreement text is saved with each new contract. Existing contracts keep their original text until explicitly edited. The editor's Use latest software agreement action loads the current main and renewal terms, uses payment terms from Settings, and preserves product-specific wording.

## Reference choices

The current choices follow the user's subsequent instructions rather than Pepperi's New York jurisdiction, three-year term, unilateral price increases, three-month cap, publicity permission or non-solicitation restriction.

Supporting references consulted:

- [Uganda Arbitration and Conciliation Act](https://ulii.org/en/akn/ug/act/2000/7/eng%402024-12-23)
- [Uganda Data Protection and Privacy Act](https://ulii.org/en/akn/ug/act/2019/9/eng%402019-05-03)
- [Personal Data Protection Office](https://www.pdpo.go.ug/information-center)
- [ISO/IEC 27001](https://www.iso.org/standard/27001)
- [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html)
- [ISO/IEC 20000-1:2018](https://www.iso.org/standard/70636.html)

- [WIPO: Technology transfer agreements](https://www.wipo.int/en/web/technology-transfer/agreements) for the separation of licensing and confidentiality obligations.
- [ICO: Contracts and liabilities between controllers and processors](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/) for the distinction between commercial service terms and required data-processing terms where that regime applies.

## Checks

Run `node --test tests/contracts.test.mjs`, followed by `npm run build`. The contract tests include default wording, preserving custom and historical terms, custom billing, date boundaries and paragraph formatting.

Firestore rules must be validated and deployed for live writes. The earlier remote-validation request was declined; local checks do not verify deployed permissions.
