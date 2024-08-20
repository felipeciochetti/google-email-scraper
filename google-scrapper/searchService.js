const readline = require("readline-sync");
const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");
const popup = require("./popup.js");
(async () => {
  try {
    // Get user input for city and services
    const city = readline.question("Enter the city name: ");
    const service = readline.question("Enter the service you're looking for: ");

    // Create the Google search query
    const searchQuery = `${service},+${city}`;
    const googleSearchUrl = `https://www.google.com/maps/search/${searchQuery}`;

    console.log(googleSearchUrl);

    // Launch puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Go to the Google search page
    await page.goto(googleSearchUrl, { waitUntil: "networkidle2" });

    // Get the HTML content of the page
    const htmlContent = await page.content();

    // Print the HTML content
    // console.log(htmlContent);

    // Close the browser
    await browser.close();

    // Create a JSDOM instance from the HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    results = popup(document);

    console.log(results);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
