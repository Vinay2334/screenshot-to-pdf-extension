function showNotification(message) {
  // Create a notification element
  let snackbar = document.getElementById("snackbar");
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.id = "snackbar";
    document.body.appendChild(snackbar);

    // Add the CSS styles directly in JavaScript
    const style = document.createElement("style");
    style.textContent = `
      #snackbar {
        visibility: hidden; /* Hidden by default. Visible on click */
        min-width: 250px; /* Set a default minimum width */
        margin-left: -125px; /* Divide value of min-width by 2 */
        background-color: #333; /* Black background color */
        color: #fff; /* White text color */
        text-align: center; /* Centered text */
        border-radius: 2px; /* Rounded borders */
        padding: 16px; /* Padding */
        position: fixed; /* Sit on top of the screen */
        z-index: 1000; /* Add a z-index if needed */
        left: 50%; /* Center the snackbar */
        top: 30px; /* 30px from the top */
      }

      /* Show the snackbar when clicking on a button (class added with JavaScript) */
      #snackbar.show {
        visibility: visible; /* Show the snackbar */
        /* Add animation: Take 0.5 seconds to fade in and out the snackbar.
        However, delay the fade out process for 2.5 seconds */
        -webkit-animation: fadein 0.5s, fadeout 0.5s 0.5s;
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
      }

      /* Animations to fade the snackbar in and out */
      @-webkit-keyframes fadein {
        from {top: 0; opacity: 0;}
        to {top: 0; opacity: 1;}
      }

      @keyframes fadein {
        from {top: 0; opacity: 0;}
        to {top: 0; opacity: 1;}
      }

      @-webkit-keyframes fadeout {
        from {top: 0; opacity: 1;}
        to {top: 0; opacity: 0;}
      }

      @keyframes fadeout {
        from {top: 0; opacity: 1;}
        to {top: 0; opacity: 0;}
      }
    `;
    document.head.appendChild(style);
  }

  // Set the message
  snackbar.textContent = message;

  // Add the 'show' class to trigger the animation
  snackbar.className = "show";

  // Remove the 'show' class after the animation duration (3 seconds in total)
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000); // 3 seconds for the full visibility including animation
}

// Expose the function to global scope for injection
window.showNotification = showNotification;