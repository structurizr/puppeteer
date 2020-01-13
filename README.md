# Structurizr Puppeteer

This repo contains some Node.js examples of how to script and automate parts of the Structurizr web application using Puppeteer (and headless Chrome) from the command line, perhaps as a part of your build process. Examples of what you can do include:

- Export diagrams and keys to PNG or SVG formats.
- Export all diagrams to a single HTML page for offline use. 

See [Structurizr - Help - Scripting - Diagrams](https://structurizr.com/help/scripting-diagrams) for more details.

## Examples

The command line examples that follow assume that you have Puppeteer installed. Please see [Puppeteer](https://developers.google.com/web/tools/puppeteer/) for details of how to install Puppeteer on your platform.

### Exporting diagrams from a public workspace

The ```export-public-diagrams.js``` script will export diagrams and keys from a public Structurizr workspace, creating a number of PNG or SVG (HTML) files in the current directory.

```
node export-public-diagrams.js <png|svg> <workspace ID> [diagram key]
```

For example, to export all diagrams (and keys) from the [Big Bank plc example workspace](https://structurizr.com/share/36141/diagrams):

```
node export-public-diagrams.js png 36141
```

And to export a single diagram:

```
node export-public-diagrams.js png 36141 SystemContext
```

### Exporting diagrams from a private workspace

The ```export-private-diagrams.js``` script will export diagrams and keys from a private Structurizr workspace, creating a number of PNG or SVG (HTML) files in the current directory.

```
node export-private-diagrams.js <username> <password> <png|svg> <workspaceId> [diagramKey]
```

For example, to export all diagrams (and keys) from a private workspace, with ID ```123456```:

```
node export-private-diagrams.js username password png 123456
```

## Auto-layout

By default, Structurizr will only apply an auto-layout algorithm if the diagram definition doesn't include any layouting information; i.e. there are no x,y coordinates specified for any of the elements on the diagram. To force an auto-layout algorithm, call the ```structurizr.scripting.setAutoLayout(bool)``` function with ```true``` or ```false``` before changing the view.  Alternatively, you can set a query string parameter named ```autoLayout``` to ```true``` when opening the workspace diagrams or Express page. You can do this by modifying the URL used by Puppeteer in the above scripts.
