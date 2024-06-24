/**
 * Copies version from package.json into src/manifest.json
 */

const path = require('path');
const fs = require('fs').promises;

const packageJson = require(path.resolve(__dirname, '..', 'package.json'));

const manifestPath = path.resolve(
  __dirname,
  '..',
  'src',
  'manifests',
  'base.json'
);
const manifest = require(manifestPath);

const updatedManifest = { ...manifest, version: packageJson.version };
const updatedManifestStr = `${JSON.stringify(updatedManifest, null, 2)}\n`;

fs.writeFile(manifestPath, updatedManifestStr)
  .then(() => {
    console.log(`Updated manifest.json version to ${packageJson.version}`);
  })
  .catch(console.error);
