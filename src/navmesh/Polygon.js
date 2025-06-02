/**
 * @module Polygon
 * Representa um polígono 2D com funcionalidades de cálculo de bounding box,
 * arestas, centro, e verificação de contenção de ponto.
 */
export class Polygon {
  /**
   * Cria um polígono com os vértices fornecidos.
   * @param {Array<{x: number, y: number}>} vertices - Lista de vértices (mínimo 3).
   * @param {object} [options={}] - Opções de configuração.
   * @param {string} [options.layer="default"] - Camada do polígono.
   * @param {Set<string>} [options.allowedLayers] - Camadas permitidas para travessia.
   */
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

  /**
   * Calcula e retorna a bounding box do polígono.
   * @returns {{xmin: number, xmax: number, ymin: number, ymax: number}}
   */
  getBoundingBox() {
    if (this._bboxCache) return this._bboxCache;
    let xmin = Infinity,
      xmax = -Infinity;
    let ymin = Infinity,
      ymax = -Infinity;
    for (const { x, y } of this.vertices) {
      xmin = Math.min(xmin, x);
      xmax = Math.max(xmax, x);
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
    }
    this._bboxCache = { xmin, xmax, ymin, ymax };
    return this._bboxCache;
  }

  /**
   * Retorna as arestas do polígono como pares de pontos.
   * @returns {Array<{start: {x:number, y:number}, end: {x:number, y:number}}>}
   */
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

  /**
   * Calcula e retorna o centro geométrico do polígono.
   * @returns {{x:number, y:number}}
   */
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

  /**
   * Retorna a largura do polígono com base na bounding box.
   * @returns {number}
   */
  getWidth() {
    const { xmin, xmax } = this.getBoundingBox();
    return xmax - xmin;
  }

  /**
   * Invalida os caches de bounding box, arestas e centro,
   * para recalcular em caso de modificação dos vértices.
   */
  invalidateCache() {
    this._bboxCache = null;
    this._edgesCache = null;
    this._centerCache = null;
  }

  /**
   * Verifica se o ponto fornecido está dentro do polígono.
   * @param {{x:number, y:number}} point - Ponto a ser testado.
   * @returns {boolean}
   */
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
      const EPS = 1e-9; // tolerância
      const denom = yj - yi + EPS; // evita divisão por 0
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / denom + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Verifica se o polígono pertence ou permite a camada informada.
   * @param {string} layer - Nome da camada a verificar.
   * @returns {boolean}
   */
  hasLayer(layer) {
    return this.layer === layer || this.allowedLayers.has(layer);
  }
}
