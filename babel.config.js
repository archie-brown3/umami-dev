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
            "@/components": "./app/components",
            "@/context": "./app/context",
            "@/types": "./app/types",
            "@/lib": "./app/lib",
            "@/services": "./app/services",
          },
        },
      ],
    ],
  };
};
