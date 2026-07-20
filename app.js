const STORAGE_KEY = "fourMWorksheetForEng.v1";
const GOOGLE_SCRIPT_URL = window.APP_CONFIG?.googleScriptUrl || "";

const state = loadState();
let activeId = null;

const form = document.getElementById("worksheetForm");
const sheetList = document.getElementById("sheetList");
const sheetTableBody = document.getElementById("sheetTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
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
  draft: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3626;&#3656;&#3591;"),
  ready: fromEntities("&#3614;&#3619;&#3657;&#3629;&#3617;&#3626;&#3656;&#3591; ENG"),
  needMore: fromEntities("ENG &#3586;&#3629;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3648;&#3614;&#3636;&#3656;&#3617;"),
  closed: fromEntities("&#3611;&#3636;&#3604;&#3648;&#3588;&#3626;"),
  improved: fromEntities("&#3604;&#3637;&#3586;&#3638;&#3657;&#3609;"),
  noChange: fromEntities("&#3652;&#3617;&#3656;&#3648;&#3611;&#3621;&#3637;&#3656;&#3618;&#3609;"),
  worse: fromEntities("&#3649;&#3618;&#3656;&#3621;&#3591;"),
  needAnalysis: fromEntities("&#3619;&#3629; ENG &#3623;&#3636;&#3648;&#3588;&#3619;&#3634;&#3632;&#3627;&#3660;")
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
      machine: "1-212",
      collector: "Operator A",
      problem: "Part dimension out of spec after model change.",
      manNotes: "- Same operator as normal lot\n- No training change\n- Confirmed hand work sequence",
      machineNotes: "- Machine setting was changed during model change\n- Fixture lock has small looseness\n- No alarm during run",
      materialNotes: "- Same supplier\n- New material lot started this morning\n- Surface appearance normal",
      methodNotes: "- Adjusted condition once\n- Pre-check was not done before first trial\n- Need ENG to confirm standard condition",
      sheetStatus: "Ready for ENG",
      engNote: "Please compare standard condition for U12/14 and confirm fixture wear limit.",
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
searchInput.addEventListener("input", render);

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
    sheetStatus: data.get("sheetStatus"),
    engNote: clean(data.get("engNote"))
  };
}

function fillForm(sheet) {
  activeId = sheet.id;
  for (const [key, value] of Object.entries(sheet)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value ?? "";
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
}

function filteredSheets() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return state.sheets;
  return state.sheets.filter((sheet) => [
    sheet.mfg,
    sheet.model,
    sheet.machine,
    sheet.problem,
    sheet.manNotes,
    sheet.machineNotes,
    sheet.materialNotes,
    sheet.methodNotes,
    sheet.sheetStatus
  ].join(" ").toLowerCase().includes(query));
}

function renderMetrics() {
  document.getElementById("sheetCount").textContent = state.sheets.length;
  document.getElementById("readyCount").textContent = state.sheets.filter((sheet) => sheet.sheetStatus === "Ready for ENG").length;
  document.getElementById("closedCount").textContent = state.sheets.filter((sheet) => sheet.sheetStatus === "Closed").length;
}

function renderList(rows) {
  if (!rows.length) {
    sheetList.innerHTML = `<p class="empty-state">${escapeHtml(th.noMatchingSheet)}</p>`;
    return;
  }
  sheetList.innerHTML = rows.map((sheet) => `
    <button class="sheet-card ${sheet.id === activeId ? "is-active" : ""}" type="button" data-id="${sheet.id}">
      <strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong>
      <span>${escapeHtml(sheet.machine)}</span>
      <span>${escapeHtml(displayStatus(sheet.sheetStatus))} - ${formatDate(sheet.updatedAt)}</span>
    </button>
  `).join("");
  sheetList.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const sheet = state.sheets.find((item) => item.id === button.dataset.id);
      if (sheet) fillForm(sheet);
    });
  });
}

function renderTable(rows) {
  sheetTableBody.innerHTML = rows.map((sheet) => `
    <tr>
      <td>${formatDate(sheet.updatedAt)}</td>
      <td><strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong></td>
      <td>${escapeHtml(sheet.machine)}</td>
      <td>${escapeHtml(sheet.problem)}</td>
      <td>${compactNotes(sheet)}</td>
      <td><span class="badge">${escapeHtml(displayStatus(sheet.sheetStatus))}</span><br><span class="muted">${escapeHtml(sheet.collector)}</span></td>
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
      sheet_status: sheet.sheetStatus,
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
  document.getElementById("sheetStatus").value = "Draft";
}

function resultClass(result) {
  if (result === "Improved") return "success";
  if (result === "Worse") return "fail";
  if (result === "Need analysis") return "wait";
  return "";
}

function displayStatus(status) {
  const map = {
    Draft: th.draft,
    "Ready for ENG": th.ready,
    "ENG need more data": th.needMore,
    Closed: th.closed
  };
  return map[status] || status;
}

function displayResult(result) {
  const map = {
    Improved: th.improved,
    "No change": th.noChange,
    Worse: th.worse,
    "Need analysis": th.needAnalysis
  };
  return map[result] || result;
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
