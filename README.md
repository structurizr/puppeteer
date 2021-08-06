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
node export-public-diagrams.js <structurizrUrl> <png|svg> <workspace ID> [diagram key]
```

For example, to export all diagrams (and keys) from the [Big Bank plc example workspace](https://structurizr.com/share/36141/diagrams):

```
node export-public-diagrams.js https://structurizr.com png 36141
```

And to export a single diagram:

```
node export-public-diagrams.js https://structurizr.com png 36141 SystemContext
```

### Exporting diagrams from a private workspace

The ```export-private-diagrams.js``` script will export diagrams and keys from a private Structurizr workspace (on the cloud service), creating a number of PNG or SVG (HTML) files in the current directory.

```
node export-private-diagrams.js <structurizrUrl> <username> <password> <png|svg> <workspaceId> [diagramKey]
```

For example, to export all diagrams (and keys) from a private workspace, with ID ```123456```:

```
node export-private-diagrams.js https://structurizr.com username password png 123456
```
