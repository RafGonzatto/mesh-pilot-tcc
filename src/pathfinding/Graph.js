/**
 * @module Graph
 * Representa um grafo simples, cada nó é {id, polygon}, arestas são [idA, idB, peso].
 */
export class Graph {
  /**
   * @param {Array<{id:number, polygon:any}>} nodes 
   * @param {Array<[number, number, number]>} edges 
   */
  constructor(nodes=[], edges=[]) {
    this.nodes = nodes;  // cada nó: { id, polygon }
    this.adjList = new Map();
    for (const node of nodes) {
      this.adjList.set(node.id, []);
    }
    for (const [a,b,peso] of edges) {
      this._addEdge(a,b,peso);
      this._addEdge(b,a,peso);
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
    return this.nodes.find(n=>n.id===nodeId);
  }
}
