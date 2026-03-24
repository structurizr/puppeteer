const puppeteer = require('puppeteer');
const fs = require('fs');

const PNG_FORMAT = 'png';
const SVG_FORMAT = 'svg';

const IGNORE_HTTPS_ERRORS = true;
const HEADLESS = true;

const IMAGE_VIEW_TYPE = 'Image';

if (process.argv.length < 4) {
  console.log("Usage: <structurizrUrl> <png|svg> [username] [password]")
  process.exit(1);
}

const url = process.argv[2];
const format = process.argv[3];

if (format !== PNG_FORMAT && format !== SVG_FORMAT) {
  console.log("The output format must be ' + PNG_FORMAT + ' or ' + SVG_FORMAT + '.");
  process.exit(1);
}

var username;
var password;

if (process.argv.length > 3) {
  username = process.argv[4];
  password = process.argv[5];
}

async function exportDiagram(page, view, exportKeys, stepSuffix = '') {
  await page.waitForFunction('structurizr.scripting.isDiagramRendered() === true');

  if (format === SVG_FORMAT) {
    const diagramFilename = view.key + stepSuffix + '.svg';
    const diagramKeyFilename = view.key + stepSuffix + '-key.svg'

    var svgForDiagram = await page.evaluate(() => {
      return structurizr.scripting.exportCurrentDiagramToSVG({ includeMetadata: true });
    });

    console.log(" - " + diagramFilename);
    fs.writeFile(diagramFilename, svgForDiagram, function (err) {
      if (err) throw err;
    });

    if (exportKeys && view.type !== IMAGE_VIEW_TYPE) {
      var svgForKey = await page.evaluate(() => {
        return structurizr.scripting.exportCurrentDiagramKeyToSVG();
      });

      console.log(" - " + diagramKeyFilename);
      fs.writeFile(diagramKeyFilename, svgForKey, function (err) {
        if (err) throw err;
      });
    }
  } else {
    const diagramFilename = view.key + stepSuffix + '.png';
    const diagramKeyFilename = view.key + stepSuffix + '-key.png'

    await page.evaluate((diagramFilename) => {
      structurizr.scripting.exportCurrentDiagramToPNG({ includeMetadata: true, crop: false }, function(png) {
        window.savePNG(png, diagramFilename);
      })
    }, diagramFilename);

    if (exportKeys && view.type !== IMAGE_VIEW_TYPE) {
      await page.evaluate((diagramKeyFilename) => {
        structurizr.scripting.exportCurrentDiagramKeyToPNG(function(png) {
          window.savePNG(png, diagramKeyFilename);
        })
      }, diagramKeyFilename);
    }
  }
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

  // visit the diagrams page
  console.log(" - Opening " + url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('structurizr.scripting && structurizr.scripting.isDiagramRendered() === true');

  if (format === PNG_FORMAT) {
    // add a function to the page to save the generated PNG images
    await page.exposeFunction('savePNG', (content, filename) => {
      console.log(" - " + filename);
      content = content.replace(/^data:image\/png;base64,/, "");
      fs.writeFile(filename, content, 'base64', function (err) {
        if (err) throw err;
      });
    });
  }

  // get the array of views
  const views = await page.evaluate(() => {
    return structurizr.scripting.getViews();
  });

  console.log(" - Starting export");
  for (var i = 0; i < views.length; i++) {
    const view = views[i];

    await page.evaluate((view) => {
      structurizr.scripting.changeView(view.key);
    }, view);

    await exportDiagram(page, view, true, undefined);

    var currentViewIsDynamic = await page.evaluate(() => {
      return structurizr.diagram.currentViewIsDynamic();
    });

    if (currentViewIsDynamic) {
      await page.evaluate(() => {
        structurizr.diagram.stepForwardInAnimation();
      });

      var step = 1;
      while (await page.evaluate(() => structurizr.diagram.animationStarted())) {
        await exportDiagram(page, view, false, '-step-' + step);
        await page.evaluate(() => {
          structurizr.diagram.stepForwardInAnimation();
        });
        step++;
      }
    }
  }

  console.log(" - Finished");
  browser.close();
})();