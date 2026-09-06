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
