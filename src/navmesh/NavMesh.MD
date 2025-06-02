# Guia do NavMesh

O **NavMesh** é o núcleo do sistema de navegação em 2D desta biblioteca. Ele gerencia a malha de navegação através da adição de polígonos, construção de grafos de adjacência e integração com obstáculos dinâmicos, camadas e agentes. Este guia detalha como utilizar o NavMesh e explorar suas funcionalidades para construir mapas navegáveis robustos e dinâmicos.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [API Detalhada](#api-detalhada)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas e Dicas](#boas-práticas-e-dicas)
6. [Conclusão](#conclusão)

---

## 1. Visão Geral

O módulo **NavMesh** é responsável por:
- **Gerenciar Polígonos:** Permite adicionar polígonos que representam áreas navegáveis.
- **Construir Grafos:** Cria um grafo de adjacências entre os polígonos, essencial para os algoritmos de pathfinding.
- **Integrar Obstáculos Dinâmicos:** Atualiza o grafo automaticamente quando obstáculos (dinâmicos) são inseridos ou removidos.
- **Gerenciar Agentes:** Incorpora um sistema para criar e atualizar agentes que se movem na malha.
- **Suporte a Camadas:** Utiliza o sistema de camadas (LayerSystem) para aplicar filtros e custos diferenciados para diferentes tipos de terreno.

O NavMesh funciona como um hub que integra componentes como **Polygon**, **Graph**, **DynamicObstacleManager**, **AgentManager** e **LayerSystem**.

---

## 2. Funcionalidades Principais

- **Adição de Polígonos:**  
  Valida e adiciona instâncias de `Polygon` à malha, garantindo que o polígono pertença a uma camada registrada.

- **Construção de Grafos:**  
  - **buildGraph():** Cria um grafo básico considerando a adjacência entre os polígonos.
  - **buildGraphConsideringObstacles():** Constrói o grafo removendo arestas bloqueadas por obstáculos.

- **Verificação de Adjacência:**  
  Utiliza métodos internos (_saoAdjacentes, _bboxOverlap, _segmentsIntersect, etc.) para identificar se dois polígonos são adjacentes e, portanto, conectados.

- **Cálculo de Distâncias:**  
  Calcula o peso das arestas com base na distância entre os centros dos polígonos.

- **Integração com Obstáculos Dinâmicos:**  
  Ativa o `DynamicObstacleManager` para que o grafo seja atualizado automaticamente conforme o ambiente muda.

- **Gerenciamento de Agentes:**  
  Incorpora um `AgentManager` que utiliza o grafo para encontrar e atualizar caminhos dos agentes.

- **Sistema de Camadas:**  
  Utiliza o `LayerSystem` para definir propriedades e filtros de diferentes camadas, influenciando o custo e a travessia.

---

## 3. API Detalhada

### Construtor

```js
constructor(enableLogs = false)
```

- **Parâmetros:**  
  - `enableLogs` (boolean): Habilita logs para depuração (padrão: `false`).

- **Inicialização:**  
  - Cria um array interno de polígonos (`_polygons`) e uma referência para o grafo (`_graph`).
  - Instancia o `LayerSystem` e ativa o `DynamicObstacleManager` e `AgentManager`.

---

### Métodos de Adição e Construção

#### **addPolygon(poly)**

- **Descrição:**  
  Adiciona um polígono à malha, validando se o objeto é uma instância de `Polygon` e se sua camada está registrada.

- **Parâmetro:**  
  - `poly`: Instância de `Polygon`.

- **Eventos Emitidos:**  
  - `polygonadded` (em caso de sucesso).
  - `error` (se ocorrer um problema).

#### **buildGraph()**

- **Descrição:**  
  Constrói o grafo básico considerando adjacências entre os polígonos, sem obstáculos.

- **Processo:**  
  - Mapeia cada polígono para um nó.
  - Verifica adjacência entre os nós usando métodos internos.
  - Calcula o peso das arestas com base na distância entre os centros dos polígonos.
  - Cria uma nova instância de `Graph` com os nós e arestas gerados.
  
- **Eventos Emitidos:**  
  - `graphbuilt`.

#### **buildGraphConsideringObstacles(obstacles = [])**

- **Descrição:**  
  Similar ao `buildGraph()`, mas remove arestas onde a linha entre os centros dos polígonos intercepta algum obstáculo.

- **Parâmetro:**  
  - `obstacles`: Array de instâncias de `Polygon` que representam os obstáculos.

- **Eventos Emitidos:**  
  - Loga informações sobre arestas bloqueadas e, em seguida, atualiza o grafo.

---

### Métodos Internos de Verificação

- **_saoAdjacentes(pA, pB):**  
  Verifica se dois polígonos são adjacentes com base na sobreposição de bounding boxes e interseção de arestas.

- **_bboxOverlap(a, b):**  
  Verifica se duas bounding boxes se sobrepõem.

- **_segmentsIntersect(p1, p2, p3, p4):**  
  Determina se dois segmentos se intersectam, incluindo casos de colinearidade.

- **_direction(p1, p2, p3):**  
  Calcula a direção relativa de um ponto em relação a um segmento.

- **_onSegment(p1, p2, p3):**  
  Verifica se um ponto está dentro de um segmento.

- **_calcDistCenter(a, b):**  
  Calcula a distância euclidiana entre os centros de dois polígonos.

- **_bloqueadoPorObstaculo(A, B, obstacles):**  
  Verifica se a linha entre dois pontos intercepta algum obstáculo.

- **_lineIntersectsPolygon(p1, p2, poly):**  
  Checa se uma linha intercepta o polígono, seja por interseção com arestas ou se um dos pontos está dentro do polígono.

---

### Integração com Outros Módulos

- **enableDynamicObstacles(options):**  
  Inicializa o `DynamicObstacleManager` para atualizar o grafo automaticamente quando obstáculos mudam.

- **createAgentManager():**  
  Cria e retorna o `AgentManager` para gerenciar agentes que se movem na malha.

- **Getters:**  
  - `graph`: Retorna o grafo atual.
  - `polygons`: Retorna a lista de polígonos.
  - `dynamicObstacleManager`: Retorna o gerenciador de obstáculos dinâmicos.
  - `agentManager`: Retorna o gerenciador de agentes.

---

## 4. Exemplos de Uso

### Exemplo Básico: Construindo o NavMesh

```js
import { NavMesh } from "./NavMesh.js";
import { Polygon } from "./Polygon.js";

// Cria uma instância do NavMesh com logs ativados
const navMesh = new NavMesh(true);

// Cria dois polígonos e adiciona-os ao NavMesh
const poly1 = new Polygon([
  { x: 10, y: 10 },
  { x: 110, y: 10 },
  { x: 110, y: 80 },
  { x: 10, y: 80 }
]);

const poly2 = new Polygon([
  { x: 120, y: 10 },
  { x: 220, y: 10 },
  { x: 220, y: 80 },
  { x: 120, y: 80 }
]);

navMesh.addPolygon(poly1);
navMesh.addPolygon(poly2);

// Constrói o grafo de navegação sem considerar obstáculos
navMesh.buildGraph();

// Acesse o grafo e os polígonos
console.log("Nó do grafo:", navMesh.graph);
console.log("Polígonos:", navMesh.polygons);
```

### Exemplo Avançado: Utilizando Obstáculos Dinâmicos

```js
import { Polygon } from "./Polygon.js";

// Crie um obstáculo (polígono)
const obstacle = new Polygon([
  { x: 60, y: 40 },
  { x: 90, y: 40 },
  { x: 90, y: 70 },
  { x: 60, y: 70 }
]);

// Construa o grafo considerando o obstáculo
navMesh.buildGraphConsideringObstacles([obstacle]);
```

### Exemplo: Gerenciamento de Agentes e Camadas

```js
// Após construir o grafo, use o AgentManager para criar e gerenciar agentes
const agentManager = navMesh.createAgentManager();

// Exemplo: criar um agente, definir destino e atualizar posição
agentManager.createAgent("agent1", "default", { x: 20, y: 20 });
agentManager.setAgentTarget("agent1", { x: 200, y: 100 });

// No loop de atualização do seu aplicativo, movimente o agente:
function update() {
  agentManager.updateAgent("agent1", 2); // Atualiza com um "step" de 2 unidades
  requestAnimationFrame(update);
}
update();
```

---

## 5. Boas Práticas e Dicas

- **Validação de Camadas:**  
  Certifique-se de que todos os polígonos adicionados possuem camadas registradas no `LayerSystem` para evitar erros.

- **Utilize Logs para Depuração:**  
  Habilite `enableLogs` durante o desenvolvimento para rastrear a construção do grafo e identificar problemas na adição de polígonos e na verificação de obstáculos.

- **Ambiente Dinâmico:**  
  Se o ambiente mudar frequentemente (por exemplo, obstáculos surgindo e desaparecendo), utilize o `DynamicObstacleManager` para atualizar o grafo automaticamente.

- **Integração com Agentes:**  
  Combine o uso do `AgentManager` com o `NavMesh` para que os agentes recalculam seus caminhos automaticamente quando o grafo é atualizado.

---

## 6. Conclusão

O módulo **NavMesh** integra diversos componentes essenciais para a navegação em ambientes 2D. Ele permite a criação de uma malha de polígonos, a construção de grafos de adjacência com e sem obstáculos, e a integração com sistemas de agentes e camadas. Utilizando o NavMesh, você pode construir sistemas de pathfinding robustos e dinâmicos, adequados para aplicações como jogos, simulações e sistemas interativos.

Explore as diversas funcionalidades do NavMesh para aproveitar ao máximo as capacidades da sua biblioteca de navegação.

Boas implementações!