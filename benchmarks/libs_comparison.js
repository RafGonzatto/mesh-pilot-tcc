import { Polygon } from '../src/navmesh/Polygon.js';
import { Graph } from '../src/pathfinding/Graph.js';
import { Pathfinder } from '../src/pathfinding/Pathfinder.js';
import PF from 'pathfinding';
import { Graph as YukaGraph, NavNode, NavEdge, AStar as YukaAStar, Vector3 } from 'yuka';
import { performance } from 'perf_hooks';

function buildGridGraph(w, h) {
  const nodes = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      const poly = new Polygon([
        { x, y },
        { x: x + 1, y },
        { x: x + 1, y: y + 1 },
        { x, y: y + 1 },
      ]);
      nodes.push({ id, polygon: poly });
    }
  }
  const edges = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      if (x < w - 1) edges.push([id, id + 1, 1]);
      if (y < h - 1) edges.push([id, id + w, 1]);
    }
  }
  return new Graph(nodes, edges);
}

function buildYukaGraph(w, h) {
  const graph = new YukaGraph();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      const node = new NavNode(id, new Vector3(x, 0, y));
      graph.addNode(node);
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      if (x < w - 1) graph.addEdge(new NavEdge(id, id + 1, 1));
      if (y < h - 1) graph.addEdge(new NavEdge(id, id + w, 1));
    }
  }
  return graph;
}

const SIZE = 200;
const mpGraph = buildGridGraph(SIZE, SIZE);
const startId = 0;
const endId = SIZE * SIZE - 1;

let t0 = performance.now();
Pathfinder.findPath({ graph: mpGraph, start: startId, end: endId });
const mpTime = performance.now() - t0;

const grid = new PF.Grid(SIZE, SIZE);
const finder = new PF.AStarFinder();
t0 = performance.now();
finder.findPath(0, 0, SIZE - 1, SIZE - 1, grid);
const pfTime = performance.now() - t0;

const yGraph = buildYukaGraph(SIZE, SIZE);
const astar = new YukaAStar(yGraph, startId, endId);
t0 = performance.now();
astar.search();
astar.getPath();
const yTime = performance.now() - t0;

console.log(`mesh-pilot → ${mpTime.toFixed(2)} ms`);
console.log(`pathfinding.js → ${pfTime.toFixed(2)} ms`);
console.log(`yuka → ${yTime.toFixed(2)} ms`);
