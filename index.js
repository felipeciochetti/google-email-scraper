const googleMaps = require("./google-scrapper/googleMaps.js");
const { saveJsonToCsv } = require("./generate-csv/generate-infos-csv");
const webSite = require("./google-scrapper/website-scraper.js");

async function start() {
  console.log("stating search...");

  data = await googleMaps();

  console.log("finished search...");

  console.log("stating website search...");

  places = await webSite(data);

  console.log("finished website search...");

  saveJsonToCsv(places);
}
start();
