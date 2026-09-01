const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('Code.gs', 'utf8');
const context = {
  console,
  Date,
  JSON,
  Math,
  String,
  Number,
  Boolean,
  Array,
  Object,
  RegExp,
  Error
};
vm.createContext(context);
new vm.Script(
  source + '\n;globalThis.__headerCount = EVIDENCE_HEADERS.length;',
  { filename: 'Code.gs' }
).runInContext(context);

const rows = [];

function makeRange(values = []) {
  return {
    getValues() {
      return values;
    },
    setVerticalAlignment() {
      return this;
    },
    setWrap() {
      return this;
    },
    setValues(next) {
      if (next?.[0]?.length === 2 && rows.length) {
        rows[rows.length - 1][40] = next[0][0];
        rows[rows.length - 1][41] = next[0][1];
      }
      return this;
    }
  };
}

const sheet = {
  getLastRow() {
    return rows.length + 1;
  },
  getRange(row, column, numberOfRows, numberOfColumns) {
    if (row === 2 && column === 1) {
      return makeRange(
        rows.slice(0, numberOfRows).map(item => item.slice(0, numberOfColumns))
      );
    }
    if (row === 2 && column === 4) {
      return makeRange(
        rows.slice(0, numberOfRows).map(item => item.slice(3, 3 + numberOfColumns))
      );
    }
    return makeRange();
  },
  appendRow(values) {
    rows.push(values.slice());
  }
};

context.LockService = {
  getScriptLock: () => ({ waitLock() {}, releaseLock() {} })
};
context.Utilities = {
  formatDate: () => '2026-09-01 09:00:00'
};
context.Session = {
  getScriptTimeZone: () => 'America/Bogota',
  getActiveUser: () => ({ getEmail: () => 'teacher@glm.edu.co' })
};

const sentMail = [];
context.MailApp = {
  sendEmail(message) {
    sentMail.push(message);
  }
};
context.getSpreadsheet_ = () => ({});
context.ensureEvidenceSheet_ = () => sheet;

const payload = {
  timestamp: '2026-09-01T14:00:00.000Z',
  studentName: 'Sample Student',
  studentEmail: 'sample@glm.edu.co',
  section: '9A',
  week: 2,
  activityId: 'G9W02_E1_READ_RUN_EXPLAIN',
  activityTitle: 'Learning Evidence 1 — Read, Run, Explain',
  category: 'Learning Evidence',
  pointsPossible: 100,
  status: 'Submitted',
  editorCode: 'print("done")',
  lastOutput: 'done',
  evidence: {
    currentPart: 'D',
    predictionLocked: true,
    predictionLockedAt: '2026-09-01T13:00:00.000Z',
    a: {
      variables: 'variables',
      ipoInput: 'input',
      ipoProcessing: 'processing',
      ipoOutput: 'output',
      prediction: 'prediction',
      change: 'change'
    },
    b: {
      fileName: 'E1_Student_Sample.py',
      fileDownloaded: true,
      fileReopened: true,
      reopenedFileName: 'E1_Student_Sample.py',
      run1Inputs: 'Ana, 20',
      run1Output: 'short',
      run2Inputs: 'Ana, 40',
      run2Output: 'full'
    },
    c: {
      fixLog: [1, 2, 3, 4].map(number => ({
        problem: `problem ${number}`,
        reason: `reason ${number}`
      })),
      correctedCode: 'print("fixed")',
      testInputs: 'Ana, 30',
      testOutput: 'fixed'
    },
    d: {
      explanation: 'IPO and control explanation',
      debugStep: 'Read the error message',
      debugExplanation: 'It identified the line.',
      integrityConfirmed: true
    }
  }
};

const first = context.saveWeek2Evidence(payload);
const second = context.saveWeek2Evidence({ ...payload, status: 'Draft' });
const loaded = context.getWeek2Evidence(payload.studentEmail, payload.activityId);

if (context.__headerCount !== 42 || rows[0].length !== 42) {
  throw new Error('The sheet schema and appended row must both contain 42 values.');
}
if (!first.ok || !first.locked || !first.emailSent) {
  throw new Error('The final submission was not accepted, locked, and emailed.');
}
if (sentMail.length !== 1 || sentMail[0].to !== payload.studentEmail) {
  throw new Error('The confirmation email was not sent exactly once to the student.');
}
if (second.ok || !second.locked || !second.alreadySubmitted) {
  throw new Error('A later write was not rejected.');
}
if (!loaded.ok || loaded.status !== 'Submitted' || loaded.emailSent !== true) {
  throw new Error('The authoritative submitted record did not reload correctly.');
}

console.log('GLM Python Lab backend-state validation passed.');
console.log('- A complete final submission is accepted and emailed once.');
console.log('- Later writes are rejected as locked.');
console.log('- The authoritative submitted record reloads correctly.');
