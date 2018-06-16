const puppeteer = require('puppeteer');
const fs = require('fs');

const workspaceId = 1;
const filename = 'structurizr-' + workspaceId + '-diagrams.html';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  const page = await browser.newPage();
  await page.goto('https://structurizr.com/share/' + workspaceId);

  page.on('console', msg => {
    fs.writeFile(filename, msg.text(), function (err) {
      if (err) throw err;
    });
    browser.close();
  });
    
  await page.evaluate(() => {
    structurizr.scripting.exportDiagramsToOfflineHtmlPage(function(html) { console.log(html); });
  });
})();