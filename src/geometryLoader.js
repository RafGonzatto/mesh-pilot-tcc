// Carrega WASM se houver; senão, usa o fallback JS.
// Sempre exporta geometryReady, segmentsIntersect e _segments_intersect.

let impl = () => false;
let resolveReady;
export const geometryReady = new Promise((r) => (resolveReady = r));

export default async function createGeometry() {
  // garante que o loader já escolheu WASM ou JS
  await geometryReady;
  return { segmentsIntersect, _segments_intersect: segmentsIntersect };
}

(async () => {
  // Dentro do Jest usamos só o fallback JS.
  if (process.env.JEST_WORKER_ID !== undefined) {
    const js = await import("./geometry_js_fallback.js");
    impl = js.segmentsIntersect ?? js._segments_intersect ?? impl;
    return resolveReady();
  }
  try {
    const factory = (await import("../dist/geometry_wasm.js")).default;
    const mod = await factory();
    impl = mod.segmentsIntersect ?? mod._segments_intersect ?? impl;
  } catch {
    const js = await import("./geometry_js_fallback.js");
    impl = js.segmentsIntersect ?? js._segments_intersect ?? impl;
  } finally {
    resolveReady();
  }
})();

export function segmentsIntersect(...args) {
  return impl(...args);
}
export { segmentsIntersect as _segments_intersect };
