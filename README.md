# GLM Python Lab

One student-facing Google Apps Script web app with two focused tools:

1. **Practice Sandbox** — a free Python workspace for trying code without submitting anything.
2. **Evidence Submission** — the guided Grade 9 Week 2 activity with Google Sheets tracking, final locking, and student email confirmation.

The Sandbox opens by default. Its code and output use separate browser-storage keys, so experiments cannot overwrite the evidence editor buffer.

## Student experience

### Practice Sandbox

- Script Editor for complete programs.
- Python Shell for line-by-line experimentation.
- Brython for fast fundamentals and browser GUI activities.
- Pyodide for numpy, pandas, matplotlib, and other compatible packages.
- Starter examples for basic Python, data/plots, and browser GUIs.
- Open, download, copy, clear, and run code without a student profile.
- No Sandbox code or output is sent to Google Sheets.

### Evidence Submission

- Institutional student profile using `@glm.edu.co`.
- Guided Parts A–D for **Learning Evidence 1 — Read, Run, Explain**.
- Prediction locking before the first evidence run.
- Two recorded Program 1 tests, file confirmation, debugging log, corrected code, and individual explanation.
- Draft storage in Google Sheets.
- Final submission is immutable in both the interface and backend.
- One confirmation-email attempt to the student.
- Persistent in-app confirmation, including email-delivery status.
- Students can return to the Practice Sandbox after submitting, while the evidence remains read-only.

## Repository structure

```text
.
├── Code.gs                 # Apps Script backend and evidence persistence
├── Index.html              # Combined Sandbox + Evidence interface
├── appsscript.json         # Apps Script V8 manifest and required scopes
├── .clasp.example.json     # Example clasp connection file
├── .github/workflows/
│   └── validate.yml        # GitHub syntax and structure check
├── tests/
│   └── validate.js         # Dependency-free repository validation
└── README.md
```

## Deploy manually in Google Apps Script

1. Create or open the Google Sheet that will store evidence.
2. Open **Extensions → Apps Script**.
3. Replace `Code.gs` with this repository's `Code.gs`.
4. Create an HTML file named `Index` and paste `Index.html` into it.
5. Open **Project Settings** and enable the manifest file if needed, then use `appsscript.json` from this repository.
6. Run `setupWeek2Evidence()` once from the editor.
7. Accept the requested Spreadsheet, Drive-logo, user-email, and send-email permissions.
8. Choose **Deploy → New deployment → Web app**.
9. Execute as the deploying account and choose the access level required by GLM.
10. Publish the resulting single URL in Schoology.

When updating an existing deployment, use **Deploy → Manage deployments → Edit**, choose **New version**, and deploy. This preserves the existing web-app URL.

## Deploy with clasp

Install and authenticate clasp:

```bash
npm install -g @google/clasp
clasp login
```

Copy the example connection file and insert the Apps Script project ID:

```bash
cp .clasp.example.json .clasp.json
clasp push
clasp open
```

Create or update the web-app deployment from the Apps Script deployment screen.

## Configuration

Edit `CONFIG` in `Code.gs`:

- `SPREADSHEET_ID`: leave empty for a bound spreadsheet or automatic one-time creation.
- `RESULTS_SHEET_NAME`: destination tab for Week 2 evidence.
- `LOGO_FILE_ID`: optional institutional logo stored in Google Drive.
- `ALLOWED_DOMAIN`: institutional email suffix.

The configured activity is `G9W02_E1_READ_RUN_EXPLAIN` for Week 2.

## Submission integrity

The browser lock improves the student experience, while the backend is authoritative. Inside a script lock, the backend searches for an existing final submission before accepting any new draft or submission. Once a matching student/activity record has status `Submitted`, all later writes are rejected.

Email failure does not discard a completed submission. The row remains finalized and locked, the delivery error is stored in the sheet, and the web app tells the student to contact the teacher.

## Validate locally

```bash
node tests/validate.js
node tests/mode-state.js
node tests/backend-state.js
```

The check parses the browser JavaScript and Apps Script backend and verifies the combined-mode controls, separate Sandbox storage, submission lock, confirmation message, and 42-column evidence schema.

## Important hosting note

GitHub stores and versions the source code. The working application must still be deployed as a Google Apps Script web app because `google.script.run`, Google Sheets, Drive, and `MailApp` are server-side Apps Script services. GitHub Pages alone cannot provide those backend features.
