document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentTab = tabs[0];
    var actionButton = document.getElementById("actionButton");
    var downloadCsvButton = document.getElementById("downloadCsvButton");

    var resultsTable = document.getElementById("resultsTable");
    var filenameInput = document.getElementById("filenameInput");

    if (
      currentTab &&
      currentTab.url.includes("://www.google.com/maps/search")
    ) {
      document.getElementById("message").textContent =
        "Let's scrape Google Maps!";
      actionButton.disabled = false;
      actionButton.classList.add("enabled");
    } else {
      var messageElement = document.getElementById("message");
      messageElement.innerHTML = "";
      var linkElement = document.createElement("a");
      linkElement.href = "https://www.google.com/maps/search/";
      linkElement.textContent = "Go to Google Maps Search.";
      linkElement.target = "_blank";
      messageElement.appendChild(linkElement);

      actionButton.style.display = "none";
      downloadCsvButton.style.display = "none";
      filenameInput.style.display = "none";
    }

    actionButton.addEventListener("click", function () {
      document.getElementById("loading").style.display = "block";

      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          function: scrapeData,
        },
        function (results) {
          while (resultsTable.firstChild) {
            resultsTable.removeChild(resultsTable.firstChild);
          }

          // Define and add headers to the table
          const headers = [
            " ",
            "Title",
            "Rating",
            "Reviews",
            "Phone",
            "Address",
            "Google Maps Link",
          ];
          const headerRow = document.createElement("tr");
          headers.forEach((headerText) => {
            const header = document.createElement("th");
            header.textContent = headerText;
            headerRow.appendChild(header);
          });
          resultsTable.appendChild(headerRow);

          var count = 1;
          // Add new results to the table
          if (!results || !results[0] || !results[0].result) return;
          results[0].result.forEach(function (item) {
            var row = document.createElement("tr");
            [
              "count",
              "title",
              "rating",
              "reviewCount",
              "phone",
              "address",
              "href",
            ].forEach(function (key) {
              var cell = document.createElement("td");

              if (key === "count") {
                cell.textContent = count++;
              } else {
                cell.textContent = item[key] || "";
              }

              row.appendChild(cell);
            });
            resultsTable.appendChild(row);
          });

          document.getElementById("loading").style.display = "none";

          if (
            results &&
            results[0] &&
            results[0].result &&
            results[0].result.length > 0
          ) {
            downloadCsvButton.disabled = false;
          }
        }
      );
    });

    downloadCsvButton.addEventListener("click", function () {
      var filename = filenameInput.value.trim();

      var csv = tableToCsv(resultsTable);

      const query = ""; //document.querySelector( 'input[class*="searchboxinput"]').value;

      if (!filename) {
        filename = "google-maps-data-" + query + ".csv";
      } else {
        filename = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".csv";
      }
      downloadCsv(csv, filename);
    });
  });
});
async function autoScroll() {
  console.log("autoScroll");

  return new Promise((resolve) => {});
}
async function scrapeData() {
  // Show the loading GIF

  console.log("scrapeData");
  var totalHeight = 0;
  var distance = 1000;
  var scrollDelay = 3000;

  const wrapper = document.querySelector('div[role="feed"]');

  await new Promise((resolve) => {
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
          resolve(); // Resolve the promise to continue execution
        }
      }
    }, 200);
  });

  console.log("Scrolling finished, now start scraping data...");
  var links = Array.from(
    document.querySelectorAll('a[href^="https://www.google.com/maps/place"]')
  );
  return links.map((link) => {
    var container = link.closest('[jsaction*="mouseover:pane"]');
    var titleText = container
      ? container.querySelector(".fontHeadlineSmall").textContent
      : "";
    var rating = "";
    var reviewCount = "";
    var phone = "";
    var industry = "";
    var address = "";
    var companyUrl = "";

    // Rating and Reviews
    if (container) {
      var roleImgContainer = container.querySelector('[role="img"]');

      if (roleImgContainer) {
        var ariaLabel = roleImgContainer.getAttribute("aria-label");

        if (ariaLabel && ariaLabel.includes("stars")) {
          var parts = ariaLabel.split(" ");
          var rating = parts[0];
          var reviewCount = "(" + parts[2] + ")";
        } else {
          rating = "0";
          reviewCount = "0";
        }
      }
    }

    // Address and Industry
    if (container) {
      var containerText = container.textContent || "";
      var addressRegex = /\d+ [\w\s]+(?:#\s*\d+|Suite\s*\d+|Apt\s*\d+)?/;
      var addressMatch = containerText.match(addressRegex);

      if (addressMatch) {
        address = addressMatch[0];

        // Extract industry text based on the position before the address
        var textBeforeAddress = containerText
          .substring(0, containerText.indexOf(address))
          .trim();
        var ratingIndex = textBeforeAddress.lastIndexOf(rating + reviewCount);
        if (ratingIndex !== -1) {
          // Assuming industry is the first significant text after rating and review count
          var rawIndustryText = textBeforeAddress
            .substring(ratingIndex + (rating + reviewCount).length)
            .trim()
            .split(/[\r\n]+/)[0];
          industry = rawIndustryText.replace(/[·.,#!?]/g, "").trim();
        }
        var filterRegex = /\b(Closed|Open 24 hours|24 hours)|Open\b/g;
        address = address.replace(filterRegex, "").trim();
        address = address.replace(/(\d+)(Open)/g, "$1").trim();
        address = address.replace(/(\w)(Open)/g, "$1").trim();
        address = address.replace(/(\w)(Closed)/g, "$1").trim();
      } else {
        address = "";
      }
    }

    // Company URL
    if (container) {
      var allLinks = Array.from(container.querySelectorAll("a[href]"));
      var filteredLinks = allLinks.filter(
        (a) => !a.href.startsWith("https://www.google.com/maps/place/")
      );
      if (filteredLinks.length > 0) {
        companyUrl = filteredLinks[0].href;
      }
    }

    // Phone Numbers
    if (container) {
      var containerText = container.textContent || "";
      var phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
      var phoneMatch = containerText.match(phoneRegex);
      phone = phoneMatch ? phoneMatch[0] : "";
    }

    // Return the data as an object
    return {
      title: titleText,
      rating: rating,
      reviewCount: reviewCount,
      phone: phone,
      industry: industry,
      address: address,
      companyUrl: companyUrl,
      href: link.href,
    };
  });
}
// Convert the table to a CSV string
function tableToCsv(table) {
  var csv = [];
  var rows = table.querySelectorAll("tr");

  for (var i = 0; i < rows.length; i++) {
    var row = [],
      cols = rows[i].querySelectorAll("td, th");

    for (var j = 0; j < cols.length; j++) {
      row.push('"' + cols[j].innerText + '"');
    }
    csv.push(row.join(","));
  }
  return csv.join("\n");
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
