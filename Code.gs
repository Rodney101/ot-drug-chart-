// ═══════════════════════════════════════════════════════════════
//  OT Drug Chart — Google Apps Script  (v4 — unified activity log)
//  Paste into Extensions → Apps Script → Code.gs
//  Deploy as Web App: Execute as Me, Anyone can access
//
//  Logs tab headers (row 1):
//    Timestamp | Event Type | Drug | Qty Used | Notes | Stock After | Threshold | Old Name
//
//  Stock tab headers (row 1):
//    Drug | Stock | Threshold
// ═══════════════════════════════════════════════════════════════

const ALERT_EMAIL      = "ot-lead@yourhospital.com"; // ← CHANGE THIS
const SHEET_NAME_LOGS  = "Logs";
const SHEET_NAME_STOCK = "Stock";

// ── doGet — APP PULLS STOCK FROM SHEETS ─────────────────────────
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === "getStock") {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_STOCK);
    const vals  = sheet.getDataRange().getValues();

    if (vals.length <= 1) return jsonResponse([]);

    const headers  = vals[0].map(h => h.toString().toLowerCase().trim());
    const nameIdx  = headers.indexOf("drug");
    const stockIdx = headers.indexOf("stock");
    const thrIdx   = headers.indexOf("threshold");

    const rows = vals.slice(1)
      .filter(r => r[nameIdx])
      .map(r => ({
        name:      r[nameIdx].toString(),
        stock:     Number(r[stockIdx]) || 0,
        threshold: Number(r[thrIdx])   || 5
      }));

    return jsonResponse(rows);
  }

  return jsonResponse({ status: "ok", message: "OT Drug Chart API running" });
}

// ── doPost — RECEIVES ALL EVENTS FROM APP ───────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "activity") handleActivity(data);
    if (data.type === "stock")    handleStock(data);
    if (data.type === "rename")   handleRename(data);
    if (data.type === "delete")   handleDelete(data);

    return jsonResponse({ status: "ok" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  }
}

// ── WRITE ANY ACTIVITY EVENT TO THE LOGS TAB ────────────────────
// All three event types — Drug Used, Drug Added, Stock Updated, Drug Renamed
// — are written here as a single unified audit trail.
function handleActivity(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_LOGS);

  sheet.appendRow([
    new Date(data.ts || new Date()),              // Timestamp
    data.event     || "",                         // Event Type
    data.drug      || "",                         // Drug name
    data.qty       !== undefined ? data.qty : "", // Qty used (usage only)
    data.notes     || "",                         // Notes (usage only)
    data.stock     !== undefined ? data.stock     : "", // Stock after event
    data.threshold !== undefined ? data.threshold : "", // Reorder threshold
    data.oldName   || ""                          // Old name (rename only)
  ]);

  // Fire low-stock email alert on drug usage
  if (data.event === "Drug Used" && Number(data.stock) <= Number(data.threshold)) {
    sendAlertEmail(data.drug, data.stock, data.threshold);
  }
}

// ── UPDATE STOCK TAB (upsert) ────────────────────────────────────
function handleStock(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_STOCK);
  const vals  = sheet.getDataRange().getValues();

  let found = false;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString().toLowerCase() === data.drug.toString().toLowerCase()) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[Number(data.stock), Number(data.threshold)]]);
      found = true;
      break;
    }
  }

  if (!found) sheet.appendRow([data.drug, Number(data.stock), Number(data.threshold)]);
}

// ── RENAME DRUG IN STOCK TAB ────────────────────────────────────
function handleRename(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_STOCK);
  const vals  = sheet.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString().toLowerCase() === data.oldName.toString().toLowerCase()) {
      sheet.getRange(i + 1, 1, 1, 3).setValues([[data.newName, Number(data.stock), Number(data.threshold)]]);
      return;
    }
  }

  // Old name not in sheet — add as new row
  sheet.appendRow([data.newName, Number(data.stock), Number(data.threshold)]);
}

// ── DELETE DRUG FROM STOCK TAB ──────────────────────────────────
function handleDelete(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_STOCK);
  const vals  = sheet.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString().toLowerCase() === data.drug.toString().toLowerCase()) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

// ── SEND ALERT EMAIL ─────────────────────────────────────────────
function sendAlertEmail(drug, stock, threshold) {
  const level   = Number(stock) === 0 ? "OUT OF STOCK" : "LOW STOCK";
  const subject = "[OT Drug Chart] " + level + ": " + drug;
  const body    =
    "OT Department Drug Alert\n"                  +
    "─────────────────────────\n"                 +
    "Drug:       " + drug      + "\n"             +
    "Status:     " + level     + "\n"             +
    "Remaining:  " + stock     + " unit(s)\n"     +
    "Reorder at: " + threshold + " unit(s)\n"     +
    "Time:       " + new Date().toLocaleString()  + "\n\n" +
    "Please arrange reorder immediately.\n"       +
    "— OT Drug Chart System";

  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

// ── DAILY MORNING STOCK SUMMARY ──────────────────────────────────
// Set trigger: Extensions → Triggers → sendDailySummary → Time-driven → Day timer → 7am
function sendDailySummary() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_STOCK);
  const vals  = sheet.getDataRange().getValues().slice(1);

  if (!vals.length) return;

  const rows = vals.map(r => {
    const name  = r[0] || "";
    const stock = Number(r[1]) || 0;
    const thr   = Number(r[2]) || 0;
    const flag  = stock === 0 ? " OUT" : stock <= thr ? " LOW" : " OK";
    return "  " + name.padEnd(28) + "Stock: " + stock + flag;
  }).join("\n");

  const subject = "[OT Drug Chart] Daily Stock Summary - " + new Date().toLocaleDateString();
  const body    =
    "Daily Drug Stock Summary - OT Department\n" +
    rows + "\n\n- OT Drug Chart System - " + new Date().toLocaleString();

  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

// ── HELPER ───────────────────────────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
