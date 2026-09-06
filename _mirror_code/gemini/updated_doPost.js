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
