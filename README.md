# **Guia Completo da Biblioteca de Navegação e Pathfinding**

Bem-vindo(a) ao guia oficial desta biblioteca de navegação e pathfinding em 2D. Aqui você encontra todas as informações para instalar, configurar, utilizar e entender seus principais componentes. O objetivo é fornecer um sistema robusto de **NavMesh** (malha de navegação), **pathfinding** (busca de caminhos), **obstáculos dinâmicos**, **camadas** (layers), e **visualização de debug**, tornando o desenvolvimento de aplicações 2D mais simples e eficiente.

---

## **Índice**

1. [Proposta Geral da Biblioteca](#proposta-geral-da-biblioteca)
2. [Principais Recursos (Features)](#principais-recursos-features)
3. [Conceitos Fundamentais](#conceitos-fundamentais)
   - [Polygons](#polygons)
   - [NavMesh e DynamicObstacleManager](#navmesh-e-dynamicobstaclemanager)
   - [Graph](#graph)
   - [LayerSystem](#layersystem)
   - [Pathfinder](#pathfinder)
   - [DebugVisualizer](#debugvisualizer)
4. [Instalação e Estrutura de Pastas](#instalação-e-estrutura-de-pastas)
5. [Exemplo Rápido (Quick Start)](#exemplo-rápido-quick-start)
6. [Uso Avançado](#uso-avançado)
7. [API Detalhada](#api-detalhada)
8. [Boas Práticas e Dicas](#boas-práticas-e-dicas)

---

## **Proposta Geral da Biblioteca**

Esta biblioteca surgiu para **facilitar a criação e manutenção de sistemas de navegação em mapas 2D**, contemplando:

- **Detecção de caminhos** em mapas complexos.
- Suporte a **obstáculos dinâmicos** e atualizações em tempo real.
- **Customização por camadas** (layer system), possibilitando diferentes “tipos” de navegação.
- Uso de algoritmos de pathfinding **clássicos** (A\*, Dijkstra, BFS, DFS) e extensões.
- **Visualização de debug** para auxiliar no desenvolvimento.

Os objetos centrais são **NavMesh** (malha de navegação) e **Graph** (grafo de navegação). A biblioteca gerencia esses conceitos e fornece uma série de utilitários para manusear o mapa (polígonos), encontrar caminhos (Pathfinder), e desenhar todo o processo (DebugVisualizer).

---

## **Principais Recursos (Features)**

1. **Criação de Polígonos (Polygon)** com métodos utilitários (cálculo de bounding box, verificação de ponto dentro, etc.).
2. **NavMesh** com suporte a:
   - Construção e gerenciamento de polígonos.
   - Construção de grafos básicos ou com obstáculos dinâmicos.
   - Camadas (Layers) para filtrar ou atribuir custos diferenciados.
   - Sistema de eventos para reagir a alterações.
3. **Graph** (grafo de navegação) abstrato, para representar nós e arestas.
4. **DynamicObstacleManager** para adicionar, remover ou mover obstáculos em tempo real, atualizando o grafo.
5. **LayerSystem** para registro de camadas, aplicação de filtros de INCLUSÃO, EXCLUSÃO e modificadores de CUSTO.
6. **Pathfinder** com diversos algoritmos:
   - A\* (A_Star)
   - Dijkstra
   - BFS
   - DFS
7. **DebugVisualizer** para desenhar, inspecionar e depurar facilmente:
   - Polígonos
   - Arestas
   - Obstáculos
   - Caminhos
   - Nós (nodes)
   - Rótulos, camadas, acessibilidade
8. **EventEmitter** base para gerenciamento de eventos globais e específicos.

---

## **Conceitos Fundamentais**

### 3.1 **Polygons**

- Representam **áreas** 2D (por exemplo, células de um terreno ou qualquer região).
- Possuem métodos para:
  - **`getBoundingBox()`**: Retorna o retângulo mínimo que envolve o polígono.
  - **`getEdges()`**: Lista de arestas (segmentos) do polígono.
  - **`getCenter()`**: Centro geométrico (média das coordenadas).
  - **`containsPoint(point)`**: Verifica se um ponto (x,y) está dentro do polígono.
  - **`getWidth()`**: Retorna a largura do polígono com base na bounding box.
  - **`allowedLayers`** e **`layer`**: Define em qual camada o polígono se encontra e quais camadas ele permite.

### 3.2 **NavMesh e DynamicObstacleManager**

- **NavMesh** é a classe principal que gerencia os **polígonos** e constrói um **Graph** de navegação.
- Permite métodos como:
  - **`addPolygon(poly)`**: Adiciona um polígono à malha.
  - **`buildGraph()`**: Constrói o grafo de adjacências sem considerar obstáculos.
  - **`buildGraphConsideringObstacles(obstacles)`**: Constrói o grafo considerando uma lista de obstáculos (bloqueios).
  - **`enableDynamicObstacles()`**: Habilita o sistema de obstáculos dinâmicos.
  - **`cloneGraph()`**: Retorna uma cópia do grafo atual.
- **DynamicObstacleManager** é o componente que lida com obstáculos **em tempo real**:
  - **`addObstacle(obstacle: Polygon)`**: Adiciona um novo obstáculo e atualiza o grafo.
  - **`removeObstacle(obstacleId)`**: Remove um obstáculo, liberando arestas do grafo.
  - **`updateObstacle(obstacleId, newObstacle)`**: Atualiza forma/posição de um obstáculo.
  - Possui um **índice espacial** (SpatialGrid) para consultas rápidas.

### 3.3 **Graph**

- Estrutura de **nós** ({id, polygon}) e **arestas** ([idA, idB, peso]).
- Método principal:
  - **`getAdjacencias(nodeId)`**: Retorna as arestas ligadas a um nó (vizinhança).
  - **`getNode(nodeId)`**: Acessa o nó pelo ID.
  - **`clone()`**: Gera uma cópia profunda (Deep Clone) do grafo.

### 3.4 **LayerSystem**

- Gerencia **camadas** (por exemplo, “default”, “agua”, “terra”, “subterrâneo” etc.).
- Permite **filtros** de 3 tipos:
  1. **INCLUSION**: Nó deve satisfazer a condição para ser incluso.
  2. **EXCLUSION**: Nó é excluído se satisfizer a condição.
  3. **COST_MODIFIER**: Ajusta o custo de travessia (ex.: caminhar na areia pode custar 2x).
- Exemplo de uso:
  ```js
  layerSystem.registerLayer("lava", { color: "#ff0000", traversalCost: 10 });
  layerSystem.addFilter(
    "lava",
    LayerSystem.FILTER_TYPES.EXCLUSION,
    (node, ctx) => {
      return ctx.agentType !== "fire"; // exclui se o agente não for de fogo
    }
  );
  ```

### 3.5 **Pathfinder**

- Fornece métodos **estáticos** para encontrar caminhos em um grafo.
- Suporta:
  - **A\*** (A_STAR)
  - **Dijkstra**
  - **BFS**
  - **DFS**
- Cada método aceita configurações como:
  - `heuristic`, `costFunction`, `validator` (funções callback).
  - `maxIterations`, `partialPath`, etc.
- Exemplo:
  ```js
  const pathResult = Pathfinder.findPath({
    graph,
    start: { x: 10, y: 50 },
    end: { x: 300, y: 350 },
    method: "A*",
    heuristic: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  });
  ```

### 3.6 **DebugVisualizer**

- Classe que desenha todo o conteúdo no **Canvas**:
  - Polígonos, arestas, obstáculos, caminho atual, nós, grid, rótulos etc.
- Simplifica o debug, pois exibe em **tempo real** tudo que acontece.
- Principais métodos:
  - **`draw()`**: Faz o desenho completo.
  - **`toggle(enabled)`**: Liga/desliga a visualização.
  - **`captureDebugData()`**: Retorna dados de estado e logs de eventos.
  - **`highlightAccessibleAreas(profile)`**: Demonstra quais áreas são acessíveis a certo tipo de agente.
  - **`drawAllAgentPaths()`**: Desenha caminhos de todos os agentes ativos.

---

## **Instalação e Estrutura de Pastas**

A estrutura das pastas é:

```
src/
  navmesh/
    EventEmitter.js
    NavMesh.js
    Polygon.js
    DynamicObstacleManager.js
    LayerSystem.js
  pathfinding/
    Graph.js
    Pathfinder.js
    AgentManager.js
  debug/
    DebugVisualizer.js
```

## 4.1 **Instalação**

**Via npm**:

```bash
npm install mesh-pilot
```

**Manual/local**:

- Baixe ou clone este repositório
- Copie a pasta mesh-pilot para o seu projeto
- Importe diretamente os arquivos de ./src/index.js no seu código.

---

## **Exemplo Rápido (Quick Start)**

Suponha que você tenha um canvas em HTML e queira criar uma malha de navegação simples:

```js
import { NavMesh } from "./navmesh/NavMesh.js";
import { Polygon } from "./navmesh/Polygon.js";
import { DebugVisualizer } from "./debug/DebugVisualizer.js";
import { Pathfinder } from "./pathfinding/Pathfinder.js";

// 1) Crie o NavMesh
const navMesh = new NavMesh(true); // enableLogs = true (opcional)

// 2) Registre camadas (opcional)
navMesh.layerSystem.registerLayer("customLayer", {
  color: "#ff00ff",
  traversalCost: 2,
});

// 3) Adicione alguns polígonos
const poly1 = new Polygon(
  [
    { x: 10, y: 10 },
    { x: 100, y: 10 },
    { x: 100, y: 80 },
    { x: 10, y: 80 },
  ],
  { layer: "customLayer" }
);

navMesh.addPolygon(poly1);

// 4) Construa o grafo (sem obstáculos inicialmente)
navMesh.buildGraph();

// 5) Exemplo: Encontrar caminho entre 2 pontos
const pathResult = Pathfinder.findPath({
  graph: navMesh.graph,
  start: { x: 12, y: 12 },
  end: { x: 90, y: 70 },
  method: "A*",
});
console.log("Path:", pathResult.path, "Distance:", pathResult.distance);

// 6) Visualizar no canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const debug = new DebugVisualizer(ctx, navMesh, {
  showNodes: true,
});
debug.draw(); // Desenha tudo (polígonos, arestas, etc.)
```

Nesse exemplo, adicionamos um polígono simples, construímos o grafo e buscamos o caminho via A\*. Depois, utilizamos o `DebugVisualizer` para desenhar tudo em tela.

---

## **Uso Avançado**

### 6.1 **Obstáculos Dinâmicos**

Para adicionar obstáculos em tempo real:

```js
// 1) Habilitar o gerenciador de obstáculos
navMesh.enableDynamicObstacles();

// 2) Criar um polígono representando obstáculo
const obstaclePoly = new Polygon([
  { x: 50, y: 50 },
  { x: 60, y: 50 },
  { x: 60, y: 60 },
  { x: 50, y: 60 },
]);

// 3) Adicionar ao gerenciador
const obstacleId = navMesh.dynamicObstacleManager.addObstacle(obstaclePoly);
```

O grafo será **automaticamente atualizado** (caso `autoUpdate` esteja habilitado), removendo arestas bloqueadas pelo obstáculo.

### 6.2 **LayerSystem Filtros**

```js
// Exemplo de filtro de exclusão
navMesh.layerSystem.addFilter("customLayer", "exclude", (node, context) => {
  // Exclui polígonos se...
  return node.polygon.getWidth() < 20;
});
```

### 6.3 **Múltiplos algoritmos de Pathfinding**

```js
const dijkstraResult = Pathfinder.findPath({
  graph: navMesh.graph,
  start: { x: 20, y: 20 },
  end: { x: 300, y: 300 },
  method: "DIJKSTRA",
});
```

---

## **API Detalhada**

A seguir, listamos as classes e métodos-chave (já documentados no código-fonte):

1. **`NavMesh`**

   - `addPolygon(poly: Polygon)`: Adiciona polígono.
   - `buildGraph()`: Constrói grafo simples.
   - `buildGraphConsideringObstacles(obstacles: Polygon[])`: Constrói grafo levando em conta bloqueios.
   - `enableDynamicObstacles(options?)`: Inicializa o gerenciador de obstáculos.
   - `cloneGraph()`: Retorna cópia do grafo atual.
   - ...

2. **`Polygon`**

   - `new Polygon(vertices, options?)`: Cria polígono.
   - `getBoundingBox()`, `getEdges()`, `getCenter()`, `getWidth()`.
   - `containsPoint(point)`.
   - ...

3. **`DynamicObstacleManager`**

   - `addObstacle(obstacle: Polygon)`, `removeObstacle(id: string)`, `updateObstacle(id: string, newObstacle: Polygon)`.
   - Mantém índice espacial via `SpatialGrid`.

4. **`LayerSystem`**

   - `registerLayer(name: string, config: Object)`.
   - `addFilter(layer: string, type: string, condition: Function, scope?)`.
   - `applyFilters(nodes: any[], context?)`.

5. **`Graph`**

   - `nodes: {id, polygon}[]`.
   - `adjList: Map<nodeId, Array<{nodeId, peso}>>`.
   - `getAdjacencias(nodeId)`, `getNode(nodeId)`, `clone()`.

6. **`Pathfinder`**

   - `findPath(config)`: Principal método, aceita `A_STAR`, `DIJKSTRA`, `BFS`, `DFS`.
   - Diversos callbacks de customização (heuristic, costFunction, validator).

7. **`DebugVisualizer`**
   - `draw()`, `toggle(enabled)`, `captureDebugData()`.
   - `highlightAccessibleAreas(profile)`, `drawAllAgentPaths()`, etc.

---

## **Boas Práticas e Dicas**

1. **Valide sempre seus polígonos**: verifique se não há interseções indesejadas ou vértices desalinhados.
2. **Use camadas com cautela**: As camadas podem aumentar a complexidade, então utilize filtros somente quando necessário.
3. **Otimize o Pathfinding**: Se possível, defina uma boa `heuristic` para o A\* e uma `costFunction` coerente com o custo real de travessia do seu ambiente.
4. **Obstáculos Dinâmicos**: Gerenciar muitos obstáculos pode impactar o desempenho. Se tiver muitos, considere otimizar o `cellSize` do `SpatialGrid`.
5. **DebugVisualizer**: Em produção, você pode desativar (`toggle(false)`) para economizar recursos de desenho.
6. **Agentes**: Se estiver usando `AgentManager`, mantenha cada agente com perfil de camada e custo condizentes com seu tipo (por exemplo, “veículo grande” vs. “humano”).

---

## **Conclusão**

Esta biblioteca oferece um **ecossistema completo** para lidar com navegação em 2D. Desde a fase de **desenho** e **construção** de polígonos, passando por **camadas** e **filtros**, até a **busca de caminhos** com algoritmos clássicos, você tem um toolkit robusto para construir jogos, simulações, ou qualquer sistema que exija pathfinding e gestão de obstáculos.

Para mais exemplos e detalhes internos, consulte o código-fonte já totalmente documentado. Experimente e explore as diversas combinações que a **NavMesh** + **Pathfinder** + **DynamicObstacleManager** e **DebugVisualizer** podem oferecer ao seu projeto.

Boas criações!
