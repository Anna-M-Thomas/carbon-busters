import * as L from "leaflet";
const mapDiv = document.getElementById("mapid");

//set up map
export const mymap = L.map(mapDiv, {
  zoomControl: false,
  keyboard: false,
  touchZoom: false,
  doubleClickZoom: false,
  scrollWheelZoom: false, //<==temporarily enable if you want to check things
}).setView({ lat: 38.423940781047804, lng: 141.31276130676272 }, 14);

L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
  {
    attribution:
    "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.",
    maxZoom: 14,
    tileSize: 512,
    zoomOffset: -1,
  }
).addTo(mymap);
