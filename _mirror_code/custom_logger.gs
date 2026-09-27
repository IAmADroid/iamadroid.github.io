function logToSheet(data){
    // let sheet = SpreadsheetApp.openById("INSERT_ID_HERE");
    var lock = LockService.getDocumentLock();
    lock.waitLock(30000); // hold off up to 30 sec to avoid concurrent writing

    // select the 'responses' sheet by default
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = e.parameters.formGoogleSheetName || "log";
    var sheet = doc.getSheetByName(sheetName);
    //sheet = sheet.getSheetByName("log");

    let date = new Date();

    if(typeof data === "object" && data !== null && !Array.isArray(data)){
        data = JSON.stringify(data);
    }

    sheet.appendRow([date.toTimeString(), data]);
}