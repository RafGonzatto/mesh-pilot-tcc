import { EventEmitter } from "../navmesh/EventEmitter.js";
//Pathfinder.js
/**
 * @module Pathfinder
 * Sistema avançado de pathfinding com múltiplos algoritmos e parametrização
 */
export class Pathfinder {
  static on(event, listener) {
    EventRegistry._instance.on(event, listener);
  }

  static off(event, listener) {
    EventRegistry._instance.off(event, listener);
  }
  static ALGORITHMS = {
    "A*": "A_STAR",
    DIJKSTRA: "DIJKSTRA",
    BFS: "BFS",
    DFS: "DFS",
  };

  /**
   * Encontra caminho entre pontos com diversas opções de configuração
   * @param {Object} config - Configurações do pathfinding
   * @param {Graph} config.graph - Grafo de navegação
   * @param {number|Object} config.start - ID do nó inicial ou coordenada {x,y}
   * @param {number|Object} config.end - ID do nó final ou coordenada {x,y}
   * @param {string} [config.method='A*'] - Algoritmo a ser usado
   * @param {Function} [config.heuristic] - Função heurística para A*
   * @param {Function} [config.costFunction] - Função de custo das arestas
   * @param {number} [config.maxIterations=10000] - Limite de iterações
   * @param {boolean} [config.smoothPath=false] - Suavizar caminho final
   * @param {number} [config.smoothingTolerance=0.25] - Tolerância para suavização
   * @param {boolean} [config.partialPath=true] - Retornar caminho parcial se não encontrar completo
   * @param {boolean} [config.allowDiagonal=true] - Movimento na diagonal
   * @param {Function} [config.validator] - Função de validação customizada
   * @returns {PathResult} - Resultado do caminho
   */
  static findPath(config) {
    try {
      config.graph.emit("pathrequested", {
        start: config.start,
        end: config.end,
      });
      const defaults = {
        method: "A*",
        heuristic: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
        costFunction: (edge) => edge.peso,
        maxIterations: 10000,
        smoothPath: false,
        smoothingTolerance: 0.25,
        partialPath: true,
        allowDiagonal: true,
        validator: () => true,
      };

      const cfg = { ...defaults, ...config };
      if (cfg.method === "A*") {
        cfg.method = "A_STAR";
      }

      const { startNode, endNode } = this._resolveNodes(cfg);
      cfg.startNode = startNode;
      cfg.endNode = endNode;

      let rawPath;
      switch (cfg.method.toUpperCase()) {
        case "A_STAR":
          rawPath = this._aStar(cfg, startNode, endNode);
          break;
        case "DIJKSTRA":
          rawPath = this._dijkstra(cfg, startNode, endNode);
          break;
        case "BFS":
          rawPath = this._bfs(cfg, startNode, endNode);
          break;
        case "DFS":
          rawPath = this._dfs(cfg, startNode, endNode);
          break;
        default:
          throw new Error(`Algoritmo desconhecido: ${cfg.method}`);
      }

      if (config.agentProfile) {
        config.costFunction = this._createAgentCostFunction(
          config.agentProfile
        );
      }
      // Aplica filtros de camada
      if (config.layerContext) {
        config.validator = this._createLayerValidator(config.layerContext);
      }

      // Calcula custo considerando camadas
      config.costFunction =
        config.costFunction ||
        ((edge) =>
          this.navMesh.layerSystem.calculateEdgeCost(edge, config.context));

      if (rawPath.length > 0) {
        config.graph.emit("pathfound", rawPath);
      } else {
        config.graph.emit("pathblocked", {
          start: config.start,
          end: config.end,
        });
      }

      return this._postProcessPath(rawPath, cfg);
    } catch (error) {
      config.graph.emit("error", {
        operation: "findPath",
        error,
        config,
      });
      throw error;
    }
  }

  static _createLayerValidator(context) {
    return (edge, node) => {
      const layerConfig = this.navMesh.layerSystem.layerFilters.get(
        node.polygon.layer
      );
      return this.navMesh.layerSystem._evaluateFilters(
        layerConfig,
        node,
        context
      );
    };
  }

  static _createAgentCostFunction(profile) {
    return (edge) => {
      const baseCost = edge.peso;
      const layerCost =
        edge.polygon.traversalCost *
          profile.layerMultipliers.get(edge.polygon.layer) || 1;
      return baseCost * layerCost;
    };
  }

  static _validateConfig(cfg) {
    if (!cfg.graph) throw new Error("Grafo não fornecido");
    if (cfg.maxIterations <= 0) throw new Error("Número de iterações inválido");
  }

  static _resolveNodes(cfg) {
    const resolveNode = (target) => {
      if (typeof target === "number") return cfg.graph.getNode(target);
      return this._findNearestNode(cfg.graph, target);
    };

    const startNode = resolveNode(cfg.start);
    const endNode = resolveNode(cfg.end);

    if (!startNode || !endNode) {
      throw new Error("Nó inicial/final não encontrado");
    }

    return { startNode, endNode };
  }

  static _findNearestNode(graph, point) {
    let minDist = Infinity;
    let nearest = null;

    for (const node of graph.nodes) {
      const center = node.polygon.getCenter();
      const dist = Math.hypot(center.x - point.x, center.y - point.y);

      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }

  static _aStar(cfg, startNode, endNode) {
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    let iterations = 0;
    let currentId; // Declarado fora do loop

    gScore.set(startNode.id, 0);
    fScore.set(
      startNode.id,
      cfg.heuristic(startNode.polygon.getCenter(), endNode.polygon.getCenter())
    );
    openSet.enqueue(startNode.id, fScore.get(startNode.id));

    while (!openSet.isEmpty() && iterations++ < cfg.maxIterations) {
      currentId = openSet.dequeue();
      const currentNode = cfg.graph.getNode(currentId);

      if (currentId === endNode.id) {
        return this._reconstructPath(cameFrom, endNode.id);
      }

      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!cfg.validator(edge, currentNode)) continue;

        const neighbor = cfg.graph.getNode(edge.nodeId);
        const tentativeGScore = gScore.get(currentId) + cfg.costFunction(edge);
        const currentGScore = gScore.get(neighbor.id) ?? Infinity;

        if (tentativeGScore < currentGScore) {
          cameFrom.set(neighbor.id, currentId);
          gScore.set(neighbor.id, tentativeGScore);
          fScore.set(
            neighbor.id,
            tentativeGScore +
              cfg.heuristic(
                neighbor.polygon.getCenter(),
                endNode.polygon.getCenter()
              )
          );

          if (!openSet.contains(neighbor.id)) {
            openSet.enqueue(neighbor.id, fScore.get(neighbor.id));
          }
        }
      }
    }

    return cfg.partialPath ? this._reconstructPath(cameFrom, currentId) : [];
  }

  static _dijkstra(cfg, startNode, endNode) {
    const distances = new Map();
    const prev = new Map();
    const queue = new PriorityQueue();
    let iterations = 0;

    cfg.graph.nodes.forEach((node) => {
      distances.set(node.id, Infinity);
      prev.set(node.id, null);
    });

    distances.set(startNode.id, 0);
    queue.enqueue(startNode.id, 0);

    while (!queue.isEmpty() && iterations++ < cfg.maxIterations) {
      const currentId = queue.dequeue();
      const currentNode = cfg.graph.getNode(currentId);

      if (currentId === endNode.id) break;

      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!cfg.validator(edge, currentNode)) continue;

        const alt = distances.get(currentId) + cfg.costFunction(edge);
        if (alt < distances.get(edge.nodeId)) {
          distances.set(edge.nodeId, alt);
          prev.set(edge.nodeId, currentId);
          queue.enqueue(edge.nodeId, alt);
        }
      }
    }

    return this._reconstructPath(prev, endNode.id);
  }

  static _bfs(cfg, startNode, endNode) {
    const queue = [startNode.id];
    const visited = new Set([startNode.id]);
    const cameFrom = new Map();
    let iterations = 0;

    while (queue.length > 0 && iterations++ < cfg.maxIterations) {
      const currentId = queue.shift();
      if (currentId === endNode.id) {
        return this._reconstructPath(cameFrom, endNode.id);
      }

      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (
          !visited.has(edge.nodeId) &&
          cfg.validator(edge, cfg.graph.getNode(currentId))
        ) {
          visited.add(edge.nodeId);
          cameFrom.set(edge.nodeId, currentId);
          queue.push(edge.nodeId);
        }
      }
    }

    return cfg.partialPath ? this._reconstructPath(cameFrom, currentId) : [];
  }

  static _reconstructPath(cameFrom, endId) {
    const path = [];
    let current = endId;

    while (current !== undefined) {
      path.unshift(current);
      current = cameFrom.get(current);
    }

    return path.length > 0 ? path : [];
  }

  static _postProcessPath(rawPath, cfg) {
    const pathNodes = rawPath.map((id) => cfg.graph.getNode(id));

    const result = {
      path: rawPath,
      points: pathNodes.map((n) => n.polygon.getCenter()),
      distance: 0,
      complete:
        rawPath.length > 0 && rawPath[rawPath.length - 1] === cfg.endNode.id,
      iterations: 0,
      error: null,
    };

    if (cfg.smoothPath) {
      result.points = this._smoothPath(result.points, cfg);
    }

    result.distance = this._calculatePathDistance(result.points);
    return result;
  }

  static _smoothPath(points, cfg) {
    if (points.length < 3) return points;

    const smoothed = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const next = points[i + 1];

      if (!this._lineOfSight(prev, next, cfg)) {
        smoothed.push(points[i]);
      }
    }
    smoothed.push(points[points.length - 1]);

    return smoothed;
  }

  static _lineOfSight(a, b, cfg) {
    // Implementação de raycasting para verificar visibilidade direta
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 0; i <= steps; i++) {
      const x = a.x + stepX * i;
      const y = a.y + stepY * i;
      if (!cfg.validator({ x, y })) return false;
    }

    return true;
  }

  static _calculatePathDistance(points) {
    return points.reduce((acc, point, index) => {
      if (index === 0) return acc;
      const prev = points[index - 1];
      return acc + Math.hypot(point.x - prev.x, point.y - prev.y);
    }, 0);
  }
}

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift().element;
  }

  isEmpty() {
    return this.elements.length === 0;
  }

  contains(element) {
    return this.elements.some((e) => e.element === element);
  }
}

/**
 * @typedef {Object} PathResult
 * @property {number[]} path - IDs dos nós no caminho
 * @property {Array<{x: number, y: number}>} points - Pontos do caminho suavizado
 * @property {number} distance - Distância total do caminho
 * @property {boolean} complete - Se o caminho chega ao destino final
 * @property {string|null} error - Mensagem de erro se houver
 */
export class NavigationEvents {
  static registerGlobalListener(context, listener) {
    const wrappedListener = (event) => {
      const enhancedEvent = {
        ...event,
        timestamp: Date.now(),
        context,
      };
      listener(enhancedEvent);
    };

    EventRegistry.addGlobalListener(wrappedListener);
    return wrappedListener;
  }

  static createEventProxy(target) {
    return new Proxy(target, {
      get(obj, prop) {
        if (prop === "on") return obj.on.bind(obj);
        if (prop === "off") return obj.off.bind(obj);
        return obj[prop];
      },
    });
  }
}

class EventRegistry {
  static _instance = new EventEmitter();

  static addGlobalListener(listener) {
    this._instance.addGlobalListener(listener);
  }

  static removeGlobalListener(listener) {
    this._instance.removeGlobalListener(listener);
  }
}
