/******************************************************************************
 * This tutorial is based on the work of Martin Hawksey twitter.com/mhawksey  *
 * But has been simplified and cleaned up to make it more beginner friendly   *
 * All credit still goes to Martin and any issues/complaints/questions to me. *
 ******************************************************************************/

// if you want to store your email server-side (hidden), uncomment the next line
var TO_ADDRESS = "REDACTED_EMAIL_ADDRESS+webapp@gmail.com";

// spit out all the keys/values from the form in HTML for email
// uses an array of keys if provided or the object to determine field order
function formatMailBody(obj, order) {
  var result = "";
  if (!order) {
    order = Object.keys(obj);
  }
  
  // loop over all keys in the ordered form data
  for (var idx in order) {
    var key = order[idx];
    result += "<h4 style='text-transform: capitalize; margin-bottom: 0'>" + key + "</h4><div>" + sanitizeInput(obj[key]) + "</div>";
    // for every key, concatenate an `<h4 />`/`<div />` pairing of the key name and its value, 
    // and append it to the `result` string created at the start.
  }
  return result; // once the looping is done, `result` will be one long string to put in the email body
}

// sanitize content from the user - trust no one 
// ref: https://developers.google.com/apps-script/reference/html/html-output#appendUntrusted(String)
function sanitizeInput(rawInput) {
   var placeholder = HtmlService.createHtmlOutput(" ");
   placeholder.appendUntrusted(rawInput);
  
   return placeholder.getContent();
 }

/**
* MAIN ENTRY POINT
* 
* doPost(e) and doGet(e) are entry points
* for Web Apps/Apps Script:
* https://developers.google.com/apps-script/guides/web#request_parameters
*/
function doPost(e) {
  try {
    if (!e || !e.parameters) {
      throw new Error("No payload parameters provided in POST request.");
    }

    var mailData = e.parameters;
    
    // Extract reCAPTCHA token (e.parameters values are arrays)
    var captchaToken = mailData['g-recaptcha-response'] ? mailData['g-recaptcha-response'][0] : null;
    
    // Verify token against Google API
    var isHuman = verifyCaptcha(captchaToken);

    // Record submission to spreadsheet (including pass/fail status)
    record_data(e, isHuman);
    
    var dataOrder = mailData.formDataNameOrder ? JSON.parse(mailData.formDataNameOrder) : null;
    var sendEmailTo = (typeof TO_ADDRESS !== "undefined" && TO_ADDRESS) 
                      ? TO_ADDRESS 
                      : Session.getActiveUser().getEmail();
    
    // ONLY send email if reCAPTCHA verification passed
    if (isHuman && sendEmailTo) {
      MailApp.sendEmail({
        to: String(sendEmailTo),
        subject: "Contact Form Submitted",
        htmlBody: formatMailBody(mailData, dataOrder)
      });
      
      return ContentService
        .createTextOutput(JSON.stringify({ "result": "success", "message": "Email sent successfully." }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Submission recorded in sheet, but email blocked due to spam/bot detection
      Logger.log("Submission logged to sheet, but email suppressed (Bot detected).");
      return ContentService
        .createTextOutput(JSON.stringify({ "result": "flagged", "message": "Submission recorded, captcha failed." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    Logger.log(error);
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * There should be a g-recaptcha-response field coming in with each form submission.
 * pass that code in here to make sure it's legit.
 * 
 * https://developers.google.com/recaptcha/docs/verify
 */
function verify_recaptcha(rcode){
  var url = form.action;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  // xhr.withCredentials = true;
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // TODO: check the response to make sure it's legit
      }
  };
  // url encode form data for sending as post data
  var encoded = Object.keys(data).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
  }).join('&');
  xhr.send(encoded);
}


/**
 * record_data inserts the data received from the html form submission
 * e is the data received from the POST
 */
function record_data(e) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000); // hold off up to 30 sec to avoid concurrent writing
  
  try {
    Logger.log(JSON.stringify(e)); // log the POST data in case we need to debug it
    
    // select the 'responses' sheet by default
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = e.parameters.formGoogleSheetName || "responses";
    var sheet = doc.getSheetByName(sheetName);
    
    var oldHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var newHeader = oldHeader.slice();
    var fieldsFromForm = getDataColumns(e.parameters);
    var row = [new Date()]; // first element in the row should always be a timestamp
    
    // loop through the header columns
    for (var i = 1; i < oldHeader.length; i++) { // start at 1 to avoid Timestamp column
      var field = oldHeader[i];
      //https://developers.google.com/apps-script/guides/web#:~:text=alice%22%2C%20%22n%22%3A%20%221%22%7D-,e.parameters,-An%20object%20similar
      var output = getFieldFromData(field, e.parameters);
      row.push(output);
      
      // mark as stored by removing from form fields
      var formIndex = fieldsFromForm.indexOf(field);
      if (formIndex > -1) {
        fieldsFromForm.splice(formIndex, 1);
      }
    }
    
    // set any new fields in our form
    for (var i = 0; i < fieldsFromForm.length; i++) {
      var field = fieldsFromForm[i];
      var output = getFieldFromData(field, e.parameters);
      row.push(output);
      newHeader.push(field);
    }
    
    // more efficient to set values as [][] array than individually
    var nextRow = sheet.getLastRow() + 1; // get next row
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    // update header row with any new data
    if (newHeader.length > oldHeader.length) {
      sheet.getRange(1, 1, 1, newHeader.length).setValues([newHeader]);
    }
  }
  catch(error) {
    Logger.log(error);
  }
  finally {
    lock.releaseLock();
    return;
  }

}

function getDataColumns(data) {
  return Object.keys(data).filter(function(column) {
    return !(column === 'formDataNameOrder' || column === 'formGoogleSheetName' || column === 'formGoogleSendEmail' || column === 'honeypot');
  });
}

function getFieldFromData(field, data) {
  var values = data[field] || '';
  var output = values.join ? values.join(', ') : values;
  return output;
}

// gemini code below
//----------------------------------------
// Replace with your secret key from the Google reCAPTCHA Admin Console
var RECAPTCHA_SECRET_KEY = "YOUR_RECAPTCHA_SECRET_KEY_HERE";

/**
 * Validates a reCAPTCHA token against Google's siteverify API.
 * @param {string} captchaToken - The token sent from the form ('g-recaptcha-response').
 * @returns {boolean} - True if human/valid, false if bot or invalid token.
 */
function verifyCaptcha(captchaToken) {
  // If no secret key is set or no token provided, fail verification
  if (!RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY === "YOUR_RECAPTCHA_SECRET_KEY_HERE" || !captchaToken) {
    Logger.log("reCAPTCHA Verification skipped: Missing key or token.");
    return false;
  }

  var payload = {
    'secret': RECAPTCHA_SECRET_KEY,
    'response': captchaToken
  };

  var options = {
    'method': 'post',
    'payload': payload
  };

  try {
    var response = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', options);
    var json = JSON.parse(response.getContentText());

    Logger.log("reCAPTCHA Verification Result: " + JSON.stringify(json));

    // For reCAPTCHA v2: Checks if success is true
    // For reCAPTCHA v3: Checks if success is true AND score is >= 0.5 (threshold)
    var isSuccess = json.success === true;
    var isHumanScore = (typeof json.score !== 'undefined') ? json.score >= 0.5 : true;

    return isSuccess && isHumanScore;
  } catch (e) {
    Logger.log("Error verifying reCAPTCHA: " + e.toString());
    return false;
  }
}
