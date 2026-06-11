const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// The Vite finder site in web/ has its own node_modules; Metro must not watch it.
config.resolver.blockList = exclusionList([
  new RegExp(`${path.resolve(__dirname, 'web')}${path.sep}.*`),
]);

module.exports = config;
