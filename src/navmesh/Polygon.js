/**
 * @module Polygon
 * Representa um polígono no espaço 2D.
 */
export class Polygon {
  constructor(vertices, options = {}) {
    if (!Array.isArray(vertices) || vertices.length < 3) {
      throw new Error("Polygon requer ao menos 3 vértices.");
    }
    this.vertices = vertices;
    this._bboxCache = null;
    this._edgesCache = null;
    this._centerCache = null;

    this.layer = options.layer || "default";
    this.allowedLayers = options.allowedLayers || new Set([this.layer]);
    this.traversalCost = 1.0;
  }

  getBoundingBox() {
    if (this._bboxCache) return this._bboxCache;
    let xmin = Infinity,
      xmax = -Infinity;
    let ymin = Infinity,
      ymax = -Infinity;
    for (const { x, y } of this.vertices) {
      if (x < xmin) xmin = x;
      if (x > xmax) xmax = x;
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
    }
    this._bboxCache = { xmin, xmax, ymin, ymax };
    return this._bboxCache;
  }

  getEdges() {
    if (this._edgesCache) return this._edgesCache;
    this._edgesCache = [];
    const vs = this.vertices;
    for (let i = 0; i < vs.length; i++) {
      this._edgesCache.push({
        start: vs[i],
        end: vs[(i + 1) % vs.length],
      });
    }
    return this._edgesCache;
  }

  getCenter() {
    if (this._centerCache) return this._centerCache;
    let sx = 0,
      sy = 0;
    for (const { x, y } of this.vertices) {
      sx += x;
      sy += y;
    }
    const n = this.vertices.length;
    this._centerCache = { x: sx / n, y: sy / n };
    return this._centerCache;
  }

  // Novo método para retornar a largura do polígono
  getWidth() {
    const { xmin, xmax } = this.getBoundingBox();
    return xmax - xmin;
  }

  invalidateCache() {
    this._bboxCache = null;
    this._edgesCache = null;
    this._centerCache = null;
  }

  containsPoint(point) {
    let inside = false;
    for (
      let i = 0, j = this.vertices.length - 1;
      i < this.vertices.length;
      j = i++
    ) {
      const xi = this.vertices[i].x,
        yi = this.vertices[i].y;
      const xj = this.vertices[j].x,
        yj = this.vertices[j].y;
      const intersect =
        yi > point.y != yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  hasLayer(layer) {
    return this.layer === layer || this.allowedLayers.has(layer);
  }
}
