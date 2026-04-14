// Silly css aspect-ratio keeps getting overridden by width properties later on, so we're using javascript
(function($) {
    var submitSpinner = document.querySelector("#submit_spinner");
    
    // I believe entries is a mandatory param for this callback function.
    // observer is an optional param.
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver
    // I'm not sure why gemini forgot to include the "entries" param.
    var syncWidth = (entries, observer) => {
        var height = submitSpinner.getBoundingClientRect().height;
        // Use setProperty to apply '!important' to override high-precedence CSS
        submitSpinner.style.setProperty('width', `${height}px`, 'important');
        alert("resize!");
    };

    // 1. Initial sync on load
    syncWidth();
    //alert("yolo");

    // 2. Watch for any changes to the element's size
    var observer = new ResizeObserver(syncWidth);
    observer.observe(submitSpinner);
})(jQuery);