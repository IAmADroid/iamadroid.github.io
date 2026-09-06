function record_data(e, isHuman) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); 
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = e.parameters.formGoogleSheetName ? e.parameters.formGoogleSheetName[0] : "responses";
    var sheet = doc.getSheetByName(sheetName) || doc.getActiveSheet();
    
    var lastCol = sheet.getLastColumn();
    
    // Include initial default columns if sheet is empty
    var oldHeader = lastCol > 0 
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] 
      : ["Timestamp", "Captcha Status"];
      
    var newHeader = oldHeader.slice();
    var fieldsFromForm = getDataColumns(e.parameters);
    
    // Column 0: Timestamp, Column 1: Pass/Fail status
    var row = [new Date(), isHuman ? "PASSED (Human)" : "FAILED (Bot)"];

    for (var i = 2; i < oldHeader.length; i++) {
      var field = oldHeader[i];
      var output = getFieldFromData(field, e.parameters);
      row.push(output);
      
      var formIndex = fieldsFromForm.indexOf(field);
      if (formIndex > -1) {
        fieldsFromForm.splice(formIndex, 1);
      }
    }
    
    for (var j = 0; j < fieldsFromForm.length; j++) {
      var newField = fieldsFromForm[j];
      var newOutput = getFieldFromData(newField, e.parameters);
      row.push(newOutput);
      newHeader.push(newField);
    }
    
    sheet.appendRow(row);

    if (newHeader.length > oldHeader.length) {
      sheet.getRange(1, 1, 1, newHeader.length).setValues([newHeader]);
    }
  } catch (error) {
    Logger.log("Error in record_data: " + error.toString());
  } finally {
    lock.releaseLock();
  }
}
