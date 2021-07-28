const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 7) {
  console.log("Please specify a Structurizr URL, username, password, output format (PNG or SVG), workspace ID, and optional diagram key.");
  console.log("Usage: <structurizrUrl> <username> <password> <png|svg> <workspaceId> [diagramKey]")
  process.exit(1);
}

const structurizrUrl = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];

const format = process.argv[5];
if (format !== 'png' && format !== 'svg') {
  console.log("The output format must be png or svg.");
  process.exit(1);
}

const workspaceId = process.argv[6];
if (!new RegExp('^[0-9]+$').test(workspaceId)) {
  console.log("The workspace ID must be a non-negative integer.");
  process.exit(1);
} else {
  console.log("Exporting diagrams and keys in workspace " + workspaceId + "...");
}

var browser;
var diagramKeys = [];
var expectedNumberOfExports = 0;
var actualNumberOfExports = 0;

const url = structurizrUrl + '/workspace/' + workspaceId + '/diagrams';
const ignoreHTTPSErrors = true;
const headless = true;

const filenameSuffix = 'structurizr-' + workspaceId + '-';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors, headless});
  const page = await browser.newPage();

  await page.goto(structurizrUrl + '/dashboard', { waitUntil: 'networkidle2' });
  await page.type('#username', username);
  await page.type('#password', password);
  await page.keyboard.press('Enter');
  await page.waitForSelector('div.workspaceThumbnail');

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('structurizr.scripting.isDiagramRendered() === true');

  await page.exposeFunction('savePNG', (content, filename) => {
    console.log("Writing " + filename);
    content = content.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(filename, content, 'base64', function (err) {
      if (err) throw err;
    });

    actualNumberOfExports++;

    if (actualNumberOfExports === expectedNumberOfExports) {
      browser.close();
    }
  });

  // figure out which views should be exported
  if (process.argv[7] !== undefined) {
    diagramKeys.push(process.argv[7]);
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

  // every diagram has a key/legend
  expectedNumberOfExports = (expectedNumberOfExports * 2);

  for (var i = 0; i < diagramKeys.length; i++) {
    var diagramKey = diagramKeys[i];

    await page.evaluate((diagramKey) => {
      structurizr.scripting.changeView(diagramKey);
    }, diagramKey);

    await page.waitForFunction('structurizr.scripting.isDiagramRendered() === true');

    if (format === "svg") {
      const diagramFilename = filenameSuffix + diagramKey + '.svg';
      const diagramKeyFilename = filenameSuffix + diagramKey + '-key.svg'

      var svgForDiagram = await page.evaluate(() => {
        return structurizr.scripting.exportCurrentDiagramToSVG();
      });
    
      console.log("Writing " + diagramFilename);
      fs.writeFile(diagramFilename, svgForDiagram, function (err) {
        if (err) throw err;
      });
      actualNumberOfExports++;
    
      var svgForKey = await page.evaluate(() => {
        return structurizr.scripting.exportCurrentDiagramKeyToSVG();
      });
    
      console.log("Writing " + diagramKeyFilename);
      fs.writeFile(diagramKeyFilename, svgForKey, function (err) {
        if (err) throw err;
      });
      actualNumberOfExports++;
    } else {
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
  }
    
  if (actualNumberOfExports === expectedNumberOfExports) {
    browser.close();
  }
})();