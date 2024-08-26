const {
  saveJsonToCsv,
  readCSVFile,
} = require("./generate-csv/generate-infos-csv");
const emailScraper = require("./email-scrapper/email-scraper.js");

async function start() {
  console.log("stating email scraping...");

  data = await readCSVFile("./files/google-websites-2.csv");

  places = await emailScraper(data);

  console.log("finished email scraping...");

  saveJsonToCsv(places, "./files/google-email-3.csv");
}

start();
