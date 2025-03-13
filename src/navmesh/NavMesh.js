// src/navmesh/NavMesh.js

import Graph from "../pathfinding/Graph.js";
import Polygon from "./Polygon.js";

export default class NavMesh {
  constructor() {
    this.polygons = []; // Array<Polygon>
    this.graph = null; // Será instanciado após buildGraph()
  }

  addPolygon(polygon) {
    if (polygon instanceof Polygon) {
      this.polygons.push(polygon);
    } else {
      console.warn("Tentando adicionar algo que não é Polygon");
    }
  }

  buildGraph() {
    // Exemplo simples: cada polígono vira um nó no grafo e ligações entre polígonos adjacentes.
    const nodes = this.polygons.map((poly, index) => ({
      id: index,
      polygon: poly,
    }));
    const edges = [];

    // Checar adjacência dos polígonos
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.polygonsAreAdjacent(nodes[i].polygon, nodes[j].polygon)) {
          edges.push([i, j]);
        }
      }
    }

    // Cria o grafo
    this.graph = new Graph(nodes, edges);
  }

  polygonsAreAdjacent(polyA, polyB) {
    // Um critério simples de "adjacência" é se os polígonos compartilham um segmento.
    // Aqui faremos algo simplificado: se ao menos um vértice de A estiver dentro de B e vice-versa.
    // Você pode usar algo mais robusto como checar interseção de arestas.
    for (const vert of polyA.vertices) {
      if (polyB.containsPoint(vert)) {
        return true;
      }
    }
    for (const vert of polyB.vertices) {
      if (polyA.containsPoint(vert)) {
        return true;
      }
    }
    return false;
  }
}
