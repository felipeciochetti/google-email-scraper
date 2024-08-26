const {
  saveJsonToCsv,
  readCSVFile,
} = require("./generate-csv/generate-infos-csv");
const webSite = require("./google-scrapper/website-scraper.js");

async function start() {
  console.log("stating website scraping...");

  data = await readCSVFile("./files/google-maps-data-1.csv");

  places = await webSite(data);

  console.log("finished website search...");

  saveJsonToCsv(places, "./files/google-websites-2.csv");
}

start();
