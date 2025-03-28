# Guia do DebugVisualizer

O **DebugVisualizer** é um sistema de visualização para depuração da NavMesh e de seus componentes. Ele permite desenhar, em um canvas HTML, todos os elementos essenciais do sistema de navegação, como polígonos, arestas, obstáculos, caminhos, nós, grid espacial e rótulos. Essa ferramenta é ideal para desenvolvedores que desejam inspecionar e validar o comportamento do sistema de pathfinding durante o desenvolvimento.

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

O **DebugVisualizer** integra com os módulos **NavMesh**, **DynamicObstacleManager**, **Pathfinder** e **AgentManager** para proporcionar uma visão gráfica de todo o sistema de navegação. Ele possibilita:

- **Desenhar polígonos:** Visualizar as áreas definidas na NavMesh.
- **Desenhar arestas:** Exibir as conexões do grafo de navegação.
- **Visualizar obstáculos dinâmicos:** Identificar quais obstáculos estão ativos.
- **Exibir caminhos calculados:** Mostrar os caminhos encontrados pelo algoritmo de pathfinding.
- **Mostrar nós e grid espacial:** Para inspeção detalhada e depuração.
- **Exibir rótulos e informações:** Incluindo IDs de nós, informações sobre obstáculos e estatísticas de caminho.

---

## 2. Funcionalidades Principais

- **Configuração Personalizável:**  
  Permite definir diversas opções visuais (cores, espessura de linhas, visibilidade de elementos, etc.) por meio de um objeto de configuração.

- **Integração com Eventos:**  
  Escuta eventos emitidos pela NavMesh, DynamicObstacleManager, Pathfinder e AgentManager. Isso inclui eventos como:
  - `polygonadded`
  - `graphbuilt`
  - `graphupdated`
  - `obstacleadded` / `obstacleremoved`
  - `pathfound` / `pathblocked`
  - `agentCreated`, `agentPathUpdated` e `agentUpdated`
  - Eventos globais, se habilitados, para monitorar todas as ocorrências.

- **Desenho Dinâmico:**  
  O método `draw()` refaz a renderização do canvas com base na configuração atual e nos dados da NavMesh, atualizando automaticamente sempre que um evento relevante ocorre.

- **Funções de Destaque:**  
  Possui métodos para destacar:
  - Áreas acessíveis para um perfil de agente.
  - Polígonos de camadas específicas.
  - Caminhos de todos os agentes ativos.

- **Depuração Completa:**  
  Armazena um log de eventos para análise posterior, que pode ser acessado via `captureDebugData()`.

---

## 3. API Detalhada

### Construtor

```js
constructor(ctx, navMesh, config = {})
```

- **Parâmetros:**
  - `ctx`: Contexto de desenho do canvas (CanvasRenderingContext2D).
  - `navMesh`: Instância da NavMesh utilizada para extrair os dados de navegação.
  - `config`: Objeto de configuração opcional para customizar a visualização.  
    *Exemplo de propriedades:*
    - `showPolygons`, `showEdges`, `showObstacles`, `showPath`, `showNodes`, `showSpatialGrid`, `showLabels` (booleanos).
    - `polygonColor`, `edgeColor`, `obstacleColor`, `pathColor`, `nodeColor`, `spatialGridColor`, `labelColor` (strings de cor).
    - `debugEventLog`: Se verdadeiro, ativa log global de eventos.
    - `enabled`: Habilita ou desabilita a visualização.

### Métodos de Configuração e Redesenho

- **updateConfig(newConfig)**
  - Atualiza as configurações da visualização e solicita um redesenho.

- **toggle(enabled = true, newConfig = {})**
  - Habilita ou desabilita a visualização e atualiza as configurações, redesenhando ou limpando o canvas conforme necessário.

- **_requestRedraw()**
  - (Privado) Solicita o redesenho do canvas se a visualização estiver habilitada.

### Métodos de Desenho

- **draw()**
  - Executa o desenho completo: limpa o canvas e desenha os elementos conforme as configurações.
  
- **_clearCanvas()**
  - (Privado) Limpa o canvas.

- **_drawPolygons()**
  - (Privado) Desenha todos os polígonos contidos na NavMesh com a cor configurada.

- **_drawEdges()**
  - (Privado) Desenha as arestas do grafo com a cor e espessura configuradas.

- **_drawObstacles()**
  - (Privado) Desenha os obstáculos ativos, baseando-se no conjunto mantido pelo DynamicObstacleManager.

- **_drawPath()**
  - (Privado) Desenha o caminho atual encontrado pelo Pathfinder, incluindo os pontos do caminho.

- **_drawNodes()**
  - (Privado) Desenha os nós do grafo (opcional, se ativado).

- **_drawSpatialGrid()**
  - (Privado) Desenha o grid espacial utilizado para indexação dos obstáculos.

- **_drawLabels()**
  - (Privado) Exibe rótulos para nós, obstáculos e informações do caminho, úteis para depuração.

### Métodos de Destaque e Depuração

- **captureDebugData()**
  - Retorna um objeto com o estado atual do sistema (quantidade de polígonos, nós, obstáculos, caminhos dos agentes, dados do grid e log de eventos).

- **highlightAccessibleAreas(profile)**
  - Destaca, com uma cor específica, as áreas acessíveis para um determinado perfil de agente.

- **drawAllAgentPaths()**
  - Desenha os caminhos de todos os agentes ativos, utilizando a cor definida no perfil de cada agente.

- **highlightLayers(layers, highlightColor)**
  - Destaca os polígonos que pertencem às camadas especificadas, usando a cor de destaque informada.

---

## 4. Exemplos de Uso

### Exemplo 1: Inicialização e Desenho Básico

```js
import { NavMesh } from "./NavMesh.js";
import { DebugVisualizer } from "./DebugVisualizer.js";

// Obtém o contexto do canvas
const canvas = document.getElementById("debugCanvas");
const ctx = canvas.getContext("2d");

// Cria a instância da NavMesh (supondo que já esteja configurada com polígonos e grafo)
const navMesh = new NavMesh(true);
// ... código para adicionar polígonos e construir o grafo ...

// Cria o DebugVisualizer com configurações padrão
const debugVis = new DebugVisualizer(ctx, navMesh, {
  showPolygons: true,
  showEdges: true,
  showObstacles: true,
  showPath: true,
  showLabels: true,
  showNodes: false
});

// Inicia o desenho
debugVis.draw();
```

### Exemplo 2: Atualização Dinâmica e Depuração

```js
// Durante o loop de atualização do seu aplicativo, você pode atualizar a visualização:
function update() {
  // Atualiza a lógica do jogo e a posição dos agentes...
  
  // Redesenha a visualização
  debugVis.draw();
  
  requestAnimationFrame(update);
}
update();

// Para capturar dados de depuração:
const debugData = debugVis.captureDebugData();
console.log("Dados de Debug:", debugData);
```

### Exemplo 3: Destaque de Áreas e Camadas

```js
// Suponha que você queira destacar áreas acessíveis para um agente com um determinado perfil:
const agentProfile = {
  maxSlope: 45,
  minPathWidth: 10,
  allowedLayers: new Set(["default", "road"])
};

debugVis.highlightAccessibleAreas(agentProfile);

// Ou, para destacar polígonos de camadas específicas:
debugVis.highlightLayers(["water", "lava"], "rgba(255, 0, 0, 0.3)");
```

---

## 5. Boas Práticas e Dicas

- **Integração com Eventos:**  
  O DebugVisualizer escuta vários eventos da NavMesh e dos módulos integrados. Certifique-se de que esses eventos estejam sendo emitidos corretamente para que a visualização reflita o estado real do sistema.

- **Configuração Personalizada:**  
  Utilize a função `updateConfig()` para ajustar dinamicamente as configurações de visualização (como cores e elementos visíveis) conforme a necessidade da depuração.

- **Desempenho:**  
  Em ambientes de produção, considere desabilitar a visualização de debug (usando `toggle(false)`) para não impactar o desempenho.

- **Log de Eventos:**  
  O log de eventos armazenado em `eventLog` pode ser muito útil para rastrear problemas e entender o fluxo de operações dentro do sistema de navegação.

- **Redesenho Contínuo:**  
  Para aplicações interativas, integre o `draw()` no loop de atualização do seu aplicativo, garantindo que todas as mudanças sejam imediatamente refletidas na tela.

---

## 6. Conclusão

O **DebugVisualizer** é uma ferramenta essencial para desenvolver e depurar sistemas de navegação 2D. Ele oferece uma visão completa dos elementos que compõem a NavMesh, desde polígonos e arestas até obstáculos dinâmicos e caminhos calculados. Ao utilizar este módulo, você poderá identificar e corrigir problemas rapidamente, além de entender melhor o comportamento do sistema em tempo real.

Explore suas funcionalidades e ajuste as configurações conforme necessário para obter uma depuração eficiente e precisa.

Boas implementações!