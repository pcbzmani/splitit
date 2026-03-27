// SplitIt — Google Apps Script
// Deploy: New Deployment → Web App → Execute as: Me → Who has access: Anyone

function doGet(e) {
  try {
    const raw = e.parameter.data;
    if (!raw) return reply({status: "no data"});
    const data = JSON.parse(decodeURIComponent(raw));
    writeToSheet(data);
    return reply({status: "ok"});
  } catch(err) {
    return reply({status: "error", msg: err.toString()});
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
