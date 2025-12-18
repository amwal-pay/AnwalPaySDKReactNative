const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

config.watchFolders = [root];

// We need to make sure that only one version is loaded for peerDependencies
// So we exclude them at the root, and alias them to the versions in example's node_modules
config.resolver = {
  ...config.resolver,

  blacklistRE: exclusionList([
    new RegExp(`${path.resolve(root, 'node_modules')}/react/.*`),
    new RegExp(`${path.resolve(root, 'node_modules')}/react-native/.*`),
  ]),

  extraNodeModules: {
    ...Object.keys(pak.peerDependencies).reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
    'react-amwal-pay': path.join(root, 'src', 'index.tsx'),
  },
};

module.exports = config;
