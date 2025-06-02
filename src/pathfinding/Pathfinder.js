import { EventEmitter } from "../navmesh/EventEmitter.js";

/**
 * @module Pathfinder
 * Sistema avançado de pathfinding com múltiplos algoritmos e parametrização.
 */
export class Pathfinder {
  /**
   * Inscreve um listener para eventos globais do Pathfinder.
   * @param {string} event - Nome do evento.
   * @param {Function} listener - Callback a ser executada.
   */
  static on(event, listener) {
    EventRegistry._instance.on(event, listener);
  }

  /**
   * Remove um listener de um evento global.
   * @param {string} event - Nome do evento.
   * @param {Function} listener - Callback a ser removida.
   */
  static off(event, listener) {
    EventRegistry._instance.off(event, listener);
  }

  /**
   * Algoritmos suportados.
   */
  static ALGORITHMS = {
    "A*": "A_STAR",
    DIJKSTRA: "DIJKSTRA",
    BFS: "BFS",
    DFS: "DFS",
  };

  /**
   * Encontra o caminho entre dois pontos.
   * Emite eventos "pathrequested", "pathfound" ou "pathblocked" no grafo.
   *
   * @param {Object} config - Configurações do pathfinding.
   * @param {Graph} config.graph - Grafo de navegação.
   * @param {number|Object} config.start - Nó inicial ou coordenada {x, y}.
   * @param {number|Object} config.end - Nó final ou coordenada {x, y}.
   * @param {string} [config.method='A*'] - Algoritmo a ser utilizado.
   * @param {Function} [config.heuristic] - Função heurística (para A*).
   * @param {Function} [config.costFunction] - Função de custo (para A* e Dijkstra).
   * @param {number} [config.maxIterations=10000] - Máximo de iterações.
   * @param {boolean} [config.smoothPath=false] - Indica se o caminho deve ser suavizado.
   * @param {number} [config.smoothingTolerance=0.25] - Tolerância para suavização.
   * @param {boolean} [config.partialPath=true] - Permite retornar caminho parcial.
   * @param {boolean} [config.allowDiagonal=true] - Permite movimentos diagonais.
   * @param {Function} [config.validator] - Função para validar cada aresta.
   * @returns {Object} Resultado com {path, points, distance, complete, error}.
   */
  static findPath(config) {
    // Emite evento de requisição de caminho
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
      detailed: false,
    };
    const cfg = { ...defaults, ...config };

    // Normaliza o método
    if (cfg.method === "A*") {
      cfg.method = "A_STAR";
    }

    // Resolve nós (ou o mais próximo se start/end forem coordenadas)
    const { startNode, endNode } = this._resolveNodes(cfg);
    cfg.startNode = startNode;
    cfg.endNode = endNode;

    // Executa o algoritmo selecionado
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

    // Emite eventos conforme o resultado
    if (rawPath.length > 0) {
      cfg.graph.emit("pathfound", rawPath);
    } else {
      cfg.graph.emit("pathblocked", { start: cfg.start, end: cfg.end });
    }

    const result = this._postProcessPath(rawPath, cfg);
    return cfg.detailed ? result : result.path;
  }

  // ------------- Algoritmo A* -------------
  static _aStar(cfg, startNode, endNode) {
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    let iterations = 0;
    let currentId;

    gScore.set(startNode.id, 0);
    fScore.set(
      startNode.id,
      cfg.heuristic(startNode.polygon.getCenter(), endNode.polygon.getCenter())
    );
    openSet.enqueue(startNode.id, fScore.get(startNode.id));

    while (!openSet.isEmpty() && iterations++ < cfg.maxIterations) {
      currentId = openSet.dequeue();
      if (currentId === endNode.id) {
        return this._reconstructPath(cameFrom, endNode.id);
      }
      const currentNode = cfg.graph.getNode(currentId);
      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!cfg.validator(edge, currentNode)) continue;

        const tentativeG =
          (gScore.get(currentId) || 0) + cfg.costFunction(edge);
        const neighborId = edge.nodeId;
        const neighborNode = cfg.graph.getNode(neighborId);
        if (!neighborNode) continue;

        const currentG = gScore.get(neighborId) ?? Infinity;
        if (tentativeG < currentG) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const h = cfg.heuristic(
            neighborNode.polygon.getCenter(),
            endNode.polygon.getCenter()
          );
          const f = tentativeG + h;
          fScore.set(neighborId, f);
          if (!openSet.contains(neighborId)) {
            openSet.enqueue(neighborId, f);
          }
        }
      }
    }
    return cfg.partialPath ? this._reconstructPath(cameFrom, currentId) : [];
  }

  // ------------- Algoritmo DFS -------------
  static _dfs(cfg, startNode, endNode) {
    const stack = [startNode.id];
    const visited = new Set([startNode.id]);
    const cameFrom = new Map();
    let iterations = 0;
    let currentId = startNode.id;

    while (stack.length > 0 && iterations++ < cfg.maxIterations) {
      currentId = stack.pop();
      if (currentId === endNode.id) {
        return this._reconstructPath(cameFrom, endNode.id);
      }
      const currentNode = cfg.graph.getNode(currentId);
      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!visited.has(edge.nodeId) && cfg.validator(edge, currentNode)) {
          visited.add(edge.nodeId);
          cameFrom.set(edge.nodeId, currentId);
          stack.push(edge.nodeId);
        }
      }
    }
    return cfg.partialPath ? this._reconstructPath(cameFrom, currentId) : [];
  }

  // ------------- Algoritmo Dijkstra -------------
  static _dijkstra(cfg, startNode, endNode) {
    const distances = new Map();
    const prev = new Map();
    const queue = new PriorityQueue();
    let iterations = 0;
    let foundEnd = false;
    let currentId = startNode.id;

    // Inicializa distâncias
    cfg.graph.nodes.forEach((node) => {
      distances.set(node.id, Infinity);
      prev.set(node.id, null);
    });
    distances.set(startNode.id, 0);
    queue.enqueue(startNode.id, 0);

    while (!queue.isEmpty() && iterations++ < cfg.maxIterations) {
      currentId = queue.dequeue();
      if (currentId === endNode.id) {
        foundEnd = true;
        break;
      }
      const currentNode = cfg.graph.getNode(currentId);
      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!cfg.validator(edge, currentNode)) continue;

        const alt = distances.get(currentId) + cfg.costFunction(edge);
        const neighborId = edge.nodeId;
        if (alt < distances.get(neighborId)) {
          distances.set(neighborId, alt);
          prev.set(neighborId, currentId);
          queue.enqueue(neighborId, alt);
        }
      }
    }

    if (foundEnd) {
      return this._reconstructPath(prev, endNode.id);
    } else if (cfg.partialPath) {
      return this._reconstructPath(prev, currentId);
    }
    return [];
  }

  // ------------- Algoritmo BFS -------------
  static _bfs(cfg, startNode, endNode) {
    const queue = [startNode.id];
    const visited = new Set([startNode.id]);
    const cameFrom = new Map();
    let iterations = 0;
    let currentId;

    while (queue.length > 0 && iterations++ < cfg.maxIterations) {
      currentId = queue.shift();
      if (currentId === endNode.id) {
        return this._reconstructPath(cameFrom, endNode.id);
      }
      const currentNode = cfg.graph.getNode(currentId);
      for (const edge of cfg.graph.getAdjacencias(currentId)) {
        if (!visited.has(edge.nodeId) && cfg.validator(edge, currentNode)) {
          visited.add(edge.nodeId);
          cameFrom.set(edge.nodeId, currentId);
          queue.push(edge.nodeId);
        }
      }
    }
    return cfg.partialPath ? this._reconstructPath(cameFrom, currentId) : [];
  }

  // ------------- Funções auxiliares -------------

  /**
   * Resolve os nós de início e fim a partir das configurações.
   * Se o target for um número, usa o nó diretamente; se for um objeto {x, y},
   * encontra o nó mais próximo.
   * @private
   */
  static _resolveNodes(cfg) {
    const resolveNode = (target) => {
      if (typeof target === "number") {
        return cfg.graph.getNode(target);
      }
      return this._findNearestNode(cfg.graph, target);
    };
    const startNode = resolveNode(cfg.start);
    const endNode = resolveNode(cfg.end);
    if (!startNode || !endNode) {
      throw new Error("Nó inicial/final não encontrado");
    }
    return { startNode, endNode };
  }

  /**
   * Encontra o nó mais próximo de um ponto.
   * @private
   */
  static _findNearestNode(graph, point) {
    let minDist = Infinity;
    let best = null;
    for (const node of graph.nodes) {
      const center = node.polygon.getCenter();
      const dist = Math.hypot(center.x - point.x, center.y - point.y);
      if (dist < minDist) {
        minDist = dist;
        best = node;
      }
    }
    return best;
  }

  /**
   * Reconstrói o caminho a partir de um mapa de predecessores.
   * @private
   */
  static _reconstructPath(cameFrom, endId) {
    const path = [];
    let current = endId;
    while (current !== undefined && current !== null) {
      path.unshift(current);
      current = cameFrom.get(current);
    }
    return path;
  }

  /**
   * Pós-processa o caminho, filtrando IDs inválidos e calculando métricas.
   * @private
   */
  static _postProcessPath(rawPath, cfg) {
    const validPath = [];
    for (const id of rawPath) {
      const node = cfg.graph.getNode(id);
      if (!node) break;
      validPath.push(id);
    }
    const pathNodes = validPath.map((id) => cfg.graph.getNode(id));
    const points = pathNodes.map((n) => n.polygon.getCenter());
    let distance = this._calculatePathDistance(points);

    return {
      path: validPath,
      points,
      distance,
      complete:
        validPath.length > 0 &&
        validPath[validPath.length - 1] === cfg.endNode.id,
      iterations: 0,
      error: null,
    };
  }

  /**
   * Calcula a distância total do caminho com base nos centros dos nós.
   * @private
   */
  static _calculatePathDistance(points) {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      dist += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    }
    return dist;
  }
}

/**
 * Fila de prioridade simples usada nos algoritmos A* e Dijkstra.
 */
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
 * Registro global de eventos para o Pathfinder.
 */
class EventRegistry {
  static _instance = new EventEmitter();
  static addGlobalListener(listener) {
    this._instance.addGlobalListener(listener);
  }
  static removeGlobalListener(listener) {
    this._instance.removeGlobalListener(listener);
  }
}

/**
 * Eventos auxiliares para navegação.
 */
export class NavigationEvents {
  /**
   * Registra um listener global com contexto e timestamp.
   * @param {any} context - Contexto a ser incluído.
   * @param {Function} listener - Callback para o evento.
   * @returns {Function} Listener encapsulado.
   */
  static registerGlobalListener(context, listener) {
    const wrappedListener = (event) => {
      const enhancedEvent = { ...event, timestamp: Date.now(), context };
      listener(enhancedEvent);
    };
    EventRegistry.addGlobalListener(wrappedListener);
    return wrappedListener;
  }

  /**
   * Cria um proxy para redirecionar chamadas de "on" e "off".
   * @param {Object} target - Objeto alvo.
   * @returns {Proxy} Proxy com os métodos de eventos.
   */
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
export default Pathfinder;
