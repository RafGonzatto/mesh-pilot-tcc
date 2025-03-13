// src/pathfinding/AStar.js

export default class AStar {
  findPath(startPos, goalPos, graph) {
    if (!graph) {
      console.error("Grafo não definido. Chame buildGraph() primeiro.");
      return [];
    }

    // Encontrar nós do grafo onde estão startPos e goalPos
    const startNodeId = this.findNodeIdByPosition(startPos, graph);
    const goalNodeId = this.findNodeIdByPosition(goalPos, graph);

    if (startNodeId === null || goalNodeId === null) {
      console.warn(
        "Não foi possível encontrar nó correspondente a start ou goal."
      );
      return [];
    }

    // Conjuntos de abertos e fechados
    const openSet = [startNodeId];
    const cameFrom = {}; // Armazena caminho
    const gScore = {};
    const fScore = {};

    // Inicializa scores
    graph.nodes.forEach((node) => {
      gScore[node.id] = Infinity;
      fScore[node.id] = Infinity;
    });
    gScore[startNodeId] = 0;
    fScore[startNodeId] = this.heuristicCost(startNodeId, goalNodeId, graph);

    while (openSet.length > 0) {
      // Ordena openSet pelo menor fScore
      openSet.sort((a, b) => fScore[a] - fScore[b]);
      const current = openSet.shift();

      if (current === goalNodeId) {
        // Reconstruir caminho
        return this.reconstructPath(cameFrom, current, graph);
      }

      const neighbors = graph.getNeighbors(current);
      for (const neighbor of neighbors) {
        const tentativeG =
          gScore[current] + this.distanceBetween(current, neighbor, graph);
        if (tentativeG < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeG;
          fScore[neighbor] =
            gScore[neighbor] + this.heuristicCost(neighbor, goalNodeId, graph);
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // Se chegar aqui, não encontrou caminho
    console.warn("Caminho não encontrado.");
    return [];
  }

  reconstructPath(cameFrom, current, graph) {
    const totalPath = [current];
    while (current in cameFrom) {
      current = cameFrom[current];
      totalPath.unshift(current);
    }
    // Retorna como array de posições (centro do polígono, por ex)
    return totalPath.map((nodeId) =>
      this.getPolygonCenter(graph.getNodeById(nodeId).polygon)
    );
  }

  findNodeIdByPosition(pos, graph) {
    for (const node of graph.nodes) {
      if (node.polygon.containsPoint(pos)) {
        return node.id;
      }
    }
    return null;
  }

  distanceBetween(nodeAId, nodeBId, graph) {
    // Aqui, poderíamos calcular distância entre centros dos polígonos, por exemplo
    const polyA = graph.getNodeById(nodeAId).polygon;
    const polyB = graph.getNodeById(nodeBId).polygon;
    const centerA = this.getPolygonCenter(polyA);
    const centerB = this.getPolygonCenter(polyB);
    return this.euclideanDistance(centerA, centerB);
  }

  heuristicCost(nodeAId, nodeBId, graph) {
    // Heurística: distância Euclidiana entre centros dos polígonos
    const polyA = graph.getNodeById(nodeAId).polygon;
    const polyB = graph.getNodeById(nodeBId).polygon;
    const centerA = this.getPolygonCenter(polyA);
    const centerB = this.getPolygonCenter(polyB);
    return this.euclideanDistance(centerA, centerB);
  }

  getPolygonCenter(polygon) {
    let sumX = 0,
      sumY = 0;
    for (const v of polygon.vertices) {
      sumX += v.x;
      sumY += v.y;
    }
    return {
      x: sumX / polygon.vertices.length,
      y: sumY / polygon.vertices.length,
    };
  }

  euclideanDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
