# Guia do Módulo Graph

O módulo **Graph** é responsável por representar um grafo simples para navegação, onde cada nó é definido por um objeto do tipo `{ id, polygon }` e as arestas são representadas por um array no formato `[idA, idB, peso]`. Este módulo é fundamental para o funcionamento dos algoritmos de pathfinding, pois fornece a estrutura de dados sobre a qual os caminhos são calculados.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [API Detalhada](#api-detalhada)
   - [Construtor](#construtor)
   - [_addEdge](#addedge)
   - [getAdjacencias(nodeId)](#getadjacenciasnodeid)
   - [getNode(nodeId)](#getnodenodeid)
   - [clone()](#clone)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas e Dicas](#boas-práticas-e-dicas)
6. [Conclusão](#conclusão)

---

## Visão Geral

O **Graph** é uma estrutura de dados que modela um conjunto de nós e as conexões (arestas) entre eles. Ele permite:

- **Armazenar nós** com informações associadas, como um polígono que define a área correspondente.
- **Gerenciar arestas** que representam a adjacência entre os nós, com um peso que pode ser utilizado para calcular a distância ou o custo de travessia.
- **Clonar o grafo** para operações de atualização sem afetar o grafo original, facilitando a manutenção de versões consistentes durante alterações dinâmicas.

Esta estrutura é utilizada por módulos como o **NavMesh** para construir a malha de navegação e pelos algoritmos de pathfinding para calcular rotas.

---

## Funcionalidades Principais

- **Armazenamento de Nós e Arestas:**  
  O grafo mantém uma lista de nós e uma estrutura de adjacências (um `Map`) para armazenar as arestas de cada nó.

- **Arestas Bidirecionais:**  
  Cada aresta é adicionada de forma bidirecional, ou seja, se há uma conexão entre o nó A e o nó B, o grafo registra a conexão em ambos os nós.

- **Consulta de Adjacências:**  
  É possível recuperar rapidamente as arestas (ou conexões) associadas a um nó específico.

- **Busca de Nó pelo ID:**  
  O método `getNode()` permite localizar um nó com base em seu ID.

- **Clonagem do Grafo:**  
  A função `clone()` gera uma cópia profunda do grafo, permitindo operações que não afetem a estrutura original.

---

## API Detalhada

### Construtor

```js
constructor(nodes = [], edges = [])
```

- **Parâmetros:**
  - `nodes`: Array de objetos no formato `{ id: number, polygon: any }` representando os nós.
  - `edges`: Array de arrays no formato `[number, number, number]`, onde cada array representa uma aresta com dois IDs e um peso.

- **Descrição:**
  - Inicializa o grafo com os nós fornecidos.
  - Cria um `Map` de adjacências para armazenar as conexões entre os nós.
  - Para cada aresta na lista, chama o método interno `_addEdge` para adicioná-la de forma bidirecional.

---

### _addEdge(a, b, w = 1)

```js
_addEdge(a, b, w = 1)
```

- **Parâmetros:**
  - `a`: ID do nó de origem.
  - `b`: ID do nó de destino.
  - `w`: Peso da aresta (padrão: 1).

- **Descrição:**
  - Método privado que adiciona uma aresta à lista de adjacências do nó com ID `a`.
  - Se o nó ainda não tiver uma entrada no `adjList`, é criada uma nova entrada.

---

### getAdjacencias(nodeId)

```js
getAdjacencias(nodeId)
```

- **Parâmetro:**
  - `nodeId`: ID do nó cujo conjunto de arestas deseja consultar.

- **Retorno:**
  - Array de objetos representando as arestas conectadas ao nó. Cada objeto tem o formato `{ nodeId: number, peso: number }`.

- **Descrição:**
  - Recupera as conexões (adjacências) do nó especificado. Se não houver arestas, retorna um array vazio.

---

### getNode(nodeId)

```js
getNode(nodeId)
```

- **Parâmetro:**
  - `nodeId`: ID do nó a ser buscado.

- **Retorno:**
  - O objeto nó que possui o ID correspondente ou `undefined` se não for encontrado.

- **Descrição:**
  - Procura no array de nós e retorna o nó que possui o ID igual a `nodeId`.

---

### clone()

```js
clone()
```

- **Retorno:**
  - Uma nova instância de `Graph` que é uma cópia profunda do grafo original.

- **Descrição:**
  - Cria uma cópia dos nós e do `adjList` (lista de adjacências) para que alterações na cópia não afetem o grafo original. Essa funcionalidade é útil quando se deseja manipular ou atualizar o grafo de forma isolada.

---

## Exemplos de Uso

### Exemplo 1: Criação Básica do Grafo

```js
import { Graph } from "./Graph.js";

// Define alguns nós com seus polígonos (aqui, 'polygon' pode ser um objeto representativo)
const nodes = [
  { id: 0, polygon: { /* dados do polígono */ } },
  { id: 1, polygon: { /* dados do polígono */ } },
  { id: 2, polygon: { /* dados do polígono */ } }
];

// Define arestas no formato [idA, idB, peso]
const edges = [
  [0, 1, 10],
  [1, 2, 15],
  [0, 2, 20]
];

// Cria o grafo
const graph = new Graph(nodes, edges);

console.log("Nós:", graph.nodes);
console.log("Adjacências do nó 0:", graph.getAdjacencias(0));
```

### Exemplo 2: Clonando o Grafo

```js
// Clona o grafo para realizar operações sem afetar o original
const clonedGraph = graph.clone();

console.log("Grafo clonado:", clonedGraph);
```

---

## Boas Práticas e Dicas

- **Consistência dos IDs:**  
  Certifique-se de que os IDs dos nós sejam únicos para evitar conflitos na busca e na criação das adjacências.

- **Arestas Bidirecionais:**  
  O método `_addEdge` adiciona arestas de forma bidirecional automaticamente. Se o seu caso de uso exigir conexões unidirecionais, considere adaptar o método.

- **Clonagem do Grafo:**  
  Utilize o método `clone()` quando precisar modificar temporariamente o grafo sem afetar o grafo original, especialmente em cenários de atualização dinâmica.

- **Estrutura de Dados:**  
  O uso de um `Map` para o `adjList` permite consultas eficientes. Aproveite essa estrutura para otimizar o desempenho dos algoritmos de pathfinding.

---

## Conclusão

O módulo **Graph** fornece uma estrutura simples e eficiente para modelar a rede de conexões entre áreas navegáveis. Com funcionalidades para adicionar, consultar e clonar nós e arestas, ele é a base para os algoritmos de pathfinding e para a construção da NavMesh. Ao utilizar este módulo, você garante que sua aplicação possua uma estrutura sólida para calcular caminhos e gerenciar a navegação em ambientes 2D.

Explore o módulo **Graph** juntamente com os demais componentes da biblioteca para construir sistemas de navegação robustos e dinâmicos.

Boas implementações!