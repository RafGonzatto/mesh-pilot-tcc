import { EventEmitter } from "../navmesh/EventEmitter.js";

/**
 * @module Graph
 * Representa um grafo simples onde cada nó é definido por {id, polygon}
 * e as arestas são definidas como [idA, idB, peso].
 */
export class Graph extends EventEmitter {
  /**
   * Cria uma instância do grafo.
   * @param {Array<{id:number, polygon:any}>} nodes - Lista de nós.
   * @param {Array<[number, number, number]>} edges - Lista de arestas.
   */
  constructor(nodes = [], edges = []) {
    super();
    this.nodes = nodes;
    // Inicializa a lista de adjacências
    this.adjList = new Map();
    for (const node of nodes) {
      this.adjList.set(node.id, []);
    }
    // Adiciona as arestas (bidirecionais)
    for (const [a, b, peso] of edges) {
      this._addEdge(a, b, peso);
      this._addEdge(b, a, peso);
    }
  }

  /**
   * Adiciona uma aresta à lista de adjacências.
   * @private
   */
  _addEdge(a, b, w = 1) {
    if (!this.adjList.has(a)) {
      this.adjList.set(a, []);
    }
    this.adjList.get(a).push({ nodeId: b, peso: w });
  }

  /**
   * Retorna as adjacências de um nó.
   * @param {number|string} nodeId - ID do nó.
   * @returns {Array<Object>} Lista de arestas.
   */
  getAdjacencias(nodeId) {
    return this.adjList.get(nodeId) || [];
  }

  /**
   * Retorna um nó dado seu ID.
   * @param {number|string} nodeId - ID do nó.
   * @returns {Object} Nó encontrado.
   */
  getNode(nodeId) {
    return this.nodes.find((n) => n.id === nodeId);
  }

  /**
   * Cria uma cópia do grafo.
   * @returns {Graph} Novo grafo clonado.
   */
  clone() {
    const clonedNodes = this.nodes.map((n) => ({ ...n }));
    const clonedAdjList = new Map();
    this.adjList.forEach((edges, key) => {
      clonedAdjList.set(key, edges.map((e) => ({ ...e })));
    });
    const clonedGraph = new Graph(clonedNodes, []);
    clonedGraph.adjList = clonedAdjList;
    return clonedGraph;
  }
}
