# Guia do Pathfinder

O **Pathfinder** é o módulo avançado de pathfinding desta biblioteca, projetado para encontrar caminhos entre dois pontos em um grafo de navegação. Ele suporta diversos algoritmos clássicos, como A\*, Dijkstra, BFS e DFS, e oferece um conjunto de configurações que permitem personalizar a busca conforme as necessidades da sua aplicação.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [API Detalhada](#api-detalhada)
   - [Eventos Globais](#eventos-globais)
   - [Método findPath](#método-findpath)
   - [Algoritmos de Busca](#algoritmos-de-busca)
   - [Funções Auxiliares](#funções-auxiliares)
   - [Utilitários Internos](#utilitários-internos)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas e Dicas](#boas-práticas-e-dicas)
6. [Conclusão](#conclusão)

---

## Visão Geral

O módulo **Pathfinder** é responsável por calcular caminhos em um grafo de navegação. Ele se integra com outros módulos, como o **Graph** e o **NavMesh**, para fornecer uma solução completa de pathfinding. O Pathfinder emite eventos para notificar quando um caminho é solicitado, encontrado ou bloqueado, permitindo que outros componentes da aplicação reajam a essas mudanças.

---

## Funcionalidades Principais

- **Suporte a Múltiplos Algoritmos:**  
  - **A\*** (A_STAR): Usa uma função heurística para encontrar o caminho mais curto de forma eficiente.
  - **Dijkstra:** Calcula o caminho de menor custo sem usar heurística.
  - **BFS:** Busca em largura, útil em grafos não ponderados.
  - **DFS:** Busca em profundidade, também para grafos não ponderados.

- **Configuração Avançada:**  
  Permite definir funções personalizadas para heurística, custo, validação de arestas, e parâmetros como número máximo de iterações, suavização de caminhos e permissões de movimentos diagonais.

- **Eventos de Pathfinding:**  
  Emite eventos como `pathrequested`, `pathfound` e `pathblocked` para facilitar a integração e a depuração.

- **Utilitários Internos:**  
  Possui métodos internos para resolver nós de início/fim, reconstruir caminhos e pós-processar os resultados, calculando a distância total do caminho.

---

## API Detalhada

### Eventos Globais

- **`static on(event, listener)`**  
  Inscreve um listener para eventos globais do Pathfinder.  
  *Exemplo:*  
  ```js
  Pathfinder.on("pathfound", (result) => {
    console.log("Caminho encontrado:", result.path);
  });
  ```

- **`static off(event, listener)`**  
  Remove um listener previamente inscrito.

### Método findPath

```js
static findPath(config)
```

- **Parâmetros:**
  - `config.graph`: Instância do grafo de navegação.
  - `config.start`: Nó inicial ou coordenada `{ x, y }`.
  - `config.end`: Nó final ou coordenada `{ x, y }`.
  - `config.method`: Algoritmo a ser utilizado (`"A*"`, `"DIJKSTRA"`, `"BFS"`, ou `"DFS"`). Padrão é `"A*"`.
  - `config.heuristic`: Função heurística para A\* (padrão utiliza a distância Euclidiana).
  - `config.costFunction`: Função que retorna o custo de uma aresta.
  - `config.maxIterations`: Limite de iterações (padrão 10000).
  - `config.smoothPath`, `config.smoothingTolerance`: Parâmetros para suavização de caminho.
  - `config.partialPath`: Permite retornar caminho parcial se o destino não for alcançado.
  - `config.allowDiagonal`: Permite movimentos diagonais.
  - `config.validator`: Função para validar cada aresta.

- **Retorno:**  
  Um objeto com as seguintes propriedades:
  - `path`: Array de IDs dos nós do caminho.
  - `points`: Array de coordenadas dos centros dos nós que compõem o caminho.
  - `distance`: Distância total do caminho.
  - `complete`: Booleano indicando se o caminho é completo (atingiu o destino).
  - `iterations`: Número de iterações realizadas.
  - `error`: Informações sobre possíveis erros.

### Algoritmos de Busca

O método `findPath` seleciona o algoritmo com base na configuração:

- **A\* (`_aStar`)**  
  Utiliza uma fila de prioridade para explorar os nós com base na soma do custo acumulado e da heurística.  
  Calcula os valores `gScore` e `fScore` para cada nó e reconstrói o caminho quando o destino é alcançado.

- **Dijkstra (`_dijkstra`)**  
  Sem a utilização de heurística, o algoritmo calcula o caminho de menor custo puro através de uma fila de prioridade, atualizando as distâncias e os predecessores.

- **BFS (`_bfs`)**  
  Explora o grafo em largura, adequado para grafos não ponderados, utilizando uma fila simples.

- **DFS (`_dfs`)**  
  Explora o grafo em profundidade, utilizando uma pilha para gerenciar os nós visitados.

### Funções Auxiliares

- **`_resolveNodes(cfg)`**  
  Resolve os nós de início e fim com base nos parâmetros `start` e `end`. Se estes forem números, utiliza o nó diretamente; caso sejam coordenadas, encontra o nó mais próximo.

- **`_findNearestNode(graph, point)`**  
  Percorre os nós do grafo e retorna o nó cujo centro está mais próximo do ponto fornecido.

- **`_reconstructPath(cameFrom, endId)`**  
  Reconstrói o caminho a partir do mapa de predecessores, retornando uma lista de IDs.

- **`_postProcessPath(rawPath, cfg)`**  
  Filtra IDs inválidos, converte os nós em coordenadas (centros) e calcula a distância total do caminho.

- **`_calculatePathDistance(points)`**  
  Soma as distâncias entre pontos consecutivos para determinar o custo total do caminho.

### Utilitários Internos

- **PriorityQueue**  
  Uma fila de prioridade simples utilizada pelos algoritmos A\* e Dijkstra para gerenciar a ordem de exploração dos nós.

- **EventRegistry**  
  Um registro global de eventos que permite o gerenciamento de listeners para o Pathfinder.

- **NavigationEvents**  
  Fornece utilitários para registrar listeners globais com contexto e para criar proxies que facilitam o uso dos métodos de eventos (`on` e `off`).

---

## Exemplos de Uso

### Exemplo 1: Encontrando um Caminho com A\*

```js
import { Pathfinder } from "./Pathfinder.js";
import { Graph } from "../pathfinding/Graph.js";

// Suponha que você tenha um grafo já criado
const graph = new Graph(nodesArray, edgesArray);

// Configuração do pathfinding
const config = {
  graph,
  start: { x: 10, y: 20 },
  end: { x: 300, y: 400 },
  method: "A*", // ou "DIJKSTRA", "BFS", "DFS"
  heuristic: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  costFunction: (edge) => edge.peso,
  maxIterations: 10000,
  partialPath: true,
};

// Encontra o caminho
const pathResult = Pathfinder.findPath(config);

console.log("Caminho encontrado:", pathResult.path);
console.log("Coordenadas do caminho:", pathResult.points);
console.log("Distância total:", pathResult.distance);
```

### Exemplo 2: Uso de Eventos Globais

```js
// Inscreve um listener para quando um caminho for encontrado
Pathfinder.on("pathfound", (result) => {
  console.log("Evento pathfound:", result);
});

// Inscreve um listener para quando o caminho estiver bloqueado
Pathfinder.on("pathblocked", (result) => {
  console.log("Evento pathblocked:", result);
});
```

### Exemplo 3: Encontrando um Caminho com Dijkstra

```js
const dijkstraConfig = {
  graph,
  start: 0, // Utiliza o nó com ID 0
  end: 5,   // Utiliza o nó com ID 5
  method: "DIJKSTRA",
};

const dijkstraResult = Pathfinder.findPath(dijkstraConfig);
console.log("Caminho (Dijkstra):", dijkstraResult.path);
```

---

## Boas Práticas e Dicas

- **Defina Funções Personalizadas:**  
  Personalize a função heurística e a função de custo para refletir as características reais do seu ambiente e dos agentes.

- **Limite de Iterações:**  
  Utilize o parâmetro `maxIterations` para evitar loops infinitos em grafos muito grandes ou mal configurados.

- **Verificação de Caminho Parcial:**  
  Se o destino não for alcançável, configure `partialPath` para retornar o caminho até o último nó alcançado.

- **Utilize Eventos para Depuração:**  
  Inscreva listeners nos eventos `pathrequested`, `pathfound` e `pathblocked` para monitorar o fluxo do algoritmo e identificar possíveis problemas.

- **Teste com Diferentes Algoritmos:**  
  Experimente com A\*, Dijkstra, BFS e DFS para ver qual se adequa melhor ao seu cenário. Cada algoritmo possui características distintas que podem influenciar o desempenho e a qualidade do caminho encontrado.

---

## Conclusão

O **Pathfinder** é um módulo poderoso e flexível para calcular caminhos em grafos de navegação. Com suporte a múltiplos algoritmos, configuração avançada e integração com eventos, ele se adapta a diversas necessidades em aplicações 2D, como jogos e simulações. Ao dominar suas funcionalidades e métodos auxiliares, você poderá implementar soluções de pathfinding robustas e eficientes.

Boas implementações!