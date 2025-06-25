import { Polygon } from '../src/navmesh/Polygon.js';
import { Graph } from '../src/pathfinding/Graph.js';
import { Pathfinder } from '../src/pathfinding/Pathfinder.js';
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

const WIDTH = 50;
const HEIGHT = 200;
const graph = buildGridGraph(WIDTH, HEIGHT);

const ITERATIONS = 10;
const AGENTS = 10;
let total = 0;
for (let i = 0; i < ITERATIONS; i++) {
  const t0 = performance.now();
  for (let j = 0; j < AGENTS; j++) {
    const start = Math.floor(Math.random() * WIDTH * HEIGHT);
    const end = Math.floor(Math.random() * WIDTH * HEIGHT);
    Pathfinder.findPath({ graph, start, end });
  }
  total += performance.now() - t0;
}
const avg = total / ITERATIONS;
console.log(`NavMesh × ${AGENTS} NPCs → ${avg.toFixed(2)} ms/run`);
