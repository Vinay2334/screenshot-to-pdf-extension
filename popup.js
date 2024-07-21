console.log("PopUp");

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get({ screenshots: [] }, (result) => {
    const screenshots = result.screenshots;
    viewScreenshots(screenshots);
  });
});

function addNewScreenshot(screenshot_container, screenshot, index) {
  const new_sc_element = document.createElement("div");
  const img_element = document.createElement("img");
  const delete_btn = document.createElement("img");

  new_sc_element.className = "screenshot";
  new_sc_element.id = "sc_no-" + index;
  img_element.src = screenshot;
  img_element.id = "sc_pic";
  delete_btn.src = "assets/delete.png";
  delete_btn.className = "buttons";

  new_sc_element.addEventListener("dblclick", (e) =>
    chrome.tabs.create({ url: screenshot, active: false })
  );

  delete_btn.addEventListener("click", onDelete);

  new_sc_element.appendChild(delete_btn);
  new_sc_element.appendChild(img_element);
  screenshot_container.appendChild(new_sc_element);
}

const viewScreenshots = (screenshots) => {
  const screenshot_container = document.getElementById("screenshots");
  screenshot_container.innerHTML = "";
  if (screenshots.length > 0) {
    screenshots.map((sc, index) => {
      addNewScreenshot(screenshot_container, sc, index);
    });
  }

  //Dragging logic------------------
  const screenshots_elements = document.querySelectorAll(".screenshot");
  console.log(screenshots_elements);
  screenshots_elements.forEach((screenshot) => {
    screenshot.addEventListener("dragstart", () => {
      screenshot.classList.add("dragging");
    });

    screenshot.addEventListener("dragend", () => {
      screenshot.classList.remove("dragging");
    });
  });

  screenshot_container.addEventListener('dragover', e => {
    e.preventDefault();
    const after_element = getDragAfterElement(screenshot_container, e.clientY, e.clientX);
    const draggable_sc = document.querySelector(".dragging");
    if (after_element == null) {
      screenshot_container.appendChild(draggable_sc);
      console.log("offf")
    } else {
      screenshot_container.insertBefore(draggable_sc, after_element);
      console.log('elseeee')
    }
  })
};

function getDragAfterElement(container, y, x) {
  const draggableElements = [...container.querySelectorAll('.screenshot:not(.dragging)')]

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = (y - box.top - box.height / 2) + (x - box.left - box.width / 2);
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child }
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element
}

//Dragging end------------------------------

const onDelete = async (e) => {
  const element_index = e.target.parentNode.getAttribute("id").split("-")[1];
  chrome.storage.local.get({ screenshots: [] }, (result) => {
    const screenshots = result.screenshots;
    screenshots.splice(element_index, 1);

    chrome.storage.local.set({ screenshots: screenshots }, () => {
      viewScreenshots(screenshots);
    });
  });
};
