const fs = require("fs");

function tableToCsv(table) {
  console.log("tableToCsv", table.length);

  var csv = [];
  var rows = table.length;

  csv.push(Object.keys(table) + "\n");

  for (var i = 0; i < table.length; i++) {
    var row = [];
    cols = Object.values(table[i]).length;

    csv.push(Object.values(table[i]) + "\n");
    csv.join("\n");
  }

  saveCsv(csv.toString());
}

function saveCsv(csv) {
  fs.writeFile("./files/google-scrap.csv", csv, (err) => {
    if (err) {
      console.error("Error writing CSV file:", err);
    } else {
      console.log("CSV file saved successfully.");
    }
  });
}

module.exports = tableToCsv;
