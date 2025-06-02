module.exports = {
  testEnvironment: "node",
  testMatch: ["**/_tests_/**/*.test.[jt]s"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^../../dist/geometry_wasm\\.js$": "<rootDir>/src/geometryLoader.js", // 👈 alias p/ fallback
  },
};
