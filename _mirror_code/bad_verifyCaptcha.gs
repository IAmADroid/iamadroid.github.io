/**
 * Validates a reCAPTCHA token against Google's siteverify API.
 * @param {string} captchaToken - The token sent from the form ('g-recaptcha-response').
 * @returns {boolean} - True if human/valid, false if bot or invalid token.
 */
function verifyCaptcha(captchaToken) {
  // // If no secret key is set or no token provided, fail verification
  // if (!RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY === "YOUR_RECAPTCHA_SECRET_KEY_HERE" || !captchaToken) {
  //   logToSheet("reCAPTCHA Verification skipped: Missing key or token.");
  //   return false;
  // }

  /*
  {
    "event": {
      "token": "TOKEN",
      "expectedAction": "USER_ACTION",
      "siteKey": "REDACTED_SITE_KEY",
    }
  }
  */

  // you find this layout in: https://console.cloud.google.com/security/recaptcha
  // Fraud Defense (recaptcha) > Keys > Key Details (if you already have a key) 
  //   > Integration - Back End - "Set up"
  // and you'll find how to format the POST request.
  var formData = {
    "event": {
      "token": captchaToken,
      "expectedAction": "USER_ACTION",
      "siteKey": RECAPTCHA_SITE_KEY,
    }
  };

  /*
  // original by gemini. might be the legacy api? it doesn't work tho. bad gemini!
  var formData = {
    'secret': RECAPTCHA_SECRET_KEY,
    'response': captchaToken
  };
  */

  var options = {
    'method': 'post',
    'payload': formData
  };

  try {

    //https://recaptchaenterprise.googleapis.com/v1/projects/vba-scripts/assessments?key=API_KEY
    //where did gemini even get https://www.google.com/recaptcha/api/siteverify lol

    // https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetchurl,-params
    var response = UrlFetchApp.fetch('https://recaptchaenterprise.googleapis.com/v1/projects/vba-scripts/assessments?key=' + RECAPTCHA_API_KEY, options);
    var json = JSON.parse(response.getContentText());

    logToSheet("reCAPTCHA Verification Result: " + JSON.stringify(json));

    // For reCAPTCHA v2: Checks if success is true
    // For reCAPTCHA v3: Checks if success is true AND score is >= 0.5 (threshold)
    var isSuccess = json.success === true;
    var isHumanScore = (typeof json.score !== 'undefined') ? json.score >= 0.5 : true;

    return isSuccess && isHumanScore;
  } catch (e) {
    logToSheet("Error verifying reCAPTCHA: " + e.toString());
    return false;
  }
}