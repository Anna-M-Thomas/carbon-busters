import * as L from "leaflet";
import "leaflet-pixi-overlay";
import Bump from "./bump";
import { mymap } from "./mymap";
import * as PIXI from "pixi.js";
import { CoalPlant, Hero } from "./extendedSprites";
import filteredCoalplants from "./map_point_en";
import { Keyboard } from "./keyboard";
import { windowComponent, battleBar } from "./ui";

export class Main extends PIXI.Container {
  constructor() {
    super();

    //passes in click event unless attacc
    mymap.on("click", function (e) {
      pixiOverlay.redraw({ type: "click", data: e });
    });

    //initial coords for map
    const heroLatLng = [38.423940781047804, 141.31276130676272];

    const b = new Bump(PIXI);
    let juliaSheet = PIXI.Loader.shared.resources.hero.spritesheet;
    let coalTexture = PIXI.Loader.shared.resources.coal.texture;
    let firstDraw = true;
    let duringAttacc = false;
    let hero;
    let plantArray = [];
    let inBoundsArray = [];

    const pixiOverlay = L.pixiOverlay(function (utils, event) {
      const container = utils.getContainer();
      const renderer = utils.getRenderer();
      const project = utils.latLngToLayerPoint;
      const scale = utils.getScale();
      const map = utils.getMap();
      const interaction = renderer.plugins.interaction;

      //start first draw
      if (firstDraw) {
        // Add hero
        const heroCoords = project(heroLatLng);
        hero = new Hero(
          juliaSheet.animations["idle"],
          scale,
          heroCoords.x,
          heroCoords.y
        );
        container.addChild(hero);

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
          container.addChild(plantSprite);
          plantArray.push(plantSprite);
        });
        firstDraw = false;
      }

      //"camera" (map) moves if player moves
      if (event.type == "move") {
        const newCoords = utils.layerPointToLatLng([hero.x, hero.y]);
        map.panTo(newCoords);
      }

      if (event.type == "click" && !duringAttacc) {
        const pointerEvent = event.data.originalEvent;
        const pixiPoint = new PIXI.Point();
        interaction.mapPositionToPoint(
          pixiPoint,
          pointerEvent.clientX,
          pointerEvent.clientY
        );
        const target = interaction.hitTest(pixiPoint, container);
        if (target && target.coalPlant) {
          let content = `${target.properties.name}\nStatus: ${target.properties.status}\nMotto: "${target.motto}\n`;
          windowComponent("center", content, true, [
            {
              name: "Attack",
              function: attacc,
              dataAttribute: target.properties.ID,
            },
          ]);
        }
      }

      renderer.render(container);
    }, this);

    //Put pixi overlay on map
    pixiOverlay.addTo(mymap);

    //The ticker?
    PIXI.Ticker.shared.add(update);

    //keyboard stuff separated out!!
    let keyboard = Keyboard(hero, juliaSheet);

    let counter = 199;

    function update(deltaTime) {
      const previousX = hero.x;
      const previousY = hero.y;
      hero.x = hero.x + hero.vx * deltaTime;
      hero.y = hero.y + hero.vy * deltaTime;

      if (previousX != hero.x || previousY != hero.y) {
        pixiOverlay.redraw({ type: "move" });
      }

      counter++;

      if (counter > 200) {
        const boundsNow = mymap.getBounds();
        stuffGoesInsideBounds(boundsNow);
        counter = 0;
      }

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
      // inBoundsArray = [...magicArray];
      //check what plants etc are in bounds for possible collision
      plantArray.forEach((plant) => {
        if (largerBounds.contains(plant.latLngObject)) {
          inBoundsArray.push(plant);
        }
      });
    }

    function attacc(event) {
      let windowDiv = document.getElementById("window");
      windowDiv.remove();
      let id = event.target.dataset.attribute;
      let targetPlant = plantArray.find((plant) => plant.properties.ID == id);
      duringAttacc = true;
      let targetPlantHealth = targetPlant.properties.capacity;
      mymap.panTo(
        [targetPlant.latLngObject.lat - 0.003, targetPlant.latLngObject.lng],
        { duration: 2 }
      );
      hero.x = targetPlant.x - 0.1;
      hero.y = targetPlant.y + 2;
      keyboard.unsubscribeAll();
      let barControl = battleBar(
        targetPlant.properties.name,
        targetPlantHealth
      );
      let { changePlantHealth, endBattleButton, endBattle } = barControl;

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

      function endBattleAndResubscribe() {
        targetPlant.properties.capacity = targetPlantHealth; // set to whatever value when battle ended
        endBattleButton.removeEventListener("click", endBattleAndResubscribe);
        endBattle();
        keyboard.resubscribeAll();
        duringAttacc = false;
      }
    }
  }
}
