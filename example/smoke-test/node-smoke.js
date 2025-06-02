// example/smoke-test/node-smoke.js
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

// 1) ponto exato do .wasm e leitura binária
const wasmPath = path.join(__dirname, "..", "..", "dist", "geometry_wasm.wasm");
const wasmBinary = fs.readFileSync(wasmPath);

// 2) injeta **tanto** wasmBinary **quanto** locateFile
global.Module = {
  wasmBinary,
  locateFile(filename) {
    // se o loader pedir qualquer .wasm, devolva URL absoluta
    if (filename.endsWith(".wasm")) {
      return pathToFileURL(wasmPath).href; // file:///C:/…
    }
    return filename; // outros assets
  },
};

// 3) carrega o bundle normalmente
const {
  NavMesh,
  Polygon,
  PathFinder,
} = require("../../dist/mesh-pilot.umd.js");

// ------ teste -------------------------------------------------------------
const verts = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];
const polys = [
  new Polygon(verts.slice(0, 3).map(([x, y]) => ({ x, y }))),
  new Polygon([verts[0], verts[2], verts[3]].map(([x, y]) => ({ x, y }))),
];
const nav = new NavMesh();
polys.forEach((p) => nav.addPolygon(p));
nav.buildGraph();

const res = PathFinder.findPath({ graph: nav.graph, start: 0, end: 1 });
console.log("✅ path IDs   :", res.path);
console.log("✅ path points:", res.points);
