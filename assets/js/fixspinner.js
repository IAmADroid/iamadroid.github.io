// Silly css aspect-ratio keeps getting overridden by width properties later on, so we're using javascript
(function($) {
    const submitListItem = document.querySelector("#submit_list_item");
    const submitButton = document.querySelector("#submit_button");
    const submitSpinner = document.querySelector("#submit_spinner");
    var submitListItem_height = submitListItem.getBoundingClientRect().height
    
    // I believe entries is a mandatory param for this callback function.
    // observer is an optional param.
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/ResizeObserver
    // I'm not sure why gemini forgot to include the "entries" param.
    var syncWidth = (entries, observer) => {
        var buttonHeight = submitButton.getBoundingClientRect().height;
        // match spinner height to button height
        submitSpinner.style.setProperty('height', `${buttonHeight}px`, 'important');

        // make spinner aspect ratio 1:1
        //var height = submitSpinner.getBoundingClientRect().height;
        // (We're just gonna use buttonHeight because the math of the spinner height is all messed up
        //  when it has a rotation.)

        // Use setProperty to apply '!important' to override high-precedence CSS
        submitSpinner.style.setProperty('width', `${buttonHeight}px`, 'important');
        //alert("resize!"); // Useful for debugging accidental resize loops.
    };

    // 1. Initial sync on load
    syncWidth();
    //alert("yolo");

    // 2. Watch for any changes to the element's size
    var observer = new ResizeObserver(syncWidth);

    // the spinner itself doesn't detect all the resizes.
    //observer.observe(submitSpinner);

    // hence why we attach to the <li> instead.
    observer.observe(submitListItem);
})(jQuery);