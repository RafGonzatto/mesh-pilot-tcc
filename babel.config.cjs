// babel.config.cjs
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      { targets: { node: "current" } }, // transpila só o necessário para o Node que rodará o Jest
    ],
  ],
};
