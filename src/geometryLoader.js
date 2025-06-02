// src/geometryLoader.js
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");

const createGeometry = require("../dist/geometry_wasm.js");

const wasmPath = path.join(__dirname, "..", "dist", "geometry_wasm.wasm");
const wasmURL = pathToFileURL(wasmPath).href; // file:///C:/…

module.exports = (overrides = {}) =>
  createGeometry({
    locateFile: (f) => (f.endsWith(".wasm") ? wasmURL : f),
    // se preferir embutir o binário:
    // wasmBinary: fs.readFileSync(wasmPath),
    ...overrides,
  });
