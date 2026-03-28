// SplitIt — Google Apps Script
// Deploy: New Deployment → Web App → Execute as: Me → Who has access: Anyone

// ─── GET: reads only ────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || 'read';
    if (action === 'read') return readGroups();
    // Legacy GET write (old clients) — still supported for backwards compat
    const raw = e.parameter.data;
    if (!raw) return reply({status: "no data"});
    writeToSheet(JSON.parse(decodeURIComponent(raw)));
    return reply({status: "ok"});
  } catch(err) {
    return reply({status: "error", msg: err.toString()});
  }
}

// ─── POST: writes (no URL-length limit) ────────────────────────────────────
function doPost(e) {
  try {
    // Body arrives as plain text (Content-Type: text/plain, no preflight needed)
    const data = JSON.parse(e.postData.contents);
    writeToSheet(data);
    return reply({status: "ok"});
  } catch(err) {
    return reply({status: "error", msg: err.toString()});
  }
}

// ─── READ ───────────────────────────────────────────────────────────────────
function readGroups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName('_meta');
  if (!meta) return reply({groups: []});

  let metaData;
  try {
    metaData = JSON.parse(meta.getRange(1,1).getValue()) || {groups: []};
  } catch(e) {
    return reply({groups: []});
  }

  // Reconstruct expenses from per-group hidden data tabs.
  // Falls back to any expenses stored inline in _meta (old format) if the tab
  // doesn't exist yet — ensures zero data loss during migration.
  const groups = metaData.groups.map(g => {
    const dataSheet = ss.getSheetByName(g.id + ' — Data');
    let expenses = g.expenses || []; // old-format fallback

    if (dataSheet && dataSheet.getLastRow() > 1) {
      const rows = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, 9).getValues();
      expenses = rows
        .filter(r => r[0]) // skip blank rows
        .map(r => ({
          id:        r[0],
          date:      r[1],
          desc:      r[2],
          category:  r[3],
          amount:    parseFloat(r[4]) || 0,
          currency:  r[5],
          paidBy:    r[6],
          splits:    tryParseJSON(r[7], {}),
          splitMode: r[8] || 'equal'
        }));
    }

    // Strip inline expenses from returned metadata (keep _meta lean)
    const {expenses: _omit, ...gMeta} = g;
    return {...gMeta, expenses};
  });

  return reply({groups});
}

function tryParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch(_) { return fallback; }
}

// ─── WRITE ──────────────────────────────────────────────────────────────────
function writeToSheet(data) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const cur = data.currency || "QAR";
  const grp = (data.groupName || "Default").replace(/[:\\/?*[\]]/g, "").substring(0, 25);

  function getOrCreate(name, hide) {
    let sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); if (hide) sh.hideSheet(); }
    return sh;
  }

  // ── 1. Update _meta (group metadata only — no expenses) ──────────────────
  let meta = ss.getSheetByName('_meta');
  if (!meta) { meta = ss.insertSheet('_meta'); meta.hideSheet(); }
  let existing = {groups: []};
  try { existing = JSON.parse(meta.getRange(1,1).getValue()) || {groups: []}; } catch(e) {}

  const idIdx   = data.groupId ? existing.groups.findIndex(g => g.id   === data.groupId)   : -1;
  const nameIdx = idIdx < 0    ? existing.groups.findIndex(g => g.name === data.groupName) : -1;
  // Preserve canonical id (first writer wins) to prevent id-flip between collaborators
  const canonicalId = idIdx   >= 0 ? existing.groups[idIdx].id
                    : nameIdx >= 0 ? existing.groups[nameIdx].id
                    : (data.groupId || data.groupName);

  const gMeta = {
    id:      canonicalId,
    name:    data.groupName,
    emoji:   data.groupEmoji || '👥',
    currency: cur,
    members: data.members || []
    // No expenses — those live in the per-group data tab
  };
  const finalIdx = idIdx >= 0 ? idIdx : nameIdx;
  if (finalIdx >= 0) existing.groups[finalIdx] = gMeta;
  else               existing.groups.push(gMeta);
  meta.getRange(1,1).setValue(JSON.stringify(existing));

  // ── 2. Per-group hidden data tab (machine-readable, one row per expense) ──
  // Using canonicalId as the tab name makes it stable even if the group is renamed.
  const dataTab = getOrCreate(canonicalId + ' — Data', true);
  dataTab.clearContents();
  dataTab.appendRow(['id','date','desc','category','amount','currency','paidBy','splits','splitMode']);
  dataTab.getRange(1,1,1,9).setBackground('#1a1a2e').setFontColor('#888').setFontWeight('bold');
  (data.expenses || []).forEach(exp => {
    dataTab.appendRow([
      exp.id, exp.date, exp.desc, exp.category,
      parseFloat(exp.amount).toFixed(2),
      exp.currency || cur,
      exp.paidBy,
      JSON.stringify(exp.splits || {}),
      exp.splitMode || 'equal'
    ]);
  });

  // ── 3. Human-readable Expenses tab ───────────────────────────────────────
  const sh = getOrCreate(grp + ' — Expenses');
  sh.clearContents();
  sh.appendRow(['ID','Date','Description','Category','Amount','Currency','Paid By','Split Details']);
  sh.getRange(1,1,1,8).setBackground('#0f3d2a').setFontColor('#6ee7b7').setFontWeight('bold');
  (data.expenses || []).forEach(exp => {
    const splits = Object.entries(exp.splits || {})
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([k, v]) => k + ': ' + parseFloat(v).toFixed(2)).join(' | ');
    sh.appendRow([exp.id, exp.date, exp.desc, exp.category,
      parseFloat(exp.amount).toFixed(2), exp.currency || cur, exp.paidBy, splits]);
  });
  sh.autoResizeColumns(1, 8);

  // ── 4. Members tab ────────────────────────────────────────────────────────
  const msh = getOrCreate(grp + ' — Members');
  msh.clearContents();
  msh.appendRow(['Member']);
  msh.getRange(1,1).setBackground('#0f3d2a').setFontColor('#6ee7b7').setFontWeight('bold');
  (data.members || []).forEach(m => msh.appendRow([m]));

  // ── 5. Balances tab ───────────────────────────────────────────────────────
  const bsh = getOrCreate(grp + ' — Balances');
  bsh.clearContents();
  bsh.appendRow(['Member','Balance','Currency','Status']);
  bsh.getRange(1,1,1,4).setBackground('#0f3d2a').setFontColor('#6ee7b7').setFontWeight('bold');
  const bal = {};
  (data.members || []).forEach(m => bal[m] = 0);
  (data.expenses || []).forEach(exp => {
    bal[exp.paidBy] = (bal[exp.paidBy] || 0) + parseFloat(exp.amount);
    Object.entries(exp.splits || {}).forEach(([m, v]) => { bal[m] = (bal[m] || 0) - parseFloat(v); });
  });
  Object.entries(bal).forEach(([m, b]) => {
    bsh.appendRow([m, parseFloat(b).toFixed(2), cur, b > 0.01 ? 'Is Owed' : b < -0.01 ? 'Owes' : 'Settled Up']);
  });
  bsh.autoResizeColumns(1, 4);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
