// dist/geometry_js_fallback.js
export default async function createGeometry() {
  return {
    // ambas assinaturas usadas nos testes
    _segments_intersect() {
      /* no-op */
    },
    segmentsIntersect() {
      /* no-op */
    },
  };
}
