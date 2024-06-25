import * as path from 'path';
import * as fs from 'fs-extra';
import ParcelBundler, { ParcelBundle } from 'parcel-bundler';

const destSVGPath: string = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'material-icon-theme',
  'icons'
);
const distBasePath: string = path.resolve(__dirname, '..', 'dist');
const srcPath: string = path.resolve(__dirname, '..', 'src');

/** Create icons cache. */
async function consolidateSVGFiles(): Promise<void> {
  console.log('[1/2] Generate icon cache for extension.');
  await fs
    .copy(path.resolve(srcPath, 'custom'), destSVGPath)
    .then(() => fs.readdir(destSVGPath))
    .then((files) =>
      Object.fromEntries(files.map((filename) => [filename, filename]))
    )
    .then((iconsDict) =>
      fs.writeJSON(path.resolve(srcPath, 'icon-list.json'), iconsDict)
    );
}

function bundleJS(outDir: string, entryFile: string): Promise<ParcelBundle> {
  const parcelOptions = {
    watch: false,
    minify: true,
    sourceMaps: false,
    outDir,
  };
  const bundler = new ParcelBundler(entryFile, parcelOptions);
  return bundler.bundle();
}

function src(distPath: string): Promise<(void | ParcelBundle | void[])[]> {
  console.log('[2/2] Bundle extension manifest, images and main script.');

  const copyIcons: Promise<void> = fs.copy(destSVGPath, distPath);

  const bundleMainScript = (): Promise<ParcelBundle> =>
    bundleJS(distPath, path.resolve(srcPath, 'main.ts'));
  const bundlePopupScript = (): Promise<ParcelBundle> =>
    bundleJS(
      distPath,
      path.resolve(srcPath, 'ui', 'popup', 'settings-popup.ts')
    );
  const bundleOptionsScript = (): Promise<ParcelBundle> =>
    bundleJS(distPath, path.resolve(srcPath, 'ui', 'options', 'options.ts'));
  const bundleBackgroundScript = (): Promise<ParcelBundle> =>
    bundleJS(distPath, path.resolve(srcPath, 'background', 'background.ts'));

  const bundleAll: Promise<ParcelBundle> = bundleMainScript()
    .then(bundlePopupScript)
    .then(bundleOptionsScript)
    .then(bundleBackgroundScript);

  const copyPopup: Promise<void[]> = Promise.all(
    [
      'settings-popup.html',
      'settings-popup.css',
      'settings-popup.github-logo.svg',
    ].map((file) =>
      fs.copy(
        path.resolve(srcPath, 'ui', 'popup', file),
        path.resolve(distPath, file)
      )
    )
  );

  const copyOptions: Promise<void[]> = Promise.all(
    ['options.html', 'options.css'].map((file) =>
      fs.copy(
        path.resolve(srcPath, 'ui', 'options', file),
        path.resolve(distPath, file)
      )
    )
  );

  const copyStyles: Promise<void> = fs.copy(
    path.resolve(srcPath, 'injected-styles.css'),
    path.resolve(distPath, 'injected-styles.css')
  );

  const copyExtensionLogos: Promise<void> = fs.copy(
    path.resolve(srcPath, 'extensionIcons'),
    distPath
  );

  return Promise.all([
    copyExtensionLogos,
    copyOptions,
    copyPopup,
    copyStyles,
    copyIcons,
    bundleAll,
  ]);
}

function buildManifest(distPath: string, manifestName: string): Promise<void> {
  return Promise.all([
    fs.readJson(path.resolve(srcPath, 'manifests', 'base.json')),
    fs.readJson(path.resolve(srcPath, 'manifests', manifestName)),
  ])
    .then(([base, custom]) => ({ ...base, ...custom }))
    .then((manifest) =>
      fs.writeJson(path.resolve(distPath, 'manifest.json'), manifest, {
        spaces: 2,
      })
    );
}

function buildDist(name: string, manifestName: string): Promise<void> {
  const distPath: string = path.resolve(distBasePath, name);

  return fs
    .ensureDir(distPath)
    .then(consolidateSVGFiles)
    .then(() => src(distPath))
    .then(() => buildManifest(distPath, manifestName))
    .catch(console.error);
}

buildDist('firefox', 'firefox.json').then(() =>
  buildDist('chrome-edge', 'chrome-edge.json')
);
