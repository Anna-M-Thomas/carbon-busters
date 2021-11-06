//from kittykatattack/learningPixi
function keyboard(value) {
  let key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };

  key.resubscribe = () => {
    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);
  };

  return key;
}

function Keyboard(hero, juliaSheet) {
  let left = keyboard("j");
  let right = keyboard("l");
  let up = keyboard("i");
  let down = keyboard("k");

  left.press = () => {
    hero.textures = juliaSheet.animations["walk_left"];
    hero.play();
    hero.vx = -0.04;
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
    hero.vy = -0.04;
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
    hero.vx = 0.04;
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
    hero.vy = 0.04;
    hero.vx = 0;
  };
  down.release = () => {
    if (!up.isDown && hero.vx === 0) {
      hero.textures = juliaSheet.animations["idle"];
      hero.vy = 0;
    }
  };

  function unsubscribeAll() {
    left.unsubscribe();
    up.unsubscribe();
    right.unsubscribe();
    down.unsubscribe();
  }

  function resubscribeAll() {
    left.resubscribe();
    up.resubscribe();
    right.resubscribe();
    down.resubscribe();
  }

  return { unsubscribeAll, resubscribeAll };
}

export { Keyboard };
