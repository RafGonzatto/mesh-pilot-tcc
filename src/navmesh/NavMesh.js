import { EventEmitter } from "./EventEmitter.js";
import { Polygon } from "./Polygon.js";
import { DynamicObstacleManager } from "./DynamicObstacleManager.js";
import { Graph } from "../pathfinding/Graph.js";
import { AgentManager } from "../pathfinding/AgentManager.js";
import { LayerSystem } from "./LayerSystem.js";
import { Pathfinder } from "../pathfinding/Pathfinder.js";
import { geometryReady } from "../geometryLoader.js";

/**
 * @module NavMesh
 * Gerencia a malha de navegação (NavMesh) e suas operações,
 * como a adição de polígonos, construção de grafos de adjacência
 * e verificação de obstáculos dinâmicos.
 */
export class NavMesh extends EventEmitter {
  /**
   * Cria uma instância da NavMesh.
   * @param {boolean} [enableLogs=false] - Habilita logs para debug.
   */
  constructor(enableLogs = false) {
    super();
    this._polygons = [];
    this._graph = null;
    this.enableLogs = enableLogs;
    this.layerSystem = new LayerSystem(this);

    // Gerenciadores auxiliares
    this.enableDynamicObstacles();
    this._agentManager = new AgentManager(this);
  }

  // =========================================================
  // API pública
  // =========================================================

  /** Adiciona um polígono à NavMesh. */
  addPolygon(poly) {
    try {
      if (!(poly instanceof Polygon))
        throw new Error("NavMesh.addPolygon espera um Polygon válido.");
      if (!this.layerSystem.registeredLayers.has(poly.layer))
        throw new Error(`Camada ${poly.layer} não registrada`);
      this.polygons.push(poly);
      if (this.enableLogs) console.log("[NavMesh] Polygon adicionado.");
      this.emit("polygonadded", { polygon: poly, count: this.polygons.length });
    } catch (error) {
      this.emit("error", { operation: "addPolygon", error });
    }
  }

  /** Constrói o grafo de adjacência simples. */
  buildGraph() {
    try {
      if (this.enableLogs)
        console.log("[NavMesh] buildGraph() – sem obstáculos.");
      const nodes = this.polygons.map((poly, i) => ({ id: i, polygon: poly }));
      const edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (this._saoAdjacentes(this.polygons[i], this.polygons[j])) {
            const peso = this._calcDistCenter(
              this.polygons[i],
              this.polygons[j]
            );
            edges.push([i, j, peso]);
          }
        }
      }
      this._graph = new Graph(nodes, edges);
      if (this.enableLogs)
        console.log(
          `[NavMesh] buildGraph() -> ${edges.length} arestas criadas.`
        );
      this.emit("graphbuilt", {
        nodes: this.graph.nodes.length,
        edges: this.graph.adjList.size,
      });
    } catch (error) {
      this.emit("error", { operation: "buildGraph", error });
    }
  }

  /** Constrói o grafo considerando obstáculos. */
  buildGraphConsideringObstacles(obstacles = []) {
    if (this.enableLogs)
      console.log(
        "[NavMesh] buildGraphConsideringObstacles() – verificando interseções com obstáculos."
      );
    const nodes = this.polygons.map((poly, i) => ({ id: i, polygon: poly }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (!this._saoAdjacentes(this.polygons[i], this.polygons[j])) continue;
        const centerA = this.polygons[i].getCenter();
        const centerB = this.polygons[j].getCenter();
        if (!this._bloqueadoPorObstaculo(centerA, centerB, obstacles)) {
          const peso = this._calcDistCenter(this.polygons[i], this.polygons[j]);
          edges.push([i, j, peso]);
        } else if (this.enableLogs) {
          console.log(`[NavMesh] Aresta ${i}→${j} BLOQUEADA por obstáculo.`);
        }
      }
    }
    this._graph = new Graph(nodes, edges);
    if (this.enableLogs)
      console.log(
        `[NavMesh] buildGraphConsideringObstacles() -> ${edges.length} arestas válidas.`
      );
  }

  /** Localiza qual polígono contém o ponto. */
  locatePolygon(pt) {
    for (let i = 0; i < this.polygons.length; i++) {
      if (this.polygons[i].containsPoint(pt)) return i;
    }
    return null;
  }

  /** Encontra o caminho de start → end usando o Pathfinder. */
  findPath(start, end) {
    const sId = this.locatePolygon(start);
    const eId = this.locatePolygon(end);
    if (sId === null || eId === null)
      return { complete: false, reason: "point_outside_navmesh" };
    if (sId === eId) return { complete: true, path: [start, end] };
    return Pathfinder.findPath({ graph: this.graph, start: sId, end: eId });
  }

  // =========================================================
  // Métodos internos de geometria
  // =========================================================

  _saoAdjacentes(pA, pB) {
    const boxA = pA.getBoundingBox();
    const boxB = pB.getBoundingBox();
    if (!this._bboxOverlap(boxA, boxB)) return false;
    const edgesA = pA.getEdges();
    const edgesB = pB.getEdges();
    for (const ea of edgesA) {
      for (const eb of edgesB) {
        if (this._segmentsIntersect(ea.start, ea.end, eb.start, eb.end))
          return true;
      }
    }
    return false;
  }

  _bboxOverlap(a, b) {
    return !(
      a.xmax < b.xmin ||
      b.xmax < a.xmin ||
      a.ymax < b.ymin ||
      b.ymax < a.ymin
    );
  }

  _segmentsIntersect(p1, p2, p3, p4) {
    return this._g
      ? this._g.segmentsIntersect(
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          p3.x,
          p3.y,
          p4.x,
          p4.y
        )
      : (({ x: a, y: b }, { x: c, y: d }, { x: e, y: f }, { x: g, y: h }) => {
          const dir = (x1, y1, x2, y2, x3, y3) =>
            (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
          const on = (x1, y1, x2, y2, x3, y3) =>
            x3 >= Math.min(x1, x2) &&
            x3 <= Math.max(x1, x2) &&
            y3 >= Math.min(y1, y2) &&
            y3 <= Math.max(y1, y2);
          const EPS = 1e-9,
            d1 = dir(e, f, g, h, a, b),
            d2 = dir(e, f, g, h, c, d),
            d3 = dir(a, b, c, d, e, f),
            d4 = dir(a, b, c, d, g, h);
          if (
            ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
            ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
          )
            return true;
          if (Math.abs(d1) < EPS && on(e, f, g, h, a, b)) return true;
          if (Math.abs(d2) < EPS && on(e, f, g, h, c, d)) return true;
          if (Math.abs(d3) < EPS && on(a, b, c, d, e, f)) return true;
          if (Math.abs(d4) < EPS && on(a, b, c, d, g, h)) return true;
          return false;
        })(p1, p2, p3, p4);
  }

  _calcDistCenter(a, b) {
    const ca = a.getCenter();
    const cb = b.getCenter();
    const dx = cb.x - ca.x;
    const dy = cb.y - ca.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _bloqueadoPorObstaculo(A, B, obstacles) {
    for (const obs of obstacles) {
      if (this._lineIntersectsPolygon(A, B, obs)) {
        return true;
      }
    }
    return false;
  }

  _lineIntersectsPolygon(p1, p2, poly) {
    for (const e of poly.getEdges()) {
      if (this._segmentsIntersect(p1, p2, e.start, e.end)) {
        return true;
      }
    }
    if (poly.containsPoint(p1) || poly.containsPoint(p2)) {
      return true;
    }
    return false;
  }

  // =========================================================
  // Gerenciadores e utilidades
  // =========================================================

  enableDynamicObstacles(options) {
    this._dynamicObstacleManager = new DynamicObstacleManager(this, options);
    return this._dynamicObstacleManager;
  }

  getActiveGraph() {
    return this._graph;
  }

  cloneGraph() {
    return new Graph(
      this._graph.nodes.map((n) => ({ ...n })),
      Array.from(this.graph.adjList.entries())
    );
  }

  /**
   * Cria ou retorna gerenciador de agentes.
   */
  createAgentManager() {
    return this._agentManager;
  }

  // Getters
  get graph() {
    return this._graph;
  }

  get polygons() {
    return this._polygons;
  }

  get dynamicObstacleManager() {
    return this._dynamicObstacleManager;
  }

  get agentManager() {
    return this._agentManager;
  }
}
