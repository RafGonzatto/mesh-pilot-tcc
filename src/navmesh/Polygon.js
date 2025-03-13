// src/navmesh/Polygon.js

export default class Polygon {
  constructor(vertices = []) {
    this.vertices = vertices; // Array de { x, y }
  }

  // Método auxiliar para verificar se um ponto (x, y) está dentro deste polígono
  containsPoint(point) {
    // Algoritmo de raycasting simples
    let inside = false;
    for (
      let i = 0, j = this.vertices.length - 1;
      i < this.vertices.length;
      j = i++
    ) {
      const xi = this.vertices[i].x,
        yi = this.vertices[i].y;
      const xj = this.vertices[j].x,
        yj = this.vertices[j].y;
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
