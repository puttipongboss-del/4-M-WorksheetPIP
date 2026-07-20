const STORAGE_KEY = "fourMWorksheetForEng.v1";
const GOOGLE_SCRIPT_URL = window.APP_CONFIG?.googleScriptUrl || "";
const SENT_STATUS = "Submitted";

const state = loadState();
let activeId = null;

const form = document.getElementById("worksheetForm");
const homePage = document.getElementById("homePage");
const formPage = document.getElementById("formPage");
const dataPage = document.getElementById("dataPage");
const sheetList = document.getElementById("sheetList");
const sheetTableBody = document.getElementById("sheetTableBody");
const emptyState = document.getElementById("emptyState");
const syncStatus = document.getElementById("syncStatus");
const th = {
  noMatchingSheet: fromEntities("&#3652;&#3617;&#3656;&#3614;&#3610;&#3651;&#3610;&#3591;&#3634;&#3609;&#3607;&#3637;&#3656;&#3605;&#3619;&#3591;&#3585;&#3633;&#3610;&#3585;&#3634;&#3619;&#3588;&#3657;&#3609;&#3627;&#3634;"),
  no4MNote: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3617;&#3637;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585; 4M"),
  notConnected: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3652;&#3604;&#3657;&#3651;&#3626;&#3656; Web App URL &#3651;&#3609; config.js"),
  syncReady: fromEntities("&#3648;&#3594;&#3639;&#3656;&#3629;&#3617;&#3605;&#3656;&#3629;&#3649;&#3621;&#3657;&#3623; - &#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3592;&#3632;&#3626;&#3656;&#3591;&#3648;&#3586;&#3657;&#3634; Google Sheet &#3648;&#3617;&#3639;&#3656;&#3629;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585;"),
  syncing: fromEntities("&#3585;&#3635;&#3621;&#3633;&#3591;&#3626;&#3656;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3648;&#3586;&#3657;&#3634; Google Sheet..."),
  synced: fromEntities("&#3626;&#3656;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3649;&#3621;&#3657;&#3623; &#3585;&#3619;&#3640;&#3603;&#3634;&#3605;&#3619;&#3623;&#3592;&#3607;&#3637;&#3656; Google Sheet"),
  syncFailed: fromEntities("&#3626;&#3656;&#3591;&#3652;&#3617;&#3656;&#3626;&#3635;&#3648;&#3619;&#3655;&#3592; &#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3618;&#3633;&#3591;&#3648;&#3585;&#3655;&#3610;&#3651;&#3609;&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3609;&#3637;&#3657;"),
  clearConfirm: fromEntities("&#3605;&#3657;&#3629;&#3591;&#3585;&#3634;&#3619;&#3621;&#3657;&#3634;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3651;&#3610;&#3591;&#3634;&#3609;&#3607;&#3633;&#3657;&#3591;&#3627;&#3617;&#3604;&#3651;&#3609;&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3609;&#3637;&#3657;&#3651;&#3594;&#3656;&#3652;&#3627;&#3617;"),
  submittedTitle: fromEntities("&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3607;&#3637;&#3656;&#3626;&#3656;&#3591;&#3652;&#3611;&#3649;&#3621;&#3657;&#3623;"),
  formTitle: fromEntities("&#3585;&#3619;&#3629;&#3585;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621; 4M")
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const sheet = readForm();
  let savedSheet;
  if (activeId) {
    const index = state.sheets.findIndex((item) => item.id === activeId);
    if (index >= 0) {
      savedSheet = { ...state.sheets[index], ...sheet, updatedAt: new Date().toISOString() };
      state.sheets[index] = savedSheet;
    }
  } else {
    savedSheet = { ...sheet, id: createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.sheets.unshift(savedSheet);
  }
  activeId = null;
  form.reset();
  resetDefaults();
  saveAndRender();
  if (savedSheet) syncSheetToGoogle(savedSheet);
  window.location.hash = "submitted";
});

document.getElementById("newSheetButton").addEventListener("click", () => {
  activeId = null;
  form.reset();
  resetDefaults();
  render();
});

document.getElementById("seedDataButton").addEventListener("click", () => {
  if (state.sheets.length) return;
  state.sheets = [
    {
      id: createId(),
      mfg: "NV",
      model: "U12/14",
      machine: "1-212 / MC-04",
      collector: fromEntities("&#3614;&#3609;&#3633;&#3585;&#3591;&#3634;&#3609; A"),
      problem: fromEntities("&#3594;&#3636;&#3657;&#3609;&#3591;&#3634;&#3609;&#3586;&#3609;&#3634;&#3604;&#3648;&#3585;&#3636;&#3609;&#3626;&#3648;&#3611;&#3588;&#3627;&#3621;&#3633;&#3591;&#3648;&#3611;&#3621;&#3637;&#3656;&#3618;&#3609;&#3619;&#3640;&#3656;&#3609;"),
      manNotes: fromEntities("- &#3649;&#3617;&#3656;&#3614;&#3636;&#3617;&#3614;&#3660;&#3617;&#3637;&#3619;&#3629;&#3618;&#3607;&#3637;&#3656;&#3612;&#3636;&#3623;&#3591;&#3634;&#3609;\n- gate &#3617;&#3637;&#3588;&#3619;&#3634;&#3610;&#3648;&#3585;&#3634;&#3632;\n- &#3605;&#3657;&#3629;&#3591;&#3651;&#3627;&#3657; ENG &#3605;&#3619;&#3623;&#3592;&#3626;&#3629;&#3610;&#3626;&#3636;&#3585;"),
      machineNotes: fromEntities("- Setting &#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3648;&#3611;&#3621;&#3637;&#3656;&#3618;&#3609;&#3605;&#3629;&#3609;&#3648;&#3611;&#3621;&#3637;&#3656;&#3618;&#3609;&#3619;&#3640;&#3656;&#3609;\n- &#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3652;&#3617;&#3656;&#3649;&#3592;&#3657;&#3591; alarm\n- &#3588;&#3623;&#3634;&#3617;&#3604;&#3633;&#3609;&#3618;&#3633;&#3591;&#3629;&#3618;&#3641;&#3656;&#3651;&#3609;&#3588;&#3656;&#3634;&#3585;&#3635;&#3627;&#3609;&#3604;"),
      materialNotes: fromEntities("- &#3648;&#3611;&#3621;&#3637;&#3656;&#3618;&#3609; material lot &#3605;&#3629;&#3609;&#3648;&#3594;&#3657;&#3634;\n- &#3652;&#3617;&#3656;&#3614;&#3610;&#3588;&#3619;&#3634;&#3610;&#3594;&#3639;&#3657;&#3609;\n- &#3626;&#3637;&#3648;&#3617;&#3655;&#3604;&#3611;&#3585;&#3605;&#3636;"),
      methodNotes: fromEntities("- &#3611;&#3619;&#3633;&#3610; condition &#3649;&#3621;&#3657;&#3623; 1 &#3588;&#3619;&#3633;&#3657;&#3591;\n- &#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3652;&#3604;&#3657;&#3605;&#3619;&#3623;&#3592;&#3588;&#3656;&#3634;&#3585;&#3656;&#3629;&#3609;&#3607;&#3604;&#3621;&#3629;&#3591;\n- &#3586;&#3629; ENG &#3618;&#3639;&#3609;&#3618;&#3633;&#3609; standard condition"),
      sheetStatus: SENT_STATUS,
      engNote: fromEntities("&#3586;&#3629;&#3651;&#3627;&#3657; ENG &#3648;&#3607;&#3637;&#3618;&#3610;&#3588;&#3656;&#3634; standard condition &#3586;&#3629;&#3591; U12/14 &#3649;&#3621;&#3632;&#3605;&#3619;&#3623;&#3592;&#3626;&#3629;&#3610;&#3626;&#3636;&#3585;&#3649;&#3617;&#3656;&#3614;&#3636;&#3617;&#3614;&#3660;"),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];
  saveAndRender();
});

document.getElementById("clearButton").addEventListener("click", () => {
  if (!confirm(th.clearConfirm)) return;
  state.sheets = [];
  activeId = null;
  form.reset();
  resetDefaults();
  saveAndRender();
});

document.getElementById("exportButton").addEventListener("click", exportCsv);
document.getElementById("printButton").addEventListener("click", () => window.print());
window.addEventListener("hashchange", renderRoute);

function readForm() {
  const data = new FormData(form);
  return {
    mfg: clean(data.get("mfg")),
    model: clean(data.get("model")),
    machine: clean(data.get("machine")),
    collector: clean(data.get("collector")),
    problem: clean(data.get("problem")),
    manNotes: clean(data.get("manNotes")),
    machineNotes: clean(data.get("machineNotes")),
    materialNotes: clean(data.get("materialNotes")),
    methodNotes: clean(data.get("methodNotes")),
    sheetStatus: SENT_STATUS,
    engNote: clean(data.get("engNote"))
  };
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { sheets: [] };
  } catch {
    return { sheets: [] };
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  const rows = filteredSheets();
  renderMetrics();
  renderList(rows);
  renderTable(rows);
  renderSyncStatus();
  renderRoute();
}

function filteredSheets() {
  return state.sheets;
}

function renderMetrics() {
  document.getElementById("sheetCount").textContent = state.sheets.length;
  document.getElementById("localCount").textContent = state.sheets.length;
  document.getElementById("googleMode").textContent = GOOGLE_SCRIPT_URL ? "ON" : "OFF";
}

function renderList(rows) {
  if (!rows.length) {
    sheetList.innerHTML = `<p class="empty-state">${escapeHtml(th.noMatchingSheet)}</p>`;
    return;
  }
  sheetList.innerHTML = rows.map((sheet) => `
    <article class="sheet-card">
      <strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong>
      <span>${escapeHtml(sheet.machine)}</span>
      <span>${escapeHtml(formatDate(sheet.updatedAt))}</span>
    </article>
  `).join("");
}

function renderTable(rows) {
  sheetTableBody.innerHTML = rows.map((sheet) => `
    <tr>
      <td>${formatDate(sheet.updatedAt)}</td>
      <td><strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong></td>
      <td>${escapeHtml(sheet.machine)}</td>
      <td>${escapeHtml(sheet.problem)}</td>
      <td>${compactNotes(sheet)}</td>
      <td>${escapeHtml(sheet.collector)}<br><span class="muted">${escapeHtml(formatDate(sheet.updatedAt))}</span></td>
    </tr>
  `).join("");
  emptyState.hidden = rows.length > 0;
}

function compactNotes(sheet) {
  const parts = [
    [fromEntities("&#3649;&#3617;&#3656;&#3614;&#3636;&#3617;&#3614;&#3660;"), sheet.manNotes],
    [fromEntities("&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3592;&#3633;&#3585;&#3619;"), sheet.machineNotes],
    [fromEntities("&#3648;&#3617;&#3655;&#3604;&#3614;&#3621;&#3634;&#3626;&#3605;&#3636;&#3585;"), sheet.materialNotes],
    [fromEntities("&#3585;&#3619;&#3632;&#3610;&#3623;&#3609;&#3585;&#3634;&#3619;/&#3623;&#3636;&#3608;&#3637;&#3585;&#3634;&#3619;"), sheet.methodNotes]
  ].filter(([, value]) => value);
  if (!parts.length) return `<span class="muted">${escapeHtml(th.no4MNote)}</span>`;
  return parts.map(([label, value]) => `<strong>${label}:</strong> ${escapeHtml(shortText(value, 56))}`).join("<br>");
}

function exportCsv() {
  const header = [
    "created_at",
    "updated_at",
    "mfg",
    "model",
    "machine",
    "collector",
    "problem",
    "man_notes",
    "machine_notes",
    "material_notes",
    "method_notes",
    "sheet_status",
    "eng_note"
  ];
  const rows = state.sheets.map((sheet) => header.map((key) => {
    const map = {
      created_at: formatDate(sheet.createdAt),
      updated_at: formatDate(sheet.updatedAt),
      mfg: sheet.mfg,
      model: sheet.model,
      machine: sheet.machine,
      collector: sheet.collector,
      problem: sheet.problem,
      man_notes: sheet.manNotes,
      machine_notes: sheet.machineNotes,
      material_notes: sheet.materialNotes,
      method_notes: sheet.methodNotes,
      sheet_status: sheet.sheetStatus || SENT_STATUS,
      eng_note: sheet.engNote
    };
    return map[key] ?? "";
  }));
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `4m-worksheet-eng-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function syncSheetToGoogle(sheet) {
  if (!GOOGLE_SCRIPT_URL) {
    renderSyncStatus();
    return;
  }
  try {
    setSyncStatus(th.syncing);
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "upsertWorksheet",
        sheet
      })
    });
    setSyncStatus(th.synced);
  } catch (error) {
    setSyncStatus(th.syncFailed);
    console.warn("Google Sheet sync failed. Data is still saved locally.", error);
  }
}

function renderSyncStatus() {
  if (!syncStatus) return;
  syncStatus.textContent = GOOGLE_SCRIPT_URL ? th.syncReady : th.notConnected;
}

function setSyncStatus(message) {
  if (syncStatus) syncStatus.textContent = message;
}

function resetDefaults() {
}

function renderRoute() {
  const route = window.location.hash;
  const isForm = route === "#form";
  const isData = route === "#submitted";
  homePage.hidden = isForm || isData;
  formPage.hidden = !isForm;
  dataPage.hidden = !isData;
  document.body.classList.toggle("home-route", !isForm && !isData);
  document.body.classList.toggle("form-route", isForm);
  document.body.classList.toggle("data-route", isData);
  document.title = isForm ? th.formTitle : isData ? th.submittedTitle : "4 M Worksheet";
}

function fromEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function shortText(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function clean(value) {
  return String(value ?? "").trim();
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
