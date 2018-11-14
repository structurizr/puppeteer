const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 6) {
  console.log("Please specify a username, password, output format (PNG or SVG), workspace ID, and optional diagram key.");
  console.log("Usage: <username> <password> <png|svg> <workspaceId> [diagramKey]")
  process.exit(1);
}

const username = process.argv[2];
const password = process.argv[3];

const format = process.argv[4];
if (format !== 'png' && format !== 'svg') {
  console.log("The output format must be png or svg.");
  process.exit(1);
}

const workspaceId = process.argv[5];
if (!new RegExp('^[0-9]+$').test(workspaceId)) {
  console.log("The workspace ID must be a non-negative integer.");
  process.exit(1);
} else {
  console.log("Exporting diagrams and keys in workspace " + workspaceId + "...");
}

var diagramKey;
if (process.argv[6] !== '*') {
  diagramKey = process.argv[6];
}

const url = 'https://structurizr.com/workspace/' + workspaceId + '/diagrams?autoLayout=false' + (diagramKey ? '#' + diagramKey : '');
const filenameSuffix = 'structurizr-' + workspaceId + '-';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  const page = await browser.newPage();

  await page.goto('https://structurizr.com/dashboard');
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('p.dashboardMetaData');

  await page.goto(url);
  await page.waitForXPath("//*[name()='svg']");

  if (diagramKey !== undefined) {
    if (format === 'png') {
      await exportDiagramAndKeyToPNG(page, diagramKey);
    } else {
      await exportDiagramAndKeyToSVG(page, diagramKey);
    }
  } else {
    const views = await page.evaluate(() => {
      return structurizr.scripting.getViews();
    });

    for (var i = 0; i < views.length; i++) {
      var view = views[i];  

      await page.evaluate((view) => {
        structurizr.scripting.changeView(view.key);
      }, view);
      await page.waitForXPath("//*[name()='svg']");

      if (format === 'png') {
        await exportDiagramAndKeyToPNG(page, view.key);
      } else {
        await exportDiagramAndKeyToSVG(page, view.key);
      }
    }
  }
  
  console.log("Done");
  await browser.close();
})();

async function exportDiagramAndKeyToPNG(page, diagramKey) {
  const diagramFilename = filenameSuffix + diagramKey + '.png';
  const diagramKeyFilename = filenameSuffix + diagramKey + '-key.png'

  console.log(' - ' + diagramKey + ' (diagram) -> ' + diagramFilename);

  var base64DataForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToPNG();
  });

  fs.writeFile(diagramFilename, base64DataForDiagram.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });

  console.log(' - ' + diagramKey + ' (key) -> ' + diagramKeyFilename);

  var base64DataForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToPNG();
  });

  fs.writeFile(diagramKeyFilename, base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });
}

async function exportDiagramAndKeyToSVG(page, diagramKey) {
  const diagramFilename = filenameSuffix + diagramKey + '.html';
  const diagramKeyFilename = filenameSuffix + diagramKey + '-key.html'

  console.log(' - ' + diagramKey + ' (diagram) -> ' + diagramFilename);

  var svgForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToSVG();
  });

  fs.writeFile(diagramFilename, svgForDiagram, function (err) {
    if (err) throw err;
  });

  console.log(' - ' + diagramKey + ' (key) -> ' + diagramKeyFilename);

  var svgForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToSVG();
  });

  fs.writeFile(diagramKeyFilename, svgForKey, function (err) {
    if (err) throw err;
  });
}