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
  console.log("Opening diagram in workspace " + workspaceId + "...");
}

var diagramKey;
if (process.argv[6] !== '*') {
  diagramKey = process.argv[6];
}

const structurizrUrl = 'https://structurizr.com';
const url = structurizrUrl + '/workspace/' + workspaceId + '/diagram-editor' + (diagramKey ? '#' + diagramKey : '');
const filenameSuffix = 'structurizr-' + workspaceId + '-';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: false});
  const page = await browser.newPage();

  await page.setCookie({
    "name": "structurizr.hideDiagramEditorIntroduction",
    "value": "true",
    "url": structurizrUrl
  })

  await page.goto(structurizrUrl + '/dashboard');
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('p.workspaceMetaData');

  await page.goto(url);
  await page.waitForXPath("//*[name()='svg']");

  var workspaceSaved = async function(){
    console.log("Workspace saved; creating PNG/SVG files for all views in the workspace...");

    var diagramKey = await page.evaluate(() => {
      return structurizr.scripting.getViewKey();
    });
  
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

    // and navigate back to previous view
    await page.evaluate((diagramKey) => {
      structurizr.scripting.changeView(diagramKey);
    }, diagramKey);
  }
  
  await page.exposeFunction('workspaceSaved', workspaceSaved);
  
  await page.evaluate(() => {
    return structurizr.scripting.onWorkspaceSaved(workspaceSaved);
  });
})();

async function exportDiagramAndKeyToPNG(page) {
  var diagramKey = await page.evaluate(() => {
    return structurizr.scripting.getViewKey();
  });

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
    return structurizr.scripting.exportCurrentDiagramKeyToPNG(false);
  });

  fs.writeFile(diagramKeyFilename, base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });
}

async function exportDiagramAndKeyToSVG(page) {
  var diagramKey = await page.evaluate(() => {
    return structurizr.scripting.getViewKey();
  });

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
