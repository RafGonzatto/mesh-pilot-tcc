import { NavMesh, Polygon } from "../../src/index.js";

test("Arestas são bloqueadas por obstáculo dinâmico", () => {
  // 1) Define três triângulos A, B e C alinhados
  const polyA = new Polygon([
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 0, y: 5 },
  ]);
  const polyB = new Polygon([
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 5 },
  ]);
  const polyC = new Polygon([
    { x: 10, y: 0 },
    { x: 10, y: 5 },
    { x: 5, y: 5 },
  ]);

  // 2) Cria a NavMesh e adiciona A, B e C
  const nav = new NavMesh();
  nav.addPolygon(polyA);
  nav.addPolygon(polyB);
  nav.addPolygon(polyC);

  // 3) Constroi o grafo sem obstáculos
  nav.buildGraph();

  // Verifica estado inicial:
  // A(0) ↔ B(1); B(1) ↔ A(0) e C(2); C(2) ↔ B(1)
  expect(nav.graph.adjList.get(0).length).toBe(1); // A só tem B
  expect(nav.graph.adjList.get(1).length).toBe(2); // B tem A e C
  expect(nav.graph.adjList.get(2).length).toBe(1); // C só tem B

  // 4) Cria um obstáculo que cruza a aresta entre A e B
  const obsAB = new Polygon([
    { x: 4, y: 1 },
    { x: 6, y: 1 },
    { x: 6, y: 3 },
    { x: 4, y: 3 },
  ]);

  // 5) Reconstrói o grafo considerando o obstáculo.
  // Se a sua implementação fornece buildGraphConsideringObstacles:
  nav.buildGraphConsideringObstacles([obsAB]);

  // OU, se usar DynamicObstacleManager, faça:
  // nav.enableDynamicObstacles();
  // const obsId = nav.dynamicObstacleManager.addObstacle(obsAB);
  // nav.buildGraph();

  // 6) Agora A(0) não deve ter vizinhos;
  //    B(1) conecta apenas com C(2);
  //    C(2) conecta apenas com B(1).
  const adjA = nav.graph.adjList.get(0) || [];
  const adjB = nav.graph.adjList.get(1) || [];
  const adjC = nav.graph.adjList.get(2) || [];

  expect(adjA.length).toBe(0);
  expect(adjB.length).toBe(1);
  expect(adjC.length).toBe(1);
});
