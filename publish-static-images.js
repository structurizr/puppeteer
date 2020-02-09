const puppeteer = require('puppeteer');

if (process.argv.length < 6) {
  console.log("Please specify a username, password, and workspace ID.");
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

const url = structurizrUrl + '/workspace/' + workspaceId + '/diagram-editor';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});
  const page = await browser.newPage();

  console.log("Signing in...");

  await page.goto(structurizrUrl + '/dashboard');
  await page.type('#username', username);
  await page.type('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('#searchForm');

  console.log("Opening diagrams in workspace " + workspaceId + "...");

  await page.goto(url);
  await page.waitForXPath("//*[name()='svg']");

  console.log("Regenerating static images...");

  await regenerateImages(page);

  process.exit(0);
})();

async function regenerateImages(page) {
  await page.evaluate(() => {
    return Structurizr.diagram.publishImagesToRepository();
  });
  await page.waitForFunction('Structurizr.diagram.publishImagesToRepositoryFinished() == true', { timeout: 1000 * 60 * 3 });
}