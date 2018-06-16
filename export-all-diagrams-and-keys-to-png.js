const puppeteer = require('puppeteer');
const fs = require('fs');

const workspaceId = 1;
const filename = 'structurizr-' + workspaceId + '-';

(async () => {
  const browser = await puppeteer.launch({ignoreHTTPSErrors: false, headless: true});
  const page = await browser.newPage();
  await page.goto('https://structurizr.com/share/' + workspaceId);

  const views = await page.evaluate(() => {
    return structurizr.scripting.getViews();
  });

  for (var i = 0; i < views.length; i++) {
    var view = views[i];  

    await page.evaluate((view) => {
      structurizr.scripting.changeView(view.key);
    }, view);

    var base64DataForDiagram = await page.evaluate(() => {
      return structurizr.scripting.exportCurrentDiagramToPNG();
    });
  
    var base64DataForKey = await page.evaluate(() => {
      return structurizr.scripting.exportCurrentDiagramKeyToPNG();
    });
  
    fs.writeFile(filename + view.key + '.png', base64DataForDiagram.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
      if (err) throw err;
    });
  
    fs.writeFile(filename + view.key + '-key.png', base64DataForKey.replace(/^data:image\/png;base64,/, ""), 'base64', function (err) {
      if (err) throw err;
    });
  }
  
  await browser.close();
})();