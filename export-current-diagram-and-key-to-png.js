const puppeteer = require('puppeteer');
const fs = require('fs');

const workspaceId = 1;
const diagramKey = 'liveDeployment';
const filename = 'structurizr-' + workspaceId + '-' + diagramKey;

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  const page = await browser.newPage();
  await page.goto('https://structurizr.com/share/' + workspaceId + '#' + diagramKey);

  const base64DataForDiagram = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramToPNG();
  });

  const base64DataForKey = await page.evaluate(() => {
    return structurizr.scripting.exportCurrentDiagramKeyToPNG();
  });

  fs.writeFile(filename + '.png', base64DataForDiagram.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });

  fs.writeFile(filename + '-key.png', base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
    if (err) throw err;
  });

  await browser.close();
})();