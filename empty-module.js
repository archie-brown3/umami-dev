// This file is intentionally empty.
// It's used in metro.config.js to prevent Node.js modules from being bundled.
// Empty module to prevent Node.js modules from being bundled in React Native
// This file is referenced in metro.config.js to replace problematic modules

// Export an empty object to satisfy module requirements
module.exports = {};

// Also provide some common properties that modules might expect
module.exports.default = {};

// For Jest-specific exports that might be expected
if (typeof global !== "undefined") {
  // Prevent Jest globals from being accessed
  const emptyFunction = () => {};
  const emptyObject = {};

  // Common Jest globals that might be referenced
  module.exports.describe = emptyFunction;
  module.exports.it = emptyFunction;
  module.exports.test = emptyFunction;
  module.exports.expect = emptyFunction;
  module.exports.beforeEach = emptyFunction;
  module.exports.afterEach = emptyFunction;
  module.exports.beforeAll = emptyFunction;
  module.exports.afterAll = emptyFunction;
  module.exports.jest = emptyObject;
}
