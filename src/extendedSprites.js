import * as PIXI from 'pixi.js';
import getMotto from './coalmotto';

class Politician extends PIXI.Sprite {
  constructor(texture, scale, x, y) {
    super(texture);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.scale.set(0.6 / scale);
    this.anchor.set(0.5, 0.5);
  }
}

class CoalPlant extends PIXI.Sprite {
  constructor(texture, scale, x, y, latLng, properties) {
    super(texture);
    this.x = x;
    this.y = y;
    this.anchor.set(0.5, 1);
    this.scale.set(0.3 / scale);
    this.interactive = true;
    // this.buttonMode = true; why doesn't this work? Oh welllllll
    this.coalPlant = true;
    this.convertedPlant = false;
    this.properties = properties;
    this.latLngObject = latLng;
    this.motto = getMotto('coal');
  }
}

class Magic extends PIXI.Sprite {
  constructor(texture, scale, latLng) {
    super(texture);
    this.scale.set(0.2 / scale);
    this.magic = true;
    //added to prevent double score during collision
    this.hit = false;
    this.latLngObject = latLng;
  }
}

class Hero extends PIXI.AnimatedSprite {
  constructor(texture, scale, x, y) {
    super(texture);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.animationSpeed = 0.1;
    this.scale.set(1 / scale);
    this.anchor.set(0.5, 0.5);
  }
}

export { Politician, Hero, CoalPlant, Magic };
