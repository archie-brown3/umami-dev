const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle Node.js modules and Jest
config.resolver.resolverMainFields = ["react-native", "browser", "main"];
config.resolver.platforms = ["ios", "android", "native", "web"];

// Create an empty empty-module.js in your project root for this to work
const emptyModulePath = require.resolve("./empty-module.js");

// Enhanced resolver to prevent Jest and other problematic modules from being bundled
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Prevent Jest and testing-related modules from being bundled
  const jestModules = [
    "jest",
    "@jest/core",
    "@jest/environment",
    "@jest/globals",
    "@jest/types",
    "jest-environment-node",
    "jest-runtime",
    "jest-util",
    "jest-mock",
    "jest-config",
    "jest-circus",
    "jest-jasmine2",
    "jest-snapshot",
    "jest-matcher-utils",
    "jest-diff",
    "jest-get-type",
    "jest-validate",
    "jest-serializer",
    "jest-worker",
    "jest-haste-map",
    "jest-resolve",
    "jest-resolve-dependencies",
    "jest-changed-files",
    "jest-message-util",
    "jest-leak-detector",
    "jest-docblock",
    "jest-each",
    "jest-runner",
    "jest-watcher",
    "jest-cli",
    "babel-jest",
    "ts-jest",
  ];

  // Check if the module is Jest-related
  const isJestModule = jestModules.some(
    (jestMod) =>
      moduleName === jestMod ||
      moduleName.startsWith(jestMod + "/") ||
      moduleName.includes("jest")
  );

  if (isJestModule) {
    console.log(`[Metro] Blocking Jest module: ${moduleName}`);
    return {
      filePath: emptyModulePath,
      type: "sourceFile",
    };
  }

  // Use default resolver for other modules
  return context.resolveRequest(context, moduleName, platform);
};

// Attempt to prevent 'ws' from being bundled for the client
// by resolving it to a non-existent or empty module in the client bundle.
// This is a workaround. Ideally, Supabase/RealtimeJS handles this correctly.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};

// You might also need to tell Metro that 'stream', 'http', 'https', 'crypto', 'events', etc., are empty
// if 'ws' itself tries to require them and the above doesn't stop it.
const nodeCoreModules = [
  "stream",
  "http",
  "https",
  "crypto",
  "events",
  "fs",
  "path",
  "os",
  "tty",
  "zlib",
  "url",
  "assert",
  "constants",
  "timers",
  "net",
  "tls",
  "child_process",
  "dgram",
  "dns",
  "repl",
  "vm",
  "module",
  "util",
  "buffer",
  "querystring",
  "string_decoder",
  "punycode",
];

for (const moduleName of nodeCoreModules) {
  config.resolver.extraNodeModules[moduleName] = emptyModulePath;
}

// Add Jest modules to extraNodeModules as well for extra safety
const jestModulesForExtra = [
  "jest",
  "@jest/core",
  "@jest/environment",
  "@jest/globals",
  "@jest/types",
  "babel-jest",
  "ts-jest",
];

for (const moduleName of jestModulesForExtra) {
  config.resolver.extraNodeModules[moduleName] = emptyModulePath;
}

module.exports = config;
