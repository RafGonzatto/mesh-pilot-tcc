# Guia Avançado de Navegação e Pathfinding com NavMesh

Este guia expandido apresenta uma visão aprofundada do uso da biblioteca de _NavMesh_ e _Pathfinding_, exemplificada pelo "NavMesh Demo Game". O objetivo é fornecer uma orientação completa ao desenvolvedor que deseja integrar este tipo de solução em projetos de jogos ou simulações, bem como mostrar como estudar o código de exemplo para entender as entranhas da lib.

---

## Sumário

1. [Visão Geral da Biblioteca](#visão-geral-da-biblioteca)
2. [Arquitetura e Componentes](#arquitetura-e-componentes)  
   2.1 [NavMesh e Polygon](#navmesh-e-polygon)  
   2.2 [AgentManager e AgentProfile](#agentmanager-e-agentprofile)  
   2.3 [Obstáculos Dinâmicos e Spatial Grid](#obstáculos-dinâmicos-e-spatial-grid)  
   2.4 [DebugVisualizer](#debugvisualizer)
3. [Exemplo Prático: NavMesh Demo Game](#exemplo-prático-navmesh-demo-game)  
   3.1 [Estrutura de Arquivos](#estrutura-de-arquivos)  
   3.2 [Explicação do Código HTML](#explicação-do-código-html)  
   3.3 [Integração do `game.js` com a Lib](#integração-do-gamejs-com-a-lib)  
   3.4 [Fluxo de Execução](#fluxo-de-execução)
4. [Boas Práticas e Customizações](#boas-práticas-e-customizações)  
   4.1 [Criação de Terrenos e Layers](#criação-de-terrenos-e-layers)  
   4.2 [Manipulação de Obstáculos e Áreas Bloqueadas](#manipulação-de-obstáculos-e-áreas-bloqueadas)  
   4.3 [Perfis de Agentes e Balanceamento de Custos](#perfis-de-agentes-e-balanceamento-de-custos)  
   4.4 [Depuração e Ajuste de Desempenho](#depuração-e-ajuste-de-desempenho)
5. [Aprofundamento Teórico](#aprofundamento-teórico)  
   5.1 [Modelagem de Grafos e Algoritmos de Pathfinding](#modelagem-de-grafos-e-algoritmos-de-pathfinding)  
   5.2 [Estruturas de Dados Geométricas](#estruturas-de-dados-geométricas)  
   5.3 [Arquitetura Baseada em Componentes](#arquitetura-baseada-em-componentes)
6. [Referências Acadêmicas e Recomendações](#referências-acadêmicas-e-recomendações)
7. [Conclusão](#conclusão)

---

## Visão Geral da Biblioteca

A biblioteca fornece:

- **NavMesh** – Uma malha de navegação baseada em polígonos.
- **Pathfinding** – Algoritmos como A\*, BFS, Dijkstra e DFS, aplicados sobre o grafo gerado pelo NavMesh.
- **AgentManager** – Gerencia diferentes agentes, cada qual com suas restrições (tamanho, custos de terreno, etc.).
- **DebugVisualizer** – Fornece recursos de depuração para inspecionar caminhos, polígonos e dados de desempenho em tempo real.

A principal finalidade é auxiliar desenvolvedores de jogos e simulações a criar ambientes navegáveis, permitindo que entidades (agentes) encontrem rotas plausíveis considerando obstáculos, diferentes tipos de solo e custos de travessia (ex.: água, estrada, ponte, etc.).

---

## Arquitetura e Componentes

### 2.1 **NavMesh e Polygon**

- **NavMesh**  
  Estrutura central que gerencia um conjunto de _Polygon_ (regiões), formando um grafo de navegação. Cada _Polygon_ indica uma área do cenário que pode ser navegada e contém propriedades como “layer” (_ground_, _water_, etc.).

- **Polygon**  
  Classe que define cada polígono:
  - **Vertices**: Lista de pontos (x, y) que formam o contorno da área.
  - **Layer**: Indica qual tipo de terreno ou camada.
  - **Neighbors**: Polígonos adjacentes, permitindo a formação de um grafo.

**Processo de Construção**

1. Cria-se diversos _Polygon_ (ex.: em forma de grade ou em qualquer formato geométrico).
2. Conecta-se polígonos vizinhos, gerando um grafo onde cada nó é um polígono e cada aresta representa uma adjacência navegável.
3. O _NavMesh_ indexa e organiza esses polígonos para que algoritmos de pathfinding possam criar rotas entre eles.

### 2.2 **AgentManager e AgentProfile**

- **AgentProfile**  
  Armazena informações sobre o “tipo” de agente:

  - **radius** (raio de colisão)
  - **minPathWidth** (largura mínima do caminho)
  - **allowedLayers** (quais terrenos são permitidos)
  - **terrainCosts** (penalidades de custo ao caminhar em cada layer)

  Isso permite que um “car” evite água ou que um “boat” prefira água e sofra grande penalidade em terra.

- **AgentManager**  
  Responsável por criar, atualizar e remover agentes:
  - **createAgent**(id, tipo, posição) – Instancia um agente.
  - **updateAgent**(id, velocidade) – Move o agente de acordo com sua rota de navegação.
  - **setAgentTarget**(id, alvo, recalcular) – Define o destino de um agente, acionando o _pathfinding_.

Cada agente guarda:

- Posição atual
- Caminho ativo (lista de pontos)
- Índice do próximo ponto a atingir
- Referência ao _AgentProfile_

### 2.3 **Obstáculos Dinâmicos e Spatial Grid**

O _NavMesh_ pode ser configurado para lidar com obstáculos dinâmicos que surgem ou desaparecem durante a execução:

- **DynamicObstacleManager**: Gera uma “área de exclusão” no grafo, ajustando as conexões dos polígonos, pois trechos antes navegáveis podem ser bloqueados.
- **Spatial Grid**: É um método de subdivisão espacial usado para acelerar busca/deteção de colisões e interseções, especialmente útil se o cenário tiver grande número de obstáculos dinâmicos.

### 2.4 **DebugVisualizer**

Ferramenta para:

- Desenhar as arestas do NavMesh
- Exibir rótulos de polígonos e nós
- Visualizar caminhos dos agentes
- Mostrar _spatial grid_ (grades e células)

Fornece dados em tempo real para serem exibidos num modal ou console, como número de nós, quantidade de polígonos, dimensões da grid e caminhos atuais dos agentes.

---

## Exemplo Prático: NavMesh Demo Game

### 3.1 **Estrutura de Arquivos**

A demo está separada em três arquivos principais:

1. **`index.html`** – Contém a estrutura do jogo (canvas, botões, modal de debug).
2. **`main.css`** – Aplica estilos a todos os elementos.
3. **`game.js`** – Carrega a lib (seu arquivo de entrada único) e implementa a lógica do jogo: inicialização de NavMesh, criação de agentes, atualização do loop, etc.

```plaintext
navmesh-demo/
├── index.html
├── main.css
└── game.js
```

### 3.2 **Explicação do Código HTML**

#### Cabeçalho (Head)

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>NavMesh Demo Game</title>
    <link rel="stylesheet" href="main.css" />
  </head>
</html>
```

- Especifica o tipo de documento HTML5, define o idioma e linka o arquivo de estilos `main.css`.

#### Corpo (Body)

```html
<body>
  <!-- Imagens (pré-carregadas no onload) -->
  <img id="obstacleImage" src="../../static/obstacle.png" />
  ...
  <!-- Painéis fixos -->
  <div id="gameStatus"> ... </div>
  <div id="controls"> ... </div>
  <div id="howToPlay"> ... </div>
  <div id="layerLegend"> ... </div>

  <!-- Canvas principal e Canvas de debug -->
  <div id="gameContainer">
    <canvas id="gameCanvas"></canvas>
    <canvas id="debugCanvas"></canvas>
  </div>

  <!-- Modal de Debug -->
  <div id="debugModal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeDebugModal()">&times;</span>
      <pre id="debugLog"></pre>
    </div>
  </div>

  <script type="module" src="game.js"></script>
</body>
</html>
```

- As imagens (ex.: `carImage`, `boatImage`, etc.) são **ocultas** via CSS, mas ficam prontas para uso dentro do `canvas`.
- **Divs** fixas servem de overlay para exibir controles, status do jogo, instruções e legenda de custos de terreno.
- Há **dois canvases**:
  - `gameCanvas`: Renderização do cenário e agentes.
  - `debugCanvas`: Sobreposto para visualizar depuração (linhas, nós, labels).
- O **modal de debug** (`debugModal`) exibe dados de depuração mais complexos, atualizados dinamicamente pelo sistema de debug.
- No fim, chamamos `game.js`, que inicializa o jogo e faz uso da lib.

### 3.3 **Integração do `game.js` com a Lib**

Trechos importantes:

```js
import {
  NavMesh,
  DebugVisualizer,
  AgentProfile,
  Polygon,
  AgentManager,
} from "../../src/index.js";
```

- O arquivo `index.js` (da sua lib) reexporta todos os módulos essenciais para serem utilizados no script.

```js
this.navMesh = new NavMesh(true);
this.navMesh.enableDynamicObstacles({
  cellSize: 80,
  autoUpdate: true,
  obstacleLayer: "dynamic",
});
```

- Configura o _NavMesh_ para lidar com obstáculos dinâmicos.

```js
this.debug = new DebugVisualizer(this.debugCtx, this.navMesh, {
  debugEventLog: true,
  showLabels: true,
  showSpatialGrid: true,
});
```

- Inicializa o componente de debug no canvas de depuração.

```js
this.agentManager.registerProfile("human", new AgentProfile({...}))
this.agentManager.createAgent("agent1", "human", {x:50, y:50});
```

- Registra um perfil e cria um agente "human" posicionado em (50,50).

### 3.4 **Fluxo de Execução**

1. **Carregamento**: Ao abrir `index.html`, o script `game.js` pré-carrega imagens e inicializa o _Game_.
2. **Inicialização**:
   - Cria o _NavMesh_, registra layers e perfis de agentes.
   - Gera uma “grade” de polígonos aleatórios e conecta vizinhos.
3. **Loop de Jogo**:
   - Limpa o canvas.
   - Desenha todos os polígonos (camada “ground”, “water”, “road”, etc.).
   - Atualiza agentes (move-os em direção a seus destinos) e os desenha.
   - Se o modo debug estiver ativo, desenha linhas extras (arestas, caminhos, rótulos).
4. **Eventos de Usuário**:
   - Clique: Define alvo para o agente selecionado.
   - Duplo Clique: Adiciona um obstáculo dinâmico (ex.: caixa) no local clicado.
   - Botões de UI: Alternam debug, pausam o jogo, abrem modal de debug, etc.

---

## Boas Práticas e Customizações

### 4.1 **Criação de Terrenos e Layers**

- **Registre** cada camada com cores e texturas distintas:
  ```js
  layerSystem.registerLayer("bridge", {
    color: "#8b4513",
    imageId: "bridgeImage",
  });
  ```
- **Use Patterns ou Sprites** para dar aparência customizada à camada no canvas.

### 4.2 **Manipulação de Obstáculos e Áreas Bloqueadas**

- Sempre que adicionar ou remover um obstáculo:
  ```js
  navMesh.dynamicObstacleManager.addObstacle(novoObstaculo);
  navMesh.buildGraphConsideringObstacles(...);
  ```
  Isso atualiza o grafo, recalculando as áreas que ficam intransitáveis.

### 4.3 **Perfis de Agentes e Balanceamento de Custos**

- Defina **custos de terreno** de forma coerente. Ex.: um barco pode ter custo muito alto em terra para evitar atravessar uma área que não é viável.
- Ajuste **minPathWidth** e **radius** para impedir que agentes tentem passar onde fisicamente não caberiam.

### 4.4 **Depuração e Ajuste de Desempenho**

- Use o **DebugVisualizer** para exibir a “espacial grid” e verificar se os obstáculos são atualizados corretamente.
- **Otimize** o tamanho das células (`cellSize`) de acordo com a densidade de obstáculos para balancear precisão e desempenho.

---

## Aprofundamento Teórico

### 5.1 **Modelagem de Grafos e Algoritmos de Pathfinding**

- **Grafos de Polígonos**: Cada polígono é um nó do grafo, suas conexões (edges) representam adjacências.
- **Algoritmos**: A lib normalmente emprega A\*, Dijkstra ou BFS, conforme configurado.
  - **A\***: Encontrará o caminho ótimo se a heurística for consistente.
  - **Dijkstra**: Adequado se não houver heurística viável ou se todos os caminhos precisarem ser analisados uniformemente.
  - **BFS/DFS**: Úteis para exploração inicial ou debug, mas não tão eficientes para cenários complexos.

### 5.2 **Estruturas de Dados Geométricas**

- **Spatial Grid**: Divide o mapa em células, cada célula guarda os polígonos/obstáculos que a interceptam. Isso acelera consultas de “quem está aqui?” ou “quem está próximo?”.
- **Índice Espacial (Quadtree, BSP, etc.)**: Poderia ser integrado à lib para lidar com cenários vastos ou 3D.

### 5.3 **Arquitetura Baseada em Componentes**

- O uso de **AgentProfile** como componente de comportamento (custos, raio, etc.) segue a abordagem de _component-based architecture_, comum em engines de jogo. Isso facilita adicionar novos comportamentos sem duplicar código.

---

## Referências Acadêmicas e Recomendações

- **Hart, P. E., Nilsson, N. J., & Raphael, B. (1968)**  
  _A Formal Basis for the Heuristic Determination of Minimum Cost Paths_.  
  _IEEE Transactions on Systems Science and Cybernetics._

- **Millington, I. (2009)**  
  _Artificial Intelligence for Games_. Routledge.

- **Buckland, M. (2005)**  
  _Programming Game AI by Example_. Course Technology.

Essas obras discutem algoritmos de pathfinding, modelagem de cenários, heurísticas de busca e abordagens de inteligência artificial para jogos.

---

## Conclusão

A biblioteca de _NavMesh_ e _Pathfinding_ apresentada oferece um **framework robusto** para criar ambientes navegáveis em jogos 2D/3D. O _NavMesh Demo Game_ exemplifica como integrar esses componentes em uma aplicação real, demonstrando:

- **Criação e gerenciamento** de polígonos (NavMesh + Polygon)
- **Perfis de agentes** com diferentes restrições (AgentProfile)
- **Adaptação a obstáculos dinâmicos** em tempo de execução
- **Depuração avançada** com DebugVisualizer

Com esse guia, o desenvolvedor pode aprofundar-se na leitura do código-fonte de `game.js` e depois investigar o funcionamento interno da lib em `NavMesh`, `AgentManager`, `DebugVisualizer` e outras classes. Entender como cada parte funciona permite **personalizar e expandir** o sistema para cenários mais complexos, desde jogos de estratégia até simulações de multidões em ambientes realistas.
