const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Index.html'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'appsscript.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const mainScript = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
assert(mainScript, 'Index.html must contain the main inline JavaScript block.');
new vm.Script(mainScript[1], { filename: 'Index-inline.js' });

const backendContext = {};
vm.createContext(backendContext);
new vm.Script(
  backend + '\n;globalThis.__evidenceHeaderCount = EVIDENCE_HEADERS.length;',
  { filename: 'Code.gs' }
).runInContext(backendContext);

[
  'sandboxModeButton',
  'evidenceModeButton',
  'labModeDescription',
  'week2EvidenceCard',
  'submissionConfirmationPanel',
  'editor',
  'shellInput'
].forEach(id => {
  assert(html.includes(`id="${id}"`), `Missing required interface control: #${id}`);
});

[
  "glmPythonSandboxCode",
  "glmPythonSandboxOutput",
  "glmWeek2Evidence1",
  "switchLabMode('sandbox')",
  "switchLabMode('evidence')",
  "activeLabMode === 'sandbox'",
  "activeLabMode === 'evidence'",
  'data-sandbox-only',
  'data-evidence-only'
].forEach(text => {
  assert(html.includes(text), `Missing combined-mode behavior: ${text}`);
});

[
  'findEvidenceRecord_',
  'sendSubmissionConfirmationEmail_',
  'alreadySubmitted',
  'Confirmation Email Sent',
  'Email Status'
].forEach(text => {
  assert(backend.includes(text), `Missing submission protection: ${text}`);
});

assert(backendContext.__evidenceHeaderCount === 42, 'Evidence schema must contain 42 columns.');
assert(manifest.runtimeVersion === 'V8', 'Apps Script must use the V8 runtime.');
assert(
  manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.send_mail'),
  'Manifest must include the email-sending scope.'
);

console.log('GLM Python Lab validation passed.');
console.log('- Browser and backend JavaScript parse successfully.');
console.log('- Sandbox and Evidence controls are present and use separate storage.');
console.log('- Final-submission protection and email confirmation are present.');
console.log('- Evidence schema contains 42 columns.');
