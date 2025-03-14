import { Polygon } from './Polygon.js';
import { Graph } from '../pathfinding/Graph.js';
/**
 * @module NavMesh
 * Gera e gerencia a malha de navegação.
 */
export class NavMesh {
  constructor(enableLogs = false) {
    this.polygons = []; // áreas caminháveis
    this.graph = null;
    this.enableLogs = enableLogs;
  }

  addPolygon(poly) {
    if (!(poly instanceof Polygon)) {
      throw new Error('NavMesh.addPolygon espera um Polygon válido.');
    }
    this.polygons.push(poly);
    if (this.enableLogs) console.log('[NavMesh] Polygon adicionado.');
  }

  /**
   * Constrói o grafo básico – adjacências entre polígonos.
   * NÃO leva em conta obstáculos. 
   */
  buildGraph() {
    if (this.enableLogs) console.log('[NavMesh] buildGraph() – sem obstáculos.');
    const nodes = [];
    for (let i=0; i<this.polygons.length; i++) {
      nodes.push({ id: i, polygon: this.polygons[i] });
    }
    const edges = [];
    // Verifica adjacência
    for (let i=0; i<nodes.length; i++) {
      for (let j=i+1; j<nodes.length; j++) {
        if (this._saoAdjacentes(this.polygons[i], this.polygons[j])) {
          const peso = this._calcDistCenter(this.polygons[i], this.polygons[j]);
          edges.push([i, j, peso]);
        }
      }
    }
    this.graph = new Graph(nodes, edges);
    if (this.enableLogs) console.log(`[NavMesh] buildGraph() -> ${edges.length} arestas criadas.`);
  }

  /**
   * Parecido com buildGraph(), mas remove arestas bloqueadas por obstáculos.
   * @param {Polygon[]} obstacles
   */
  buildGraphConsideringObstacles(obstacles=[]) {
    if (this.enableLogs) {
      console.log('[NavMesh] buildGraphConsideringObstacles() – verificando interseções com obstáculos.');
    }
    const nodes = [];
    for (let i=0; i<this.polygons.length; i++) {
      nodes.push({ id: i, polygon: this.polygons[i] });
    }
    const edges = [];
    for (let i=0; i<nodes.length; i++){
      for (let j=i+1; j<nodes.length; j++){
        // 1) Polígonos precisam ser adjacentes
        if (!this._saoAdjacentes(this.polygons[i], this.polygons[j])) continue;
        // 2) Checa se a linha “centroA → centroB” cruza algum obstáculo
        const centerA = this.polygons[i].getCenter();
        const centerB = this.polygons[j].getCenter();
        if (!this._bloqueadoPorObstaculo(centerA, centerB, obstacles)) {
          const peso = this._calcDistCenter(this.polygons[i], this.polygons[j]);
          edges.push([i, j, peso]);
        } else {
          if (this.enableLogs) {
            console.log(`[NavMesh] Aresta ${i}→${j} BLOQUEADA por obstáculo.`);
          }
        }
      }
    }
    this.graph = new Graph(nodes, edges);
    if (this.enableLogs) console.log(`[NavMesh] buildGraphConsideringObstacles() -> ${edges.length} arestas válidas.`);
  }

  // ---------------------------------------------------------
  // Métodos de checagem
  // ---------------------------------------------------------
  _saoAdjacentes(pA, pB) {
    // bounding box + checagem de arestas
    const boxA = pA.getBoundingBox();
    const boxB = pB.getBoundingBox();
    if (!this._bboxOverlap(boxA, boxB)) return false;

    const edgesA = pA.getEdges();
    const edgesB = pB.getEdges();
    for (const ea of edgesA) {
      for (const eb of edgesB) {
        if (this._segmentsIntersect(ea.start, ea.end, eb.start, eb.end)) {
          return true;
        }
      }
    }
    return false;
  }

  _bboxOverlap(a,b){
    if(a.xmax < b.xmin) return false;
    if(b.xmax < a.xmin) return false;
    if(a.ymax < b.ymin) return false;
    if(b.ymax < a.ymin) return false;
    return true;
  }

  _segmentsIntersect(p1,p2,p3,p4){
    const EPS = 1e-9;
    const d1 = this._direction(p3,p4,p1),
          d2 = this._direction(p3,p4,p2),
          d3 = this._direction(p1,p2,p3),
          d4 = this._direction(p1,p2,p4);
    const cruza = ((d1>EPS && d2<-EPS)||(d1<-EPS && d2>EPS)) &&
                  ((d3>EPS && d4<-EPS)||(d3<-EPS && d4>EPS));
    if (cruza) return true;

    if(Math.abs(d1)<EPS && this._onSegment(p3,p4,p1)) return true;
    if(Math.abs(d2)<EPS && this._onSegment(p3,p4,p2)) return true;
    if(Math.abs(d3)<EPS && this._onSegment(p1,p2,p3)) return true;
    if(Math.abs(d4)<EPS && this._onSegment(p1,p2,p4)) return true;
    return false;
  }

  _direction(p1,p2,p3){
    return (p2.x-p1.x)*(p3.y-p1.y) - (p2.y-p1.y)*(p3.x-p1.x);
  }
  _onSegment(p1,p2,p3){
    const [minX,maxX] = [Math.min(p1.x,p2.x), Math.max(p1.x,p2.x)];
    const [minY,maxY] = [Math.min(p1.y,p2.y), Math.max(p1.y,p2.y)];
    return (p3.x>=minX && p3.x<=maxX && p3.y>=minY && p3.y<=maxY);
  }

  _calcDistCenter(a,b){
    const ca = a.getCenter();
    const cb = b.getCenter();
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  /**
   * Retorna true se a linha do ponto A->B interceptar qualquer obstáculo.
   * @param {{x:number,y:number}} A 
   * @param {{x:number,y:number}} B 
   * @param {Polygon[]} obstacles 
   */
  _bloqueadoPorObstaculo(A, B, obstacles){
    for (const obs of obstacles) {
      // se intersecta edges ou se A está dentro, etc
      if (this._lineIntersectsPolygon(A,B,obs)) {
        return true;
      }
    }
    return false;
  }

  _lineIntersectsPolygon(p1, p2, poly){
    // se qualquer edge do polígono interceptar (p1->p2), retorna true
    const edges = poly.getEdges();
    for (const e of edges) {
      if (this._segmentsIntersect(p1,p2,e.start,e.end)) {
        return true;
      }
    }
    // ou se p1 ou p2 estiver dentro do obstáculo (raro, mas pode acontecer)
    if (poly.containsPoint(p1) || poly.containsPoint(p2)) {
      return true;
    }
    return false;
  }
}