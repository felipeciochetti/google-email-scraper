
  async function autoScroll() {
    await document.evaluate(async () => {
      const wrapper = document.querySelector('div[role="feed"]');

      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 1000;
        var scrollDelay = 3000;

        var timer = setInterval(async () => {
          var scrollHeightBefore = wrapper.scrollHeight;
          wrapper.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeightBefore) {
            totalHeight = 0;
            await new Promise((resolve) => setTimeout(resolve, scrollDelay));

            // Calculate scrollHeight after waiting
            var scrollHeightAfter = wrapper.scrollHeight;

            if (scrollHeightAfter > scrollHeightBefore) {
              // More content loaded, keep scrolling
              return;
            } else {
              // No more content loaded, stop scrolling
              clearInterval(timer);
              resolve();
            }
          }
        }, 200);
      });
    });
  }

  await autoScroll(page);

  const html = await page.content();
  const pages = await browser.pages();
  await Promise.all(pages.map((page) => page.close()));

  console.log("browser closed");

  // get all a tag parent where a tag href includes /maps/place/
  const $ = cheerio.load(html);
  const aTags = $("a");
  const parents = [];
  aTags.each((i, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }
    if (href.includes("/maps/place/")) {
      parents.push($(el).parent());
    }
  });

  console.log("parents", parents.length);

  const buisnesses = [];

  parents.forEach((parent) => {
    const url = parent.find("a").attr("href");
    // get a tag where data-value="Website"
    const website = parent.find('a[data-value="Website"]').attr("href");

    // find a div that includes the class fontHeadlineSmall
    const storeName = parent.find("div.fontHeadlineSmall").text();
    // find span that includes class fontBodyMedium
    const ratingText = parent
      .find("span.fontBodyMedium > span")
      .attr("aria-label");

    // get the first div that includes the class fontBodyMedium
    const bodyDiv = parent.find("div.fontBodyMedium").first();
    const children = bodyDiv.children();
    const lastChild = children.last();
    const firstOfLast = lastChild.children().first();
    const lastOfLast = lastChild.children().last();

    var container = parent.closest('[jsaction*="mouseover:pane"]');

    var containerText = container.textContent || "";
    var addressRegex = /\d+ [\w\s]+(?:#\s*\d+|Suite\s*\d+|Apt\s*\d+)?/;
    var addressMatch = containerText.match(addressRegex);

    //addressMatch = firstOfLast?.text()?.split("·")?.[1]?.trim();
    buisnesses.push({
      // placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
      address: addressMatch,
      category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
      phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
      googleUrl: url,
      bizWebsite: website,
      storeName,
      ratingText,
      stars: ratingText?.split("stars")?.[0]?.trim()
        ? Number(ratingText?.split("stars")?.[0]?.trim())
        : null,
      numberOfReviews: ratingText
        ?.split("stars")?.[1]
        ?.replace("Reviews", "")
        ?.trim()
        ? Number(
            ratingText?.split("stars")?.[1]?.replace("Reviews", "")?.trim()
          )
        : null,
    });
  });
  const end = Date.now();

  console.log(`time in seconds ${Math.floor((end - start) / 1000)}`);

  // buisnesses.forEach((el) => console.log(el));
  return buisnesses;
}

// Download the CSV file
function downloadCsv(csv, filename) {
  var csvFile;
  var downloadLink;

  csvFile = new Blob([csv], { type: "text/csv" });
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

module.exports = scrapeData;
