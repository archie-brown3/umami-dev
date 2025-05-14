const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Attempt to prevent 'ws' from being bundled for the client
// by resolving it to a non-existent or empty module in the client bundle.
// This is a workaround. Ideally, Supabase/RealtimeJS handles this correctly.
defaultConfig.resolver = defaultConfig.resolver || {};
defaultConfig.resolver.extraNodeModules =
  defaultConfig.resolver.extraNodeModules || {};

// Create an empty empty-module.js in your project root for this to work
const emptyModulePath = require.resolve("./empty-module.js");

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
];

for (const moduleName of nodeCoreModules) {
  defaultConfig.resolver.extraNodeModules[moduleName] = emptyModulePath;
}

module.exports = defaultConfig;
