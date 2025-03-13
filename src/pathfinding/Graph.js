// src/pathfinding/Graph.js

export default class Graph {
  /**
   * @param {Array} nodes - Ex: [{ id: 0, polygon: {...}}, ...]
   * @param {Array} edges - Ex: [[0,1], [1,2]] (pares de índices)
   */
  constructor(nodes = [], edges = []) {
    this.nodes = nodes;
    this.adjList = new Map();

    // Inicializar adjacency list
    nodes.forEach((node) => {
      this.adjList.set(node.id, []);
    });

    // Popular adjacency list
    edges.forEach(([id1, id2]) => {
      this.adjList.get(id1).push(id2);
      this.adjList.get(id2).push(id1);
    });
  }

  getNeighbors(nodeId) {
    return this.adjList.get(nodeId);
  }

  getNodeById(id) {
    return this.nodes.find((n) => n.id === id);
  }
}
