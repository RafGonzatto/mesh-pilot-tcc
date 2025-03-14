import { Polygon } from './Polygon.js';
import { Graph } from '../pathfinding/Graph.js';

/**
 * @module NavMesh
 * Gera e gerencia a malha de navegação (polígonos “caminháveis” → nós no grafo).
 * Inclui logs para acompanhar a verificação de adjacência.
 */
export class NavMesh {
  /**
   * @param {(msg:string)=>void} logger Função opcional para logar mensagens
   */
  constructor(logger=null) {
    /** @type {Polygon[]} */
    this.polygons = [];
    /** @type {Graph|null} */
    this.graph = null;
    this.log = logger || (()=>{});
  }

  addPolygon(poly) {
    if (!(poly instanceof Polygon)) {
      throw new Error('NavMesh.addPolygon espera Polygon.');
    }
    this.polygons.push(poly);
  }

  buildGraph() {
    this.log('> [NavMesh] Iniciando buildGraph...');

    const nodes = [];
    for (let i=0; i<this.polygons.length; i++) {
      nodes.push({ id: i, polygon: this.polygons[i] });
    }
    const edges = [];

    // Verifica adjacência
    for (let i=0; i<nodes.length; i++) {
      for (let j=i+1; j<nodes.length; j++) {
        const polyA = this.polygons[i];
        const polyB = this.polygons[j];
        const adj = this._saoAdjacentes(polyA, polyB);
        this.log(`[NavMesh] Polígono ${i} e Polígono ${j} são adjacentes? ${adj}`);
        if (adj) {
          const peso = this._calcDistCenter(polyA, polyB);
          edges.push([i, j, peso]);
        }
      }
    }

    this.graph = new Graph(nodes, edges);
    this.log(`> [NavMesh] Grafo finalizado com ${nodes.length} nós e ${edges.length} arestas.\n`);
  }

  _saoAdjacentes(pA, pB) {
    if (!pA || !pB) return false;
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
    if (a.xmax < b.xmin) return false;
    if (b.xmax < a.xmin) return false;
    if (a.ymax < b.ymin) return false;
    if (b.ymax < a.ymin) return false;
    return true;
  }

  _segmentsIntersect(p1,p2,p3,p4) {
    const EPS = 1e-9;
    const d1 = this._direction(p3,p4,p1),
          d2 = this._direction(p3,p4,p2),
          d3 = this._direction(p1,p2,p3),
          d4 = this._direction(p1,p2,p4);

    const cruza = ((d1>EPS && d2<-EPS)||(d1<-EPS && d2>EPS)) &&
                  ((d3>EPS && d4<-EPS)||(d3<-EPS && d4>EPS));
    if (cruza) return true;

    if (Math.abs(d1)<EPS && this._onSegment(p3,p4,p1)) return true;
    if (Math.abs(d2)<EPS && this._onSegment(p3,p4,p2)) return true;
    if (Math.abs(d3)<EPS && this._onSegment(p1,p2,p3)) return true;
    if (Math.abs(d4)<EPS && this._onSegment(p1,p2,p4)) return true;
    return false;
  }

  _direction(p1,p2,p3){
    return (p2.x-p1.x)*(p3.y-p1.y) - (p2.y-p1.y)*(p3.x-p1.x);
  }

  _onSegment(p1,p2,p3){
    const minX = Math.min(p1.x,p2.x), maxX = Math.max(p1.x,p2.x);
    const minY = Math.min(p1.y,p2.y), maxY = Math.max(p1.y,p2.y);
    return (p3.x>=minX && p3.x<=maxX && p3.y>=minY && p3.y<=maxY);
  }

  _calcDistCenter(a,b) {
    const ca = a.getCenter(), cb = b.getCenter();
    const dx = cb.x - ca.x, dy = cb.y - ca.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
}