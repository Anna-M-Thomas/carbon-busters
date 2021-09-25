import * as L from "leaflet";
import * as PIXI from "pixi.js";
import "leaflet-pixi-overlay";
import Bump from "./bump";
import keyboard from "./keyboard";
import { windowComponent, battleBar } from "./ui";
import coalPlants from "./map_point_en.geoJson";
import getMotto from "./coalmotto";
const mapDiv = document.getElementById("mapid");
const magicDisplay = document.getElementById("magic-score");
const plantDisplay = document.getElementById("plant-count");
const convertedPlantDisplay = document.getElementById("converted-plant-count");
let windowDiv; // use to store created window component and tell it to remove itself

//pixi setup, global variables
const loader = new PIXI.Loader();
const app = new PIXI.Application();
const b = new Bump(PIXI);
let hero, state, pixiOverlay;
let sprites = [];
let spritesInBounds = [];
let magics = [];
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
  scrollWheelZoom: false, //<==temporarily enable to check things
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
loader.add("magic", "img/earth.png");
loader.load(setup);

/*** start of setup function ***/
function setup(loader, resources) {
  let firstDraw = true;

  //Julia (our hero)
  const juliaSheet = resources.hero.spritesheet;
  hero = new PIXI.AnimatedSprite(juliaSheet.animations["idle"]);

  //Coal sprites texture
  const coalTexture = resources.coal.texture;
  const magicTexture = resources.magic.texture;

  //add hero
  app.stage.addChild(hero);
  //another test

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
      //initial velocity, position, scale etc. for hero
      hero.vx = 0;
      hero.vy = 0;
      const heroCoords = project(heroLatLng);
      hero.x = heroCoords.x;
      hero.y = heroCoords.y;
      hero.scale.set(1 / scale);
      hero.animationSpeed = 0.1;
      hero.anchor.set(0, 0.5);

      //filter mothballed/shelved plants out of coalPlants
      const filteredCoalplants = coalPlants.features.filter((plant) => {
        return (
          plant.properties.status_class == "operation" ||
          plant.properties.status_class == "planned"
        );
      });

      plantCount = filteredCoalplants.length;
      plantDisplay.innerText = plantCount;

      //make and place the coal plant sprites
      filteredCoalplants.forEach((plant) => {
        const plantSprite = new PIXI.Sprite(coalTexture);
        app.stage.addChild(plantSprite);
        plantSprite.anchor.set(0.5, 1);
        plantSprite.scale.set(0.3 / scale);
        plantSprite.interactive = true;
        plantSprite.buttonMode = true;
        const plantLatLng = L.latLng(
          plant.geometry.coordinates[1],
          plant.geometry.coordinates[0]
        );
        const plantCoords = project(plantLatLng);
        plantSprite.x = plantCoords.x;
        plantSprite.y = plantCoords.y;
        plantSprite.properties = plant.properties;
        plantSprite.latLngObject = plantLatLng;
        plantSprite.coalPlant = true;
        plantSprite.motto = getMotto("coal");
        sprites.push(plantSprite);
      });

      //make magic sprites
      for (let i = 0; i < 5; i++) {
        const magic = new PIXI.Sprite(magicTexture);
        magic.scale.set(2 / scale);
        magic.magic = true;
        //added to prevent double score during collision
        magic.hit = false;
        //purposefully out of bounds initially to be placed in right area
        magic.latLngObject = L.latLng(50.5, 30.5);
        app.stage.addChild(magic);
        magics.push(magic);
        spritesInBounds.push(magic);
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
      const heroLat = targetPlant.latLngObject.lat - 0.015;
      let heroCoords = project([heroLat, panLng]);
      hero.x = heroCoords.x;
      hero.y = heroCoords.y;
      left.unsubscribe();
      up.unsubscribe();
      right.unsubscribe();
      down.unsubscribe();
      let barControl = battleBar(
        targetPlant.properties.name,
        targetPlantHealth
      );
      let { changePlantHealth, endBattleButton, endBattle } = barControl;
      function endBattleAndResubscribe() {
        targetPlant.properties.capacity = targetPlantHealth; // set to whatever value when battle ended
        endBattleButton.removeEventListener("click", endBattleAndResubscribe);
        endBattle();
        left.resubscribe();
        up.resubscribe();
        right.resubscribe();
        down.resubscribe();
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

  //Keyboard stuff
  let left = keyboard("j");
  let right = keyboard("l");
  let up = keyboard("i");
  let down = keyboard("k");

  left.press = () => {
    hero.textures = juliaSheet.animations["walk_left"];
    hero.play();
    hero.vx = -0.05;
    hero.vy = 0;
  };
  left.release = () => {
    if (!right.isDown && hero.vy === 0) {
      hero.textures = juliaSheet.animations["idle"];
      hero.vx = 0;
    }
  };

  up.press = () => {
    hero.textures = juliaSheet.animations["walk_up"];
    hero.play();
    hero.vy = -0.05;
    hero.vx = 0;
  };
  up.release = () => {
    if (!down.isDown && hero.vx === 0) {
      hero.textures = juliaSheet.animations["idle"];
      hero.vy = 0;
    }
  };

  right.press = () => {
    hero.textures = juliaSheet.animations["walk_right"];
    hero.play();
    hero.vx = 0.05;
    hero.vy = 0;
  };
  right.release = () => {
    if (!left.isDown && hero.vy === 0) {
      hero.textures = juliaSheet.animations["idle"];
      hero.vx = 0;
    }
  };

  down.press = () => {
    hero.textures = juliaSheet.animations["walk_forward"];
    hero.play();
    hero.vy = 0.05;
    hero.vx = 0;
  };
  down.release = () => {
    if (!up.isDown && hero.vx === 0) {
      hero.textures = juliaSheet.animations["idle"];
      hero.vy = 0;
    }
  };

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
  const previousX = hero.x;
  const previousY = hero.y;

  //Use hero's velocity to make her move
  hero.x += hero.vx;
  hero.y += hero.vy;

  //increase counter
  counter++;

  //if hero actually moved, check bounds, redraw and check for collision
  if (previousX != hero.x || previousY != hero.y) {
    if (counter > 200) {
      const boundsNow = mymap.getBounds();
      stuffGoesInsideBounds(boundsNow);
      counter = 0;
    }

    pixiOverlay.redraw({ type: "move" });
    if (counter % 10 === 0) {
      spritesInBounds.forEach((sprite) => {
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
  }
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
  spritesInBounds = [...magics];
  //check who is in bounds for possible collision
  sprites.forEach((sprite) => {
    if (largerBounds.contains(sprite.latLngObject)) {
      //     sprite.visible = true;
      spritesInBounds.push(sprite);
    }
    //   } else sprite.visible = false;
  });
  // replace magic that has been picked up or out of larger bounds
  magics.forEach((magic) => {
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
  let found = sprites
    .filter((sprite) => sprite.coalPlant)
    .find((sprite) => sprite.properties.ID == id);
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
  console.log(plantCount, convertedPlantCount);
  plantCount--;
  convertedPlantCount++;
  plantDisplay.innerText = plantCount;
  convertedPlantDisplay.innerText = convertedPlantCount;
}
