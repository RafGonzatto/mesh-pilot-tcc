import { EventEmitter } from "./EventEmitter.js";

/**
 * @module DynamicObstacleManager
 * Gerencia obstáculos dinâmicos e atualiza o grafo de navegação
 * quando obstáculos são adicionados, removidos ou atualizados.
 */
export class DynamicObstacleManager extends EventEmitter {
  /**
   * Cria uma instância do DynamicObstacleManager.
   * @param {NavMesh} navMesh - Instância da NavMesh associada.
   * @param {Object} [options={}] - Opções de configuração.
   * @param {number} [options.cellSize=100] - Tamanho das células para indexação espacial.
   * @param {boolean} [options.autoUpdate=true] - Atualiza automaticamente o grafo após mudanças.
   * @param {string} [options.obstacleLayer="dynamic"] - Camada utilizada para obstáculos dinâmicos.
   */
  constructor(navMesh, options = {}) {
    super();
    this.navMesh = navMesh;
    this.options = {
      cellSize: 100,
      autoUpdate: true,
      obstacleLayer: "dynamic",
      ...options,
    };
    this.obstacles = new Map();
    this.spatialGrid = new SpatialGrid(this.options.cellSize);
    this.blockedEdges = new Set();
    this.edgeObstacleMap = new Map();
    this.init();
  }

  /**
   * Inicializa o gerenciador, construindo o índice espacial.
   */
  init() {
    this._buildSpatialIndex();
  }

  /**
   * Constrói o índice espacial para as arestas do grafo.
   * Caso o grafo ainda não esteja disponível, aguarda seu evento de construção.
   * @private
   */
  _buildSpatialIndex() {
    if (!this.navMesh.graph) {
      const handler = () => {
        this.navMesh.off("graphbuilt", handler);
        this._buildSpatialIndex();
      };
      this.navMesh.on("graphbuilt", handler);
      return;
    }
    this.navMesh.graph.nodes.forEach((node) => {
      node.polygon.getEdges().forEach((edge) => {
        this.spatialGrid.insertEdge(edge, node.id);
      });
    });
  }

  /**
   * Adiciona um obstáculo dinâmico e atualiza o grafo de navegação.
   * @param {Polygon} obstacle - Polígono representando o obstáculo.
   * @returns {string} ID único do obstáculo.
   */
  addObstacle(obstacle) {
    try {
      const id = crypto.randomUUID();
      this.obstacles.set(id, obstacle);

      const blocked = this._findBlockedEdges(obstacle);
      this.blockedEdges = new Set([...this.blockedEdges, ...blocked]);

      blocked.forEach((edgeId) => {
        if (!this.edgeObstacleMap.has(edgeId)) {
          this.edgeObstacleMap.set(edgeId, new Set());
        }
        this.edgeObstacleMap.get(edgeId).add(id);
      });

      if (this.options.autoUpdate) {
        this._updateNavMeshGraph();
      }
      this.emit("obstacleadded", {
        id,
        obstacle,
        blockedEdges: Array.from(blocked),
      });
      this.navMesh.emit("graphupdated", { source: "obstacle", type: "add" });
      return id;
    } catch (error) {
      this.emit("error", { operation: "addObstacle", error });
    }
  }

  /**
   * Remove um obstáculo dinâmico e libera as arestas bloqueadas.
   * @param {string} obstacleId - ID do obstáculo a ser removido.
   */
  removeObstacle(obstacleId) {
    try {
      if (!this.obstacles.has(obstacleId)) return;

      const toUnblock = [];
      this.edgeObstacleMap.forEach((obstacles, edgeId) => {
        if (obstacles.has(obstacleId)) {
          obstacles.delete(obstacleId);
          if (obstacles.size === 0) {
            toUnblock.push(edgeId);
            this.edgeObstacleMap.delete(edgeId);
          }
        }
      });

      this.obstacles.delete(obstacleId);
      toUnblock.forEach((edgeId) => this.blockedEdges.delete(edgeId));

      if (this.options.autoUpdate) {
        this._updateNavMeshGraph();
      }
      this.emit("obstacleremoved", {
        id: obstacleId,
        affectedEdges: toUnblock,
      });
      this.navMesh.emit("graphupdated", { source: "obstacle", type: "remove" });
    } catch (error) {
      this.emit("error", { operation: "removeObstacle", error });
    }
  }

  /**
   * Atualiza a posição ou forma de um obstáculo dinâmico.
   * @param {string} obstacleId - ID do obstáculo a ser atualizado.
   * @param {Polygon} newObstacle - Nova representação do obstáculo.
   */
  updateObstacle(obstacleId, newObstacle) {
    this.removeObstacle(obstacleId);
    this.addObstacle(newObstacle);
  }

  /**
   * Identifica as arestas do grafo bloqueadas por um obstáculo.
   * @private
   * @param {Polygon} obstacle - Obstáculo a verificar.
   * @returns {Set<string>} Conjunto de IDs de arestas bloqueadas.
   */
  _findBlockedEdges(obstacle) {
    const blockedEdges = new Set();
    const obsBBox = obstacle.getBoundingBox();

    // Consulta as arestas no grid espacial que se sobrepõem à bounding box do obstáculo.
    const nearbyEdges = this.spatialGrid.query(obsBBox);

    nearbyEdges.forEach(({ edge, nodeId }) => {
      const polygon = this.navMesh.graph.getNode(nodeId).polygon;
      if (this._edgeIntersectsObstacle(polygon, edge, obstacle)) {
        blockedEdges.add(this._getEdgeId(edge, nodeId));
      }
    });

    return blockedEdges;
  }

  /**
   * Verifica se uma aresta intersecta um obstáculo.
   * @private
   * @param {Polygon} polygon - Polígono associado à aresta.
   * @param {Object} edge - Aresta a ser verificada.
   * @param {Polygon} obstacle - Obstáculo.
   * @returns {boolean} Verdadeiro se a aresta intersecta o obstáculo.
   */
  _edgeIntersectsObstacle(polygon, edge, obstacle) {
    return this.navMesh._lineIntersectsPolygon(edge.start, edge.end, obstacle);
  }

  /**
   * Gera um identificador único para uma aresta com base em seus pontos e no ID do nó.
   * @private
   * @param {Object} edge - Aresta com propriedades "start" e "end".
   * @param {number|string} nodeId - ID do nó associado à aresta.
   * @returns {string} Identificador da aresta.
   */
  _getEdgeId(edge, nodeId) {
    return `${nodeId}_${edge.start.x},${edge.start.y}_${edge.end.x},${edge.end.y}`;
  }

  /**
   * Atualiza o grafo da NavMesh removendo as arestas bloqueadas.
   * @private
   */
  _updateNavMeshGraph() {
    const updatedGraph = this.navMesh.graph.clone();

    this.blockedEdges.forEach((edgeId) => {
      // edgeId no formato: "nodeId_xStart,yStart_xEnd,yEnd"
      const [nodeId, ...points] = edgeId.split("_");
      const [start, end] = points.map((p) => {
        const [x, y] = p.split(",").map(Number);
        return { x, y };
      });

      // Remove as arestas bloqueadas do nó original
      updatedGraph.adjList.set(
        nodeId,
        updatedGraph.adjList.get(nodeId).filter((edge) => !this._edgesEqual(edge, start, end))
      );

      // Remove a aresta correspondente do nó vizinho
      const oldEdges = [...updatedGraph.adjList.get(nodeId)];
      const removedEdges = oldEdges.filter((ed) => this._edgesEqual(ed, start, end));
      for (let re of removedEdges) {
        const neighborId = re.nodeId.toString();
        updatedGraph.adjList.set(
          neighborId,
          updatedGraph.adjList.get(neighborId).filter((ed2) => ed2.nodeId !== Number(nodeId))
        );
      }
    });

    this.navMesh.graph = updatedGraph;
  }

  /**
   * Compara se duas arestas são equivalentes, comparando seus pontos.
   * @private
   * @param {Object} edge - Aresta do grafo.
   * @param {Object} start - Ponto de início para comparação.
   * @param {Object} end - Ponto de término para comparação.
   * @returns {boolean} Verdadeiro se as arestas forem iguais.
   */
  _edgesEqual(edge, start, end) {
    return (
      edge.start.x === start.x &&
      edge.start.y === start.y &&
      edge.end.x === end.x &&
      edge.end.y === end.y
    );
  }
}
/**
 * @module SpatialGrid
 * Estrutura de indexação espacial para consulta eficiente de arestas.
 * Divide o espaço em células para armazenar e consultar arestas com base na localização.
 */
class SpatialGrid {
  /**
   * Cria uma instância do SpatialGrid.
   * @param {number} [cellSize=100] - Tamanho das células do grid.
   */
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Insere uma aresta no grid, associando-a ao ID do nó.
   * @param {Object} edge - Aresta com propriedades "start" e "end".
   * @param {number|string} nodeId - ID do nó associado à aresta.
   */
  insertEdge(edge, nodeId) {
    const bbox = this._getEdgeBBox(edge);
    const cells = this._getCellsForBBox(bbox);

    cells.forEach((cell) => {
      const key = this._cellKey(cell);
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key).add({ edge, nodeId });
    });
  }

  /**
   * Consulta as arestas que se encontram em células que sobrepõem a bounding box informada.
   * @param {{xmin: number, xmax: number, ymin: number, ymax: number}} bbox - Bounding box para consulta.
   * @returns {Array<Object>} Array de objetos contendo a aresta e o ID do nó.
   */
  query(bbox) {
    const cells = this._getCellsForBBox(bbox);
    const results = new Set();

    cells.forEach((cell) => {
      const key = this._cellKey(cell);
      if (this.grid.has(key)) {
        this.grid.get(key).forEach((entry) => results.add(entry));
      }
    });

    return Array.from(results);
  }

  /**
   * Calcula a bounding box de uma aresta.
   * @private
   * @param {Object} edge - Aresta com propriedades "start" e "end".
   * @returns {{xmin: number, xmax: number, ymin: number, ymax: number}}
   */
  _getEdgeBBox(edge) {
    return {
      xmin: Math.min(edge.start.x, edge.end.x),
      xmax: Math.max(edge.start.x, edge.end.x),
      ymin: Math.min(edge.start.y, edge.end.y),
      ymax: Math.max(edge.start.y, edge.end.y),
    };
  }

  /**
   * Determina as células do grid que uma bounding box cobre.
   * @private
   * @param {{xmin: number, xmax: number, ymin: number, ymax: number}} bbox - Bounding box.
   * @returns {Array<Object>} Array de células com propriedades {x, y}.
   */
  _getCellsForBBox(bbox) {
    const cells = [];
    const minXCell = Math.floor(bbox.xmin / this.cellSize);
    const maxXCell = Math.floor(bbox.xmax / this.cellSize);
    const minYCell = Math.floor(bbox.ymin / this.cellSize);
    const maxYCell = Math.floor(bbox.ymax / this.cellSize);

    for (let x = minXCell; x <= maxXCell; x++) {
      for (let y = minYCell; y <= maxYCell; y++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }

  /**
   * Gera uma chave única para uma célula do grid.
   * @private
   * @param {Object} cell - Objeto com propriedades "x" e "y".
   * @returns {string} Chave da célula.
   */
  _cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }
}
