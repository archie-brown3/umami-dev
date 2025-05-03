const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  // Add svg to assetExts
  config.resolver.assetExts = resolver.assetExts.filter((ext) => ext !== "svg");

  // Add svg to sourceExts
  config.resolver.sourceExts = [...resolver.sourceExts, "svg"];

  // Configure transformer for svg files
  config.transformer.babelTransformerPath = require.resolve(
    "react-native-svg-transformer"
  );

  // Configure logging
  config.reporter = {
    update: () => {},
    // Show all logs
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  return config;
})();
