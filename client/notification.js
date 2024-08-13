function showNotification() {
  // Create a notification element
  let snackbar = document.getElementById("sc_snackbar");
  let image = document.getElementById("snackbar_image");
  if (!snackbar) {
    snackbar = document.createElement("div");
    image = document.createElement("img");
    image.id = "snackbar_image";
    image.src = "https://res.cloudinary.com/diu5vyuxy/image/upload/v1723394284/cjxma2iulo7espgdotsj.png";
    snackbar.id = "sc_snackbar";
    document.body.appendChild(snackbar);
    snackbar.appendChild(image);

    // Add the CSS styles directly in JavaScript
    const style = document.createElement("style");
    style.textContent = `
      #sc_snackbar {
        visibility: hidden; /* Hidden by default. Visible on click */
        width: fit-content; /* Set a default minimum width */
        margin-left: -125px; /* Divide value of min-width by 2 */
        background-color: white;
        text-align: center; /* Centered text */
        border-radius: 2px; /* Rounded borders */
        padding: 5px; /* Padding */
        position: fixed; /* Sit on top of the screen */
        z-index: 5000; /* Add a z-index if needed */
        left: 50%; /* Center the snackbar */
        border-radius: 50%;
      }
      
      #snackbar_image{
      width: 50px;
      height: 50px;
      }

      /* Show the snackbar when clicking on a button (class added with JavaScript) */
      #sc_snackbar.show {
        visibility: visible; /* Show the snackbar */
        animation: fadein 1s, fadeout 0.8s
      }

      /* Animations to fade the snackbar in and out */
      @-webkit-keyframes fadein {
        from {top: 3px; opacity: 0;}
        to {top: 12px; opacity: 1;}
      }

      @keyframes fadein {
        from {top: 3px; opacity: 0;}
        to {top: 12px; opacity: 1;}
      }

      @-webkit-keyframes fadeout {
        from {top: 12px; opacity: 1;}
        to {top: 3px; opacity: 0;}
      }

      @keyframes fadeout {
        from {top: 12px; opacity: 1;}
        to {top: 3px; opacity: 0;}
      }
    `;
    document.head.appendChild(style);
  }

  // Add the 'show' class to trigger the animation
  snackbar.className = "show";

  // Remove the 'show' class after the animation duration (3 seconds in total)
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 700); // 3 seconds for the full visibility including animation
}

// Expose the function to global scope for injection
window.showNotification = showNotification;