/**
 * GLM Grade 9 Python Lab · Practice Sandbox + Evidence backend
 * ------------------------------------------------
 * Files:
 *   1. Code.gs   (paste this file into Code.gs)
 *   2. Index.html
 *
 * Activity:
 *   G9W02_E1_READ_RUN_EXPLAIN
 *   Learning Evidence 1 — Read, Run, Explain
 *
 * The Practice Sandbox runs locally in the browser and never writes student
 * work to Sheets. The backend stores structured Parts A–D evidence, drafts, final submissions,
 * code, recorded outputs, file confirmation, completion metadata, and email
 * delivery status. Final submissions are immutable and receive one confirmation
 * email attempt.
 * It checks submission completeness but does not expose or apply an answer key.
 */

const CONFIG = {
  SPREADSHEET_ID: '',
  RESULTS_SHEET_NAME: 'G9 Week 2 Evidence',
  LOGO_FILE_ID: '1eF4QN7i0heRo_zipVQk0gDn0o10ZtZWo',
  ALLOWED_DOMAIN: '@glm.edu.co'
};

const WEEK2_ACTIVITY = {
  WEEK: 2,
  ID: 'G9W02_E1_READ_RUN_EXPLAIN',
  TITLE: 'Learning Evidence 1 — Read, Run, Explain',
  CATEGORY: 'Learning Evidence',
  POINTS_POSSIBLE: 100
};

const EVIDENCE_HEADERS = [
  'Timestamp ISO',
  'Saved At',
  'Student Name',
  'Student Email',
  'Section',
  'Week',
  'Activity ID',
  'Activity Title',
  'Category',
  'Points Possible',
  'Status',
  'Completion Percent',
  'Ready For Review',
  'A1 Variables',
  'A2 Input',
  'A2 Processing',
  'A2 Output',
  'A3 Prediction Before Run',
  'A3 Locked At',
  'A4 Change',
  'Run 1 Inputs',
  'Run 1 Output',
  'Run 2 Inputs',
  'Run 2 Output',
  'Required File Name',
  'File Downloaded',
  'File Reopened',
  'Reopened File Name',
  'C1 Fix Log JSON',
  'C2 Corrected Code',
  'C3 Inputs',
  'C3 Output',
  'D1 IPO and Control Explanation',
  'D2 Debugging Step',
  'D2 Explanation',
  'Individual Work Confirmed',
  'Current Editor Code',
  'Last Output',
  'Attempt Number',
  'Submitted By',
  'Confirmation Email Sent',
  'Email Status'
];

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('GLM Python Lab · Sandbox + Evidence')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Run once from the Apps Script editor. */
function setupWeek2Evidence() {
  const ss = getSpreadsheet_();
  const sheet = ensureEvidenceSheet_(ss);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, EVIDENCE_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#0B1F3A')
    .setFontColor('#FFFFFF')
    .setWrap(true);

  sheet.setColumnWidths(1, EVIDENCE_HEADERS.length, 130);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(7, 230);
  sheet.setColumnWidth(8, 260);
  sheet.setColumnWidths(14, 7, 240);
  sheet.setColumnWidths(21, 4, 220);
  sheet.setColumnWidth(29, 320);
  sheet.setColumnWidth(30, 420);
  sheet.setColumnWidths(31, 6, 260);
  sheet.setColumnWidth(37, 420);
  sheet.setColumnWidth(38, 320);
  sheet.setColumnWidth(41, 180);
  sheet.setColumnWidth(42, 320);

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  sheet.getRange(1, 1, sheet.getMaxRows(), EVIDENCE_HEADERS.length).createFilter();

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: CONFIG.RESULTS_SHEET_NAME,
    activityId: WEEK2_ACTIVITY.ID
  };
}

/** Backward-friendly setup name. */
function setupPythonLab() {
  return setupWeek2Evidence();
}

/** Saves either a Draft or a final Submitted record. */
function saveWeek2Evidence(payload) {
  try {
    const clean = validateAndCleanEvidencePayload_(payload);
    const completion = computeCompletion_(clean.evidence);

    if (clean.status === 'Submitted' && !completion.ready) {
      throw new Error('The evidence is incomplete. Finish every required item before submitting.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
      const ss = getSpreadsheet_();
      const sheet = ensureEvidenceSheet_(ss);
      const finalSubmission = findEvidenceRecord_(
        sheet,
        clean.studentEmail,
        clean.activityId,
        true
      );

      if (finalSubmission) {
        return {
          ok: false,
          locked: true,
          alreadySubmitted: true,
          status: 'Submitted',
          savedAt: formatSavedAt_(finalSubmission.values[1]),
          message: 'This evidence was already submitted and is locked. No later changes were saved.'
        };
      }

      const attemptNumber = getNextAttemptNumber_(sheet, clean.studentEmail, clean.activityId);
      const savedAt = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd HH:mm:ss'
      );

      const e = clean.evidence;
      sheet.appendRow([
        clean.timestamp,
        savedAt,
        clean.studentName,
        clean.studentEmail,
        clean.section,
        clean.week,
        clean.activityId,
        clean.activityTitle,
        clean.category,
        clean.pointsPossible,
        clean.status,
        completion.percent,
        completion.ready,
        e.a.variables,
        e.a.ipoInput,
        e.a.ipoProcessing,
        e.a.ipoOutput,
        e.a.prediction,
        e.predictionLockedAt,
        e.a.change,
        e.b.run1Inputs,
        e.b.run1Output,
        e.b.run2Inputs,
        e.b.run2Output,
        e.b.fileName,
        e.b.fileDownloaded,
        e.b.fileReopened,
        e.b.reopenedFileName,
        JSON.stringify(e.c.fixLog),
        e.c.correctedCode,
        e.c.testInputs,
        e.c.testOutput,
        e.d.explanation,
        e.d.debugStep,
        e.d.debugExplanation,
        e.d.integrityConfirmed,
        clean.editorCode,
        clean.lastOutput,
        attemptNumber,
        safeSessionEmail_(),
        false,
        clean.status === 'Submitted' ? 'Pending' : 'Not requested'
      ]);

      const row = sheet.getLastRow();
      sheet.getRange(row, 1, 1, EVIDENCE_HEADERS.length)
        .setVerticalAlignment('top')
        .setWrap(true);

      let emailResult = {
        sent: false,
        status: 'Not requested'
      };

      if (clean.status === 'Submitted') {
        emailResult = sendSubmissionConfirmationEmail_(clean, savedAt, attemptNumber);
        sheet.getRange(row, 41, 1, 2).setValues([[
          emailResult.sent,
          emailResult.status
        ]]);
      }

      return {
        ok: true,
        status: clean.status,
        message: clean.status === 'Submitted'
          ? emailResult.sent
            ? 'Evidence sent successfully. Editing is now locked and a confirmation email was sent.'
            : 'Evidence sent successfully and editing is now locked. The confirmation email could not be sent; ask your teacher for help.'
          : 'Draft saved in Google Sheets.',
        savedAt: savedAt,
        attemptNumber: attemptNumber,
        completionPercent: completion.percent,
        readyForReview: completion.ready,
        locked: clean.status === 'Submitted',
        emailSent: emailResult.sent,
        emailStatus: emailResult.status
      };

    } finally {
      lock.releaseLock();
    }

  } catch (error) {
    return {
      ok: false,
      message: error.message || String(error)
    };
  }
}

/** Returns the newest Week 2 record for one student. */
function getWeek2Evidence(email, activityId) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanActivityId = String(activityId || WEEK2_ACTIVITY.ID).trim();

    if (!isValidGlmEmail_(cleanEmail)) {
      throw new Error('Use a valid institutional email ending in ' + CONFIG.ALLOWED_DOMAIN + '.');
    }

    if (cleanActivityId !== WEEK2_ACTIVITY.ID) {
      throw new Error('The requested Week 2 activity is not available.');
    }

    const ss = getSpreadsheet_();
    const sheet = ensureEvidenceSheet_(ss);
    if (sheet.getLastRow() < 2) {
      return { ok: true, found: false };
    }

    const record = findEvidenceRecord_(sheet, cleanEmail, cleanActivityId, true) ||
      findEvidenceRecord_(sheet, cleanEmail, cleanActivityId, false);

    if (record) {
      const row = record.values;
      const rowActivityId = String(row[6] || '').trim();

      const fixLog = parseFixLog_(row[28]);
      const evidence = {
        activityId: rowActivityId,
        status: String(row[10] || 'Draft'),
        savedAt: formatSavedAt_(row[1]),
        currentPart: 'A',
        predictionLocked: Boolean(row[18]),
        predictionLockedAt: String(row[18] || ''),
        a: {
          variables: String(row[13] || ''),
          ipoInput: String(row[14] || ''),
          ipoProcessing: String(row[15] || ''),
          ipoOutput: String(row[16] || ''),
          prediction: String(row[17] || ''),
          change: String(row[19] || '')
        },
        b: {
          fileName: String(row[24] || 'E1_Lastname_Firstname.py'),
          fileDownloaded: toBoolean_(row[25]),
          fileReopened: toBoolean_(row[26]),
          reopenedFileName: String(row[27] || ''),
          run1Inputs: String(row[20] || ''),
          run1Output: String(row[21] || ''),
          run2Inputs: String(row[22] || ''),
          run2Output: String(row[23] || '')
        },
        c: {
          fixLog: fixLog,
          correctedCode: String(row[29] || ''),
          testInputs: String(row[30] || ''),
          testOutput: String(row[31] || '')
        },
        d: {
          explanation: String(row[32] || ''),
          debugStep: String(row[33] || ''),
          debugExplanation: String(row[34] || ''),
          integrityConfirmed: toBoolean_(row[35])
        },
        editorCode: String(row[36] || ''),
        lastOutput: String(row[37] || '')
      };

      return {
        ok: true,
        found: true,
        status: evidence.status,
        savedAt: evidence.savedAt,
        completionPercent: Number(row[11] || 0),
        readyForReview: toBoolean_(row[12]),
        locked: evidence.status === 'Submitted',
        emailSent: row[40] === '' || row[40] === undefined ? null : toBoolean_(row[40]),
        emailStatus: String(row[41] || ''),
        editorCode: evidence.editorCode,
        lastOutput: evidence.lastOutput,
        evidence: evidence
      };
    }

    return { ok: true, found: false };

  } catch (error) {
    return {
      ok: false,
      found: false,
      message: error.message || String(error)
    };
  }
}

function getLogoDataUri() {
  try {
    if (!CONFIG.LOGO_FILE_ID) {
      return '';
    }
    const file = DriveApp.getFileById(CONFIG.LOGO_FILE_ID);
    const blob = file.getBlob();
    const contentType = blob.getContentType() || 'image/png';
    return 'data:' + contentType + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (error) {
    return '';
  }
}

function validateAndCleanEvidencePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('No evidence data was received.');
  }

  const evidence = normalizeEvidence_(payload.evidence);
  const clean = {
    timestamp: limitText_(payload.timestamp || new Date().toISOString(), 80),
    studentName: limitText_(payload.studentName, 120),
    studentEmail: limitText_(String(payload.studentEmail || '').toLowerCase(), 160),
    section: limitText_(String(payload.section || '').toUpperCase(), 10),
    week: Number(payload.week || WEEK2_ACTIVITY.WEEK),
    activityId: limitText_(payload.activityId || WEEK2_ACTIVITY.ID, 80),
    activityTitle: limitText_(payload.activityTitle || WEEK2_ACTIVITY.TITLE, 200),
    category: limitText_(payload.category || WEEK2_ACTIVITY.CATEGORY, 80),
    pointsPossible: Number(payload.pointsPossible || WEEK2_ACTIVITY.POINTS_POSSIBLE),
    status: String(payload.status || 'Draft') === 'Submitted' ? 'Submitted' : 'Draft',
    editorCode: limitText_(payload.editorCode, 50000),
    lastOutput: limitText_(payload.lastOutput, 30000),
    evidence: evidence
  };

  if (clean.studentName.length < 3) {
    throw new Error('Please write the full student name.');
  }
  if (!isValidGlmEmail_(clean.studentEmail)) {
    throw new Error('Use a valid institutional email ending in ' + CONFIG.ALLOWED_DOMAIN + '.');
  }
  if (!/^9[A-Z]$/.test(clean.section)) {
    throw new Error('Select a valid Grade 9 section.');
  }
  if (clean.week !== WEEK2_ACTIVITY.WEEK || clean.activityId !== WEEK2_ACTIVITY.ID) {
    throw new Error('This deployment accepts only the configured Week 2 evidence activity.');
  }

  clean.activityTitle = WEEK2_ACTIVITY.TITLE;
  clean.category = WEEK2_ACTIVITY.CATEGORY;
  clean.pointsPossible = WEEK2_ACTIVITY.POINTS_POSSIBLE;
  return clean;
}

function normalizeEvidence_(source) {
  const raw = source && typeof source === 'object' ? source : {};
  const a = raw.a && typeof raw.a === 'object' ? raw.a : {};
  const b = raw.b && typeof raw.b === 'object' ? raw.b : {};
  const c = raw.c && typeof raw.c === 'object' ? raw.c : {};
  const d = raw.d && typeof raw.d === 'object' ? raw.d : {};
  const sourceFixLog = Array.isArray(c.fixLog) ? c.fixLog.slice(0, 4) : [];
  const allowedDebugSteps = [
    'Read the error message',
    'Test a value',
    'Compare variable names',
    'Check intended logic'
  ];
  const fixLog = [];

  for (let index = 0; index < 4; index++) {
    const item = sourceFixLog[index] || {};
    fixLog.push({
      problem: limitText_(item.problem, 1500),
      reason: limitText_(item.reason, 2000)
    });
  }

  return {
    activityId: WEEK2_ACTIVITY.ID,
    status: String(raw.status || 'Not started'),
    savedAt: limitText_(raw.savedAt, 80),
    currentPart: /^[ABCD]$/.test(String(raw.currentPart || 'A')) ? String(raw.currentPart || 'A') : 'A',
    predictionLocked: toBoolean_(raw.predictionLocked),
    predictionLockedAt: limitText_(raw.predictionLockedAt, 80),
    a: {
      variables: limitText_(a.variables, 4000),
      ipoInput: limitText_(a.ipoInput, 2500),
      ipoProcessing: limitText_(a.ipoProcessing, 2500),
      ipoOutput: limitText_(a.ipoOutput, 2500),
      prediction: limitText_(a.prediction, 5000),
      change: limitText_(a.change, 3000)
    },
    b: {
      fileName: limitText_(b.fileName || 'E1_Lastname_Firstname.py', 180),
      fileDownloaded: toBoolean_(b.fileDownloaded),
      fileReopened: toBoolean_(b.fileReopened),
      reopenedFileName: limitText_(b.reopenedFileName, 180),
      run1Inputs: limitText_(b.run1Inputs, 1500),
      run1Output: limitText_(b.run1Output, 10000),
      run2Inputs: limitText_(b.run2Inputs, 1500),
      run2Output: limitText_(b.run2Output, 10000)
    },
    c: {
      fixLog: fixLog,
      correctedCode: limitText_(c.correctedCode, 40000),
      testInputs: limitText_(c.testInputs, 1500),
      testOutput: limitText_(c.testOutput, 10000)
    },
    d: {
      explanation: limitText_(d.explanation, 8000),
      debugStep: allowedDebugSteps.indexOf(String(d.debugStep || '')) >= 0
        ? String(d.debugStep)
        : '',
      debugExplanation: limitText_(d.debugExplanation, 6000),
      integrityConfirmed: toBoolean_(d.integrityConfirmed)
    },
    editorCode: limitText_(raw.editorCode, 50000),
    lastOutput: limitText_(raw.lastOutput, 30000)
  };
}

function computeCompletion_(evidence) {
  const e = evidence;
  const inputsDifferent = Boolean(
    e.b.run1Inputs &&
    e.b.run2Inputs &&
    normalizeCheckText_(e.b.run1Inputs) !== normalizeCheckText_(e.b.run2Inputs)
  );
  const fixChecks = [];
  const fileConfirmed = Boolean(
    e.b.fileDownloaded &&
    e.b.fileReopened &&
    /^E1_[A-Za-z0-9-]+_[A-Za-z0-9-]+\.py$/i.test(e.b.fileName) &&
    e.b.fileName.toLowerCase() === e.b.reopenedFileName.toLowerCase()
  );
  e.c.fixLog.forEach(function (item) {
    fixChecks.push(Boolean(item.problem));
    fixChecks.push(Boolean(item.reason));
  });

  const checks = [
    Boolean(e.a.variables),
    Boolean(e.a.ipoInput),
    Boolean(e.a.ipoProcessing),
    Boolean(e.a.ipoOutput),
    Boolean(e.a.prediction),
    Boolean(e.a.change),
    Boolean(e.predictionLocked && e.predictionLockedAt),
    Boolean(e.b.run1Inputs),
    Boolean(e.b.run1Output),
    Boolean(e.b.run2Inputs),
    Boolean(e.b.run2Output),
    inputsDifferent,
    fileConfirmed,
  ].concat(fixChecks).concat([
    Boolean(e.c.correctedCode),
    Boolean(e.c.testInputs),
    Boolean(e.c.testOutput),
    Boolean(e.d.explanation),
    Boolean(e.d.debugStep),
    Boolean(e.d.debugExplanation),
    Boolean(e.d.integrityConfirmed)
  ]);

  const completed = checks.filter(Boolean).length;
  return {
    completed: completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    ready: checks.every(Boolean)
  };
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('G9_WEEK2_EVIDENCE_SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (error) {
      props.deleteProperty('G9_WEEK2_EVIDENCE_SPREADSHEET_ID');
    }
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('G9_WEEK2_EVIDENCE_SPREADSHEET_ID', active.getId());
    return active;
  }

  const created = SpreadsheetApp.create('G9 Week 2 Learning Evidence 1');
  props.setProperty('G9_WEEK2_EVIDENCE_SPREADSHEET_ID', created.getId());
  return created;
}

function ensureEvidenceSheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.RESULTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.RESULTS_SHEET_NAME);
  }

  if (sheet.getMaxColumns() < EVIDENCE_HEADERS.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      EVIDENCE_HEADERS.length - sheet.getMaxColumns()
    );
  }

  const firstRow = sheet.getRange(1, 1, 1, EVIDENCE_HEADERS.length).getValues()[0];
  const needsHeaders = EVIDENCE_HEADERS.some(function (header, index) {
    return String(firstRow[index] || '') !== header;
  });

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, EVIDENCE_HEADERS.length).setValues([EVIDENCE_HEADERS]);
    sheet.getRange(1, 1, 1, EVIDENCE_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0B1F3A')
      .setFontColor('#FFFFFF')
      .setWrap(true);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getNextAttemptNumber_(sheet, studentEmail, activityId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 1;
  }

  const values = sheet.getRange(2, 4, lastRow - 1, 4).getValues();
  let count = 0;
  values.forEach(function (row) {
    const email = String(row[0] || '').trim().toLowerCase();
    const id = String(row[3] || '').trim();
    if (email === studentEmail && id === activityId) {
      count++;
    }
  });
  return count + 1;
}

/**
 * Finds the newest matching record. When submittedOnly is true, drafts are
 * ignored so an older final submission remains authoritative and immutable.
 */
function findEvidenceRecord_(sheet, studentEmail, activityId, submittedOnly) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, EVIDENCE_HEADERS.length).getValues();
  for (let index = values.length - 1; index >= 0; index--) {
    const row = values[index];
    const email = String(row[3] || '').trim().toLowerCase();
    const id = String(row[6] || '').trim();
    const status = String(row[10] || '').trim();

    if (email !== studentEmail || id !== activityId) {
      continue;
    }
    if (submittedOnly && status !== 'Submitted') {
      continue;
    }

    return {
      rowNumber: index + 2,
      values: row
    };
  }

  return null;
}

function sendSubmissionConfirmationEmail_(clean, savedAt, attemptNumber) {
  const subject = 'GLM Python Lab — Learning Evidence 1 submitted';
  const textBody = [
    'Hello ' + clean.studentName + ',',
    '',
    'Your evidence was sent successfully.',
    'Activity: ' + clean.activityTitle,
    'Week: ' + clean.week,
    'Section: ' + clean.section,
    'Submitted at: ' + savedAt,
    'Attempt number: ' + attemptNumber,
    'Status: Submitted',
    '',
    'Editing is now locked. Keep this email as your submission confirmation.',
    '',
    'GLM Python Lab'
  ].join('\n');
  const htmlBody = [
    '<div style="font-family:Arial,sans-serif;line-height:1.55;color:#172033">',
    '<h2 style="color:#0B1F3A">Evidence sent successfully</h2>',
    '<p>Hello ' + escapeHtml_(clean.studentName) + ',</p>',
    '<p>Your Week 2 evidence was submitted successfully.</p>',
    '<table style="border-collapse:collapse">',
    '<tr><td style="padding:4px 12px 4px 0"><strong>Activity</strong></td><td>' + escapeHtml_(clean.activityTitle) + '</td></tr>',
    '<tr><td style="padding:4px 12px 4px 0"><strong>Week</strong></td><td>' + escapeHtml_(clean.week) + '</td></tr>',
    '<tr><td style="padding:4px 12px 4px 0"><strong>Section</strong></td><td>' + escapeHtml_(clean.section) + '</td></tr>',
    '<tr><td style="padding:4px 12px 4px 0"><strong>Submitted at</strong></td><td>' + escapeHtml_(savedAt) + '</td></tr>',
    '<tr><td style="padding:4px 12px 4px 0"><strong>Status</strong></td><td>Submitted</td></tr>',
    '</table>',
    '<p><strong>Editing is now locked.</strong> Keep this email as your submission confirmation.</p>',
    '<p>GLM Python Lab</p>',
    '</div>'
  ].join('');

  try {
    MailApp.sendEmail({
      to: clean.studentEmail,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: 'GLM Python Lab'
    });
    return {
      sent: true,
      status: 'Sent to ' + clean.studentEmail
    };
  } catch (error) {
    return {
      sent: false,
      status: 'Email error: ' + limitText_(error.message || String(error), 500)
    };
  }
}

function escapeHtml_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseFixLog_(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (Array.isArray(parsed)) {
      const result = parsed.slice(0, 4).map(function (item) {
        return {
          problem: String(item && item.problem || ''),
          reason: String(item && item.reason || '')
        };
      });
      while (result.length < 4) {
        result.push({ problem: '', reason: '' });
      }
      return result;
    }
  } catch (error) {
    // Return a clean empty log below.
  }
  return [
    { problem: '', reason: '' },
    { problem: '', reason: '' },
    { problem: '', reason: '' },
    { problem: '', reason: '' }
  ];
}

function formatSavedAt_(value) {
  return value instanceof Date
    ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
    : String(value || '');
}

function normalizeCheckText_(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isValidGlmEmail_(email) {
  return /^[^\s@]+@glm\.edu\.co$/i.test(String(email || '').trim());
}

function toBoolean_(value) {
  return value === true || String(value || '').toLowerCase() === 'true';
}

function limitText_(value, maxLength) {
  const text = String(value === undefined || value === null ? '' : value);
  if (text.length <= maxLength) {
    return text;
  }
  const suffix = '... [trimmed]';
  return text.substring(0, Math.max(0, maxLength - suffix.length)) + suffix;
}

function safeSessionEmail_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (error) {
    return '';
  }
}
