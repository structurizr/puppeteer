const puppeteer = require('puppeteer');
const fs = require('fs');

const workspaceId = 1;
const diagramKey = 'components';
const filename = 'structurizr-' + workspaceId + '-' + diagramKey;
const username = '';
const password = '';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  var page = await browser.newPage();

  await page.goto('https://structurizr.com/dashboard');
  await page.type('#j_username', username);
  await page.type('#j_password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('p.dashboardMetaData');

  await page.goto('https://structurizr.com/workspace/' + workspaceId + '#' + diagramKey);
  await page.waitForXPath("//*[name()='svg']");

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