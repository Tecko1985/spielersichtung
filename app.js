// ---------- Helpers ----------
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Lokales Datum (nicht toISOString/UTC), sonst verschiebt sich das Datum
// zwischen Mitternacht und ~02:00 deutscher Zeit auf den Vortag.
function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function isoToDisplay(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function todayDisplay() { return isoToDisplay(todayIso()); }

function distinctValues(list, field) {
  return [...new Set(list.map((x) => (x[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
}

// ---------- State ----------
let appData = { players: [], clubs: [] };
let currentUser = null;
let editingPlayerId = null;
let editingClubId = null;
let persistTimer = null;

const PLAYER_FIELDS = [
  "nachname", "vorname", "geschlecht", "geburtsdatum", "verein", "position", "trikotnummer", "passnummer",
  "stuetzpunktSpieler", "stuetzpunkt", "sichtungDurch", "bemerkungen", "zustaendigkeit", "kontaktDurchWen",
  "kontaktMitVerein", "kontaktMitEltern", "rueckinfoNachEinladung", "probetrainingAm", "zusageProbetraining", "wechsel"
];

// ---------- Status ----------
function computeStatus(p) {
  const wechsel = (p.wechsel || "").trim().toLowerCase();
  const zusage = (p.zusageProbetraining || "").trim().toLowerCase();
  if (wechsel === "ja") return { key: "gewechselt", label: "✅ Gewechselt" };
  if (wechsel.startsWith("nein")) return { key: "abgesagt", label: "❌ Kein Wechsel" };
  if (zusage === "ja") return { key: "probetraining", label: "🏃 Probetraining bestätigt" };
  const hatKontakt = [p.kontaktMitVerein, p.kontaktMitEltern, p.kontaktDurchWen].some((v) => (v || "").trim() !== "");
  if (hatKontakt) return { key: "kontakt", label: "📞 Kontakt läuft" };
  return { key: "neu", label: "🆕 Neu gesichtet" };
}

// ---------- Datalisten & Filter-Optionen ----------
function fillSelectOptions(selectId, values, allLabel) {
  const el = document.getElementById(selectId);
  const current = el.value;
  el.innerHTML = `<option value="">${allLabel}</option>` + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (values.includes(current)) el.value = current;
}

function fillDatalist(id, values) {
  document.getElementById(id).innerHTML = values.map((v) => `<option value="${escapeHtml(v)}"></option>`).join("");
}

function populateSpielerFilterOptions() {
  fillSelectOptions("filter-zustaendigkeit", distinctValues(appData.players, "zustaendigkeit"), "Alle Zuständigen");
  fillSelectOptions("filter-position", distinctValues(appData.players, "position"), "Alle Positionen");
}

function populateDatalists() {
  const vereine = new Set([...appData.clubs.map((c) => c.name), ...appData.players.map((p) => p.verein)].map((v) => (v || "").trim()).filter(Boolean));
  fillDatalist("dl-vereine", [...vereine].sort((a, b) => a.localeCompare(b, "de")));
  fillDatalist("dl-positionen", distinctValues(appData.players, "position"));
  fillDatalist("dl-stuetzpunkte", distinctValues(appData.players, "stuetzpunkt"));
  fillDatalist("dl-personen", distinctValues(appData.players, "sichtungDurch"));
  fillDatalist("dl-zustaendigkeit", distinctValues(appData.players, "zustaendigkeit"));
}

// ---------- Spieler-Liste ----------
function playerRowHtml(p) {
  const status = computeStatus(p);
  const flag = p.stuetzpunktSpieler ? `<span class="stuetzpunkt-flag" title="Stützpunktspieler">★ ${escapeHtml(p.stuetzpunkt || "")}</span>` : "";
  return `
    <div class="list-row" data-id="${escapeHtml(p.id)}">
      <div>
        <div class="lr-name">${escapeHtml(p.nachname)}${p.vorname ? ", " + escapeHtml(p.vorname) : ""}</div>
        <div class="lr-sub">${escapeHtml(p.geburtsdatum || "")}</div>
      </div>
      <div>
        <div>${escapeHtml(p.verein || "—")}</div>
        ${flag ? `<div class="lr-sub">${flag}</div>` : ""}
      </div>
      <div>${escapeHtml(p.position || "—")}</div>
      <div><span class="status-badge status-${status.key}">${status.label}</span></div>
      <div>${escapeHtml(p.zustaendigkeit || "—")}</div>
      <div class="lr-sub">${escapeHtml(isoToDisplay(p.letzteBearbeitung))}</div>
    </div>`;
}

function filteredSpieler() {
  const q = (document.getElementById("spieler-search").value || "").trim().toLowerCase();
  const statusF = document.getElementById("filter-status").value;
  const zustF = document.getElementById("filter-zustaendigkeit").value;
  const posF = document.getElementById("filter-position").value;
  let list = appData.players.filter((p) => {
    if (q && !`${p.nachname} ${p.vorname} ${p.verein}`.toLowerCase().includes(q)) return false;
    if (statusF && computeStatus(p).key !== statusF) return false;
    if (zustF && (p.zustaendigkeit || "") !== zustF) return false;
    if (posF && (p.position || "") !== posF) return false;
    return true;
  });
  list.sort((a, b) => {
    const da = a.letzteBearbeitung || "", db = b.letzteBearbeitung || "";
    if (da !== db) return da < db ? 1 : -1; // neueste Bearbeitung zuerst
    return a.nachname.localeCompare(b.nachname, "de");
  });
  return list;
}

function renderSpielerListe() {
  populateSpielerFilterOptions();
  const list = filteredSpieler();
  document.getElementById("spieler-list").innerHTML = list.map(playerRowHtml).join("");
  document.getElementById("spieler-count").textContent = `${list.length} von ${appData.players.length}`;
  document.getElementById("spieler-empty").classList.toggle("hidden", list.length > 0);
  document.getElementById("import-banner").classList.toggle("hidden", appData.players.length > 0);
}

// ---------- Vereins-Liste ----------
function clubRowHtml(c) {
  const primary = c.kontakte && c.kontakte[0];
  const primaryLabel = primary ? (primary.name || primary.email || primary.telefon || "") : "";
  return `
    <div class="club-list-row" data-id="${escapeHtml(c.id)}">
      <div class="lr-name">${escapeHtml(c.name)}</div>
      <div class="lr-sub">${escapeHtml(c.ort || "—")}</div>
      <div class="lr-sub">${escapeHtml(primaryLabel || "—")}</div>
      <div class="lr-sub">${(c.kontakte || []).length} Ansprechpartner</div>
    </div>`;
}

function filteredVereine() {
  const q = (document.getElementById("verein-search").value || "").trim().toLowerCase();
  let list = appData.clubs.filter((c) => !q || `${c.name} ${c.ort || ""}`.toLowerCase().includes(q));
  list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return list;
}

function renderVereinListe() {
  const list = filteredVereine();
  document.getElementById("verein-list").innerHTML = list.map(clubRowHtml).join("");
  document.getElementById("verein-count").textContent = `${list.length} von ${appData.clubs.length}`;
  document.getElementById("verein-empty").classList.toggle("hidden", list.length > 0);
}

// ---------- Version / Changelog / Nutzer ----------
function renderVersionInfo() {
  document.querySelectorAll("#version-badge, #version-badge-2, #version-badge-nav").forEach((el) => { if (el) el.textContent = "v" + APP_VERSION; });
  const list = document.getElementById("changelog-list");
  if (!list) return;
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <div class="cv">Version ${escapeHtml(entry.version)}</div>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>`).join("")}
    </div>`).join("");
}

function renderHeaderUser() {
  const el = document.getElementById("header-user");
  const el2 = document.getElementById("einstellungen-user");
  if (!currentUser) { if (el) el.textContent = ""; if (el2) el2.textContent = ""; return; }
  const name = (currentUser.vorname || currentUser.nachname)
    ? `${currentUser.vorname || ""} ${currentUser.nachname || ""}`.trim()
    : currentUser.username;
  if (el) el.textContent = "👤 " + name;
  if (el2) el2.textContent = "Angemeldet als " + name;
}

function renderAll() {
  populateDatalists();
  renderSpielerListe();
  renderVereinListe();
  renderVersionInfo();
}

// ---------- Spieler-Formular ----------
function openSpielerModal(id) {
  editingPlayerId = id || null;
  const isNew = !id;
  const player = isNew ? null : appData.players.find((p) => p.id === id);
  document.getElementById("spieler-modal-title").textContent = isNew ? "Neuer Spieler" : `${player.nachname}${player.vorname ? ", " + player.vorname : ""}`;
  document.getElementById("btn-delete-spieler").classList.toggle("hidden", isNew);
  PLAYER_FIELDS.forEach((f) => {
    const el = document.getElementById("pf-" + f);
    if (!el) return;
    if (el.type === "checkbox") el.checked = player ? !!player[f] : false;
    else el.value = player ? (player[f] || "") : (f === "geschlecht" ? "m" : "");
  });
  document.getElementById("pf-letzteBearbeitung").value = player && player.letzteBearbeitung ? isoToDisplay(player.letzteBearbeitung) : "(wird beim Speichern gesetzt)";
  document.getElementById("spieler-modal").classList.remove("hidden");
  document.getElementById("pf-nachname").focus();
}

function closeSpielerModal() {
  document.getElementById("spieler-modal").classList.add("hidden");
  editingPlayerId = null;
}

function saveSpieler() {
  const nachname = document.getElementById("pf-nachname").value.trim();
  if (!nachname) { alert("Bitte einen Nachnamen eingeben."); return; }
  let player = editingPlayerId ? appData.players.find((p) => p.id === editingPlayerId) : null;
  const isNew = !player;
  if (isNew) player = { id: uuid() };
  PLAYER_FIELDS.forEach((f) => {
    const el = document.getElementById("pf-" + f);
    if (!el) return;
    player[f] = el.type === "checkbox" ? el.checked : el.value.trim();
  });
  player.letzteBearbeitung = todayIso();
  if (isNew) appData.players.push(player);
  persist();
  renderAll();
  closeSpielerModal();
}

function deleteSpieler() {
  if (!editingPlayerId) return;
  if (!confirm("Diesen Spieler wirklich löschen?")) return;
  appData.players = appData.players.filter((p) => p.id !== editingPlayerId);
  persist();
  renderAll();
  closeSpielerModal();
}

function appendEntry(fieldId) {
  const el = document.getElementById(fieldId);
  const text = prompt("Neuer Eintrag:");
  if (!text || !text.trim()) return;
  const stamped = `${todayDisplay()}: ${text.trim()}`;
  el.value = el.value.trim() ? `${el.value.trim()} // ${stamped}` : stamped;
}

// ---------- Vereins-Formular ----------
function buildKontaktRow(k) {
  const row = document.createElement("div");
  row.className = "kontakt-row";
  row.innerHTML = `
    <input type="text" placeholder="Name" class="kf-name" value="${escapeHtml(k.name || "")}" />
    <input type="text" placeholder="Funktion" class="kf-funktion" value="${escapeHtml(k.funktion || "")}" />
    <input type="email" placeholder="E-Mail" class="kf-email" value="${escapeHtml(k.email || "")}" />
    <input type="text" placeholder="Telefon" class="kf-telefon" value="${escapeHtml(k.telefon || "")}" />
    <button type="button" class="btn secondary small" data-remove-kontakt title="Ansprechpartner entfernen">✕</button>`;
  row.querySelector("[data-remove-kontakt]").addEventListener("click", () => row.remove());
  return row;
}

function renderKontakteRows(kontakte) {
  const container = document.getElementById("kontakte-list");
  container.innerHTML = "";
  const list = kontakte && kontakte.length ? kontakte : [{ name: "", funktion: "", email: "", telefon: "" }];
  list.forEach((k) => container.appendChild(buildKontaktRow(k)));
}

function openVereinModal(id) {
  editingClubId = id || null;
  const isNew = !id;
  const club = isNew ? null : appData.clubs.find((c) => c.id === id);
  document.getElementById("verein-modal-title").textContent = isNew ? "Neuer Verein" : club.name;
  document.getElementById("btn-delete-verein").classList.toggle("hidden", isNew);
  document.getElementById("cf-name").value = club ? club.name : "";
  document.getElementById("cf-strasse").value = club ? club.strasse || "" : "";
  document.getElementById("cf-plz").value = club ? club.plz || "" : "";
  document.getElementById("cf-ort").value = club ? club.ort || "" : "";
  document.getElementById("cf-website").value = club ? club.website || "" : "";
  renderKontakteRows(club ? club.kontakte : []);
  document.getElementById("verein-modal").classList.remove("hidden");
  document.getElementById("cf-name").focus();
}

function closeVereinModal() {
  document.getElementById("verein-modal").classList.add("hidden");
  editingClubId = null;
}

function saveVerein() {
  const name = document.getElementById("cf-name").value.trim();
  if (!name) { alert("Bitte einen Vereinsnamen eingeben."); return; }
  let club = editingClubId ? appData.clubs.find((c) => c.id === editingClubId) : null;
  const isNew = !club;
  if (isNew) club = { id: uuid() };
  club.name = name;
  club.strasse = document.getElementById("cf-strasse").value.trim();
  club.plz = document.getElementById("cf-plz").value.trim();
  club.ort = document.getElementById("cf-ort").value.trim();
  club.website = document.getElementById("cf-website").value.trim();
  club.kontakte = [...document.querySelectorAll("#kontakte-list .kontakt-row")]
    .map((row) => ({
      name: row.querySelector(".kf-name").value.trim(),
      funktion: row.querySelector(".kf-funktion").value.trim(),
      email: row.querySelector(".kf-email").value.trim(),
      telefon: row.querySelector(".kf-telefon").value.trim()
    }))
    .filter((k) => k.name || k.funktion || k.email || k.telefon);
  if (isNew) appData.clubs.push(club);
  persist();
  renderAll();
  closeVereinModal();
}

function deleteVerein() {
  if (!editingClubId) return;
  if (!confirm("Diesen Verein wirklich löschen?")) return;
  appData.clubs = appData.clubs.filter((c) => c.id !== editingClubId);
  persist();
  renderAll();
  closeVereinModal();
}

// ---------- Datenimport (lokale Datei, nie ins Repo/GitHub Pages) ----------
function handleImportFile(file) {
  if (!file || appData.players.length > 0) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (e) {
      alert("Die Datei ist kein gültiges JSON.");
      return;
    }
    const players = Array.isArray(parsed.players) ? parsed.players : null;
    const clubs = Array.isArray(parsed.clubs) ? parsed.clubs : null;
    if (!players || !clubs) {
      alert("Die Datei enthält nicht das erwartete Format ({ players: [...], clubs: [...] }).");
      return;
    }
    if (!confirm(`Wirklich ${players.length} Spieler und ${clubs.length} Vereine importieren?`)) return;
    appData.players = players;
    appData.clubs = clubs;
    renderAll();
    const ok = await saveNow();
    if (ok) alert(`Import erfolgreich gespeichert: ${players.length} Spieler und ${clubs.length} Vereine.`);
  };
  reader.readAsText(file, "utf-8");
}

// ---------- Tabs ----------
function switchTab(tab) {
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.toggle("active", s.id === "tab-" + tab));
  if (tab === "spieler") renderSpielerListe();
  if (tab === "vereine") renderVereinListe();
  if (tab === "einstellungen") renderVersionInfo();
}

// ---------- Gateway: Laden / Speichern / Konflikte ----------
function setSaveStatus(text, kind) {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = text;
  el.className = "header-status" + (kind ? " is-" + kind : "");
}

function persist() {
  clearTimeout(persistTimer);
  setSaveStatus("Änderung noch nicht gespeichert…", "pending");
  persistTimer = setTimeout(doPersist, 300);
}

// Sofort speichern (ohne Debounce) und Erfolg zurückmelden — für den Import,
// der erst nach bestätigtem Speichern als abgeschlossen gelten soll.
async function saveNow() {
  clearTimeout(persistTimer);
  return doPersist();
}

async function doPersist() {
  setSaveStatus("Speichern…", "pending");
  try {
    await gatewaySave(appData);
    const t = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    setSaveStatus("Gespeichert " + t, "ok");
    return true;
  } catch (e) {
    if (e instanceof ConflictError) { await reloadAfterConflict(); setSaveStatus("Von anderem Gerät aktualisiert", ""); return false; }
    if (e instanceof NotLoggedInError) { showConnectScreen("Sitzung abgelaufen — bitte neu anmelden."); return false; }
    console.error("Speichern fehlgeschlagen", e);
    setSaveStatus("Nicht gespeichert", "error");
    alert("Speichern fehlgeschlagen: " + e.message);
    return false;
  }
}

async function reloadAfterConflict() {
  try {
    const data = await gatewayLoad();
    appData = (data && Array.isArray(data.players) && Array.isArray(data.clubs)) ? data : { players: [], clubs: [] };
    renderAll();
    alert("Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert — die aktuelle Version wurde neu geladen. Bitte die letzte Änderung bei Bedarf erneut vornehmen.");
  } catch (e) {
    console.error("Neuladen nach Konflikt fehlgeschlagen", e);
  }
}

// ---------- Start ----------
function showConnectScreen(errorMsg) {
  document.getElementById("connect-screen").style.display = "";
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("cloud-error").textContent = errorMsg ? "Fehler: " + errorMsg : "";
}

async function startApp() {
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "";
  renderAll();
  try {
    currentUser = await fetchMe();
    renderHeaderUser();
  } catch (_) {
    // Name im Header ist best-effort, App funktioniert auch ohne
  }
}

async function init() {
  setupListeners();
  if (!getSessionToken()) { showConnectScreen(); return; }
  try {
    const data = await gatewayLoad();
    appData = (data && Array.isArray(data.players) && Array.isArray(data.clubs)) ? data : { players: [], clubs: [] };
    await startApp();
  } catch (e) {
    if (e instanceof NotLoggedInError) { showConnectScreen(); return; }
    console.error("Nextcloud-Zugriff über Login fehlgeschlagen", e);
    showConnectScreen(e.message);
  }
}

function setupListeners() {
  document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  document.getElementById("spieler-search").addEventListener("input", renderSpielerListe);
  document.getElementById("filter-status").addEventListener("change", renderSpielerListe);
  document.getElementById("filter-zustaendigkeit").addEventListener("change", renderSpielerListe);
  document.getElementById("filter-position").addEventListener("change", renderSpielerListe);
  document.getElementById("spieler-list").addEventListener("click", (e) => {
    const row = e.target.closest(".list-row");
    if (row) openSpielerModal(row.dataset.id);
  });
  document.getElementById("btn-new-spieler").addEventListener("click", () => openSpielerModal(null));
  document.getElementById("spieler-modal-close").addEventListener("click", closeSpielerModal);
  document.getElementById("btn-cancel-spieler").addEventListener("click", closeSpielerModal);
  document.getElementById("btn-save-spieler").addEventListener("click", saveSpieler);
  document.getElementById("btn-delete-spieler").addEventListener("click", deleteSpieler);
  document.getElementById("spieler-modal").addEventListener("click", (e) => { if (e.target.id === "spieler-modal") closeSpielerModal(); });
  document.getElementById("spieler-form").addEventListener("submit", (e) => e.preventDefault());
  document.querySelectorAll("[data-append]").forEach((btn) => btn.addEventListener("click", () => appendEntry(btn.dataset.append)));

  document.getElementById("verein-search").addEventListener("input", renderVereinListe);
  document.getElementById("verein-list").addEventListener("click", (e) => {
    const row = e.target.closest(".club-list-row");
    if (row) openVereinModal(row.dataset.id);
  });
  document.getElementById("btn-new-verein").addEventListener("click", () => openVereinModal(null));
  document.getElementById("verein-modal-close").addEventListener("click", closeVereinModal);
  document.getElementById("btn-cancel-verein").addEventListener("click", closeVereinModal);
  document.getElementById("btn-save-verein").addEventListener("click", saveVerein);
  document.getElementById("btn-delete-verein").addEventListener("click", deleteVerein);
  document.getElementById("verein-modal").addEventListener("click", (e) => { if (e.target.id === "verein-modal") closeVereinModal(); });
  document.getElementById("verein-form").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("btn-add-kontakt").addEventListener("click", () => document.getElementById("kontakte-list").appendChild(buildKontaktRow({})));

  document.getElementById("btn-import-seed").addEventListener("click", () => document.getElementById("import-file-input").click());
  document.getElementById("import-file-input").addEventListener("change", (e) => {
    handleImportFile(e.target.files[0]);
    e.target.value = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("spieler-modal").classList.contains("hidden")) closeSpielerModal();
    if (!document.getElementById("verein-modal").classList.contains("hidden")) closeVereinModal();
  });
}

document.addEventListener("DOMContentLoaded", init);
