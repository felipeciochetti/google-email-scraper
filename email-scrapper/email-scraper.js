const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const cheerio = require("cheerio");
const {
  tableToCsv,
  readCSVFile,
  saveJsonToCsv,
} = require("../generate-csv/generate-infos-csv");

var browser;
var page;

// Regular expression to match email addresses
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

async function startBrowser() {
  browser = await puppeteerExtra.launch({
    headless: false, // Set to true if you want headless mode
    // headless: "new",
    // devtools: true,
    executablePath: "", // Automatically find Chromium path or leave empty for default Puppeteer Chromium
  });

  page = await browser.newPage();
}

async function emailScraper(data) {
  try {
    await startBrowser();

    for (const element of data) {
      element.email = await findEmailsOnWebsite(element.web);
    }

    return data;
  } catch (error) {
    console.error(`Error`, error);
  } finally {
    await browser.close();
  }
}
async function findEmailOnPage(page) {
  const html = await page.content();
  const emails = html.match(emailRegex);
  return emails ? emails : [];
}
async function findContactPageAndEmail(page, websiteUrl) {
  const html = await page.content();
  const $ = cheerio.load(html);

  // Look for links that might point to a contact page
  const contactLink = $("a")
    .filter((i, link) => {
      const href = $(link).attr("href");
      const text = $(link).text().toLowerCase();
      return href && (text.includes("contact") || href.includes("contact"));
    })
    .first();

  if (contactLink.length > 0) {
    let contactUrl = contactLink.attr("href");

    // Handle relative URLs
    if (!contactUrl.startsWith("http")) {
      contactUrl = new URL(contactUrl, websiteUrl).href;
    }

    console.log("Navigating to contact page:", contactUrl);
    await page.goto(contactUrl, { waitUntil: "networkidle2" });

    // Try to find emails on the contact page
    return await findEmailOnPage(page);
  }

  return [];
}
async function findEmailsOnWebsite(websiteUrl) {
  // Launch puppeteer browser

  try {
    console.log("goto", websiteUrl);

    await page.goto(websiteUrl, { waitUntil: "networkidle2" });

    // Attempt to find emails on the main page
    let emails = await findEmailOnPage(page);

    // If no emails are found, try to find a contact page
    if (emails.length === 0) {
      emails = await findContactPageAndEmail(page, websiteUrl);
    }

    // Print the found emails or a message if none were found
    if (emails.length > 0) {
      let unique = [];
      emails.forEach((element) => {
        if (!unique.includes(element)) {
          unique.push(element);
        }
      });
      emails = unique;

      console.log("Emails found:", emails.join(", "));
    } else {
      console.log("No emails found on the website.");
    }

    return emails;
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
  }
}

module.exports = emailScraper;
/*
async function start() {
  const websiteUrl = await readCSVFile();
  emailScraper(websiteUrl);
}
*/
// Example usage

//findEmailsOnWebsite(websiteUrl);
//start();
