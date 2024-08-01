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
  new_sc_element.draggable = true;
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

  //Dragging logic start------------------

  let draggable_sc = null;
  let is_right = false;
  let closest_element = null;

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  const screenshots_elements = document.querySelectorAll(".screenshot");
  screenshots_elements.forEach((screenshot) => {
    screenshot.addEventListener("dragstart", () => {
      screenshot.classList.add("dragging");
    });

    screenshot.addEventListener("dragend", () => {
      console.log("ENding");
      screenshot.classList.remove("dragging");
      console.log(closest_element);
      if (closest_element !== null && closest_element !== undefined) {
        const draggable_sc_idx = draggable_sc.id.split("-")[1];
        const closest_element_idx = closest_element.id.split("-")[1];
        console.log("Draggable idx", draggable_sc_idx);
        console.log("After idx", closest_element_idx);
        const [draggable_sc_element] = screenshots.splice(draggable_sc_idx, 1);
        console.log(screenshots);
        if (is_right) {
          screenshots.splice(closest_element_idx + 1, 0, draggable_sc_element);
        } else {
          screenshots.splice(closest_element_idx, 0, draggable_sc_element);
        }
        chrome.storage.local.set({ screenshots }, () => {
          console.log("Screenshot rearranged.");
        });
        viewScreenshots(screenshots);
      }
    });
  });

  screenshot_container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const after_elementobj = getDragAfterElement(
      screenshot_container,
      e.clientY,
      e.clientX
    );
    const after_element = after_elementobj?.element;
    const after_element_coordinates = after_elementobj?.co_ordinates;
    draggable_sc = document.querySelector(".dragging");

    if (after_element !== null && after_element !== undefined) {
      closest_element = after_element;
      if (e.clientX > after_element_coordinates[0]) {
        is_right = true;
        insertAfter(draggable_sc, after_element);
      } else {
        is_right = false;
        screenshot_container.insertBefore(draggable_sc, after_element);
      }
    }
  });
};

function getDragAfterElement(container, y, x) {
  const draggableElements = [
    ...container.querySelectorAll(".screenshot:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const box_coordinates = [
        box.left + box.width / 2,
        box.top + box.height / 2,
      ];
      const dist = Math.sqrt(
        Math.pow(x - box_coordinates[0], 2) +
          Math.pow(y - box_coordinates[1], 2)
      );
      if (dist < 60 && dist < closest.distance) {
        return {
          distance: dist,
          element: child,
          co_ordinates: box_coordinates,
        };
      } else {
        return closest;
      }
    },
    { distance: Number.POSITIVE_INFINITY }
  );
}

//Dragging logic end------------------------------

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

const send_btn = document.getElementById("send_btn");
send_btn.onclick = (e) => {
  chrome.runtime.sendMessage({ type: "send" });
};
