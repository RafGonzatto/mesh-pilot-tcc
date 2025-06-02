import { EventEmitter } from "./EventEmitter.js";
import { Polygon } from "./Polygon.js";
import { DynamicObstacleManager } from "./DynamicObstacleManager.js";
import { Graph } from "../pathfinding/Graph.js";
import { AgentManager } from "../pathfinding/AgentManager.js";
import { LayerSystem } from "./LayerSystem.js";
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
    this._polygons = []; // Lista interna de polígonos
    this._graph = null; // Grafo de adjacências entre polígonos
    this.enableLogs = enableLogs;
    this.layerSystem = new LayerSystem(this);
    // Inicializa o gerenciador de obstáculos dinâmicos
    this.enableDynamicObstacles();
    // Cria o gerenciador de agentes
    this._agentManager = new AgentManager(this);
  }

  /**
   * Adiciona um polígono à NavMesh, validando a camada.
   * @param {Polygon} poly - Instância de Polygon a ser adicionada.
   */
  addPolygon(poly) {
    try {
      if (!(poly instanceof Polygon)) {
        throw new Error("NavMesh.addPolygon espera um Polygon válido.");
      }
      if (!this.layerSystem.registeredLayers.has(poly.layer)) {
        throw new Error(`Camada ${poly.layer} não registrada`);
      }
      this.polygons.push(poly);
      if (this.enableLogs) console.log("[NavMesh] Polygon adicionado.");
      this.emit("polygonadded", { polygon: poly, count: this.polygons.length });
    } catch (error) {
      this.emit("error", { operation: "addPolygon", error });
    }
  }

  /**
   * Constrói o grafo básico considerando adjacências entre polígonos,
   * sem levar em conta obstáculos.
   */
  buildGraph() {
    try {
      if (this.enableLogs)
        console.log("[NavMesh] buildGraph() – sem obstáculos.");
      const nodes = this.polygons.map((poly, i) => ({ id: i, polygon: poly }));
      const edges = [];
      // Percorre os nós para verificar adjacências
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

  /**
   * Constrói o grafo levando em conta obstáculos,
   * removendo arestas que estão bloqueadas.
   * @param {Polygon[]} [obstacles=[]] - Lista de obstáculos a considerar.
   */
  buildGraphConsideringObstacles(obstacles = []) {
    if (this.enableLogs) {
      console.log(
        "[NavMesh] buildGraphConsideringObstacles() – verificando interseções com obstáculos."
      );
    }
    const nodes = this.polygons.map((poly, i) => ({ id: i, polygon: poly }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // 1) Verifica se os polígonos são adjacentes
        if (!this._saoAdjacentes(this.polygons[i], this.polygons[j])) continue;
        // 2) Verifica se a linha entre os centros não cruza obstáculos
        const centerA = this.polygons[i].getCenter();
        const centerB = this.polygons[j].getCenter();
        if (!this._bloqueadoPorObstaculo(centerA, centerB, obstacles)) {
          const peso = this._calcDistCenter(this.polygons[i], this.polygons[j]);
          edges.push([i, j, peso]);
        } else {
          if (this.enableLogs) {
            console.log(`[NavMesh] Aresta ${i}→${j} BLOQUEADA por obstáculo.`);
          }
        }
      }
    }
    this._graph = new Graph(nodes, edges);
    if (this.enableLogs)
      console.log(
        `[NavMesh] buildGraphConsideringObstacles() -> ${edges.length} arestas válidas.`
      );
  }

  // =========================
  // Métodos de verificação interna
  // =========================

  /**
   * Verifica se dois polígonos são adjacentes.
   * Usa sobreposição de bounding box e interseção de arestas.
   * @private
   * @param {Polygon} pA
   * @param {Polygon} pB
   * @returns {boolean} True se forem adjacentes.
   */
  _saoAdjacentes(pA, pB) {
    const boxA = pA.getBoundingBox();
    const boxB = pB.getBoundingBox();
    if (!this._bboxOverlap(boxA, boxB)) return false;

    const edgesA = pA.getEdges();
    const edgesB = pB.getEdges();
    for (const ea of edgesA) {
      for (const eb of edgesB) {
        if (this._segmentsIntersect(ea.start, ea.end, eb.start, eb.end)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Verifica se duas bounding boxes se sobrepõem.
   * @private
   * @param {{xmin:number, xmax:number, ymin:number, ymax:number}} a
   * @param {{xmin:number, xmax:number, ymin:number, ymax:number}} b
   * @returns {boolean}
   */
  _bboxOverlap(a, b) {
    if (a.xmax < b.xmin) return false;
    if (b.xmax < a.xmin) return false;
    if (a.ymax < b.ymin) return false;
    if (b.ymax < a.ymin) return false;
    return true;
  }

  /**
   * Checa se dois segmentos se intersectam.
   * @private
   * @param {{x:number, y:number}} p1
   * @param {{x:number, y:number}} p2
   * @param {{x:number, y:number}} p3
   * @param {{x:number, y:number}} p4
   * @returns {boolean}
   */
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
      : // fallback JS:
        (({ x: a, y: b }, { x: c, y: d }, { x: e, y: f }, { x: g, y: h }) => {
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

  /**
   * Calcula a direção do ponto p3 relativo ao vetor p1→p2.
   * @private
   * @param {{x:number, y:number}} p1
   * @param {{x:number, y:number}} p2
   * @param {{x:number, y:number}} p3
   * @returns {number}
   */
  _direction(p1, p2, p3) {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  /**
   * Verifica se o ponto p3 está no segmento definido por p1 e p2.
   * @private
   * @param {{x:number, y:number}} p1
   * @param {{x:number, y:number}} p2
   * @param {{x:number, y:number}} p3
   * @returns {boolean}
   */
  _onSegment(p1, p2, p3) {
    const [minX, maxX] = [Math.min(p1.x, p2.x), Math.max(p1.x, p2.x)];
    const [minY, maxY] = [Math.min(p1.y, p2.y), Math.max(p1.y, p2.y)];
    return p3.x >= minX && p3.x <= maxX && p3.y >= minY && p3.y <= maxY;
  }

  /**
   * Calcula a distância entre os centros de dois polígonos.
   * @private
   * @param {Polygon} a
   * @param {Polygon} b
   * @returns {number} Distância Euclidiana.
   */
  _calcDistCenter(a, b) {
    const ca = a.getCenter();
    const cb = b.getCenter();
    const dx = cb.x - ca.x,
      dy = cb.y - ca.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Retorna true se a linha entre A e B interceptar algum obstáculo.
   * @private
   * @param {{x:number, y:number}} A
   * @param {{x:number, y:number}} B
   * @param {Polygon[]} obstacles
   * @returns {boolean}
   */
  _bloqueadoPorObstaculo(A, B, obstacles) {
    for (const obs of obstacles) {
      if (this._lineIntersectsPolygon(A, B, obs)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checa se a linha de p1 a p2 intercepta o polígono.
   * Verifica interseção com as arestas ou se um dos pontos está dentro.
   * @private
   * @param {{x:number, y:number}} p1
   * @param {{x:number, y:number}} p2
   * @param {Polygon} poly
   * @returns {boolean}
   */
  _lineIntersectsPolygon(p1, p2, poly) {
    const edges = poly.getEdges();
    for (const e of edges) {
      if (this._segmentsIntersect(p1, p2, e.start, e.end)) {
        return true;
      }
    }
    if (poly.containsPoint(p1) || poly.containsPoint(p2)) {
      return true;
    }
    return false;
  }

  /**
   * Inicializa e retorna o gerenciador de obstáculos dinâmicos.
   * @param {object} [options] - Opções para configuração.
   * @returns {DynamicObstacleManager}
   */
  enableDynamicObstacles(options) {
    this._dynamicObstacleManager = new DynamicObstacleManager(this, options);
    return this._dynamicObstacleManager;
  }

  /**
   * Retorna o grafo ativo.
   * @returns {Graph}
   */
  getActiveGraph() {
    return this._graph;
  }

  /**
   * Cria e retorna uma cópia do grafo atual.
   * @returns {Graph}
   */
  cloneGraph() {
    return new Graph(
      this._graph.nodes.map((n) => ({ ...n })),
      Array.from(this.graph.adjList.entries())
    );
  }

  // Getters para acesso às propriedades privadas
  get graph() {
    return this._graph;
  }

  get polygons() {
    return this._polygons;
  }

  get dynamicObstacleManager() {
    return this._dynamicObstacleManager;
  }

  /**
   * Retorna o gerenciador de agentes.
   * @returns {AgentManager}
   */
  createAgentManager() {
    return this._agentManager;
  }

  get agentManager() {
    return this._agentManager;
  }
}
