//place is justify-content, so flex-end, center etc., close is close button or no
//buttons is a array of objects name: name of button, function: event listener for button
function windowComponent(
  place = "center",
  content = "",
  close = true,
  buttons = null
) {
  const windowContainer = document.getElementById("window-container");
  const windowExists = document.getElementsByClassName("window");
  let closeButton;

  if (windowExists.length > 0) {
    return;
  }
  windowContainer.style.justifyContent = place;
  let div = document.createElement("div");
  div.classList.add("window");
  windowContainer.appendChild(div);

  if (place == "flex-end") {
    div.classList.add("end");
  }

  if (close) {
    closeButton = document.createElement("button");
    closeButton.classList.add("close-button");
    closeButton.innerText = "Close";
    closeButton.addEventListener("click", remove);
    div.appendChild(closeButton);
  }

  let contentDiv = document.createElement("div");
  contentDiv.innerText = content;
  contentDiv.classList.add("content");
  div.appendChild(contentDiv);

  //all added buttons besides close button
  const addedbuttons = [];
  if (buttons) {
    buttons.forEach((buttonObject) => {
      let button = document.createElement("button");
      button.innerText = buttonObject.name;
      button.addEventListener("click", buttonObject.function);
      if (buttonObject.dataAttribute) {
        button.dataset.attribute = buttonObject.dataAttribute;
      }
      button.classList.add("action-button");
      addedbuttons.push(button);
      contentDiv.appendChild(button);
    });
  }

  function remove() {
    addedbuttons.forEach((button, index) => {
      button.removeEventListener("click", buttons[index].function);
    });
    if (closeButton) {
      closeButton.removeEventListener("click", remove);
    }
    windowContainer.removeChild(div);
  }

  return div;
}
//Object with stuff to display
function battleBar(plantName, plantHealth) {
  const barDiv = document.getElementById("top-bar");
  const plantDiv = document.getElementById("plant-count-div");
  const convertedDiv = document.getElementById("converted-count-div");
  barDiv.classList.add("battle-bar");
  plantDiv.style.display = "none";
  convertedDiv.style.display = "none";

  let healthDiv = document.createElement("div");
  healthDiv.classList.add("bar-item");
  barDiv.appendChild(healthDiv);

  let contentDiv = document.createElement("div");
  contentDiv.innerText = `${plantName} health: `;
  healthDiv.appendChild(contentDiv);

  let healthCountDiv = document.createElement("div");
  healthCountDiv.innerText = plantHealth;
  healthDiv.appendChild(healthCountDiv);

  let endBattleButton = document.createElement("button");
  endBattleButton.innerText = "End battle";
  // endBattleButton.addEventListener("click", endBattle);
  barDiv.appendChild(endBattleButton);

  function changePlantHealth(newHealth) {
    healthCountDiv.innerText = newHealth;
  }
  //feed it the event listeners
  function endBattle() {
    plantDiv.style.display = "flex";
    convertedDiv.style.display = "flex";
    barDiv.classList.remove("battle-bar");
    barDiv.removeChild(healthDiv);
    console.log("End battle11!!!");
    endBattleButton.removeEventListener("click", endBattle);
    barDiv.removeChild(endBattleButton);
  }
  return { changePlantHealth, endBattleButton, endBattle };
}

export { windowComponent, battleBar };
