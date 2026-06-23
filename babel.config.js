module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@/components": "./src/components",
            "@/context": "./src/context",
            "@/types": "./src/types",
            "@/lib": "./src/lib",
            "@/services": "./src/services",
            "@/utils": "./src/utils",
            "@/constants": "./src/constants",
            "@/hooks": "./src/hooks",
          },
        },
      ],
    ],
  };
};
