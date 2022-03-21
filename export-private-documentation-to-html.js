const puppeteer = require('puppeteer');
const fs = require('fs');

if (process.argv.length < 6) {
  console.log("Please specify a Structurizr URL, username, password, workspace ID, and software system name.");
  console.log("Usage: <structurizrUrl> <username> <password> <workspaceId> [softwareSystemName]")
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

var softwareSystemName = "";

if (process.argv.length === 7) {
  softwareSystemName = process.argv[6];
}

const url = structurizrUrl + '/workspace/' + workspaceId + '/documentation/' + softwareSystemName;

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});
  const page = await browser.newPage();

  console.log("Signing in at " + structurizrUrl);

  await page.goto(structurizrUrl + '/dashboard', { waitUntil: 'networkidle2' });
  await page.type('#username', username);
  await page.type('#password', password);
  await page.keyboard.press('Enter');
  await page.waitForSelector('div#dashboard');

  console.log("Opening documentation at " + url);

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction('structurizr && structurizr.scripting && structurizr.scripting.isDocumentationRendered() === true');

  await page.exposeFunction('saveHtml', (content) => {
    const filename = 'structurizr-' + workspaceId + '-documentation.html';
    console.log("Writing documentation to " + filename);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) throw err;
    });

    browser.close();
  });

  console.log("Exporting documentation as offline HTML page");
  await exportDocumentation(page);
})();

async function exportDocumentation(page) {
  await page.evaluate(() => {
    return structurizr.scripting.exportDocumentationToOfflineHtmlPage(function(html) {
      saveHtml(html);
    });
  });
}