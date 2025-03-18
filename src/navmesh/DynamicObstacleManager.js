import { EventEmitter } from "./EventEmitter.js";

//DynamicObstacleManager.js
/**
 * @module DynamicObstacleManager
 * Gerencia obstáculos dinâmicos e atualiza o grafo de navegação
 */
export class DynamicObstacleManager extends EventEmitter {
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

  init() {
    this._buildSpatialIndex();
  }

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
   * Adiciona obstáculo dinâmico e atualiza o grafo
   * @param {Polygon} obstacle
   * @returns {string} Obstacle ID
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
   * Remove obstáculo e libera arestas bloqueadas
   * @param {string} obstacleId
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
   * Atualiza posição de obstáculo dinâmico
   * @param {string} obstacleId
   * @param {Polygon} newObstacle
   */
  updateObstacle(obstacleId, newObstacle) {
    this.removeObstacle(obstacleId);
    this.addObstacle(newObstacle);
  }

  _findBlockedEdges(obstacle) {
    const blockedEdges = new Set();
    const obsBBox = obstacle.getBoundingBox();

    // Query edges in spatial grid
    const nearbyEdges = this.spatialGrid.query(obsBBox);

    nearbyEdges.forEach(({ edge, nodeId }) => {
      const polygon = this.navMesh.graph.getNode(nodeId).polygon;
      if (this._edgeIntersectsObstacle(polygon, edge, obstacle)) {
        blockedEdges.add(this._getEdgeId(edge, nodeId));
      }
    });

    return blockedEdges;
  }

  _edgeIntersectsObstacle(polygon, edge, obstacle) {
    // Check edge-obstacle intersection
    return this.navMesh._lineIntersectsPolygon(edge.start, edge.end, obstacle);
  }

  _getEdgeId(edge, nodeId) {
    return `${nodeId}_${edge.start.x},${edge.start.y}_${edge.end.x},${edge.end.y}`;
  }

  _updateNavMeshGraph() {
    const updatedGraph = this.navMesh.graph.clone();

    this.blockedEdges.forEach((edgeId) => {
      const [nodeId, ...points] = edgeId.split("_");
      const [start, end] = points.map((p) => {
        const [x, y] = p.split(",").map(Number);
        return { x, y };
      });

      updatedGraph.adjList.set(
        nodeId,
        updatedGraph.adjList
          .get(nodeId)
          .filter((edge) => !this._edgesEqual(edge, start, end))
      );
    });

    this.navMesh.graph = updatedGraph;
  }

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
 * Indexação espacial para consulta eficiente de arestas
 */
class SpatialGrid {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

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

  _getEdgeBBox(edge) {
    return {
      xmin: Math.min(edge.start.x, edge.end.x),
      xmax: Math.max(edge.start.x, edge.end.x),
      ymin: Math.min(edge.start.y, edge.end.y),
      ymax: Math.max(edge.start.y, edge.end.y),
    };
  }

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

  _cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }
}
