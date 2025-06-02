import { NavMesh, Polygon, Pathfinder } from "../index.js"; // 🡅 índice exporta “Pathfinder” :contentReference[oaicite:0]{index=0}
test("A* encontra rota numa NavMesh de 2 triângulos", () => {
  // 1) Define os dois triângulos (polígonos A e B) que compartilham um lado
  const polyA = new Polygon([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: 10 },
  ]);
  const polyB = new Polygon([
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]);

  // 2) Cria a NavMesh e adiciona A e B
  const nav = new NavMesh();
  nav.addPolygon(polyA);
  nav.addPolygon(polyB);

  // 3) Constói o grafo de conexões (sem obstáculos)
  nav.buildGraph();

  // 4) Executa A* de (1,1) até (9,9)
  const result = Pathfinder.findPath({
    graph: nav.graph,
    start: { x: 1, y: 1 },
    end: { x: 9, y: 9 },
  });

  // 5) Deve retornar um array de índices de polígonos: [0, 1]
  expect(Array.isArray(result)).toBe(true);
  expect(result).toEqual([0, 1]);
});
