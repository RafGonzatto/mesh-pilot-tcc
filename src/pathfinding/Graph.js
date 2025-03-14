/**
 * @module Graph
 * Representa um grafo simples com nós e listas de adjacência.
 */
export class Graph {
  /**
   * @param {Array<{id:number, polygon:any}>} nodes 
   * @param {Array<[number, number, number]>} edges [nodeA, nodeB, peso]
   */
  constructor(nodes=[], edges=[]) {
    this.nodes = nodes;
    this.adjList = new Map();
    for (const node of nodes) {
      this.adjList.set(node.id, []);
    }
    for (const [a, b, w] of edges) {
      this._addEdge(a, b, w);
      this._addEdge(b, a, w);
    }
  }

  _addEdge(a, b, w=1) {
    if (!this.adjList.has(a)) {
      this.adjList.set(a, []);
    }
    this.adjList.get(a).push({ nodeId: b, peso: w });
  }

  getAdjacencias(nodeId) {
    return this.adjList.get(nodeId) || [];
  }

  getNode(nodeId) {
    return this.nodes.find(n => n.id === nodeId);
  }
}
