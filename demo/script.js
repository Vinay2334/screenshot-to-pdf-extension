document.addEventListener("DOMContentLoaded", function() {
    const draggable = document.getElementById('draggable');
    let isDragging = false;
  
    // Event listeners for drag and drop
    draggable.addEventListener('mousedown', function(event) {
      isDragging = true;
      // Calculate initial offsets
      const rect = draggable.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
  
      // Update position initially
      updatePosition(event.clientX, event.clientY);
  
      // Move element with mouse movement
      document.addEventListener('mousemove', onMouseMove);
    });
  
    document.addEventListener('mouseup', function() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
    });
  
    // Function to update position of draggable element
    function updatePosition(clientX, clientY) {
      const gridContainerRect = document.querySelector('.grid-container').getBoundingClientRect();
      let x = clientX - offsetX - gridContainerRect.left;
      let y = clientY - offsetY - gridContainerRect.top;
  
      // Snap to nearest grid position
      const gridSize = 100 + 10; // Width of grid item + gap
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
  
      draggable.style.left = `${x}px`;
      draggable.style.top = `${y}px`;
    }
  
    function onMouseMove(event) {
      if (!isDragging) return;
      updatePosition(event.clientX, event.clientY);
    }
  });
  