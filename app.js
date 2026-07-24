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
let searchQuery = "";
let filterMfg = "";
let filterStatus = "";
let sortKey = "updatedAt_desc";
let currentDetailSheet = null;
let currentGalleryImages = [];
let currentGalleryIndex = 0;

const form = document.getElementById("worksheetForm");
const homePage = document.getElementById("homePage");
const formPage = document.getElementById("formPage");
const dataPage = document.getElementById("dataPage");
const sheetList = document.getElementById("sheetList");
const sheetTableBody = document.getElementById("sheetTableBody");
const emptyState = document.getElementById("emptyState");
const syncStatus = document.getElementById("syncStatus");
const dataStatus = document.getElementById("dataStatus");
const searchInput = document.getElementById("searchInput");
const filterMfgSelect = document.getElementById("filterMfg");
const filterStatusSelect = document.getElementById("filterStatus");
const sortBySelect = document.getElementById("sortBy");
const resetFilterButton = document.getElementById("resetFilterButton");
const detailModal = document.getElementById("detailModal");
const detailBody = document.getElementById("detailBody");
const detailTitle = document.getElementById("detailTitle");
const detailPrintButton = document.getElementById("detailPrintButton");
const detailCloseButton = document.getElementById("detailCloseButton");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

const topicLabels = {
  man: fromEntities("&#3649;&#3617;&#3656;&#3614;&#3636;&#3617;&#3614;&#3660;"),
  machine: fromEntities("&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;&#3592;&#3633;&#3585;&#3619;"),
  material: fromEntities("&#3648;&#3617;&#3655;&#3604;&#3614;&#3621;&#3634;&#3626;&#3605;&#3636;&#3585;"),
  method: fromEntities("&#3585;&#3619;&#3632;&#3610;&#3623;&#3609;&#3585;&#3634;&#3619; / &#3623;&#3636;&#3608;&#3637;&#3585;&#3634;&#3619;")
};

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
  formTitle: fromEntities("&#3585;&#3619;&#3629;&#3585;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621; 4M"),
  detailButton: fromEntities("&#3604;&#3641;&#3619;&#3634;&#3618;&#3621;&#3632;&#3648;&#3629;&#3637;&#3618;&#3604;"),
  mfgModel: fromEntities("MFG / &#3619;&#3640;&#3656;&#3609;"),
  machineLabel: fromEntities("&#3648;&#3588;&#3619;&#3639;&#3656;&#3629;&#3591;/&#3626;&#3606;&#3634;&#3609;&#3637;"),
  collectorLabel: fromEntities("&#3612;&#3641;&#3657;&#3648;&#3585;&#3655;&#3610;&#3586;&#3657;&#3629;&#3617;&#3641;&#3621;"),
  dateLabel: fromEntities("&#3623;&#3633;&#3609;&#3607;&#3637;&#3656;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585;"),
  statusLabel: fromEntities("&#3626;&#3634;&#3606;&#3634;&#3609;&#3632;"),
  problemLabel: fromEntities("&#3629;&#3634;&#3585;&#3634;&#3619;&#3611;&#3633;&#3597;&#3627;&#3634;"),
  engNoteLabel: fromEntities("&#3627;&#3617;&#3634;&#3618;&#3648;&#3627;&#3605;&#3640; / &#3586;&#3657;&#3629;&#3588;&#3635;&#3586;&#3629;&#3591; ENG"),
  noImageInTopic: fromEntities("&#3652;&#3617;&#3656;&#3617;&#3637;&#3619;&#3641;&#3611;&#3616;&#3634;&#3614;&#3649;&#3609;&#3610;"),
  noSheetsYet: fromEntities("&#3618;&#3633;&#3591;&#3652;&#3617;&#3656;&#3617;&#3637;&#3651;&#3610;&#3591;&#3634;&#3609;&#3607;&#3637;&#3656;&#3610;&#3633;&#3609;&#3607;&#3638;&#3585;")
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

let searchDebounce = null;
searchInput?.addEventListener("input", (event) => {
  clearTimeout(searchDebounce);
  const value = event.target.value;
  searchDebounce = setTimeout(() => {
    searchQuery = value;
    render();
  }, 180);
});
filterMfgSelect?.addEventListener("change", (event) => {
  filterMfg = event.target.value;
  render();
});
filterStatusSelect?.addEventListener("change", (event) => {
  filterStatus = event.target.value;
  render();
});
sortBySelect?.addEventListener("change", (event) => {
  sortKey = event.target.value;
  render();
});
resetFilterButton?.addEventListener("click", () => {
  searchQuery = "";
  filterMfg = "";
  filterStatus = "";
  sortKey = "updatedAt_desc";
  if (searchInput) searchInput.value = "";
  if (filterMfgSelect) filterMfgSelect.value = "";
  if (filterStatusSelect) filterStatusSelect.value = "";
  if (sortBySelect) sortBySelect.value = "updatedAt_desc";
  render();
});

sheetTableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".detail-button");
  if (button) openDetail(button.dataset.id);
});
sheetList.addEventListener("click", (event) => {
  const card = event.target.closest(".sheet-card");
  if (card) openDetail(card.dataset.id);
});
sheetList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".sheet-card");
  if (!card) return;
  event.preventDefault();
  openDetail(card.dataset.id);
});
detailBody.addEventListener("click", (event) => {
  const imageButton = event.target.closest("[data-gallery-index]");
  if (imageButton) openLightbox(Number(imageButton.dataset.galleryIndex));
});
detailCloseButton?.addEventListener("click", closeDetail);
detailModal?.addEventListener("click", (event) => {
  if (event.target === detailModal) closeDetail();
});
detailPrintButton?.addEventListener("click", () => {
  if (currentDetailSheet) printSingleSheet(currentDetailSheet);
});
lightboxClose?.addEventListener("click", closeLightbox);
lightboxNext?.addEventListener("click", showNextImage);
lightboxPrev?.addEventListener("click", showPrevImage);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (lightbox && !lightbox.hidden) {
    closeLightbox();
  } else if (detailModal && !detailModal.hidden) {
    closeDetail();
  }
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
  populateFilterOptions();
  const rows = filteredSheets();
  renderMetrics(rows);
  renderList(rows);
  renderTable(rows);
  renderSyncStatus();
  renderRoute();
}

function filteredSheets() {
  let rows = [...state.sheets];
  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    rows = rows.filter((sheet) => [
      sheet.mfg, sheet.model, sheet.machine, sheet.collector, sheet.problem,
      sheet.manNotes, sheet.machineNotes, sheet.materialNotes, sheet.methodNotes, sheet.engNote
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }
  if (filterMfg) rows = rows.filter((sheet) => sheet.mfg === filterMfg);
  if (filterStatus) rows = rows.filter((sheet) => (sheet.sheetStatus || SENT_STATUS) === filterStatus);
  return sortRows(rows, sortKey);
}

function sortRows(rows, key) {
  const sorted = [...rows];
  switch (key) {
    case "updatedAt_asc":
      sorted.sort((a, b) => new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0));
      break;
    case "mfg_asc":
      sorted.sort((a, b) => String(a.mfg || "").localeCompare(String(b.mfg || "")) || String(a.model || "").localeCompare(String(b.model || "")));
      break;
    case "machine_asc":
      sorted.sort((a, b) => String(a.machine || "").localeCompare(String(b.machine || "")));
      break;
    case "updatedAt_desc":
    default:
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }
  return sorted;
}

function populateFilterOptions() {
  if (filterMfgSelect) {
    const options = [...new Set(state.sheets.map((sheet) => sheet.mfg).filter(Boolean))].sort();
    const current = filterMfgSelect.value;
    filterMfgSelect.innerHTML = `<option value="">${escapeHtml(fromEntities("MFG &#3607;&#3633;&#3657;&#3591;&#3627;&#3617;&#3604;"))}</option>` +
      options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    filterMfgSelect.value = options.includes(current) ? current : "";
  }
  if (filterStatusSelect) {
    const options = [...new Set(state.sheets.map((sheet) => sheet.sheetStatus || SENT_STATUS).filter(Boolean))].sort();
    const current = filterStatusSelect.value;
    filterStatusSelect.innerHTML = `<option value="">${escapeHtml(fromEntities("&#3626;&#3634;&#3606;&#3634;&#3609;&#3632;&#3607;&#3633;&#3657;&#3591;&#3627;&#3617;&#3604;"))}</option>` +
      options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    filterStatusSelect.value = options.includes(current) ? current : "";
  }
}

function renderMetrics(rows) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount = state.sheets.filter((sheet) => new Date(sheet.createdAt || 0).getTime() >= weekAgo).length;
  document.getElementById("sheetCount").textContent = state.sheets.length;
  document.getElementById("filteredCount").textContent = rows.length;
  document.getElementById("weekCount").textContent = weekCount;
  document.getElementById("googleMode").textContent = GOOGLE_SCRIPT_URL ? "ON" : "OFF";
}

function renderList(rows) {
  if (!rows.length) {
    sheetList.innerHTML = "";
    return;
  }
  sheetList.innerHTML = rows.map((sheet) => {
    const status = sheet.sheetStatus || SENT_STATUS;
    const isOk = status === SENT_STATUS;
    const photoCount = countImages(sheet);
    return `
    <article class="sheet-card ${isOk ? "" : "status-pending"}" data-id="${escapeHtml(sheet.id)}" tabindex="0">
      <span class="sheet-card-body">
        <span class="sheet-card-top">
          <strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong>
          <span class="status-pill ${isOk ? "" : "status-pending"}">${escapeHtml(status)}</span>
        </span>
        <span class="card-machine">${escapeHtml(sheet.machine)}</span>
        <span class="card-problem">${escapeHtml(sheet.problem)}</span>
        <span class="card-meta">
          <span>${escapeHtml(formatDate(sheet.updatedAt))}</span>
          ${photoCount ? `<span class="photo-count"><svg width="13" height="13"><use href="#i-camera"/></svg>${photoCount}</span>` : ""}
        </span>
      </span>
      <span class="card-arrow"><svg width="16" height="16"><use href="#i-arrow-right"/></svg></span>
    </article>
  `;
  }).join("");
}

function countImages(sheet) {
  return normalizeUrls(sheet.manImageUrls).length
    + normalizeUrls(sheet.machineImageUrls).length
    + normalizeUrls(sheet.materialImageUrls).length
    + normalizeUrls(sheet.methodImageUrls).length;
}

function firstImageUrl(sheet) {
  const groups = [sheet.manImageUrls, sheet.machineImageUrls, sheet.materialImageUrls, sheet.methodImageUrls];
  for (const group of groups) {
    const items = normalizeUrls(group);
    if (items.length) return items[0];
  }
  return "";
}

function renderTable(rows) {
  sheetTableBody.innerHTML = rows.map((sheet) => {
    const status = sheet.sheetStatus || SENT_STATUS;
    const isOk = status === SENT_STATUS;
    const thumb = firstImageUrl(sheet);
    return `
    <tr>
      <td>${formatDate(sheet.updatedAt)}</td>
      <td><strong>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</strong><br><span class="status-pill ${isOk ? "" : "status-pending"}">${escapeHtml(status)}</span></td>
      <td>${escapeHtml(sheet.machine)}</td>
      <td>${escapeHtml(sheet.problem)}</td>
      <td>${thumb ? `<img class="row-thumb" src="${escapeHtml(thumb)}" alt="" loading="lazy">` : ""}${compactNotes(sheet)}</td>
      <td>${escapeHtml(sheet.collector)}<br><span class="muted">${escapeHtml(formatDate(sheet.updatedAt))}</span></td>
      <td class="detail-cell"><button class="button secondary detail-button" type="button" data-id="${escapeHtml(sheet.id)}"><svg width="14" height="14"><use href="#i-eye"/></svg>${escapeHtml(th.detailButton)}</button></td>
    </tr>
  `;
  }).join("");
  emptyState.hidden = rows.length > 0;
  emptyState.innerHTML = rows.length ? "" : `<span class="empty-state-icon"><svg width="22" height="22"><use href="#i-search"/></svg></span><br>${escapeHtml(state.sheets.length ? th.noMatchingSheet : th.noSheetsYet)}`;
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

function openDetail(id) {
  const sheet = state.sheets.find((item) => item.id === id);
  if (!sheet) return;
  currentDetailSheet = sheet;
  currentGalleryImages = collectGalleryImages(sheet);
  detailTitle.textContent = `${sheet.mfg || ""} / ${sheet.model || ""} — ${sheet.machine || ""}`;
  detailBody.innerHTML = renderDetailBody(sheet);
  detailModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeDetail() {
  detailModal.hidden = true;
  document.body.classList.remove("modal-open");
  currentDetailSheet = null;
}

function renderDetailBody(sheet) {
  const topics = [
    ["man", sheet.manNotes, sheet.manImageUrls],
    ["machine", sheet.machineNotes, sheet.machineImageUrls],
    ["material", sheet.materialNotes, sheet.materialImageUrls],
    ["method", sheet.methodNotes, sheet.methodImageUrls]
  ];
  let galleryCursor = 0;
  const topicBlocks = topics.map(([key, note, urls]) => {
    const items = normalizeUrls(urls);
    const startIndex = galleryCursor;
    galleryCursor += items.length;
    return `
      <div class="detail-block ${key}">
        <h3>${escapeHtml(topicLabels[key])}</h3>
        <p>${note ? escapeHtml(note) : `<span class="muted">${escapeHtml(th.no4MNote)}</span>`}</p>
        ${renderDetailGallery(items, startIndex)}
      </div>
    `;
  }).join("");

  return `
    <div class="detail-meta">
      <div><span>MFG</span>${escapeHtml(sheet.mfg)}</div>
      <div><span>${escapeHtml(th.mfgModel)}</span>${escapeHtml(sheet.model)}</div>
      <div><span>${escapeHtml(th.machineLabel)}</span>${escapeHtml(sheet.machine)}</div>
      <div><span>${escapeHtml(th.collectorLabel)}</span>${escapeHtml(sheet.collector)}</div>
      <div><span>${escapeHtml(th.dateLabel)}</span>${escapeHtml(formatDate(sheet.updatedAt))}</div>
      <div><span>${escapeHtml(th.statusLabel)}</span>${escapeHtml(sheet.sheetStatus || SENT_STATUS)}</div>
    </div>
    <div class="detail-block">
      <h3>${escapeHtml(th.problemLabel)}</h3>
      <p>${escapeHtml(sheet.problem)}</p>
    </div>
    <div class="detail-note-grid">${topicBlocks}</div>
    ${sheet.engNote ? `
      <div class="detail-block">
        <h3>${escapeHtml(th.engNoteLabel)}</h3>
        <p>${escapeHtml(sheet.engNote)}</p>
      </div>
    ` : ""}
  `;
}

function renderDetailGallery(urls, startIndex) {
  if (!urls.length) return "";
  return `<div class="detail-image-gallery">${urls.map((url, index) => `
    <button type="button" data-gallery-index="${startIndex + index}">
      <img src="${escapeHtml(url)}" alt="4M photo" loading="lazy">
    </button>
  `).join("")}</div>`;
}

function collectGalleryImages(sheet) {
  const topics = [
    ["man", sheet.manImageUrls],
    ["machine", sheet.machineImageUrls],
    ["material", sheet.materialImageUrls],
    ["method", sheet.methodImageUrls]
  ];
  const images = [];
  topics.forEach(([key, urls]) => {
    normalizeUrls(urls).forEach((url) => images.push({ url, label: topicLabels[key] }));
  });
  return images;
}

function openLightbox(index) {
  if (!currentGalleryImages.length) return;
  currentGalleryIndex = ((index % currentGalleryImages.length) + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxImage();
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
}

function showNextImage() {
  currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
  updateLightboxImage();
}

function showPrevImage() {
  currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxImage();
}

function updateLightboxImage() {
  const item = currentGalleryImages[currentGalleryIndex];
  if (!item) return;
  lightboxImage.src = item.url;
  lightboxImage.alt = item.label;
  lightboxCaption.textContent = `${item.label} (${currentGalleryIndex + 1}/${currentGalleryImages.length})`;
}

function printSingleSheet(sheet) {
  const topics = [
    ["man", sheet.manNotes, sheet.manImageUrls],
    ["machine", sheet.machineNotes, sheet.machineImageUrls],
    ["material", sheet.materialNotes, sheet.materialImageUrls],
    ["method", sheet.methodNotes, sheet.methodImageUrls]
  ];
  const topicsHtml = topics.map(([key, note, urls]) => `
    <section style="border:1px solid #d6cfc1;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
      <h3 style="margin:0 0 6px;font-size:1rem;">${escapeHtml(topicLabels[key])}</h3>
      <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 8px;">${escapeHtml(note || "-")}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${normalizeUrls(urls).map((url) => `<img src="${escapeHtml(url)}" alt="4M photo" style="width:120px;height:120px;object-fit:cover;border:1px solid #d6cfc1;border-radius:6px;">`).join("")}
      </div>
    </section>
  `).join("");

  const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>4M Worksheet - ${escapeHtml(sheet.mfg)} ${escapeHtml(sheet.model)}</title>
<style>
  body { font-family: "Segoe UI", Tahoma, sans-serif; color:#222522; padding: 28px; }
  h1 { font-size: 1.6rem; margin: 0 0 4px; }
  .meta { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin: 16px 0; }
  .meta div { border:1px solid #d6cfc1; border-radius:8px; padding:8px 10px; }
  .meta span { display:block; color:#666b68; font-size:0.75rem; text-transform:uppercase; margin-bottom:2px; }
</style>
</head><body>
  <h1>4M Worksheet</h1>
  <p style="color:#666b68;margin-top:0;">${escapeHtml(formatDate(sheet.updatedAt))}</p>
  <div class="meta">
    <div><span>MFG / Model</span>${escapeHtml(sheet.mfg)} / ${escapeHtml(sheet.model)}</div>
    <div><span>${escapeHtml(th.machineLabel)}</span>${escapeHtml(sheet.machine)}</div>
    <div><span>${escapeHtml(th.collectorLabel)}</span>${escapeHtml(sheet.collector)}</div>
  </div>
  <section style="border:1px solid #d6cfc1;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
    <h3 style="margin:0 0 6px;font-size:1rem;">${escapeHtml(th.problemLabel)}</h3>
    <p style="white-space:pre-wrap;line-height:1.5;margin:0;">${escapeHtml(sheet.problem)}</p>
  </section>
  ${topicsHtml}
  ${sheet.engNote ? `
  <section style="border:1px solid #d6cfc1;border-radius:8px;padding:12px 14px;">
    <h3 style="margin:0 0 6px;font-size:1rem;">${escapeHtml(th.engNoteLabel)}</h3>
    <p style="white-space:pre-wrap;line-height:1.5;margin:0;">${escapeHtml(sheet.engNote)}</p>
  </section>` : ""}
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
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
  const rows = filteredSheets().map((sheet) => header.map((key) => {
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
