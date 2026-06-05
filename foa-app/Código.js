var GROQ_API_KEY = 'TU_GROQ_API_KEY_ACÁ';

  function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Forwarding Operations Assistant')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  function loginAndGetToken(email, password) {
    try {
      var ss = getOrCreateUsersSheet();
      var data = ss.getSheetByName('Usuarios').getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toLowerCase() === email.toLowerCase()) {
          if (data[i][3] !== 'active') return { success: false, error: 'Cuenta inactiva. Contacta al administrador.' };
          if (data[i][1].toString() === password) {
            var token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            var expiry = Date.now() + 8 * 60 * 60 * 1000;
            PropertiesService.getScriptProperties().setProperty('tok_' + token, email + '|' + expiry);
            return { success: true, token: token };
          }
          return { success: false, error: 'Contrasena incorrecta.' };
        }
      }
      return { success: false, error: 'Email no encontrado. Solicita acceso.' };
    } catch(e) { return { success: false, error: e.message }; }
  }

  function validateToken(token) {
    try {
      var val = PropertiesService.getScriptProperties().getProperty('tok_' + token);
      if (!val) return false;
      var expiry = parseInt(val.split('|')[1]);
      return expiry > Date.now();
    } catch(e) { return false; }
  }

  function callGroq(prompt) {
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + GROQ_API_KEY },
      payload: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }),
      muteHttpExceptions: true
    };
    var data = JSON.parse(UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', options).getContentText());
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  // ===== COTIZACIONES =====

  function extractTextFromPDF(base64Data, fileName) {
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/pdf', fileName);
    var tempFile = DriveApp.createFile(blob);
    var docFile = Drive.Files.insert(
      { title: 'tmp_' + fileName, mimeType: MimeType.GOOGLE_DOCS },
      tempFile.getBlob(),
      { convert: true }
    );
    var text = DocumentApp.openById(docFile.id).getBody().getText();
    DriveApp.getFileById(docFile.id).setTrashed(true);
    tempFile.setTrashed(true);
    return text;
  }

  function extractQuoteFromText(text, fileName) {
    var instructions = "You are a freight forwarding expert.";
    instructions += " Extract the freight quote from this document.";
    instructions += " Return ONLY a valid JSON object with these exact keys:";
    instructions += " forwarder (string), via as Air/Sea/Land (string),";
    instructions += " origin_charges (number), freight (number),";
    instructions += " destination_charges (number), total (number),";
    instructions += " transit_days (number), routing (string),";
    instructions += " currency (string), notes (string).";
    instructions += " Use 0 for missing numbers. File: " + fileName;
    instructions += "\n---\n" + text.substring(0, 3000);
    try {
      var result = callGroq(instructions);
      var cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch(e) { return null; }
  }

  function analyzeQuotes(formData, filesBase64) {
    try {
      var quotes = [];
      (filesBase64 || []).forEach(function(file) {
        var text = extractTextFromPDF(file.data, file.name);
        if (text && text.length > 50) {
          var q = extractQuoteFromText(text, file.name);
          if (q) { q.source = file.name; quotes.push(q); }
        }
      });
      if (quotes.length === 0) return { error: "No se pudieron extraer cotizaciones." };

      var quotesText = "";
      quotes.forEach(function(q, i) {
        var total = q.total || (Number(q.origin_charges) + Number(q.freight) + Number(q.destination_charges));
        quotesText += "\nQuote " + (i+1) + " [" + q.source + "]:\n";
        quotesText += "  Forwarder: " + q.forwarder + " | Mode: " + q.via + "\n";
        quotesText += "  Origin: " + q.currency + " " + q.origin_charges;
        quotesText += " | Freight: " + q.currency + " " + q.freight;
        quotesText += " | Dest: " + q.currency + " " + q.destination_charges + "\n";
        quotesText += "  Total: " + q.currency + " " + total;
        quotesText += " | Transit: " + q.transit_days + " days | Routing: " + q.routing + "\n";
      });

      var prompt = "You are a senior freight forwarder.\n";
      prompt += "SHIPMENT: " + formData.origen + " to " + formData.destino + "\n";
      prompt += "Cargo: " + formData.mercaderia + " | ";
      prompt += formData.peso + "kg / " + formData.volumen + "CBM | ";
      prompt += formData.incoterm + " | Client: " + formData.cliente + "\n\n";
      prompt += "QUOTES:" + quotesText + "\n\n";
      prompt += "Respond with EXACTLY two sections:\n";
      prompt += "## ANALISIS INTERNO\n";
      prompt += "(Spanish) Comparison table, ranking, recommendation, risks.\n\n";
      prompt += "## EMAIL AL CLIENTE\n";
      prompt += "(English) Subject: ...\n";
      prompt += "Professional email to " + formData.cliente;
      prompt += " with recommended option, price breakdown, next steps.";

      var analysis = callGroq(prompt);
      var parts = analysis.split("## EMAIL AL CLIENTE");
      saveQuoteHistory(formData, quotes.length);
      return {
        success: true,
        internalAnalysis: parts[0].replace("## ANALISIS INTERNO", "").trim(),
        clientEmail: parts[1] ? parts[1].trim() : ""
      };
    } catch(e) { return { error: e.message }; }
  }

  // ===== USUARIOS / LOGIN =====

  function getOrCreateUsersSheet() {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('usersSheetId');
    var ss;
    if (sheetId) {
      try { ss = SpreadsheetApp.openById(sheetId); } catch(e) { sheetId = null; }
    }
    if (!sheetId) {
      ss = SpreadsheetApp.create('FOA - Usuarios');
      props.setProperty('usersSheetId', ss.getId());
      var sheet = ss.getActiveSheet().setName('Usuarios');
      sheet.appendRow(['Email', 'Password', 'Nombre', 'Estado', 'Agregado']);
      sheet.setFrozenRows(1);
      sheet.appendRow(['santirodriguezdr@gmail.com', 'admin123', 'Santiago', 'active', new Date()]);
    }
    return ss;
  }

  function loginUser(email, password) {
    try {
      var ss = getOrCreateUsersSheet();
      var data = ss.getSheetByName('Usuarios').getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toLowerCase() === email.toLowerCase()) {
          if (data[i][3] !== 'active') return { success: false, error: 'Tu cuenta no esta activa. Contacta a Santiago.' };
          if (data[i][1] === password) return { success: true, name: data[i][2] };
          return { success: false, error: 'Contrasena incorrecta.' };
        }
      }
      return { success: false, error: 'Email no encontrado. Solicita acceso.' };
    } catch(e) { return { success: false, error: e.message }; }
  }

  function requestAccess(name, email) {
    try {
      var ss = getOrCreateUsersSheet();
      ss.getSheetByName('Usuarios').appendRow([email, '', name, 'pending', new Date()]);
      return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
  }

  // ===== EMPRESA =====

  function saveCompanySettings(s) {
    PropertiesService.getScriptProperties().setProperty('company', JSON.stringify(s));
    return { success: true };
  }

  function getCompanySettings() {
    var raw = PropertiesService.getScriptProperties().getProperty('company');
    return raw ? JSON.parse(raw) : {};
  }
function uploadLogo(base64Data, fileName, mimeType) {
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: 'https://drive.google.com/uc?export=view&id=' + file.getId() };
  }
  // ===== DOCUMENTOS =====

  function generateAllDocuments(docTypes, data) {
    var results = [];
    var errors = [];
    var names = { invoice: "Commercial_Invoice", packing: "Packing_List", bl: "BL_Instructions" };
    docTypes.forEach(function(type) {
      var r = generatePDF(type, data);
      if (r.success) {
        results.push({ fileName: names[type] + "_" + (data.invoiceNo || "") + ".pdf", data: r.data });
      } else {
        errors.push(type + ": " + r.error);
      }
    });
    if (results.length > 0) return { success: true, documents: results };
    saveDocHistory(data, docTypes);
    return { error: errors.join(" | ") };
  }

  function generatePDF(docType, data) {
    var docId = null;
    try {
      var company = getCompanySettings();
      var doc = DocumentApp.create("_tmp_" + docType + "_" + Date.now());
      docId = doc.getId();
      var body = doc.getBody();
      body.setMarginTop(40);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Logo
      if (company.logoUrl) {
        try {
          var img = body.appendImage(UrlFetchApp.fetch(company.logoUrl).getBlob());
          img.setWidth(120).setHeight(50);
        } catch(e) {}
      }

      // Nombre empresa
      var namePara = body.appendParagraph(company.name || "Empresa");
      namePara.editAsText().setFontSize(16).setBold(true).setFontFamily("Arial").setForegroundColor("#1a365d");

      // Datos empresa
      body.appendParagraph(company.address || "").editAsText().setFontSize(9).setFontFamily("Arial").setForegroundColor("#555555");
      var cp = [];
      if (company.taxId) cp.push("Tax ID: " + company.taxId);
      if (company.email) cp.push(company.email);
      if (company.phone) cp.push(company.phone);
      if (cp.length) body.appendParagraph(cp.join("  |  ")).editAsText().setFontSize(9).setFontFamily("Arial").setForegroundColor("#555555");

      // Barra azul separadora
      body.appendParagraph("");
      var bar = body.appendTable([[""]]);
      bar.getRow(0).getCell(0).setBackgroundColor("#1a365d");
      bar.getRow(0).getCell(0).setPaddingTop(4);
      bar.getRow(0).getCell(0).setPaddingBottom(4);
      bar.getRow(0).getCell(0).editAsText().setFontSize(1).setForegroundColor("#1a365d");

      // Título del documento
      var titles = { invoice: "COMMERCIAL INVOICE", packing: "PACKING LIST", bl: "BILL OF LADING INSTRUCTIONS" };
      var titlePara = body.appendParagraph(titles[docType]);
      titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      titlePara.editAsText().setFontSize(17).setBold(true).setFontFamily("Arial").setForegroundColor("#1a365d");
      titlePara.setSpacingBefore(14);
      titlePara.setSpacingAfter(10);

      // Tabla info
      var infoTable = body.appendTable([
        ["No.", data.invoiceNo || "", "Date", data.date || Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM/yyyy")],
        ["Incoterm", data.incoterm || "", "Currency", data.currency || "USD"]
      ]);
      styleInfoTable(infoTable);
      body.appendParagraph("");

      // Tabla partes
      var expInfo = [company.name, company.address, company.taxId ? "Tax ID: " + company.taxId : ""].filter(Boolean).join("\n");
      var impInfo = [data.importador, data.importadorAddress, data.importadorCountry, data.importadorTaxId ? "Tax ID: " + data.importadorTaxId : ""].filter(Boolean).join("\n");
      var partTable = body.appendTable([["SELLER / EXPORTER", "BUYER / IMPORTER"], [expInfo, impInfo]]);
      stylePartiesTable(partTable);
      body.appendParagraph("");

      // Contenido
      if (docType === "invoice") buildInvoiceContent(body, data);
      else if (docType === "packing") buildPackingContent(body, data);
      else buildBLContent(body, data, company);

      // Footer
      body.appendParagraph("");
      var ftBar = body.appendTable([[""]]);
      var ftCell = ftBar.getRow(0).getCell(0);
      ftCell.setBackgroundColor("#e8f0fe");
      ftCell.setPaddingTop(7);
      ftCell.setPaddingBottom(7);
      ftCell.setPaddingLeft(10);
      ftCell.editAsText().setText("Generated by " + (company.name || "Forwarding Operations Assistant") + "  ·  " + Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires",
  "dd/MM/yyyy")).setFontSize(8).setItalic(true).setFontFamily("Arial").setForegroundColor("#555555");

      doc.saveAndClose();
      var pdf = DriveApp.getFileById(docId).getAs(MimeType.PDF);
      return { success: true, data: Utilities.base64Encode(pdf.getBytes()) };

    } catch(e) {
      return { error: e.toString() };
    } finally {
      if (docId) { try { DriveApp.getFileById(docId).setTrashed(true); } catch(e2) {} }
    }
  }

 function styleInfoTable(table) {
    for (var i = 0; i < table.getNumRows(); i++) {
      for (var j = 0; j < table.getRow(i).getNumCells(); j++) {
        var cell = table.getRow(i).getCell(j);
        cell.setPaddingTop(5);
        cell.setPaddingBottom(5);
        cell.setPaddingLeft(8);
        cell.setPaddingRight(8);
        if (j % 2 === 0) {
          cell.setBackgroundColor("#e8f0fe");
          cell.editAsText().setBold(true).setFontSize(9).setFontFamily("Arial").setForegroundColor("#1a365d");
        } else {
          cell.editAsText().setFontSize(9).setFontFamily("Arial");
        }
      }
    }
  }

  function stylePartiesTable(table) {
    for (var j = 0; j < table.getRow(0).getNumCells(); j++) {
      var hc = table.getRow(0).getCell(j);
      hc.setBackgroundColor("#1a365d");
      hc.setPaddingTop(6);
      hc.setPaddingBottom(6);
      hc.setPaddingLeft(10);
      hc.editAsText().setBold(true).setFontSize(10).setFontFamily("Arial").setForegroundColor("#ffffff");
    }
    for (var k = 0; k < table.getRow(1).getNumCells(); k++) {
      var dc = table.getRow(1).getCell(k);
      dc.setPaddingTop(8);
      dc.setPaddingBottom(8);
      dc.setPaddingLeft(10);
      dc.editAsText().setFontSize(9).setFontFamily("Arial").setForegroundColor("#333333");
    }
  }

  function styleItemsTable(table) {
    for (var j = 0; j < table.getRow(0).getNumCells(); j++) {
      var hc = table.getRow(0).getCell(j);
      hc.setBackgroundColor("#1a365d");
      hc.setPaddingTop(6);
      hc.setPaddingBottom(6);
      hc.setPaddingLeft(6);
      hc.editAsText().setBold(true).setFontSize(9).setFontFamily("Arial").setForegroundColor("#ffffff");
    }
    for (var i = 1; i < table.getNumRows(); i++) {
      var bg = (i % 2 === 0) ? "#f0f4f8" : "#ffffff";
      for (var k = 0; k < table.getRow(i).getNumCells(); k++) {
        var cell = table.getRow(i).getCell(k);
        cell.setBackgroundColor(bg);
        cell.setPaddingTop(5);
        cell.setPaddingBottom(5);
        cell.setPaddingLeft(6);
        cell.editAsText().setFontSize(9).setFontFamily("Arial");
      }
    }
  }

  function buildInvoiceContent(body, data) {
    var items = data.items || [];
    var rows = [["Description", "HS Code", "Qty", "Unit", "Unit Price", "Amount"]];
    items.forEach(function(item) {
      rows.push([item.description || "", item.hsCode || "", item.qty || "", item.unit || "",
        (data.currency || "USD") + " " + (item.unitPrice || ""),
        (data.currency || "USD") + " " + (item.amount || "")]);
    });
    rows.push(["", "", "", "", "TOTAL", (data.currency || "USD") + " " + (data.totalValue || "0")]);
    var t = body.appendTable(rows);
    styleItemsTable(t);
    var lastRow = t.getRow(t.getNumRows() - 1);
    lastRow.getCell(4).setBackgroundColor("#e8f0fe");
    lastRow.getCell(4).editAsText().setBold(true).setFontFamily("Arial");
    lastRow.getCell(5).setBackgroundColor("#1a365d");
    lastRow.getCell(5).editAsText().setBold(true).setFontFamily("Arial").setForegroundColor("#ffffff");
    body.appendParagraph("");
    var routing = [];
    if (data.portOfLoading) routing.push("Port of Loading: " + data.portOfLoading);
    if (data.portOfDischarge) routing.push("Port of Discharge: " + data.portOfDischarge);
    if (data.countryOfOrigin) routing.push("Country of Origin: " + data.countryOfOrigin);
    if (data.freightTerms) routing.push("Freight: " + data.freightTerms);
    if (routing.length) {
      var rp = body.appendParagraph(routing.join("   |   "));
      rp.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rp.editAsText().setFontSize(9).setFontFamily("Arial").setForegroundColor("#555555");
    }
  }

  function buildPackingContent(body, data) {
    var items = data.items || [];
    var rows = [["Description", "Pkgs", "GW (kg)", "NW (kg)", "CBM"]];
    items.forEach(function(item) {
      rows.push([item.description || "", item.packages || "1", item.grossWeight || "", item.netWeight || "", ""]);
    });
    rows.push(["TOTALS", "", data.totalGrossWeight || "", data.totalNetWeight || "", data.totalCBM || ""]);
    var t = body.appendTable(rows);
    styleItemsTable(t);
    var lastRow = t.getRow(t.getNumRows() - 1);
    for (var j = 0; j < lastRow.getNumCells(); j++) {
      lastRow.getCell(j).setBackgroundColor("#e8f0fe");
      lastRow.getCell(j).editAsText().setBold(true).setFontFamily("Arial");
    }
  }

   function buildBLContent(body, data, company) {
    var fields = [
      ["Shipper", (company.name || "") + "\n" + (company.address || "")],
      ["Consignee", (data.importador || "") + "\n" + (data.importadorAddress || "")],
      ["Notify Party", data.importador || ""],
      ["Port of Loading", data.portOfLoading || ""],
      ["Port of Discharge", data.portOfDischarge || ""],
      ["Vessel / Flight", data.vessel || ""],
      ["ETD", data.etd || ""],
      ["ETA", data.eta || ""],
      ["Freight Terms", data.freightTerms || ""],
      ["Description of Goods", (data.items || []).map(function(i) { return i.description; }).join(", ")],
      ["Gross Weight", (data.totalGrossWeight || "") + " kg"],
      ["Measurement", (data.totalCBM || "") + " CBM"],
      ["Special Instructions", data.specialInstructions || ""]
    ];
    var t = body.appendTable(fields);
    for (var i = 0; i < t.getNumRows(); i++) {
      var lc = t.getRow(i).getCell(0);
      var vc = t.getRow(i).getCell(1);
      lc.setBackgroundColor("#1a365d");
      lc.setPaddingTop(6);
      lc.setPaddingBottom(6);
      lc.setPaddingLeft(10);
      lc.editAsText().setBold(true).setFontSize(9).setFontFamily("Arial").setForegroundColor("#ffffff");
      vc.setPaddingTop(6);
      vc.setPaddingBottom(6);
      vc.setPaddingLeft(10);
      vc.editAsText().setFontSize(9).setFontFamily("Arial");
      if (i % 2 === 0) vc.setBackgroundColor("#f0f4f8");
    }
  }
   // ===== HISTORIAL =====

  function getOrCreateHistorySheet() {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty("historySheetId");
    var ss;
    if (sheetId) {
      try { ss = SpreadsheetApp.openById(sheetId); } catch(e) { sheetId = null; }
    }
    if (!sheetId) {
      ss = SpreadsheetApp.create("FOA - Historial de Operaciones");
      props.setProperty("historySheetId", ss.getId());
      var qs = ss.getActiveSheet().setName("Cotizaciones");
      qs.appendRow(["Fecha", "Origen", "Destino", "Mercaderia", "Cliente", "Forwarders analizados", "Incoterm"]);
      qs.setFrozenRows(1);
      var ds = ss.insertSheet("Documentos");
      ds.appendRow(["Fecha", "N Invoice", "Importador", "Valor total", "Moneda", "Incoterm", "Documentos"]);
      ds.setFrozenRows(1);
    }
    return ss;
  }

  function saveQuoteHistory(formData, quotesFound) {
    try {
      var ss = getOrCreateHistorySheet();
      ss.getSheetByName("Cotizaciones").appendRow([
        new Date(), formData.origen, formData.destino,
        formData.mercaderia, formData.cliente, quotesFound, formData.incoterm
      ]);
    } catch(e) {}
  }

  function saveDocHistory(data, docTypes) {
    try {
      var ss = getOrCreateHistorySheet();
      ss.getSheetByName("Documentos").appendRow([
        new Date(), data.invoiceNo, data.importador,
        data.totalValue, data.currency, data.incoterm, docTypes.join(", ")
      ]);
    } catch(e) {}
  }

  function getHistory() {
    try {
      var ss = getOrCreateHistorySheet();
      var qData = ss.getSheetByName("Cotizaciones").getDataRange().getValues();
      var dData = ss.getSheetByName("Documentos").getDataRange().getValues();
      return {
        quotes: qData.slice(1).reverse().slice(0, 25),
        documents: dData.slice(1).reverse().slice(0, 25),
        sheetUrl: ss.getUrl()
      };
    } catch(e) { return { error: e.message }; }
  }

  function autorizarSheets() {
    var ss = SpreadsheetApp.create("test_auth_sheets");
    DriveApp.getFileById(ss.getId()).setTrashed(true);
    Logger.log("Sheets autorizado");
  }