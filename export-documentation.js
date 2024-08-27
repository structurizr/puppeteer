const puppeteer = require('puppeteer');
const fs = require('fs');

const FILENAME_PREFIX = '';

const IGNORE_HTTPS_ERRORS = true;
const HEADLESS = true;

if (process.argv.length < 3) {
  console.log("Usage: <structurizrUrl> [username] [password]")
  process.exit(1);
}

const url = process.argv[2];

var username;
var password;

if (process.argv.length > 2) {
  username = process.argv[3];
  password = process.argv[4];
}

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: IGNORE_HTTPS_ERRORS, headless: HEADLESS});
  const page = await browser.newPage();

  if (username !== undefined && password !== undefined) {
    // sign in
    const parts = url.split('://');
    const signinUrl = parts[0] + '://' + parts[1].substring(0, parts[1].indexOf('/')) + '/dashboard'; 
    console.log(' - Signing in via ' + signinUrl);

    await page.goto(signinUrl, { waitUntil: 'networkidle2' });
    await page.type('#username', username);
    await page.type('#password', password);
    await page.keyboard.press('Enter');
    await page.waitForSelector('div#dashboard');
  }

  // visit the documentation page
  console.log(" - Opening " + url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('structurizr.scripting && structurizr.scripting.isDocumentationRendered() === true');

  await page.exposeFunction('saveHtml', (content) => {
    const filename = FILENAME_PREFIX + 'documentation.html';
    console.log(" - Writing " + filename);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) throw err;
    });

    console.log(" - Finished");
    browser.close();
  });

  await page.evaluate(() => {
    return structurizr.scripting.exportDocumentationToOfflineHtmlPage(function(html) {
      saveHtml(html);
    });
  });

})();
