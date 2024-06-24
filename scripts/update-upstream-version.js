const path = require('path');
const fs = require('fs/promises');

/**
 * Gets latest VSCode Extension release version by parsing it's most recent 100 commit msgs
 *
 * returns version string or undefined
 *
 * @returns {Promise<string>} The current version of the upstream repository.
 */
const getUpstreamVersion = async () => {
  const packagePath = path.resolve(
    __dirname,
    '..',
    'node_modules',
    'material-icon-theme',
    'package.json'
  );
  const packageData = await fs.readFile(packagePath, { encoding: 'utf8' });
  const packageJson = JSON.parse(packageData);
  return packageJson.version;
};

const updateReadmeBadge = async (version) => {
  const readmeFilePath = path.resolve(__dirname, '..', 'README.md');
  const readme = await fs.readFile(readmeFilePath, { encoding: 'utf8' });
  const versionRgx = /(badge\/[\w_]+-v)\d+\.\d+\.\d+/;
  const replacement = `$1${version}`;
  const updatedReadme = readme.replace(versionRgx, replacement);

  return fs.writeFile(readmeFilePath, updatedReadme);
};

const run = async () => {
  const latestVersion = getUpstreamVersion();

  console.log(`Latest upstream version: ${latestVersion}`);

  console.log('Updating upstream version badge in README');
  await updateReadmeBadge(latestVersion);
};

run();
