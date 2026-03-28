// SplitIt — Google Apps Script
// Deploy: New Deployment → Web App → Execute as: Me → Who has access: Anyone

function doGet(e) {
  try {
    const action = e.parameter.action || 'write';
    if (action === 'read') return readGroups();
    const raw = e.parameter.data;
    if (!raw) return reply({status: "no data"});
    const data = JSON.parse(decodeURIComponent(raw));
    writeToSheet(data);
    return reply({status: "ok"});
  } catch(err) {
    return reply({status: "error", msg: err.toString()});
  }
}

function readGroups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName('_meta');
  if (!meta) return reply({groups: []});
  try {
    return reply(JSON.parse(meta.getRange(1,1).getValue()) || {groups: []});
  } catch(e) {
    return reply({groups: []});
  }
}

function writeToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cur = data.currency || "QAR";
  const grp = (data.groupName || "Default").replace(/[:\\/?*[\]]/g, "").substring(0, 25);

  function getOrCreate(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    return sh;
  }

  // Update _meta for read-back / connect flow
  let meta = ss.getSheetByName('_meta');
  if (!meta) { meta = ss.insertSheet('_meta'); meta.hideSheet(); }
  let existing = {groups: []};
  try { existing = JSON.parse(meta.getRange(1,1).getValue()) || {groups: []}; } catch(e) {}
  // Find by id first, then by name (handles same-named groups created with different local ids)
  const idIdx = data.groupId
    ? existing.groups.findIndex(g => g.id === data.groupId)
    : -1;
  const nameIdx = idIdx < 0
    ? existing.groups.findIndex(g => g.name === data.groupName)
    : -1;
  const canonicalId = idIdx >= 0
    ? existing.groups[idIdx].id          // exact id match — keep it
    : nameIdx >= 0
      ? existing.groups[nameIdx].id      // name match — preserve canonical id, don't adopt new id
      : (data.groupId || data.groupName); // new group — use provided id
  const gd = {
    id: canonicalId,
    name: data.groupName,
    emoji: data.groupEmoji || '👥',
    currency: cur,
    members: data.members || [],
    expenses: data.expenses || []
  };
  const finalIdx = idIdx >= 0 ? idIdx : nameIdx;
  if (finalIdx >= 0) existing.groups[finalIdx] = gd; else existing.groups.push(gd);
  meta.getRange(1,1).setValue(JSON.stringify(existing));

  // Expenses tab — one per group
  let sh = getOrCreate(grp + " — Expenses");
  sh.clearContents();
  sh.appendRow(["ID","Date","Description","Category","Amount","Currency","Paid By","Split Details"]);
  sh.getRange(1,1,1,8).setBackground("#0f3d2a").setFontColor("#6ee7b7").setFontWeight("bold");
  (data.expenses||[]).forEach(exp => {
    const splits = Object.entries(exp.splits||{})
      .filter(([_,v])=>parseFloat(v)>0)
      .map(([k,v])=>k+": "+parseFloat(v).toFixed(2)).join(" | ");
    sh.appendRow([exp.id,exp.date,exp.desc,exp.category,
      parseFloat(exp.amount).toFixed(2),exp.currency||cur,exp.paidBy,splits]);
  });
  sh.autoResizeColumns(1,8);

  // Members tab — one per group
  let msh = getOrCreate(grp + " — Members");
  msh.clearContents();
  msh.appendRow(["Member"]);
  msh.getRange(1,1).setBackground("#0f3d2a").setFontColor("#6ee7b7").setFontWeight("bold");
  (data.members||[]).forEach(m => msh.appendRow([m]));

  // Balances tab — one per group
  let bsh = getOrCreate(grp + " — Balances");
  bsh.clearContents();
  bsh.appendRow(["Member","Balance","Currency","Status"]);
  bsh.getRange(1,1,1,4).setBackground("#0f3d2a").setFontColor("#6ee7b7").setFontWeight("bold");
  const bal = {};
  (data.members||[]).forEach(m=>bal[m]=0);
  (data.expenses||[]).forEach(exp=>{
    bal[exp.paidBy]=(bal[exp.paidBy]||0)+parseFloat(exp.amount);
    Object.entries(exp.splits||{}).forEach(([m,v])=>{bal[m]=(bal[m]||0)-parseFloat(v);});
  });
  Object.entries(bal).forEach(([m,b])=>{
    bsh.appendRow([m, parseFloat(b).toFixed(2), cur, b>0.01?"Is Owed":b<-0.01?"Owes":"Settled Up"]);
  });
  bsh.autoResizeColumns(1,4);
}

function reply(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
