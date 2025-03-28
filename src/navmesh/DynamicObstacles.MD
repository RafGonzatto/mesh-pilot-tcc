# Guia do DynamicObstacleManager e SpatialGrid

Este guia descreve como utilizar o **DynamicObstacleManager** – responsável por gerenciar obstáculos dinâmicos e atualizar o grafo de navegação – e o **SpatialGrid**, que fornece uma indexação espacial para consulta eficiente de arestas. Esses módulos são fundamentais para aplicações que exigem atualização em tempo real dos caminhos de navegação quando o ambiente muda.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [DynamicObstacleManager](#dynamicobstaclemanager)
   - [Objetivos e Funcionalidades](#objetivos-e-funcionalidades)
   - [Fluxo de Funcionamento](#fluxo-de-funcionamento)
   - [API: Principais Métodos](#api-principais-métodos-do-dynamicobstaclemanager)
   - [Exemplo de Uso](#exemplo-de-uso-do-dynamicobstaclemanager)
3. [SpatialGrid](#spatialgrid)
   - [Objetivo](#objetivo)
   - [Como Funciona](#como-funciona)
   - [API: Principais Métodos](#api-principais-métodos-do-spatialgrid)
4. [Boas Práticas e Dicas](#boas-práticas-e-dicas)
5. [Conclusão](#conclusão)

---

## Visão Geral

A dinâmica de obstáculos é essencial em sistemas de navegação modernos, onde elementos do ambiente podem mudar em tempo real (ex.: veículos, pedestres ou objetos móveis). O **DynamicObstacleManager** trabalha em conjunto com o **NavMesh** para:

- **Adicionar, remover e atualizar obstáculos** dinâmicos (representados como polígonos).
- **Atualizar automaticamente o grafo de navegação** para refletir alterações no ambiente.
- Utilizar um sistema de indexação espacial (**SpatialGrid**) para encontrar rapidamente as arestas do grafo que podem ser bloqueadas por um obstáculo.

---

## DynamicObstacleManager

### Objetivos e Funcionalidades

- **Gerenciamento de Obstáculos Dinâmicos:** Permite adicionar, remover ou atualizar obstáculos durante a execução da aplicação.
- **Atualização Automática do Grafo:** Ao modificar obstáculos, o gerenciador atualiza o grafo (caso `autoUpdate` esteja habilitado), removendo arestas bloqueadas.
- **Integração com Eventos:** Emite eventos como `obstacleadded`, `obstacleremoved` e erros, e também notifica o **NavMesh** para indicar atualizações no grafo.

### Fluxo de Funcionamento

1. **Inicialização:**
   - No construtor, o gerenciador recebe uma instância do **NavMesh** e as opções de configuração (como `cellSize`, `autoUpdate` e `obstacleLayer`).
   - Cria estruturas para armazenar obstáculos, arestas bloqueadas e mapeamento entre arestas e obstáculos.
   - Chama o método `init()`, que constrói o índice espacial das arestas através do método privado `_buildSpatialIndex()`.

2. **Construção do Índice Espacial:**
   - Se o grafo do **NavMesh** ainda não estiver disponível, o método aguarda o evento `graphbuilt`.
   - Uma vez disponível, para cada nó do grafo, insere as arestas (obtidas a partir dos polígonos) no **SpatialGrid**.

3. **Adição de Obstáculos:**
   - Ao chamar `addObstacle(obstacle)`, um obstáculo (um polígono) é adicionado.
   - O gerenciador identifica quais arestas do grafo são bloqueadas pelo obstáculo usando `_findBlockedEdges(obstacle)`.
   - Atualiza as coleções internas: adiciona o obstáculo, atualiza o conjunto de arestas bloqueadas e mapeia os obstáculos para cada aresta.
   - Se `autoUpdate` estiver ativo, atualiza o grafo da **NavMesh** através do método `_updateNavMeshGraph()`.

4. **Remoção e Atualização de Obstáculos:**
   - `removeObstacle(obstacleId)` remove o obstáculo, liberando as arestas bloqueadas associadas.
   - `updateObstacle(obstacleId, newObstacle)` remove o obstáculo antigo e adiciona o novo.

5. **Atualização do Grafo:**
   - O método `_updateNavMeshGraph()` clona o grafo atual e remove as arestas que foram bloqueadas.
   - Essa atualização garante que o sistema de navegação reflita o ambiente atual.

### API: Principais Métodos do DynamicObstacleManager

| Método                                  | Descrição                                                                                  |
|-----------------------------------------|--------------------------------------------------------------------------------------------|
| **constructor(navMesh, options?)**      | Inicializa o gerenciador com a instância do NavMesh e configurações opcionais.             |
| **init()**                              | Constrói o índice espacial das arestas do grafo.                                            |
| **_buildSpatialIndex()**                | (Privado) Cria o índice espacial; aguarda a construção do grafo se necessário.              |
| **addObstacle(obstacle: Polygon)**        | Adiciona um obstáculo dinâmico e atualiza o grafo; retorna um ID único para o obstáculo.      |
| **removeObstacle(obstacleId: string)**      | Remove o obstáculo especificado e libera as arestas bloqueadas.                              |
| **updateObstacle(obstacleId: string, newObstacle: Polygon)** | Atualiza a posição ou forma do obstáculo.                                               |
| **_findBlockedEdges(obstacle: Polygon)**  | (Privado) Identifica as arestas bloqueadas pelo obstáculo, retornando um conjunto de IDs.     |
| **_edgeIntersectsObstacle(...)**          | (Privado) Verifica se uma aresta intercepta o obstáculo.                                      |
| **_getEdgeId(edge, nodeId)**              | (Privado) Gera um identificador único para uma aresta com base nos seus pontos e ID do nó.     |
| **_updateNavMeshGraph()**                 | (Privado) Atualiza o grafo removendo as arestas bloqueadas.                                  |
| **_edgesEqual(edge, start, end)**          | (Privado) Compara duas arestas para verificar se são equivalentes.                           |

### Exemplo de Uso do DynamicObstacleManager

```js
import { NavMesh } from "./NavMesh.js";
import { Polygon } from "./Polygon.js";

// Crie a instância da NavMesh e construa o grafo
const navMesh = new NavMesh(true);
navMesh.addPolygon(new Polygon([
  { x: 10, y: 10 },
  { x: 100, y: 10 },
  { x: 100, y: 80 },
  { x: 10, y: 80 }
]));
navMesh.buildGraph();

// Habilite o DynamicObstacleManager
const dynamicObstacleManager = navMesh.enableDynamicObstacles();

// Crie um obstáculo (polígono)
const obstaclePoly = new Polygon([
  { x: 50, y: 50 },
  { x: 60, y: 50 },
  { x: 60, y: 60 },
  { x: 50, y: 60 }
]);

// Adicione o obstáculo
const obstacleId = dynamicObstacleManager.addObstacle(obstaclePoly);

// Em seguida, se necessário, remova ou atualize o obstáculo
// dynamicObstacleManager.removeObstacle(obstacleId);
// dynamicObstacleManager.updateObstacle(obstacleId, newObstaclePoly);
```

---

## SpatialGrid

### Objetivo

O **SpatialGrid** é uma estrutura de dados que divide o espaço em células, permitindo a **indexação espacial** de arestas. Isso torna a consulta por arestas que se sobrepõem a uma determinada região (bounding box) muito eficiente.

### Como Funciona

1. **Divisão do Espaço:**
   - O espaço é dividido em células de tamanho fixo (`cellSize`), que pode ser configurado (padrão: 100 unidades).
2. **Inserção de Arestas:**
   - Cada aresta é inserida na grade com base na sua bounding box, associada ao ID do nó de origem.
3. **Consulta:**
   - Ao consultar uma bounding box, o SpatialGrid determina todas as células que a cobrem e retorna as arestas armazenadas nessas células.

### API: Principais Métodos do SpatialGrid

| Método                                        | Descrição                                                                                    |
|-----------------------------------------------|----------------------------------------------------------------------------------------------|
| **constructor(cellSize?)**                     | Cria uma instância do SpatialGrid com o tamanho de célula especificado.                      |
| **insertEdge(edge, nodeId)**                   | Insere uma aresta no grid, associando-a ao ID do nó.                                         |
| **query(bbox)**                                | Retorna um array de objetos contendo arestas e IDs dos nós que se encontram na bounding box.  |
| **_getEdgeBBox(edge)**                         | (Privado) Calcula a bounding box de uma aresta.                                              |
| **_getCellsForBBox(bbox)**                     | (Privado) Determina as células do grid que uma bounding box cobre.                           |
| **_cellKey(cell)**                             | (Privado) Gera uma chave única para identificar uma célula com base em suas coordenadas.       |

### Exemplo de Uso do SpatialGrid

O **DynamicObstacleManager** utiliza o **SpatialGrid** internamente. Contudo, o uso isolado pode ser feito da seguinte forma:

```js
import { SpatialGrid } from "./DynamicObstacleManager.js"; // ou o caminho adequado

const grid = new SpatialGrid(100);

// Suponha que temos uma aresta definida por dois pontos
const edge = {
  start: { x: 20, y: 30 },
  end: { x: 80, y: 90 }
};
const nodeId = 1;

// Insere a aresta no grid
grid.insertEdge(edge, nodeId);

// Consulta arestas em uma região específica
const bbox = { xmin: 0, ymin: 0, xmax: 100, ymax: 100 };
const results = grid.query(bbox);
console.log("Arestas encontradas:", results);
```

---

## Boas Práticas e Dicas

- **Configuração do `cellSize`:**  
  Ajuste o tamanho das células no **SpatialGrid** de acordo com a densidade do seu mapa. Um valor muito pequeno pode gerar muitas células, enquanto um valor muito alto pode reduzir a eficiência da consulta.

- **Manutenção do Grafo:**  
  Utilize a opção `autoUpdate` para que o grafo seja automaticamente atualizado sempre que houver mudanças. Se precisar de mais controle, desative essa opção e gerencie as atualizações manualmente.

- **Tratamento de Erros:**  
  Verifique os eventos de erro emitidos pelo **DynamicObstacleManager** para capturar e tratar exceções durante a adição, remoção ou atualização de obstáculos.

- **Integração com o NavMesh:**  
  Certifique-se de que o **NavMesh** já possui um grafo construído antes de utilizar o **DynamicObstacleManager**. Caso contrário, o gerenciador aguardará o evento `graphbuilt`.

---

## Conclusão

O **DynamicObstacleManager** e o **SpatialGrid** juntos fornecem um sistema robusto para lidar com mudanças dinâmicas no ambiente de navegação. Ao utilizar essas ferramentas, você pode:

- Gerenciar obstáculos que se movem ou mudam de forma.
- Atualizar o grafo de navegação de forma eficiente, garantindo que os agentes sempre encontrem os caminhos corretos.
- Realizar consultas espaciais rápidas para identificar arestas afetadas por obstáculos.

Com este guia, você está preparado para integrar e utilizar esses módulos na sua aplicação, melhorando a resiliência e a adaptabilidade do seu sistema de navegação.

Boa implementação!