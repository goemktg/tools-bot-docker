// START vega-demo.js
import vega from "vega";
import fs from "fs";

const stackedBarChartSpec = require("../stacked-bar-chart.spec.json");

console.log(stackedBarChartSpec);

// create a new view instance for a given Vega JSON spec
const view = new vega.View(vega.parse(stackedBarChartSpec))
  .renderer("none")
  .initialize();

// generate static PNG file from chart
view
  .toSVG()
  .then(function (svg) {
    // process node-canvas instance for example, generate a PNG stream to write var
    // stream = canvas.createPNGStream();
    console.log("Writing PNG to file...");
    fs.writeFileSync("stackedBarChart.svg", svg);
  })
  .catch(function (err) {
    console.log("Error writing PNG to file:");
    console.error(err);
  });
// END vega-demo.js
