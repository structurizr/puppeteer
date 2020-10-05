const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 6) {
  console.log("Please specify a Structurizr URL, username, password, and workspace ID.");
  console.log("Usage: <structurizrUrl> <username> <password> <workspaceId>")
  process.exit(1);
}

const structurizrUrl = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];

const workspaceId = process.argv[5];
if (!new RegExp('^[0-9]+$').test(workspaceId)) {
  console.log("The workspace ID must be a non-negative integer.");
  process.exit(1);
}

const url = structurizrUrl + '/workspace/' + workspaceId + '/diagrams';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});
  const page = await browser.newPage();

  console.log("Signing in...");

  await page.goto(structurizrUrl + '/dashboard', { waitUntil: 'networkidle2' });
  await page.type('#username', username);
  await page.type('#password', password);
  await page.keyboard.press('Enter');
  await page.waitForSelector('div.dashboardMetaData');

  console.log("Opening diagrams in workspace " + workspaceId + "...");

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('structurizr.scripting.isDiagramRendered() === true');

  await page.exposeFunction('saveHtml', (content) => {
    const filename = 'structurizr-' + workspaceId + '-diagrams.html';
    console.log("Writing " + filename);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) throw err;
    });

    browser.close();
  });

  console.log("Exporting diagrams as offline HTML page...");
  await exportDiagrams(page);
})();

async function exportDiagrams(page) {
  await page.evaluate(() => {
    return structurizr.scripting.exportDiagramsToOfflineHTMLPage(function(html) {
      saveHtml(html);
    });
  });
}