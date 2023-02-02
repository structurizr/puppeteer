const puppeteer = require('puppeteer');
const fs = require('fs');

console.log("Usage: [Structurizr Lite URL] [diagram key]")

var structurizrUrl = 'http://localhost:8080';

if (process.argv.length > 2) {
  structurizrUrl = process.argv[2];
}

console.log(' - URL: ' +structurizrUrl);

var diagramKeys = [];
var expectedNumberOfExports = 0;
var actualNumberOfExports = 0;

const url = structurizrUrl + '/workspace/diagrams';

const filenameSuffix = 'structurizr-';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});  
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  await page.exposeFunction('savePNG', (content, filename) => {
    console.log(" - Writing: " + filename);
    content = content.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(filename, content, 'base64', function (err) {
      if (err) throw err;
    });

    actualNumberOfExports++;

    if (actualNumberOfExports === expectedNumberOfExports) {
      console.log(" - Finished");
      browser.close();
    }
  });
  
  await page.waitForFunction('structurizr.scripting && structurizr.scripting.isDiagramRendered && structurizr.scripting.isDiagramRendered()');

  // figure out which views should be exported
  if (process.argv[3] !== undefined) {
    diagramKeys.push(process.argv[3]);
    expectedNumberOfExports++;
  } else {
    const views = await page.evaluate(() => {
      return structurizr.scripting.getViews();
    });
  
    views.forEach(function(view) {
      diagramKeys.push(view.key);
      expectedNumberOfExports++;
    });
  }

  console.log(" - Diagrams: " + diagramKeys);

  expectedNumberOfExports = (expectedNumberOfExports * 2); // every diagram has a key/legend

  for (var i = 0; i < diagramKeys.length; i++) {
    var diagramKey = diagramKeys[i];

    await page.evaluate((diagramKey) => {
      structurizr.scripting.changeView(diagramKey);
    }, diagramKey);

    await page.waitForFunction('structurizr.scripting.isDiagramRendered() === true');

    const diagramFilename = filenameSuffix + diagramKey + '.png';
    const diagramKeyFilename = filenameSuffix + diagramKey + '-key.png'

    page.evaluate((diagramFilename) => {
      structurizr.scripting.exportCurrentDiagramToPNG({ crop: false }, function(png) {
        window.savePNG(png, diagramFilename);
      })
    }, diagramFilename);

    page.evaluate((diagramKeyFilename) => {
      structurizr.scripting.exportCurrentDiagramKeyToPNG(function(png) {
        window.savePNG(png, diagramKeyFilename);
      })
    }, diagramKeyFilename);
  }
})();