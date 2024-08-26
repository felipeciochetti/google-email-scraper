const cheerio = require("cheerio");
const puppeteerExtra = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");

var browser;
var page;

async function startBrowser() {
  browser = await puppeteerExtra.launch({
    headless: false, // Set to true if you want headless mode
    // headless: "new",
    // devtools: true,
    executablePath: "", // Automatically find Chromium path or leave empty for default Puppeteer Chromium
  });

  page = await browser.newPage();
}

async function searchWebSite(data) {
  await startBrowser();

  const places = [];
  var x = 0;
  for (const element of data) {
    console.log(x++, "of", data.length);
    console.log("Waiting for 3 seconds...");
    await delay(3000); // Waits for 5 seconds

    if (x > 10) {
      break;
    }

    const place = await searchGoogleMaps(element["Google Maps Link"]);
    places.push(place);
  }

  await browser.close();

  return places;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function searchGoogleMaps(url) {
  puppeteerExtra.use(stealthPlugin());

  try {
    await page.goto(url);
  } catch (error) {
    console.log("Error navigating to the page:", error);
    await browser.close();
    return;
  }

  const html = await page.content();

  const $ = cheerio.load(html);

  const name = scrapeName($);
  const web = scrapeWebsiteLink($);
  const address = scrapeAddress($);

  data = {
    name: name.replaceAll(",", ""),
    address: address.replaceAll(",", ""),
    web: web,
  };
  return data;
}

function scrapeName($) {
  const name = $("h1");

  return name.text();
}

function scrapeAddress($) {
  // Select the button with the data-item-id="address"
  const addressButton = $('button[data-item-id="address"]');

  // Find the next element with class 'fontmedium' after the addressButton
  const addressText = addressButton.find(".fontBodyMedium").text();

  return addressText.trim(); // Trim any extra whitespace() for HTML content
}

function scrapeWebsiteLink($) {
  // Select the element based on the data-tooltip attribute
  const websiteLinkElement = $('a[data-tooltip="Open website"]');

  if (websiteLinkElement.length > 0) {
    // Extract the desired information
    const websiteUrl = websiteLinkElement.attr("href");
    // const websiteLabel = websiteLinkElement.attr("aria-label");
    // const websiteText = websiteLinkElement.find(".Io6YTe").text();

    return websiteUrl;
  }
}

module.exports = searchWebSite;
