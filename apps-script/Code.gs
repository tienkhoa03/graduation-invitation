const SHEET_NAME = "Wishes";
const HEADERS = ["time", "name", "message", "hidden", "slot"];
const VERSION = 3;
const MAX_NAME = 60;
const MAX_MESSAGE = 1000;
const SLOTS = {
  "27": "9h30 – 11h ngày 27/11",
  "28": "12h – 14h ngày 28/11",
  later: "Hẹn dịp khác",
};

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  } else if (sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// A leading = + - @ would make Sheets evaluate user input as a formula.
function asText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function doGet() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter((r) => r[1] && r[2] && !r[3])
    .map((r) => ({
      time: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      message: String(r[2]),
    }))
    .reverse();
  return json_({ ok: true, version: VERSION, wishes: wishes });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad_request" });
  }
  if (data.website) return json_({ ok: true });

  const name = String(data.name || "").trim().slice(0, MAX_NAME);
  const message = String(data.message || "").trim().slice(0, MAX_MESSAGE);
  if (!name || !message) return json_({ ok: false, error: "missing_fields" });
  const slot = Object.prototype.hasOwnProperty.call(SLOTS, data.slot) ? SLOTS[data.slot] : "";

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), asText_(name), asText_(message), "", slot]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}
