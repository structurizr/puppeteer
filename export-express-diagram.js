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

const url = 'https://structurizr.com/express';
const autoLayout = false;
const ignoreHTTPSErrors = false;
const headless = true;

const filename = process.argv[3];
const expressDiagramDefinition = fs.readFileSync(filename, 'utf8');
const filenameSuffix = 'structurizr-' + filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'));

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: ignoreHTTPSErrors, headless: headless});
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForXPath("//*[name()='svg']");

  await page.evaluate((autoLayout) => {
    return structurizr.scripting.setAutoLayout(autoLayout);
  }, autoLayout);

  await page.evaluate((expressDiagramDefinition) => {
    return structurizr.scripting.renderExpressDefinition(expressDiagramDefinition);
  }, expressDiagramDefinition);

  if (format === 'png') {
    await exportDiagramAndKeyToPNG(page);
  } else {
    await exportDiagramAndKeyToSVG(page);
  }

  await browser.close();
})();

async function exportDiagramAndKeyToPNG(page) {
  const diagramFilename = filenameSuffix + '.png';
  const diagramKeyFilename = filenameSuffix + '-key.png'

  var base64DataForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToPNG({ crop: false });
  });

  console.log("Writing " + diagramFilename);
  fs.writeFile(diagramFilename, base64DataForDiagram.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });

  var base64DataForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToPNG();
  });

  console.log("Writing " + diagramKeyFilename);
  fs.writeFile(diagramKeyFilename, base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });
}

async function exportDiagramAndKeyToSVG(page) {
  const diagramFilename = filenameSuffix + '.html';
  const diagramKeyFilename = filenameSuffix + '-key.html'

  var svgForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToSVG();
  });

  console.log("Writing " + diagramFilename);
  fs.writeFile(diagramFilename, svgForDiagram, function (err) {
    if (err) throw err;
  });

  var svgForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToSVG();
  });

  console.log("Writing " + diagramKeyFilename);
  fs.writeFile(diagramKeyFilename, svgForKey, function (err) {
    if (err) throw err;
  });
}