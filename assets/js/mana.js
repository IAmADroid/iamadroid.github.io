var id = toggle_color('red', 'blue', 5000);

function toggle_color(color1, color2, time, elementQuery = 'body') {
  var $selector = document.querySelector(elementQuery);

  setTransitionDurations($selector, time)
  $selector.style.backgroundColor = $selector.style.backgroundColor === color1 ? color2 : color1; 
  var intervalId = setInterval(function() {
    $selector.style.backgroundColor = $selector.style.backgroundColor === color1 ? color2 : color1; 
  }, time);
  return intervalId;
}

function getStringFromMs(ms) {
  // convert ms to string
  // i.e. 1000 => '1ms'
  return ms + 'ms';
}

function setTransitionDurations($selector, ms) {
  var transitionSeconds = getStringFromMs(ms);
  // you need to set the transition for 
  // each browser for max compatibility
  var prefixes = ['-webkit', '-o', '-moz'];
  prefixes.forEach(function(prefix) {
    $selector.style.setProperty(prefix + '-transition-duration', transitionSeconds);
  })
  $selector.style.transitionDuration = transitionSeconds;
}