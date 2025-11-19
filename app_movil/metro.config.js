const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reduce symbolicator noise on Windows when Hermes frames reference InternalBytecode.js
config.symbolicator = {
  customizeFrame: (frame) => {
    const file = frame && frame.file ? String(frame.file) : '';
    const collapse = file.includes('InternalBytecode') || file.includes('HermesInternal');
    return { ...frame, collapse };
  },
};

module.exports = config;
