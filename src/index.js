import { Application, Loader } from "pixi.js";
import { Main } from "./Main";

const app = new Application();

Loader.shared.add("hero", "img/Julia/Julia.json");
Loader.shared.add("coal", "img/hysteric_karyoku.png");
Loader.shared.add("politician", "img/seijika2.png");
Loader.shared.add("magic", "img/earth.png");

Loader.shared.onComplete.once(() => {
  app.stage.addChild(new Main());
});
Loader.shared.load();

export { app as App };
