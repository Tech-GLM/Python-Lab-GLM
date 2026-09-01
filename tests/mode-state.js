const fs = require('fs');
const vm = require('vm');

class ClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(...items) {
    items.forEach(item => this.values.add(item));
  }

  remove(...items) {
    items.forEach(item => this.values.delete(item));
  }

  toggle(item, force) {
    if (force === undefined) {
      if (this.values.has(item)) {
        this.values.delete(item);
      } else {
        this.values.add(item);
      }
    } else if (force) {
      this.values.add(item);
    } else {
      this.values.delete(item);
    }
    return this.values.has(item);
  }

  contains(item) {
    return this.values.has(item);
  }
}

class ElementSpan {
  constructor() {
    this.textContent = '';
  }
}

class Element {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.readOnly = false;
    this.checked = false;
    this.files = [];
    this.style = {};
    this.dataset = {};
    this.className = '';
    this.classList = new ClassList();
    this.listeners = {};
    this.attributes = {};
    this.childSpan = new ElementSpan();
  }

  addEventListener(type, callback) {
    (this.listeners[type] ||= []).push(callback);
  }

  dispatch(type) {
    (this.listeners[type] || []).forEach(callback => callback.call(this, { target: this }));
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] || '';
  }

  appendChild() {}
  removeChild() {}
  focus() {}
  select() {}
  setSelectionRange() {}
  scrollIntoView() {}

  querySelector(selector) {
    return selector === 'span' ? this.childSpan : new Element('child');
  }

  querySelectorAll() {
    return [];
  }
}

const elements = new Map();
const get = id => {
  if (!elements.has(id)) {
    elements.set(id, new Element(id));
  }
  return elements.get(id);
};

[
  'editor', 'highlight', 'lineNumbers', 'output', 'plotArea', 'guiPreview', 'engineSelect',
  'enginePill', 'engineHelp', 'librariesPanel', 'loadLibrariesButton', 'libraryHint',
  'scriptEditorPane', 'pythonShellPane', 'scriptEditorActions', 'shellActions', 'editorTab',
  'shellTab', 'shellTranscript', 'shellInput', 'shellRunButton', 'studentName', 'studentEmail',
  'studentSection', 'profilePill', 'exerciseList', 'exerciseDetails', 'exerciseCounter',
  'manualStatus', 'studentReflection', 'saveStatusBox', 'week2EvidenceForm', 'editorLockNotice',
  'evidenceProgressFill', 'evidenceCompletionPill', 'submissionStatusBadge', 'submitEvidenceButton',
  'submissionConfirmationPanel', 'submissionConfirmationTitle', 'submissionConfirmationText',
  'sandboxModeButton', 'evidenceModeButton', 'labModeDescription', 'headerModeSubtitle',
  'week2Title', 'modeHeroText', 'resultsModeText', 'modeWorkflowNote', 'runButton',
  'saveRunButton', 'saveDraftButton', 'pythonFileInput', 'eA1Variables', 'eA2Input',
  'eA2Processing', 'eA2Output', 'eA3Prediction', 'eA4Change', 'eFileName', 'eRun1Inputs',
  'eRun1Output', 'eRun2Inputs', 'eRun2Output', 'eC2CorrectedCode', 'eC3Inputs', 'eC3Output',
  'eD1Explanation', 'eD2Explanation', 'eIntegrityConfirmed', 'lockPredictionButton',
  'fileConfirmationStatus', 'sidebarFileStatus', 'finalCheck1', 'finalCheck2', 'finalCheck3',
  'finalCheck4', 'finalCheck5', 'stepButtonA', 'stepButtonB', 'stepButtonC', 'stepButtonD',
  'evidencePanelA', 'evidencePanelB', 'evidencePanelC', 'evidencePanelD', 'runtimeInfo',
  'extraPackages'
].forEach(get);

[1, 2, 3, 4].forEach(number => {
  get(`eFix${number}Problem`);
  get(`eFix${number}Reason`);
});

get('engineSelect').value = 'brython';
get('output').textContent = 'No output yet.';
get('submissionConfirmationPanel').hidden = true;

const evidenceControls = [
  get('eA1Variables'), get('eA2Input'), get('eA2Processing'), get('eA2Output'),
  get('eA3Prediction'), get('eA4Change'), get('eFileName'), get('eIntegrityConfirmed')
];
const scriptButtons = [get('shellRunButton')];
const toolbarButtons = [get('runButton')];
const evidenceButtons = [get('submitEvidenceButton')];

const body = new Element('body');
body.classList.add('sandbox-mode');

const document = {
  body,
  getElementById: get,
  createElement: id => new Element(id),
  addEventListener() {},
  execCommand() {
    return true;
  },
  querySelector(selector) {
    if (selector === 'input[name="debugStep"]:checked') {
      return null;
    }
    return null;
  },
  querySelectorAll(selector) {
    if (selector === 'input[name="debugStep"]') {
      return [];
    }
    if (selector.includes('#week2EvidenceForm input') && selector.includes('#week2EvidenceForm textarea')) {
      return evidenceControls;
    }
    if (selector.includes('#scriptEditorActions button')) {
      return scriptButtons;
    }
    if (selector.includes('.toolbar button:not')) {
      return toolbarButtons;
    }
    if (selector.includes('.evidence-save-bar button')) {
      return evidenceButtons;
    }
    if (selector.includes('.settings-area input')) {
      return [get('engineSelect'), get('loadLibrariesButton')];
    }
    return [];
  }
};

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  }
};

const loadCallbacks = [];
const context = {
  console,
  document,
  localStorage,
  navigator: {},
  Blob: function Blob() {},
  FileReader: function FileReader() {},
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  Date,
  JSON,
  Math,
  String,
  Number,
  Boolean,
  Array,
  Object,
  RegExp,
  Error,
  Promise,
  setTimeout(callback) {
    callback();
    return 1;
  },
  clearTimeout() {},
  prompt: () => '',
  alert() {},
  confirm: () => true
};

context.window = context;
context.window.addEventListener = (type, callback) => {
  if (type === 'load') {
    loadCallbacks.push(callback);
  }
};
context.window.setTimeout = callback => {
  callback();
  return 1;
};
context.window.clearTimeout = () => {};
context.window.prompt = () => '';
context.window.confirm = () => true;

vm.createContext(context);
const html = fs.readFileSync('Index.html', 'utf8');
const mainScript = html.match(/<script>\s*([\s\S]*?)<\/script>/i)[1];
const testExports = `
;globalThis.__modeTest = {
  switchLabMode,
  setEditor(value) { editor.value = value; },
  dispatchEditorInput() { editor.dispatch('input'); },
  submitForTest() {
    week2Evidence.status = 'Submitted';
    week2Evidence.predictionLocked = true;
    week2Evidence.emailSent = true;
    week2Evidence.savedAt = '2026-09-01 09:00:00';
  },
  state() {
    return {
      activeLabMode,
      editorValue: editor.value,
      editorDisabled: editor.disabled,
      confirmationHidden: submissionConfirmationPanel.hidden,
      evidenceInputDisabled: document.getElementById('eA1Variables').disabled,
      sandboxCode: localStorage.getItem('glmPythonSandboxCode'),
      evidenceCode: week2Evidence.editorCode
    };
  }
};`;

new vm.Script(mainScript + testExports, { filename: 'Index-inline.js' }).runInContext(context);
loadCallbacks.forEach(callback => callback());

let state = context.__modeTest.state();
if (state.activeLabMode !== 'sandbox' || state.editorDisabled) {
  throw new Error('Sandbox did not initialize unlocked.');
}

context.__modeTest.setEditor('sandbox_value = 42');
context.__modeTest.dispatchEditorInput();
context.__modeTest.switchLabMode('evidence');
state = context.__modeTest.state();
if (state.editorValue || !state.editorDisabled || state.evidenceCode) {
  throw new Error('Evidence buffer was contaminated by Sandbox code.');
}

context.__modeTest.switchLabMode('sandbox');
state = context.__modeTest.state();
if (state.editorValue !== 'sandbox_value = 42' || state.editorDisabled) {
  throw new Error('Sandbox buffer did not restore.');
}

context.__modeTest.submitForTest();
context.__modeTest.switchLabMode('evidence');
state = context.__modeTest.state();
if (!state.editorDisabled || state.confirmationHidden || !state.evidenceInputDisabled) {
  throw new Error('Submitted evidence was not locked.');
}

context.__modeTest.switchLabMode('sandbox');
state = context.__modeTest.state();
if (
  state.editorDisabled ||
  !state.confirmationHidden ||
  !state.evidenceInputDisabled ||
  state.editorValue !== 'sandbox_value = 42'
) {
  throw new Error('Sandbox was not safely available after submission.');
}

console.log('GLM Python Lab mode-state validation passed.');
console.log('- Sandbox initializes unlocked.');
console.log('- Sandbox and Evidence editor buffers remain separate.');
console.log('- Evidence remains locked after final submission.');
console.log('- Sandbox remains available after final submission.');
