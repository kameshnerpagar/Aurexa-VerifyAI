# Aurexa VerifyAI

> **"Intelligent Verification. Transparent Compliance. Faster Decisions."**
> **Smart India Hackathon (SIH) 2026 Prototype**
> **Problem Statement ID:** SIH26261
> **Theme:** Smart Automation
> **Organization:** All India Council for Technical Education (AICTE)

---

## 1. Executive Summary

**Aurexa VerifyAI** is a government-grade, decision-support platform designed for AICTE scrutiny officers and institutional applicants. It automates preliminary validation, multi-way cross-document consistency verification, regulatory compliance rule evaluation (Approval Process Handbook 2026-27), infrastructure geotag audits, and audit reporting.

### Core Philosophy: Decision-Support, Not Autonomous Decision-Making
- **Explainable AI & Heuristics:** Every risk score and discrepancy is accompanied by primary evidence citations (observed value vs. statutory benchmark).
- **No Fabricated Authenticity:** The platform strictly adheres to the principle that OCR text extraction, plausible document layout, or decoded QR strings alone **do not prove legal authenticity**. Genuine validation requires cryptographic trust anchors (Controller of Certifying Authorities Class 3 DSC) or authoritative queries to State Issuer registries (Fire Services, Revenue, Affiliating Universities).
- **Human Authority Preserved:** Final statutory approval or rejection remains solely with authorized AICTE competent committees.

---

## 2. Technical Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Recharts.
- **Backend:** Node.js v22 (using built-in zero-dependency high-concurrency `node:sqlite` DatabaseSync with WAL mode), Express REST API, Multer (secure file upload).
- **Document Processing:** PDF text parsing (`pdf-parse`), SHA-256 cryptographic hashing (`crypto`), regex pattern extractors for dates, PIDs, sanctioned intake caps, and simulated QR decode streamers.
- **Database:** Disk-persisted SQLite database (`server/data/verifyai.db`) with relational integrity, foreign key cascades, and transactions.

---

## 3. Architecture & Pluggable Subsystems

```
                                      +---------------------------------------------+
                                      |          Aurexa VerifyAI Frontend           |
                                      |      React + TypeScript + Tailwind CSS      |
                                      +---------------------------------------------+
                                                             |
                                                     REST APIs (Port 5001)
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
|                                            Node.js / Express Backend                                              |
|                                                                                                                   |
|  +--------------------+   +---------------------+   +---------------------+   +--------------------------------+  |
|  |  Document Intake   |   |   Cross-Document    |   | Compliance Engine   |   |  Explainable Anomaly Scorer    |  |
|  |  & Hash Extraction |-->| Consistency Engine  |-->| (APH 2026-27 Rules) |-->|  Weighted Prioritization (0-100)|  |
|  +--------------------+   +---------------------+   +---------------------+   +--------------------------------+  |
|             |                                                                                 |                   |
|             v                                                                                 v                   |
|  +-------------------------------------------------------------+              +--------------------------------+  |
|  |             Pluggable Verification Adapters                 |              | Append-Only Audit Ledger       |  |
|  | - Class 3 DSC Cryptographic Signature Chain Validator       |              | - Immutable Event Store        |  |
|  | - API Setu / State Fire / University Mock Issuer Registry   |              | - Actor, Timestamp, IP, Reason |  |
|  | - Cadastral Geolocation & Land Title Verification Gateway   |              +--------------------------------+  |
|  +-------------------------------------------------------------+                                                  |
+-------------------------------------------------------------------------------------------------------------------+
                                                             |
                                                             v
                                        +-----------------------------------------+
                                        |  SQLite Database (server/data/verifyai) |
                                        |  12 Applications & 8 Master Institutions|
                                        +-----------------------------------------+
```

---

## 4. Addressing Hardcoding vs Dynamic Persistence

### What is dynamic and data-driven in this project?
1. **Database-Driven:** All 8 institutions, 12 benchmark applications, application details, document metadata, extractions, findings, compliance rules, infrastructure items, notifications, and audit logs reside in SQLite.
2. **Dynamic Cross-Document Checks:** Comparisons (institution names, PIDs, dates, intake quotas, SHA-256 hash duplicates) are calculated dynamically across database tables.
3. **Editable Compliance Rules Engine:** Administrators can create new rules, edit existing rules (which automatically increments the version counter to preserve past evaluation audits), and toggle rules on/off in real time.
4. **Interactive Reviewer Corrections:** Reviewers can edit OCR misreads directly through the UI. The platform preserves the original OCR string, stores the corrected value, logs the mandatory justification, and immediately recalculates application compliance and risk scores.
5. **False Positive Dismissal Protocol:** Requires mandatory reviewer justification recorded in the append-only audit trail.
6. **Live Multi-Step Application Wizard:** Submitting a new institutional application saves data to SQLite, uploads supporting documents, runs OCR and verification adapters, logs audit events, creates reviewer notifications, and redirects to the review workspace.
7. **One-Click Demo Reset:** Re-seeds SQLite to pristine benchmark state at any time.

### What is simulated (Mock Adapters)?
- External government integrations (DigiLocker, State Fire Service portals, Dharani Land Gateway, CCA Root CA) are implemented via structured mock adapters backed by the SQLite `mock_issuer_registry` table. Every simulated result is explicitly labeled `DEMO / SIMULATED` to prevent false claims of live government API access.

---

## 5. Seeded Scenarios (12 Benchmark Applications)

| App ID | Institution Name | Category | Status | Risk Score | Seeded Scenario Characteristics |
|---|---|---|---|---|---|
| **APP-2026-1001** | Apex Institute of Technology | Extension of Approval | Ready for Official Decision | 5 (Low) | Complete application, 100% verified documents, valid Class 3 DSC, zero discrepancies. |
| **APP-2026-1002** | Kaveri College of Engg | New Institution Approval | Deficiencies Flagged | 65 (High) | Mandatory Affiliating University NOC missing from application bundle. |
| **APP-2026-1003** | Vidya Sagar Mgmt Studies | Extension of Approval | Deficiencies Flagged | 55 (Medium) | Fire Safety NOC expired on 31-Dec-2024 (fails academic year 2026-27 cut-off). |
| **APP-2026-1004** | Nalanda Polytechnic | Change in Site / Campus | Manual Review Required | 70 (High) | Building Safety Certificate cites obsolete legacy PID 1-9876543 vs active PID. |
| **APP-2026-1005** | Saraswati Institute of Pharmacy | Increase in Intake | Deficiencies Flagged | 80 (Critical) | Applied for 120 intake in B.Pharm; University NOC sanctions only 60 seats. |
| **APP-2026-1006** | Godavari Academy | Extension of Approval | Manual Review Required | 75 (High) | Duplicate file hash: Land Deed and Building Safety upload identical file payloads. |
| **APP-2026-1007** | Himalaya Institute | Extension of Approval | Manual Review Required | 85 (Critical) | Untrusted digital signature (self-signed CA not recognized by CCA India trust store). |
| **APP-2026-1008** | Deccan College of Architecture | New Institution Approval | Under Preliminary Validation | 35 (Medium) | State Land Revenue API Setu gateway returned 503 HTTP Service Unavailable. |
| **APP-2026-1009** | Apex Institute of Technology | Increase in Intake | Returned for Correction | 45 (Medium) | Reviewer returned application requesting revised audited financial sheet. |
| **APP-2026-1010** | Kaveri College of Engg | New Institution Approval | Inspection Recommended | 65 (High) | Lab photo GPS coordinates deviate >150km from claimed campus coordinates. |
| **APP-2026-1011** | Vidya Sagar Mgmt Studies | Extension of Approval | Ready for Official Decision | 10 (Low) | Previously deficient; institution resubmitted valid Fire NOC and cleared checks. |
| **APP-2026-1012** | Godavari Academy | Extension of Approval | Ready for Official Decision | 0 (Low) | Exemplary compliance filing with verified certificates across all 8 rules. |

---

## 6. How to Run Locally

### Prerequisites
- Node.js v22+
- npm v10+

### Step 1: Start the Backend Server
```bash
cd "server"
node src/index.js
```
The backend API boots on port `5001`:
- Health check: `http://localhost:5001/api/health`
- Live database: `server/data/verifyai.db`

### Step 2: Start the Frontend Application
In a separate terminal:
```bash
cd "client"
npm run dev
```
The Vite dev server will start at: `http://localhost:5173`

---

## 7. Demo Personas & Credentials

Switch personas directly using the **Role Switcher** in the top navigation bar:

1. **AICTE Reviewer** (Default persona)
   - Name: `Smt. Anita Deshmukh`
   - Email: `reviewer@aicte.gov.in`
   - Role: Run verification engines, review OCR findings, dismiss false positives, request evidence, recommend inspections, mark ready for official review.
2. **Institution Applicant**
   - Name: `Dr. Rajesh Sharma`
   - Email: `applicant@demo.aicte.gov.in`
   - Institution: `Apex Institute of Technology & Research` (PID: 1-348911029)
   - Role: Fill 4-step approval wizard, upload supporting documents, view deficiency notices, track applications.
3. **Administrator**
   - Name: `Dr. Vikramaditya Sen`
   - Email: `admin@aicte.gov.in`
   - Role: Configure and version compliance rules, view immutable audit trails, trigger full demo resets.

---

## 8. Complete End-to-End Walkthrough Sequence

1. **Applicant Login & Wizard:** Select "Institution Applicant", navigate to "New Application", fill in institution and course details, attach supporting documents, and click "Submit to Scrutiny Pipeline".
2. **Automatic Preliminary Scrutiny:** The system hashes documents (SHA-256), extracts text and structured fields, evaluates active APH 2026-27 rules, and calculates an explainable risk score.
3. **Reviewer Evaluation:** Switch to "AICTE Reviewer", open the application in the Review Workspace, inspect the 7 tabs (Overview, Application Info, Documents, Cross-Checks, Compliance, Infrastructure, Audit).
4. **Correction of OCR Misreads:** In the Documents tab, click "Edit / Correct" on an extracted field, input the correct value and justification. Watch the engine automatically re-evaluate consistency.
5. **Disposition of Findings:** In Cross-Document Checks, confirm a real discrepancy or dismiss a false positive by entering the mandatory regulatory reason.
6. **Decision Dossier Generation:** Navigate to "Reports" to preview or print the official AICTE Decision Dossier with QR code, stamps, findings table, and human review disclaimer.
7. **Audit Trail Verification:** Navigate to "Audit Trail" to verify that all actions have been appended to the immutable event log.
8. **One-Click Reset:** In "Settings", click "Reset Demo Dataset" to reset the database for the next judging demonstration.
