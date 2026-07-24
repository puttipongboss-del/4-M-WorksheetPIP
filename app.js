const STORAGE_KEY = "fourMWorksheetForEng.v1";
const GOOGLE_SCRIPT_URL = window.APP_CONFIG?.googleScriptUrl || "";
const SENT_STATUS = "Submitted";
const MAX_IMAGES_PER_TOPIC = 3;
const IMAGE_MAX_SIDE = 1280;
const IMAGE_QUALITY = 0.72;
const IMAGE_FIELDS = [
  { input: "manImages", upload: "manImages", urls: "manImageUrls" },
  { input: "machineImages", upload: "machineImages", urls: "machineImageUrls" },
  { input: "materialImages", upload: "materialImages", urls: "materialImageUrls" },
  { input: "methodImages", upload: "methodImages", urls: "methodImageUrls" }
];

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
const dataStatus = document.getElementById("dataStatus");
const th = {
  noMatchingSheet: fromEntities("&#3652;&#3617;&#3656;&#3614;&#3610;&#3651;&#3610;&#3591;&#3634;&#3609;&#3607;&#3637;&#3656;&#3605;&#3619;&#3591;&#3585;&#3633;&#3610;&#3585;&#3634;&#3619;&#3588;&#3657;&#3609;&#3627;&#3634;"),
  no4MNote: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3617;&#3637;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585; 4M"),
  notConnected: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3652;&#3604;&#3657;&#3651;&#3626;&#3656; Web App URL &#3651;&#3609; config.js"),
  syncReady: fromEntities("&#3648;&#3594;&#3639;&#3656;&#3629;&#3617;&#3605;&#3656;&#3629;&#3649;&#3621;&#3657;&#3623; - &#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3592;&#3632;&#3626;&#3656;&#3591;&#3648;&#3586;&#3657;&#3634; Google Sheet &#3648;&#3617;&#3639;&#3656;&#3629;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585;"),
  syncing: fromEntities("&#3585;&#3635;&#3621;&#3633;&#3591;&#3626;&#3656;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3648;&#3586;&#3657;&#3634; Google Sheet..."),
  synced: fromEntities("&#3626;&#3656;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3649;&#3621;&#3657;&#3623; &#3585;&#3619;&#3640;&#3603;&#3634;&#3605;&#3619;&#3623;&#3592;&#3607;&#3637;&#3656; Google Sheet"),
  syncFailed: fromEntities("&#3626;&#3656;&#3591;&#3652;&#3617;&#3656;&#3626;&#3635;&#3648;&#3619;&#3655;&#3592; &#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3618;&#3633;&#3591;&#3648;&#3585;&#3655;&#3610;&#3651;&#3609;&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3609;&#3637;&#3657;"),
  loadingSheet: fromEntities("&#3585;&#3635;&#3621;&#3633;&#3591;&#3604;&#3638;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3592;&#3634;&#3585; Google Sheet..."),
  loadedSheet: fromEntities("&#3604;&#3638;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3621;&#3656;&#3634;&#3626;&#3640;&#3604;&#3592;&#3634;&#3585; Google Sheet &#3649;&#3621;&#3657;&#3623;"),
  loadSheetFailed: fromEntities("&#3604;&#3638;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3592;&#3634;&#3585; Google Sheet &#3652;&#3617;&#3656;&#3626;&#3635;&#3648;&#3619;&#3655;&#3592; &#3585;&#3635;&#3621;&#3633;&#3591;&#3649;&#3626;&#3604;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3651;&#3609;&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3609;&#3637;&#3657;"),
  readOnlyHint: fromEntities("&#3627;&#3609;&#3657;&#3634;&#3609;&#3637;&#3657;&#3651;&#3594;&#3657;&#3604;&#3641;&#3612;&#3621;&#3648;&#3607;&#3656;&#3634;&#3609;&#3633;&#3657;&#3609; &#3652;&#3617;&#3656;&#3617;&#3637;&#3594;&#3656;&#3629;&#3591;&#3651;&#3627;&#3657;&#3585;&#3619;&#3629;&#3585;&#3649;&#3585;&#3657;&#3652;&#3586;"),
  clearConfirm: fromEntities("&#3605;&#3657;&#3629;&#3591;&#3585;&#3634;&#3619;&#3621;&#3657;&#3634;&#3591;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3651;&#3610;&#3591;&#3634;&#3609;&#3607;&#3633;&#3657;&#3591;&#3627;&#3617;&#3604;&#3651;&#3609;&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3609;&#3637;&#3657;&#3651;&#3594;&#3656;&#3652;&#3627;&#3617;"),
  submittedTitle: fromEntities("&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;&#3607;&#3637;&#3656;&#3626;&#3656;&#3591;&#3652;&#3611;&#3649;&#3621;&#3657;&#3623;"),
  formTitle: fromEntities("&#3585;&#3619;&#3629;&#3585;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621; 4M")
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  try {
    const sheet = await readForm();
    const localSheet = stripImageUploads(sheet);
    let savedSheet;
    if (activeId) {
      const index = state.sheets.findIndex((item) => item.id === activeId);
      if (index >= 0) {
        savedSheet = { ...state.sheets[index], ...localSheet, updatedAt: new Date().toISOString() };
        state.sheets[index] = savedSheet;
      }
    } else {
      savedSheet = { ...localSheet, id: createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.sheets.unshift(savedSheet);
    }
    if (savedSheet) {
      sheet.id = savedSheet.id;
      sheet.createdAt = savedSheet.createdAt;
      sheet.updatedAt = savedSheet.updatedAt;
    }
    activeId = null;
    form.reset();
    resetDefaults();
    saveAndRender();
    if (savedSheet) syncSheetToGoogle(sheet);
    window.location.hash = "submitted";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
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
document.getElementById("refreshButton").addEventListener("click", () => loadSheetsFromGoogle());
window.addEventListener("hashchange", () => {
  renderRoute();
  if (window.location.hash === "#submitted") loadSheetsFromGoogle();
});

async function readForm() {
  const data = new FormData(form);
  const imageUploads = await readImageUploads();
  const sheet = {
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
  if (Object.values(imageUploads).some((items) => items.length)) {
    sheet.imageUploads = imageUploads;
  }
  return sheet;
}

async function readImageUploads() {
  const result = {};
  for (const field of IMAGE_FIELDS) {
    const input = document.getElementById(field.input);
    const files = [...(input?.files || [])]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_IMAGES_PER_TOPIC);
    result[field.upload] = await Promise.all(files.map((file) => imageFileToPayload(file)));
  }
  return result;
}

async function imageFileToPayload(file) {
  const dataUrl = await resizeImage(file);
  return {
    name: safeFileName(file.name || "photo.jpg"),
    type: dataUrl.slice(5, dataUrl.indexOf(";")) || "image/jpeg",
    dataUrl
  };
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(String(reader.result || ""));
      image.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function stripImageUploads(sheet) {
  const { imageUploads, ...rest } = sheet;
  return rest;
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
    [fromEntities("&#3649;&#3617;&#3656;&#3614;&#3636;&#3617;&#3614;&#3660;"), sheet.manNotes, sheet.manImageUrls],
    [fromEntities("&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3592;&#3633;&#3585;&#3619;"), sheet.machineNotes, sheet.machineImageUrls],
    [fromEntities("&#3648;&#3617;&#3655;&#3604;&#3614;&#3621;&#3634;&#3626;&#3605;&#3636;&#3585;"), sheet.materialNotes, sheet.materialImageUrls],
    [fromEntities("&#3585;&#3619;&#3632;&#3610;&#3623;&#3609;&#3585;&#3634;&#3619;/&#3623;&#3636;&#3608;&#3637;&#3585;&#3634;&#3619;"), sheet.methodNotes, sheet.methodImageUrls]
  ].filter(([, value, urls]) => value || normalizeUrls(urls).length);
  if (!parts.length) return `<span class="muted">${escapeHtml(th.no4MNote)}</span>`;
  return parts.map(([label, value, urls]) => {
    const note = value ? ` ${escapeHtml(shortText(value, 56))}` : "";
    return `<strong>${label}:</strong>${note}${renderImageGallery(urls)}`;
  }).join("<br>");
}

function renderImageGallery(urls) {
  const items = normalizeUrls(urls);
  if (!items.length) return "";
  return `<div class="image-gallery">${items.map((url) => `
    <a href="${escapeHtml(url)}" target="_blank" rel="noopener">
      <img src="${escapeHtml(url)}" alt="4M photo" loading="lazy">
    </a>
  `).join("")}</div>`;
}

function normalizeUrls(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
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
    "man_image_urls",
    "machine_image_urls",
    "material_image_urls",
    "method_image_urls",
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
      man_image_urls: normalizeUrls(sheet.manImageUrls).join(" "),
      machine_image_urls: normalizeUrls(sheet.machineImageUrls).join(" "),
      material_image_urls: normalizeUrls(sheet.materialImageUrls).join(" "),
      method_image_urls: normalizeUrls(sheet.methodImageUrls).join(" "),
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
  const { imageUploads, ...sheetWithoutImages } = sheet;
  let textSynced = false;
  try {
    setSyncStatus(th.syncing);
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "upsertWorksheet",
        sheet: sheetWithoutImages
      })
    });
    textSynced = true;
    setSyncStatus(th.synced);
  } catch (error) {
    setSyncStatus(th.syncFailed);
    console.warn("Google Sheet sync failed. Data is still saved locally.", error);
  }

  // Photos are uploaded one at a time, after the text data, so a slow or
  // failing photo can never take the worksheet's text data down with it.
  if (textSynced && imageUploads) {
    await uploadWorksheetImages(sheet.id, sheet, imageUploads);
  }

  if (window.location.hash === "#submitted") {
    setTimeout(() => loadSheetsFromGoogle(), 800);
  }
}

const IMAGE_TOPIC_BY_UPLOAD_KEY = {
  manImages: "man",
  machineImages: "machine",
  materialImages: "material",
  methodImages: "method"
};

async function uploadWorksheetImages(worksheetId, sheet, imageUploads) {
  const items = [];
  IMAGE_FIELDS.forEach((field) => {
    (imageUploads[field.upload] || []).forEach((image) => {
      items.push({ uploadKey: field.upload, image });
    });
  });

  for (const item of items) {
    try {
      await uploadSingleImage(worksheetId, sheet, item.uploadKey, item.image);
    } catch (error) {
      // One bad photo should not stop the rest from uploading.
      console.warn("Image upload failed (continuing with the rest):", error);
    }
  }
}

async function uploadSingleImage(worksheetId, sheet, uploadKey, image) {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "uploadWorksheetImage",
      worksheetId,
      topic: IMAGE_TOPIC_BY_UPLOAD_KEY[uploadKey] || uploadKey,
      mfg: sheet.mfg,
      model: sheet.model,
      machine: sheet.machine,
      image
    })
  });
}

async function loadSheetsFromGoogle() {
  if (!GOOGLE_SCRIPT_URL) {
    setDataStatus(th.notConnected);
    return;
  }
  try {
    setDataStatus(th.loadingSheet);
    const payload = await jsonp(`${GOOGLE_SCRIPT_URL}?action=listWorksheets`);
    if (!payload || payload.ok === false) {
      throw new Error(payload && payload.error ? payload.error : "Google Sheet returned no data");
    }
    mergeSheets(payload.rows || []);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    setDataStatus(th.loadedSheet);
  } catch (error) {
    setDataStatus(th.loadSheetFailed);
    console.warn("Google Sheet load failed. Showing local data instead.", error);
  }
}

function mergeSheets(rows) {
  const byId = new Map(state.sheets.map((sheet) => [sheet.id, sheet]));
  rows.map(normalizeSheet).forEach((sheet) => {
    if (!sheet.id) return;
    const local = byId.get(sheet.id);
    byId.set(sheet.id, newerSheet(local, sheet));
  });
  state.sheets = [...byId.values()].sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
}

function normalizeSheet(sheet) {
  return {
    id: clean(sheet.id),
    createdAt: clean(sheet.createdAt),
    updatedAt: clean(sheet.updatedAt),
    mfg: clean(sheet.mfg),
    model: clean(sheet.model),
    machine: clean(sheet.machine),
    collector: clean(sheet.collector),
    problem: clean(sheet.problem),
    manNotes: clean(sheet.manNotes),
    machineNotes: clean(sheet.machineNotes),
    materialNotes: clean(sheet.materialNotes),
    methodNotes: clean(sheet.methodNotes),
    manImageUrls: normalizeUrls(sheet.manImageUrls),
    machineImageUrls: normalizeUrls(sheet.machineImageUrls),
    materialImageUrls: normalizeUrls(sheet.materialImageUrls),
    methodImageUrls: normalizeUrls(sheet.methodImageUrls),
    sheetStatus: clean(sheet.sheetStatus) || SENT_STATUS,
    engNote: clean(sheet.engNote)
  };
}

function newerSheet(local, remote) {
  if (!local) return remote;
  const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
  return remoteTime >= localTime ? { ...local, ...remote } : local;
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `fourMCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}callback=${callbackName}`;
    script.async = true;

    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP request failed"));
    };

    document.head.appendChild(script);
  });
}

function renderSyncStatus() {
  if (!syncStatus) return;
  syncStatus.textContent = GOOGLE_SCRIPT_URL ? th.syncReady : th.notConnected;
}

function setSyncStatus(message) {
  if (syncStatus) syncStatus.textContent = message;
}

function setDataStatus(message) {
  if (dataStatus) dataStatus.textContent = message || th.readOnlyHint;
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
  if (isData && dataStatus && !dataStatus.dataset.touched) {
    dataStatus.dataset.touched = "true";
    setDataStatus(th.readOnlyHint);
  }
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

function safeFileName(value) {
  return String(value || "photo.jpg")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "photo.jpg";
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
if (window.location.hash === "#submitted") {
  loadSheetsFromGoogle();
}
