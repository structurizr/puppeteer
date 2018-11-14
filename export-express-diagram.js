const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 4) {
  console.log("Please specify an output format (PNG or SVG) and the path to the file containing the JSON/YAML diagram definition.");
  console.log("Usage: <png|svg> <input filename>")
  process.exit(1);
}

const format = process.argv[2];
if (format !== 'png' && format !== 'svg') {
  console.log("The output format must be png or svg.");
  process.exit(1);
}

const filename = process.argv[3];
var expressDiagramDefinition = fs.readFileSync(filename, 'utf8');

const filenameSuffix = 'structurizr-' + filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  const page = await browser.newPage();
  await page.goto('https://structurizr.com/express?autoLayout=false');
  await page.waitForXPath("//*[name()='svg']");

  await page.evaluate((expressDiagramDefinition) => {
    return structurizr.scripting.renderExpressDefinition(expressDiagramDefinition);
  }, expressDiagramDefinition);

  if (format === 'png') {
    await exportDiagramAndKeyToPNG(page);
  } else {
    await exportDiagramAndKeyToSVG(page);
  }

  console.log("Done");
  await browser.close();
})();

async function exportDiagramAndKeyToPNG(page) {
  const diagramFilename = filenameSuffix + '.png';
  const diagramKeyFilename = filenameSuffix + '-key.png'

  console.log(' - diagram -> ' + diagramFilename);

  var base64DataForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToPNG();
  });

  fs.writeFile(diagramFilename, base64DataForDiagram.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });

  console.log(' - key -> ' + diagramKeyFilename);

  var base64DataForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToPNG();
  });

  fs.writeFile(diagramKeyFilename, base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });
}

async function exportDiagramAndKeyToSVG(page) {
  const diagramFilename = filenameSuffix + '.html';
  const diagramKeyFilename = filenameSuffix + '-key.html'

  console.log(' - diagram -> ' + diagramFilename);

  var svgForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToSVG();
  });

  fs.writeFile(diagramFilename, svgForDiagram, function (err) {
    if (err) throw err;
  });

  console.log(' - key -> ' + diagramKeyFilename);

  var svgForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToSVG();
  });

  fs.writeFile(diagramKeyFilename, svgForKey, function (err) {
    if (err) throw err;
  });
}