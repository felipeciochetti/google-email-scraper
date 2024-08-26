const fs = require("fs");
const { parse } = require("csv-parse");
const { Parser } = require("json2csv");

function tableToCsv(table) {
  console.log("tableToCsv", table.length);

  var csv = [];
  var rows = table.length;

  //csv.push(Object.keys(table) + "\n");

  for (var i = 0; i < table.length; i++) {
    cols = Object.values(table[i]).length;

    csv.push(Object.values(table[i]) + "\n");
    csv.join("\n");
  }

  saveCsv(csv.toString());
}
function saveJsonToCsv(jsonArray, filePath) {
  try {
    // Create a new parser with the fields derived from the keys of the first object in the array
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(jsonArray);

    // Write the CSV string to the specified file
    fs.writeFileSync(filePath, csv);

    console.log(`CSV file saved successfully at ${filePath}`);
  } catch (err) {
    console.error("Error converting JSON to CSV:", err);
  }
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

async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ",", columns: true })) // Adjust delimiter if necessary
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = {
  tableToCsv,
  readCSVFile,
  saveJsonToCsv,
};
