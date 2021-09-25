## What is it
A game about the remaining coal plants in Japan, played inside a map using Leaflet.js, Leaflet.PixiOverlay, and Pixi.js

## Why
I don't like coal plants (global warming!) but Japan has a lot of them and keeps making more.
I thought a game about converting Japan's coal plants to the user's choice of another kind of power plant would be a fun way to let off some steam and raise awareness of the issue.

Also, I am hoping people who are better than me at maps and/or games will run with the concept and make better, more interesting games about getting rid of coal in Japan or other countries.

## What's it made of
The map is set up with Leaflet as per the [Quick Start Guide](https://leafletjs.com/examples/quick-start/).  

I'm using the [watercolor map tiles](http://maps.stamen.com) by Stamen Design.  

A lot of the Pixi content refers to or comes from kittykatattack's [Pixi.js tutorial](https://github.com/kittykatattack/learningPixi), including the [game state](https://github.com/kittykatattack/learningPixi#game-states), and [keyboard movement](https://github.com/kittykatattack/learningPixi#keyboard-movement). Also using kittykatattacks [Bump library](https://github.com/kittykatattack/bump) for collisions.

[Leaflet.PixiOverlay](https://github.com/manubb/Leaflet.PixiOverlay) is the part that combines the Pixi part with the map. Along with the general examples in the readme, I borrowed from the leaflet-quickstart example in docs for click events on sprites.  

The information about coal plants in Japan comes from Japan Beyond Coal's [map and data](https://beyond-coal.jp/en/map-and-data/).

The lovely Julia sprite was made available by ArlanTR on [OpenGameArt.org](https://opengameart.org/content/top-down-player-sprite-sheet-julia).

The coal plant and the politician are by [Irasutoya](https://www.irasutoya.com/).
