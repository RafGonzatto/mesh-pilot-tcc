````markdown
# Documentação da API

Este documento descreve as principais classes e métodos disponíveis em `my-ia-library`.

## Classes

1. **NavMesh**

   - Responsável por armazenar e manipular a malha de navegação (NavMesh).
   - Principais propriedades:
     - `polygons`: array de polígonos que compõem a malha
     - `graph`: instância de `Graph` para pathfinding
   - Principais métodos:
     - `addPolygon(polygon)`: adiciona um polígono à NavMesh
     - `buildGraph()`: constrói o grafo de navegação com base nos polígonos

2. **Polygon**

   - Representa um polígono (região navegável).
   - Principais propriedades:
     - `vertices`: array de pontos `{x, y}`
   - Principais métodos:
     - `containsPoint(point)`: verifica se um ponto está dentro do polígono

3. **AStar**

   - Implementa o algoritmo A\* para pathfinding.
   - Principais métodos:
     - `findPath(start, goal, graph)`: retorna um array de nós ou waypoints do melhor caminho

4. **FiniteStateMachine**

   - Implementa máquinas de estados finitos.
   - Principais métodos:
     - `update()`: atualiza a FSM, executando lógica do estado atual e transições

5. **BehaviorTree**
   - Implementa Árvores de Comportamento.
   - Principais métodos:
     - `tick(blackboard)`: executa a árvore, usando dados do `blackboard`

## Exemplo de Uso

```js
import { NavMesh, Polygon, AStar, FiniteStateMachine } from "my-ia-library";
// Crie a NavMesh, adicione polígonos e construa o grafo
// Use A* para encontrar caminhos
// Configure uma FSM e atualize em cada frame
```
````

---

## 4) **/examples/minimal-example.html**

Exemplo mínimo que carrega sua biblioteca (supondo que você já a compilou ou está referenciando diretamente o arquivo `index.js`).

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My IA Library - Example</title>
  </head>
  <body>
    <h1>Minimal Example</h1>
    <script type="module">
      import {
        NavMesh,
        Polygon,
        AStar,
        FiniteStateMachine,
      } from "../src/index.js";

      // Exemplo rápido: criar NavMesh e buscar caminho
      const navMesh = new NavMesh();
      navMesh.addPolygon(
        new Polygon([
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ])
      );
      navMesh.buildGraph();

      const pathfinder = new AStar();
      const path = pathfinder.findPath(
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        navMesh.graph
      );
      console.log("Path encontrado:", path);

      // Exemplo rápido de FSM (demonstrativo)
      const idleState = {
        name: "Idle",
        enter: () => console.log("Entering Idle"),
        execute: () => console.log("Executing Idle"),
        exit: () => console.log("Exiting Idle"),
        checkTransitions: () => idleState, // sem transição
      };

      const fsm = new FiniteStateMachine(idleState);
      fsm.update();
    </script>
  </body>
</html>
```
