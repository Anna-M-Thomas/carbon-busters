import * as L from "leaflet";
import * as PIXI from "pixi.js";
import "leaflet-pixi-overlay";
import Bump from "./bump";
import { Keyboard } from "./keyboard";
import { windowComponent, battleBar } from "./ui";
import { Politician, Hero, CoalPlant, Magic } from "./extendedSprites";
import filteredCoalplants from "./map_point_en";
const mapDiv = document.getElementById("mapid");
const magicDisplay = document.getElementById("magic-score");
const plantDisplay = document.getElementById("plant-count");
const convertedPlantDisplay = document.getElementById("converted-plant-count");
let windowDiv; // use to store created window component and tell it to remove itself

//pixi setup, global variables
const loader = new PIXI.Loader();
const app = new PIXI.Application();
const b = new Bump(PIXI);
let hero, politician, state, pixiOverlay;
let plantArray = [];
let inBoundsArray = [];
let magicArray = [];
let magicCount = 0;
let plantCount;
let convertedPlantCount = 0;
let duringAttacc = false;

//set up map
const mymap = L.map(mapDiv, {
  zoomControl: false,
  keyboard: false,
  touchZoom: false,
  doubleClickZoom: false,
  scrollWheelZoom: false, //<==temporarily enable if you want to check things
}).setView({ lat: 38.07992400470959, lng: 140.8103761728401 }, 14);
L.tileLayer(
  "https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg",
  {
    attribution:
      "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.",
    maxZoom: 14,
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(mymap);

//initial coords for map
const heroLatLng = [38.423940781047804, 141.31276130676272];
mymap.panTo(heroLatLng);

//load stuff
loader.add("hero", "img/Julia/Julia.json");
loader.add("coal", "img/hysteric_karyoku.png");
loader.add("politician", "img/seijika2.png");
loader.add("magic", "img/earth.png");
loader.load(setup);

/*** start of setup function ***/
function setup(loader, resources) {
  let firstDraw = true;

  //Sprites textures
  const juliaSheet = resources.hero.spritesheet;
  const coalTexture = resources.coal.texture;
  const magicTexture = resources.magic.texture;
  //const politicianTexture = resources.politician.texture;

  //Make pixi overlay
  pixiOverlay = L.pixiOverlay(function (utils, event) {
    const container = utils.getContainer();
    const renderer = utils.getRenderer();
    const project = utils.latLngToLayerPoint;
    const scale = utils.getScale();
    const map = utils.getMap();
    const interaction = renderer.plugins.interaction;

    //start first draw
    if (firstDraw) {
      //***** adding the politician as a test ******
      // const politicianCoords = project([38.43, 141.335]);
      // politician = new Politician(
      //   politicianTexture,
      //   scale,
      //   politicianCoords.x,
      //   politicianCoords.y
      // );
      // app.stage.addChild(politician);
      //***** adding the politician as a test ******

      // Add hero
      const heroCoords = project(heroLatLng);
      hero = new Hero(
        juliaSheet.animations["idle"],
        scale,
        heroCoords.x,
        heroCoords.y
      );
      app.stage.addChild(hero);

      plantCount = filteredCoalplants.length;
      plantDisplay.innerText = plantCount;

      //make and place the coal plant sprites
      filteredCoalplants.forEach((plant) => {
        const plantLatLng = L.latLng(
          plant.geometry.coordinates[1],
          plant.geometry.coordinates[0]
        );
        const plantCoords = project(plantLatLng);
        const plantSprite = new CoalPlant(
          coalTexture,
          scale,
          plantCoords.x,
          plantCoords.y,
          plantLatLng,
          plant.properties
        );
        app.stage.addChild(plantSprite);
        plantArray.push(plantSprite);
      });

      //make magic sprites
      for (let i = 0; i < 5; i++) {
        //purposefully out of bounds initially to be placed in right area
        let latLng = L.latLng(50.5, 30.5);
        const magic = new Magic(magicTexture, scale, latLng);
        app.stage.addChild(magic);
        magicArray.push(magic);
        inBoundsArray.push(magic);
      }
    }
    //end first draw

    //"camera" (map) moves if player moves
    if (event.type == "move") {
      const newCoords = utils.layerPointToLatLng([hero.x, hero.y]);
      map.panTo(newCoords);
    }

    //from Leaflet.PixiOverlay example: to see if a sprite has been clicked
    if (event.type == "click") {
      const pointerEvent = event.data.originalEvent;
      const pixiPoint = new PIXI.Point();
      interaction.mapPositionToPoint(
        pixiPoint,
        pointerEvent.clientX,
        pointerEvent.clientY
      );
      const target = interaction.hitTest(pixiPoint, container);
      //if it's a coal plant, display info window
      if (target && target.coalPlant) {
        let content = `${target.properties.name}\nStatus: ${target.properties.status}\nMotto: "${target.motto}\n`;
        windowDiv = windowComponent("center", content, true, [
          {
            name: "Attack",
            function: attacc,
            dataAttribute: target.properties.ID,
          },
        ]);
      }
    }

    if (event.type == "magic") {
      const magicToMove = event.data;
      const magicCoords = project(magicToMove.latLngObject);
      magicToMove.x = magicCoords.x;
      magicToMove.y = magicCoords.y;
      magicToMove.visible = true;
      magicToMove.hit = false;
    }

    if (event.type == "attacc") {
      duringAttacc = true;
      const targetPlant = event.data;
      let targetPlantHealth = targetPlant.properties.capacity;
      const panLat = targetPlant.latLngObject.lat - 0.003;
      const panLng = targetPlant.latLngObject.lng;
      map.panTo([panLat, panLng], { duration: 2 });
      const heroLat = targetPlant.latLngObject.lat - 0.014;
      let heroCoords = project([heroLat, panLng - 0.002]); //slightly adjust to left to center, dunno why
      hero.x = heroCoords.x;
      hero.y = heroCoords.y;
      keyboard.unsubscribeAll();
      let barControl = battleBar(
        targetPlant.properties.name,
        targetPlantHealth
      );
      let { changePlantHealth, endBattleButton, endBattle } = barControl;
      function endBattleAndResubscribe() {
        targetPlant.properties.capacity = targetPlantHealth; // set to whatever value when battle ended
        endBattleButton.removeEventListener("click", endBattleAndResubscribe);
        endBattle();
        keyboard.resubscribeAll();
        duringAttacc = false;
      }
      endBattleButton.addEventListener("click", endBattleAndResubscribe);

      let timerKeeper = setInterval(battling, 1000);

      function battling() {
        if (!duringAttacc) {
          clearInterval(timerKeeper);
        }
        if (targetPlantHealth < 0) {
          plantConverted();
          endBattleAndResubscribe();
        }
        if (magicCount > 0) {
          changeMagic(-1);
          targetPlantHealth -= 3;
        } else {
          targetPlantHealth--;
        }
        changePlantHealth(targetPlantHealth);
      }
    }

    firstDraw = false;
    renderer.render(container);
  }, app.stage);

  //Put pixi overlay on map
  pixiOverlay.addTo(mymap);

  //keyboard stuff separated out!!
  let keyboard = Keyboard(hero, juliaSheet);

  //Set the game state
  state = play;

  //Start the game loop
  app.ticker.add((delta) => gameLoop(delta));
}
/***end of setup function***/

function gameLoop(delta) {
  //Update the current game state:
  state(delta);
}

let counter = 199;

function play(delta) {
  //previous positions for potentially moving sprites
  const previousX = hero.x;
  const previousY = hero.y;
  // const previousPoliticianX = politician.x;
  // const previousPoliticianY = politician.y;

  //Velocities
  hero.x += hero.vx;
  hero.y += hero.vy;
  // let differenceX = previousPoliticianX - hero.x;
  // let differenceY = previousPoliticianY - hero.y;
  // if (differenceX.toFixed(2) > -0.44) {
  //   politician.vx = -0.01;
  // } else if (differenceX.toFixed(2) < -0.44) {
  //   politician.vx = 0.01;
  // } else {
  //   politician.vx = 0;
  //   console.log("stop");
  // }
  // console.log(differenceY);
  // if (differenceY.toFixed(2) > 0) {
  //   politician.vy = -0.01;
  // } else if (differenceY.toFixed(2) < 0) {
  //   politician.vy = 0.01;
  // } else {
  //   politician.vy = 0;
  //   console.log("stop");
  // }

  // politician.x += politician.vx;
  // politician.y += politician.vy;

  //increase counter
  counter++;

  // Do I need to check if someone has moved? Can I just redraw every delta
  // if (
  //   previousX != hero.x ||
  //   previousY != hero.y ||
  //   previousPoliticianX !== politician.x ||
  //   previousPoliticianY !== politician.y
  // ) {
  if (counter > 200) {
    const boundsNow = mymap.getBounds();
    stuffGoesInsideBounds(boundsNow);
    counter = 0;
  }

  pixiOverlay.redraw({ type: "move" });
  if (counter % 10 === 0) {
    inBoundsArray.forEach((sprite) => {
      if (sprite.coalPlant) {
        b.rectangleCollision(hero, sprite, true, false);
      } else if (sprite.magic && !sprite.hit) {
        let collided = b.hit(hero, sprite);
        if (collided) {
          sprite.hit = true;
          sprite.visible = false;
          changeMagic(1);
        }
      }
    });
  }
  // }
}

//Stuff is placed and visible only inside larger bounds
function stuffGoesInsideBounds(visibleBounds) {
  const north = visibleBounds.getNorth();
  const south = visibleBounds.getSouth();
  const east = visibleBounds.getEast();
  const west = visibleBounds.getWest();
  const norther = north + 0.05;
  const souther = south - 0.05;
  const easter = east + 0.05;
  const wester = west - 0.05;
  const corner1 = L.latLng(norther, wester);
  const corner2 = L.latLng(souther, easter);
  const largerBounds = L.latLngBounds(corner1, corner2);
  inBoundsArray = [...magicArray];
  //check what plants etc are in bounds for possible collision
  plantArray.forEach((plant) => {
    if (largerBounds.contains(plant.latLngObject)) {
      inBoundsArray.push(plant);
    }
  });
  // replace magic that has been picked up or out of larger bounds
  magicArray.forEach((magic) => {
    if (!largerBounds.contains(magic.latLngObject) || !magic.visible) {
      let newLatLng;
      do {
        const randomLat = Math.random() * (norther - souther) + souther;
        const randomLng = Math.random() * (easter - wester) + wester;
        newLatLng = L.latLng(randomLat, randomLng);
      } while (visibleBounds.contains(newLatLng));
      magic.latLngObject = newLatLng;
      pixiOverlay.redraw({ type: "magic", data: magic });
    }
  });
}

function attacc(event) {
  windowDiv.remove();
  let id = event.target.dataset.attribute;
  let found = plantArray.find((plant) => plant.properties.ID == id);
  pixiOverlay.redraw({ type: "attacc", data: found });
}

//passes in click event unless attacc
mymap.on("click", function (e) {
  if (!duringAttacc) {
    pixiOverlay.redraw({ type: "click", data: e });
  }
});

function changeMagic(number) {
  magicCount += number;
  magicDisplay.innerText = magicCount;
}

function plantConverted() {
  plantCount--;
  convertedPlantCount++;
  plantDisplay.innerText = plantCount;
  convertedPlantDisplay.innerText = convertedPlantCount;
}
