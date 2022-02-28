//place is justify-content, so flex-end, center etc., close is close button or no
//buttons is a array of objects name: name of button, function: event listener for button
function windowComponent(content = '', buttons = null) {
  const windowContainer = document.getElementById('window-container');
  const windowExists = document.getElementById('window');
  let closeButton;

  if (windowExists) {
    return;
  }
  windowContainer.style.justifyContent = 'center';
  let div = document.createElement('div');
  div.id = 'window';
  windowContainer.appendChild(div);

  closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.innerText = 'Close';
  closeButton.addEventListener('click', remove);
  div.appendChild(closeButton);

  let contentDiv = document.createElement('div');
  contentDiv.innerText = content;
  contentDiv.classList.add('content');
  div.appendChild(contentDiv);

  //all added buttons besides close button
  const addedbuttons = [];
  if (buttons) {
    buttons.forEach((buttonObject) => {
      let button = document.createElement('button');
      button.innerText = buttonObject.name;
      button.addEventListener('click', buttonObject.function);
      button.addEventListener('click', remove);
      if (buttonObject.dataAttribute) {
        if (Array.isArray(buttonObject.dataAttribute)) {
          buttonObject.dataAttribute.forEach((attribute) => {
            const { name, value } = attribute;
            button.dataset[name] = value;
          });
        } else {
          const { name, value } = buttonObject.dataAttribute;
          button.dataset[name] = value;
        }
      }
      button.classList.add('action-button');
      addedbuttons.push(button);
      contentDiv.appendChild(button);
    });
  }

  function remove() {
    addedbuttons.forEach((button, index) => {
      button.removeEventListener('click', buttons[index].function);
      button.removeEventListener('click', remove);
    });
    closeButton.removeEventListener('click', remove);
    windowContainer.removeChild(div);
  }
}

function coalPlantWindow(clickedPlant, attaccFunction) {
  const { name, status, ID } = clickedPlant.properties;
  const content = `${name}\nStatus: ${status}\nMotto: "${clickedPlant.motto}"\n`;
  if (attaccFunction) {
    windowComponent(content, [
      {
        name: 'Attack',
        function: attaccFunction,
        dataAttribute: { name: 'id', value: ID },
      },
    ]);
  } else windowComponent(content);
}

function convertedCoalPlantWindow(clickedPlant, convertPlant) {
  const { name, ID } = clickedPlant.properties;
  const content = `Hot damn!\n Now this stupid coal plant, ${name}, can be something else!!\n`;
  windowComponent(content, [
    {
      name: 'Earth',
      function: convertPlant,
      dataAttribute: [
        { name: 'id', value: ID },
        { name: 'type', value: 'earth' },
      ],
    },
    {
      name: 'Water',
      function: convertPlant,
      dataAttribute: [
        { name: 'id', value: ID },
        { name: 'type', value: 'water' },
      ],
    },
    {
      name: 'Solar',
      function: convertPlant,
      dataAttribute: [
        { name: 'id', value: ID },
        { name: 'type', value: 'solar' },
      ],
    },
    {
      name: 'Wind',
      function: convertPlant,
      dataAttribute: [
        { name: 'id', value: ID },
        { name: 'type', value: 'wind' },
      ],
    },
    {
      name: 'Other',
      function: convertPlant,
      dataAttribute: [
        { name: 'id', value: ID },
        { name: 'type', value: 'other' },
      ],
    },
  ]);
}

//keeps track of magic count, plant count, converted plant count and changes bar display
class Bar {
  constructor(totalPlants) {
    this.magicDisplay = document.getElementById('magic-score');
    this.plantDisplay = document.getElementById('plant-count');
    this.convertedPlantDisplay = document.getElementById(
      'converted-plant-count'
    );
    console.log('total plants?', totalPlants);

    this.magicCount = 0;
    this.plantCount = totalPlants;
    this.convertedPlantCount = 0;

    this.updateDisplay();
  }

  updateDisplay() {
    this.magicDisplay.innerText = this.magicCount;
    this.plantDisplay.innerText = this.plantCount;
    this.convertedPlantDisplay.innerText = this.convertedPlantCount;
  }

  changeMagic(change) {
    this.magicCount += change;
    this.updateDisplay();
  }

  plantConverted() {
    this.plantCount--;
    this.converedPLantCount++;
    this.updateDisplay();
  }
}

//Object with stuff to display
function battleBar(plantName, plantHealth) {
  const barDiv = document.getElementById('top-bar');
  const plantDiv = document.getElementById('plant-count-div');
  const convertedDiv = document.getElementById('converted-count-div');
  barDiv.classList.add('battle-bar');
  plantDiv.style.display = 'none';
  convertedDiv.style.display = 'none';

  let healthDiv = document.createElement('div');
  healthDiv.classList.add('bar-item');
  barDiv.appendChild(healthDiv);

  let contentDiv = document.createElement('div');
  contentDiv.innerText = `${plantName} health: `;
  healthDiv.appendChild(contentDiv);

  let healthCountDiv = document.createElement('div');
  healthCountDiv.innerText = plantHealth;
  healthDiv.appendChild(healthCountDiv);

  let endBattleButton = document.createElement('button');
  endBattleButton.innerText = 'End battle';
  // endBattleButton.addEventListener("click", endBattle);
  barDiv.appendChild(endBattleButton);

  function changePlantHealth(newHealth) {
    healthCountDiv.innerText = newHealth;
  }
  //feed it the event listeners
  function endBattle() {
    plantDiv.style.display = 'flex';
    convertedDiv.style.display = 'flex';
    barDiv.classList.remove('battle-bar');
    barDiv.removeChild(healthDiv);
    endBattleButton.removeEventListener('click', endBattle);
    barDiv.removeChild(endBattleButton);
  }
  return { changePlantHealth, endBattleButton, endBattle };
}

export { coalPlantWindow, convertedCoalPlantWindow, Bar, battleBar };
