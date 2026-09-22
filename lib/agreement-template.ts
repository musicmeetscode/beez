// These are contractual undertakings for review, not claims about certifications
// or a live system's measured performance. Persist the text with each contract.
export const subscriptionPaymentTerms = `4.1. Subscription fees are stated in Schedule A in the specified currency and are exclusive of applicable taxes unless Schedule A expressly states otherwise. The Developer shall identify any applicable tax on its invoices and provide legally required tax documentation. Any withholding required by law must be supported by the relevant certificate.

4.2. Fees are invoiced in advance at the billing frequency in Schedule A, including any expressly agreed custom schedule. The Client shall pay each invoice within thirty (30) days of its date using the Developer's written payment instructions. An expressly agreed payment schedule in Schedule A prevails over this default deadline.

4.3. Overdue undisputed amounts may attract simple interest at the lower of 1.5% per month and the maximum lawful rate, calculated proportionately for the period overdue without compounding. The Developer shall notify the Client before applying a late charge. The Client shall promptly identify any invoice dispute and pay undisputed sums when due; the parties shall work in good faith to resolve the disputed portion.

4.4. Additional users, implementation, migration, training, integrations, bespoke development and expenses are chargeable only where included in Schedule A or separately approved in writing with their scope and price. Fees do not increase automatically on renewal; a change requires written agreement. Neither party may unilaterally change these payment terms.`;

export const subscriptionRenewalTerms = `6.1. The Agreement takes effect on the Effective Date in Schedule A and continues through the initial end date stated there, unless terminated earlier under this clause. It automatically renews for successive periods equal to the initial subscription term, at the existing fees and scope, unless either party gives written notice of non-renewal at least thirty (30) days before the then-current term ends. A signed extension may instead establish a different renewal period or expressly revised terms. Billing frequency and subscription duration are distinct.

6.2. Either party may terminate for a material breach that remains unremedied thirty (30) days after written notice describing the breach and requesting its remedy. Termination must be communicated in writing. A temporary suspension shall be proportionate and limited to what is reasonably necessary to address an immediate security threat, unlawful use or overdue undisputed payment after the applicable notice and cure period. The Developer shall explain the reason as soon as practicable and restore access promptly when it is resolved.

6.3. On expiry or termination, the right to use the Software ceases, subject to the data-export assistance below. Amounts accrued before termination remain payable. If the Client terminates for the Developer's unremedied material breach, the Developer shall refund prepaid fees attributable to the unused subscription period within thirty (30) days. Other refunds or early termination for convenience require written agreement, subject to rights that cannot lawfully be excluded.

6.4. Upon a written request received within fifteen (15) calendar days after termination, the Developer shall provide an export of Client Data in a commonly used, machine-readable format, such as CSV or JSON with attachments in their existing formats, within fifteen (15) calendar days of the request. The Developer shall retain exportable Client Data throughout that request period and until a timely export request is fulfilled. A standard export is included; bespoke conversion requires prior written agreement on cost.

6.5. After the export period and completion of any timely request, the Developer shall securely delete or return Client Data in accordance with applicable law and documented retention arrangements, except data that must be retained by law or isolated backup copies awaiting scheduled deletion. Retained data remains protected and may not be used for another purpose. Confidentiality, intellectual property, accrued payment obligations, liability provisions and dispute resolution survive as required to give them effect.`;

export const subscriptionProductTerms = `Authorized users and subscription limits
Access is limited to the Client's authorized users and the features, usage limits and service scope stated in Schedule A. The Client must safeguard credentials, administer user permissions and notify the Developer promptly of suspected unauthorized access.

Acceptable use
The Client must not resell access, share accounts with unauthorized persons, introduce malicious code, interfere with the Software or other customers, infringe third-party rights, or use the service unlawfully. Reverse engineering and source-code extraction are prohibited except to the extent expressly permitted by applicable law.

Product-specific requirements
The Client is responsible for compatible devices, connectivity and the accuracy and lawfulness of its submissions. Additional integrations, user limits, support arrangements and product-specific requirements may be specified here or in Schedule A. These product terms supplement the main Software Subscription Agreement.`;

export const standardAgreementTerms = `1. SCOPE OF SERVICES AND SUBSCRIPTION
1.1. Definitions. "Developer" and "Client" mean the parties identified above; together they are the "Parties". "Software" means the hosted product and included features identified in Schedule A. "Client Data" means information and materials supplied by or on behalf of the Client. "Authorized Users" means persons the Client permits to use the Software within its subscription limits. "Subscription Term" means the initial and any renewal period described in Schedule A and clause 6.

1.2. License grant. Subject to payment and compliance with this Agreement, the Developer grants the Client a non-exclusive, non-transferable subscription right to access and use the Software solely for its internal business operations during the Subscription Term. This right is revocable only in accordance with the suspension and termination provisions. No source-code delivery, ownership transfer or right to sublicense is granted. Authorized Users must comply with Schedule B.

1.3. Scope and changes. The Developer shall provide the subscribed features and included support with reasonable care and skill. Implementation, training, migration, custom development and integrations are included only if expressly stated in Schedule A or an agreed statement of work. Material scope changes and additional charges require prior written agreement. Maintenance and updates must not materially reduce the contracted core functionality during a paid term without the Client's written agreement.

1.4. Availability commitment. The Developer shall operate the production Software for access 24 hours a day, seven days a week and guarantees monthly availability of at least 99.9%, excluding qualifying scheduled maintenance. Availability is measured for the subscribed production service, not test or staging environments.

1.5. Measurement. Monthly Availability (%) = 100 x (Eligible Minutes minus Unavailable Minutes) / Eligible Minutes. Eligible Minutes are the minutes within the active Subscription Term in the calendar month, less qualifying scheduled-maintenance minutes. Unavailable Minutes are minutes in which the core production service cannot be accessed or used because of a failure within the Developer's service, including its hosting providers. Measurement uses monitoring logs and reasonably substantiated Client reports. Failures solely in the Client's equipment, connectivity or unauthorized changes are not Developer service unavailability. If there are no Eligible Minutes, no availability percentage is calculated for that month.

1.6. Maintenance and incident handling. Scheduled maintenance qualifies for exclusion only where the Developer gives at least forty-eight (48) hours' prior written notice, describes the affected service and expected duration, and performs it within the announced window. Emergency or unannounced maintenance counts as unavailability for this calculation. The Developer shall provide a support contact at activation, record incidents, prioritize service outages and security incidents, and communicate material progress and restoration. This Agreement does not promise an unstated support response time.

1.7. SLA remedies. On written request, the Developer shall provide a monthly availability report. Where availability falls below 99.9%, it shall investigate, explain the cause and provide a corrective-action plan. Repeated or material failure may be addressed under clause 6. Service credits apply only if expressly agreed in Schedule A; their absence does not remove other remedies available under this Agreement or applicable law.

2. ISO FRAMEWORK ALIGNMENT AND QUALITY ASSURANCE
2.1. The Developer shall establish, document, operate and periodically review practices aligned with ISO/IEC 27001:2022 for information-security management, ISO/IEC 25010:2023 for software product quality, and ISO/IEC 20000-1:2018 for IT service management, as applicable to the subscribed service. These are contractual process commitments. They do not represent accredited certification, completion of an external audit, or conformity of every control unless separately evidenced in writing with the certification scope and validity.

2.2. Security management. The Developer shall maintain a risk-based security programme with assigned responsibilities, access controls, least-privilege permissions, secure configuration, appropriate encryption, logging, incident handling, backup and recovery procedures, and supplier oversight. It shall document security risks, treatment actions and periodic reviews, and correct identified deficiencies according to their severity.

2.3. Software quality. The Developer shall apply documented testing and change-control practices addressing functional suitability, reliability, security, performance efficiency and maintainability. Material releases shall undergo appropriate review and testing, with rollback or recovery arrangements. The Developer shall track defects and remedial actions; this obligation does not replace the measurable availability commitment in clause 1.

2.4. Service management. Support requests, incidents, problems and releases shall be recorded and managed through defined processes with ownership, prioritization and escalation. The Developer shall review service performance and improvement actions periodically and retain proportionate records.

2.5. Assurance. The Developer shall perform documented security reviews and vulnerability assessments at least annually and following material security-relevant changes, with remediation prioritized by risk. On reasonable written request it shall provide a proportionate summary of relevant controls, assessment findings and corrective actions, subject to confidentiality and protection of other customers and sensitive security information. A reference to an ISO framework is not an ISO endorsement.

3. CLIENT DATA, PRIVACY AND SECURITY
3.1. Ownership and instructions. The Client retains all rights in Client Data. The Developer shall process it only to deliver, maintain, secure and support the service on documented Client instructions, or as required by law. It shall not sell Client Data or use it for unrelated advertising. The Client shall ensure that it has the necessary rights and lawful basis to supply the data and give processing instructions.

3.2. Applicable requirements. Each Party shall comply with the obligations applicable to it under Uganda's Data Protection and Privacy Act, 2019, the Data Protection and Privacy Regulations, 2021, and other applicable data-protection law. To the extent the Developer processes personal data for the Client, the Parties shall document the processing purpose, duration, data categories, affected individuals, locations, subprocessors and instructions in a data-processing schedule before that processing begins. This clause does not replace particulars required by law.

3.3. Safeguards and personnel. The Developer shall maintain appropriate technical and organizational safeguards against loss, destruction, alteration and unauthorized access or disclosure. Access shall be limited to authorized personnel who need it for the service and are subject to confidentiality duties. The Developer shall ensure that any engaged subprocessor is contractually bound to appropriate safeguards and remains responsible for its subcontracted service obligations.

3.4. Incidents and assistance. On discovering a suspected or confirmed security incident affecting Client Data, the Developer shall notify the Client without undue delay, preserve relevant evidence, investigate, mitigate and provide available information and updates. The Parties shall cooperate with legally required notifications, data-subject requests and regulatory inquiries. Statutory notification duties and deadlines apply independently of this contractual notice.

3.5. Transfers and exit. Hosting or transfer outside Uganda must comply with applicable transfer requirements and the documented processing arrangements. Data shall not be retained longer than lawfully necessary. Export, return and deletion following termination are governed by clause 6; any mandatory legal retention must remain restricted and protected.

5. INTELLECTUAL PROPERTY RIGHTS
5.1. The Developer and its licensors retain all rights in the Software, source code, algorithms, interfaces, designs, documentation and their updates, modifications and derivative works. The Client acquires only the subscription rights expressly granted. Nothing transfers the Client's pre-existing intellectual property or ownership of Client Data.

5.2. The Client shall not remove proprietary notices or copy, distribute, sublicense or otherwise exploit the Software beyond the permitted subscription use, except as allowed by mandatory law. Rights in separately commissioned deliverables must be addressed expressly in the applicable signed statement of work; payment alone does not transfer source-code ownership.

5.3. Each Party shall promptly notify the other of a third-party claim concerning the service or materials it supplied and reasonably cooperate in addressing it. Neither Party may admit liability or settle a claim on the other's behalf without written authority. No additional indemnity is implied by this clause.

7. LIMITATION OF LIABILITY
7.1. To the maximum extent permitted by law, neither Party is liable to the other for indirect, incidental, special, consequential or punitive damages, including loss of profit, loss of data or business interruption to the extent those losses fall within the excluded categories. This does not reclassify direct losses as indirect losses or remove express data-export, refund or payment obligations.

7.2. Subject to clause 7.3, the Developer's total cumulative liability arising from or connected with this Agreement, in contract, tort or otherwise, shall not exceed the total subscription fees actually paid by the Client in the twelve (12) months immediately preceding the event giving rise to the claim. Related events arising from the same cause shall be treated as one event. The cap may be zero if no fees have been paid in that period.

7.3. No exclusion or cap applies to fraud, deliberate misconduct, or liability that cannot lawfully be excluded or limited. The Parties' statutory obligations to regulators or data subjects are not displaced by this allocation of liability between the Parties. The Client's obligation to pay properly due fees and the Developer's obligation to make expressly due refunds are not reduced by the damages cap.

8. GOVERNING LAW AND DISPUTE RESOLUTION
8.1. This Agreement and disputes connected with it are governed by the laws of Uganda. A Party raising a dispute shall give written notice identifying the issues and requested remedy. Authorized representatives shall attempt good-faith resolution for thirty (30) days after receipt of that notice.

8.2. An unresolved dispute capable of arbitration shall be finally resolved by binding arbitration under Uganda's Arbitration and Conciliation Act, as amended. The legal seat shall be Mbarara, Uganda, the language English, and the tribunal one independent arbitrator agreed by the Parties. If they cannot agree within thirty (30) days of an arbitration request, appointment shall proceed through the appointing authority or court having jurisdiction under that Act. Hearings may take place remotely or elsewhere by agreement without changing the seat.

8.3. The tribunal shall issue a reasoned award and determine costs subject to applicable law. The award is binding, subject to statutory rights of challenge and enforcement. Either Party may seek urgent interim relief from a competent court without waiving arbitration. Matters that cannot lawfully be arbitrated remain for the competent authority or court. Undisputed obligations continue during a dispute unless lawfully suspended or terminated.

9. CONFIDENTIALITY
9.1. Non-public technical, commercial, financial and customer information disclosed in connection with this Agreement is confidential where marked as such or reasonably understood to be confidential. Each Party shall use it only to perform this Agreement, protect it with at least reasonable care, and disclose it only to personnel or advisers who need it and are bound to protect it.

9.2. This obligation does not cover information lawfully known beforehand, independently developed without using the disclosure, lawfully received without a duty of confidence, or public without breach. Disclosure required by law is permitted to the required extent, with prior notice where lawful. Neither Party may use the other's name, logo or relationship for publicity without written consent.

10. GENERAL PROVISIONS
10.1. Entire agreement and priority. This document, including Schedules A and B, Schedule C where present, and any expressly incorporated signed statement of work or data-processing schedule, records the Parties' agreement on its subject matter. Mandatory law prevails. A data-processing schedule controls personal-data processing where it conflicts with general service wording. Expressly agreed deviations in Schedule A control the relevant commercial provision; otherwise the main clauses prevail over the supplementary terms in Schedules B and C. Unstated website terms or later unilateral updates are not incorporated automatically.

10.2. Notices and changes. Notices shall be in writing to the email or physical contact details exchanged by the Parties and identified in Schedule A where available. Each Party must notify changes promptly. Email notice is effective when receipt is acknowledged or otherwise evidenced; a failed-delivery message is not receipt. Amendments, waivers and agreed extensions require written agreement by authorized representatives. Failure to enforce a provision on one occasion is not a general waiver.

10.3. Events beyond reasonable control. An affected Party shall promptly notify the other of a qualifying event beyond its reasonable control, mitigate its effects and resume performance as soon as reasonably possible. This does not excuse accrued payment obligations, override statutory duties, or add exclusions to the uptime calculation. A prolonged material inability to perform may be addressed under clause 6.

10.4. Assignment and independence. Neither Party may transfer this Agreement without the other's prior written consent, not unreasonably withheld. Permitted subcontracting does not release the Developer from its obligations. The Parties are independent contractors; neither may bind the other or represent a partnership or agency relationship.

10.5. Severability and execution. If a provision is unenforceable, the remainder continues to the extent lawful and the Parties shall seek a valid replacement reflecting the original intent. This Agreement may be signed in counterparts, including legally effective electronic signatures. Each signatory represents that they are authorized to bind the identified Party. A generated PDF or watermark alone is not a signature or evidence of execution.`;

export function agreementSections(text: string) {
  const blocks = text.split(/\n\n(?=\d+\. [A-Z])/);
  return blocks.map((block) => {
    const newline = block.indexOf("\n");
    return newline === -1
      ? { title: "Agreement terms", body: block }
      : { title: block.slice(0, newline), body: block.slice(newline + 1) };
  });
}
