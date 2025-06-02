// dist/geometryLoader.js
import Module from "./geometry_wasm.js"; // o stub gerado

export const geometryReady = Module().then((mod) => ({
  segmentsIntersect: (...args) => !!mod._segments_intersect(...args),
  bboxOverlap: (...args) => !!mod._bbox_overlap(...args),
}));
