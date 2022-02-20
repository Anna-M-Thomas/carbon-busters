import * as L from 'leaflet';
import 'leaflet-pixi-overlay';
import Bump from './bump';
import { mymap } from './mymap';
import * as PIXI from 'pixi.js';
import { CoalPlant, Hero, Magic } from './extendedSprites';
import filteredCoalplants from './map_point_en';
import { Keyboard } from './keyboard';
import { coalPlantWindow, Bar, battleBar } from './ui';

export class Main extends PIXI.Container {
  constructor() {
    super();

    //passes in click event unless attacc
    mymap.on('click', function (e) {
      pixiOverlay.redraw({ type: 'click', data: e });
    });

    //initial coords for map
    const heroLatLng = [38.423940781047804, 141.31276130676272];

    const b = new Bump(PIXI);
    let juliaSheet = PIXI.Loader.shared.resources.hero.spritesheet;
    let crystalSheet = PIXI.Loader.shared.resources.crystal.spritesheet;
    let coalTexture = PIXI.Loader.shared.resources.coal.texture;
    //let magicTexture = PIXI.Loader.shared.resources.magic.texture;
    let bananaTexture = PIXI.Loader.shared.resources.banana.texture;
    let firstDraw = true;
    let duringAttacc = false;
    let hero;
    const displayBar = new Bar(filteredCoalplants.length);
    let plantArray = [];
    let inBoundsArray = [];
    let magicArray = [];
    let project; // I need this outside of pixiOverlay
    let scale; // I guess I need to expose this too...
    const that = this; // ugh this and that

    const pixiOverlay = L.pixiOverlay(function (utils, event) {
      const container = utils.getContainer();
      const renderer = utils.getRenderer();
      project = utils.latLngToLayerPoint;
      scale = utils.getScale();
      const map = utils.getMap();
      const interaction = renderer.plugins.interaction;

      //start first draw
      if (firstDraw) {
        // Add hero
        const heroCoords = project(heroLatLng);
        hero = new Hero(
          juliaSheet.animations['idle'],
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

        //make magic sprites
        for (let i = 0; i < 5; i++) {
          //purposefully out of bounds initially to be placed in right area
          let latLng = L.latLng(50.5, 30.5);
          const index = Math.floor(Math.random() * 5);
          const magic = new Magic(
            crystalSheet.textures[`game_icons_crystal_set-${index}.png`],
            scale,
            latLng
          );
          container.addChild(magic);
          magicArray.push(magic);
          inBoundsArray.push(magic);
        }
        firstDraw = false;
      }

      //"camera" (map) moves if player moves
      if (event.type == 'move') {
        const newCoords = utils.layerPointToLatLng([hero.x, hero.y]);
        map.panTo(newCoords);
      }

      //To make everything render without movement
      if (event.type == 'emptymove') {
        console.log('empty move');
      }

      if (event.type == 'click' && !duringAttacc) {
        const pointerEvent = event.data.originalEvent;
        const pixiPoint = new PIXI.Point();
        interaction.mapPositionToPoint(
          pixiPoint,
          pointerEvent.clientX,
          pointerEvent.clientY
        );
        const target = interaction.hitTest(pixiPoint, container);
        //Show a window if coal plant is clicked
        if (target && target.coalPlant) {
          coalPlantWindow(target, attacc);
        }
      }

      renderer.render(container);
    }, this);

    //Put pixi overlay on map
    pixiOverlay.addTo(mymap);

    //The ticker
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
        pixiOverlay.redraw({ type: 'move' });
      }

      counter++;

      //
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
              displayBar.changeMagic(1);
              console.log('Display bar magic count?', displayBar.magicCount);
            }
          }
        });
      }
    }

    //move a sprite toward another sprite (make vx, vy amounst adjustable later)
    function moveSpriteTowardsOtherSprite(targetSprite, chaserSprite) {
      let previousChaserX = chaserSprite.x;
      let previousChaserY = chaserSprite.y;

      let differenceX = previousChaserX - targetSprite.x;
      let differenceY = previousChaserY - targetSprite.y;
      if (differenceX.toFixed(2) > 0) {
        chaserSprite.vx = -0.05;
      } else if (differenceX.toFixed(2) < 0) {
        chaserSprite.vx = 0.05;
      } else {
        chaserSprite.vx = 0;
        chaserSprite.x = targetSprite.x;
      }
      if (differenceY.toFixed(2) > 0) {
        chaserSprite.vy = -0.05;
      } else if (differenceY.toFixed(2) < 0) {
        chaserSprite.vy = 0.05;
      } else {
        chaserSprite.vy = 0;
        chaserSprite.y = targetSprite.y;
      }
      chaserSprite.x += chaserSprite.vx;
      chaserSprite.y += chaserSprite.vy;
      pixiOverlay.redraw({ type: 'emptymove' });
    }

    // Shoot a banana at coal plant x3.
    function shootBanana(targetPlant, hero) {
      const banana = new PIXI.Sprite(bananaTexture);
      banana.anchor.set(0.5, 0.5);

      that.addChild(banana);

      banana.x = hero.x;
      banana.y = hero.y;
      banana.scale.set(0.1 / scale);
      banana.vx = 0;
      banana.vy = 0;

      let times = 0;
      PIXI.Ticker.shared.add(function bananaShooting(deltaTime) {
        moveSpriteTowardsOtherSprite(targetPlant, banana);

        //When banana stops (hits) it goes back to hero's location
        if (banana.vy === 0 && banana.vx === 0) {
          banana.x = hero.x;
          banana.y = hero.y;
          times++;

          if (times == 3) {
            PIXI.Ticker.shared.remove(bananaShooting);
            that.removeChild(banana);
            pixiOverlay.redraw({ type: 'emptymove' });
          }
        }
      });
    }

    // Only check in bounds sprites for collisions
    // And places hidden/out of bounds magic nearby, but out of visible range
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

      // replace magic that has been picked up and hidden or is out of larger bounds
      magicArray.forEach((magic) => {
        if (!largerBounds.contains(magic.latLngObject) || !magic.visible) {
          let newLatLng;
          do {
            const randomLat = Math.random() * (norther - souther) + souther;
            const randomLng = Math.random() * (easter - wester) + wester;
            newLatLng = L.latLng(randomLat, randomLng);
          } while (visibleBounds.contains(newLatLng));
          magic.latLngObject = newLatLng;
          const magicCoords = project(magic.latLngObject);
          magic.x = magicCoords.x;
          magic.y = magicCoords.y;
          magic.visible = true;
          magic.hit = false;
        }
      });
    }

    function attacc(event) {
      const id = event.target.dataset.attribute;
      const targetPlant = plantArray.find((plant) => plant.properties.ID == id);
      duringAttacc = true;
      let targetPlantHealth = targetPlant.properties.capacity;

      mymap.panTo(
        [targetPlant.latLngObject.lat - 0.003, targetPlant.latLngObject.lng],
        { duration: 1 }
      );
      keyboard.unsubscribeAll();
      let barControl = battleBar(
        targetPlant.properties.name,
        targetPlantHealth
      );
      let { changePlantHealth, endBattleButton, endBattle } = barControl;

      endBattleButton.addEventListener('click', endBattleAndResubscribe);

      let timerKeeper = setInterval(battling, 1000);

      hero.x = targetPlant.x;
      hero.y = targetPlant.y + 2;
      shootBanana(targetPlant, hero);

      function battling() {
        if (!duringAttacc) {
          clearInterval(timerKeeper);
        }
        if (targetPlantHealth < 0) {
          plantConverted();
          endBattleAndResubscribe();
        }
        if (displayBar.magicCount > 0) {
          displayBar.changeMagic(-1);
          targetPlantHealth -= 3;
        } else {
          targetPlantHealth--;
        }
        changePlantHealth(targetPlantHealth);
      }

      function endBattleAndResubscribe() {
        targetPlant.properties.capacity = targetPlantHealth; // set to whatever value when battle ended
        endBattleButton.removeEventListener('click', endBattleAndResubscribe);
        endBattle();
        keyboard.resubscribeAll();
        duringAttacc = false;
      }
    }
  }
}
