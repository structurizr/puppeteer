const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 7) {
  console.log("Please specify a Structurizr URL, username, password, workspace ID, and software system name.");
  console.log("Usage: <structurizrUrl> <username> <password> <workspaceId> <softwareSystemName>")
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

const softwareSystemName = process.argv[6];

const url = structurizrUrl + '/workspace/' + workspaceId + '/documentation#%2F' + softwareSystemName + ':All';

console.log(url);

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});
  const page = await browser.newPage();

  console.log("Signing in...");

  await page.goto(structurizrUrl + '/dashboard');
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('#searchForm');

  console.log("Opening documentation in workspace " + workspaceId + "...");

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  await page.exposeFunction('saveHtml', (content) => {
    const filename = 'structurizr-' + workspaceId + '-documentation.html';
    console.log("Writing " + filename);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) throw err;
    });

    browser.close();
  });

  console.log("Exporting documentation as offline HTML page...");
  await exportDocumentation(page);
})();

async function exportDocumentation(page) {
  await page.evaluate(() => {
    return structurizr.scripting.exportDocumentationToOfflineHtmlPage(function(html) {
      saveHtml(html);
    });
  });
}