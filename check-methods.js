const MP = require("./dist/mesh-pilot.umd.js"); // ajuste o caminho conforme necessário
const meshData = { vertices: [], polygons: [] };
const nav = new MP.NavMesh(meshData);

console.log(">> Exports:", Object.keys(MP));
console.log(
  ">> Métodos de NavMesh:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(nav))
);
