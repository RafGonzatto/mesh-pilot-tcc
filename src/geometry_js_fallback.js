// Interseção de dois segmentos AB e CD
export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const det = (p, q, r, s) => p * s - q * r;
  const d = det(bx - ax, by - ay, dx - cx, dy - cy);
  if (!d) return false; // paralelos
  const u = det(cx - ax, cy - ay, dx - cx, dy - cy) / d;
  const v = det(cx - ax, cy - ay, bx - ax, by - ay) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

// alias exigido pelo teste wasm-fallback
export { segmentsIntersect as _segments_intersect };
