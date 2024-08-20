const googleMaps = require("./google-scrapper/googleMaps.js");
const tableToCsv = require("./generate-csv/generate-infos-csv");

async function start() {
  console.log("stating search...");
  data = await googleMaps();

  console.log("finished search...");

  tableToCsv(data);
}
start();
