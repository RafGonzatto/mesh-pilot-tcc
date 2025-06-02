# Guia do LayerSystem

O **LayerSystem** é um módulo que fornece um sistema de camadas e filtros para navegação avançada. Ele permite registrar camadas, adicionar filtros e aplicá-los nos nós (nodes) durante o cálculo de caminhos, possibilitando uma maior customização e controle do comportamento de travessia em ambientes complexos.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [API Detalhada](#api-detalhada)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas e Dicas](#boas-práticas-e-dicas)
6. [Conclusão](#conclusão)

---

## Visão Geral

O **LayerSystem** tem como objetivo oferecer um mecanismo flexível para classificar e filtrar nós (nodes) com base em camadas. Isso é especialmente útil quando diferentes tipos de superfícies ou regiões (como "terra", "água", "lava") possuem diferentes custos de travessia ou restrições para certos agentes.

Com este sistema, é possível:

- **Registrar camadas** com configurações visuais e de custo.
- **Adicionar filtros** para incluir ou excluir nós com base em condições definidas.
- **Aplicar modificadores de custo** que ajustam o peso das arestas durante o pathfinding.
- Emitir eventos para notificar o restante da aplicação sobre a criação de camadas ou a adição de filtros.

---

## Funcionalidades Principais

- **Registro de Camadas:**  
  Permite criar camadas únicas com atributos como cor para depuração e custo base de travessia.

- **Filtros de Camada:**  
  Três tipos de filtros são suportados:
  - **INCLUSION:** Permite incluir somente nós que satisfaçam uma condição.
  - **EXCLUSION:** Exclui nós que atendam a uma condição.
  - **COST_MODIFIER:** Modifica o custo de travessia de um nó, ajustando o peso das arestas.

- **Aplicação de Filtros:**  
  O método `applyFilters` avalia os filtros cadastrados em um conjunto de nós e retorna somente aqueles que passam em todas as condições.

- **Cálculo do Custo de Aresta:**  
  O método `calculateEdgeCost` computa o custo de movimento para uma aresta, considerando os custos definidos nas camadas dos nós envolvidos.

---

## API Detalhada

### 1. Enumeração dos Tipos de Filtros

```js
static FILTER_TYPES = {
  INCLUSION: "include",
  EXCLUSION: "exclude",
  COST_MODIFIER: "cost",
};
```

- **INCLUSION:** Garante que somente os nós que satisfaçam a condição sejam considerados.
- **EXCLUSION:** Exclui os nós que satisfaçam a condição.
- **COST_MODIFIER:** Aplica um modificador ao custo de travessia do nó.

### 2. Construtor

```js
constructor(navMesh)
```

- **Parâmetros:**
  - `navMesh`: Instância da NavMesh que utilizará as camadas.
- **Comportamento:**
  - Inicializa as estruturas internas (`registeredLayers` e `layerFilters`).
  - Chama o método privado `_initDefaultLayers()` para registrar a camada padrão ("default").

### 3. Registro de Camadas

```js
registerLayer(name, config)
```

- **Parâmetros:**
  - `name` (string): Nome único da camada.
  - `config` (object): Configurações da camada, que incluem:
    - `color` (string): Cor para depuração visual.
    - `traversalCost` (number): Custo base de travessia para a camada.
- **Comportamento:**
  - Verifica se a camada já foi registrada e, em caso afirmativo, lança um erro.
  - Adiciona a camada ao conjunto `registeredLayers` e cria uma estrutura de filtros associada.
  - Emite o evento `layerRegistered` no `navMesh`.

### 4. Adição de Filtros

```js
addFilter(layer, type, condition, scope)
```

- **Parâmetros:**
  - `layer` (string): Nome da camada alvo.
  - `type` (string): Tipo de filtro (usar os valores de `LayerSystem.FILTER_TYPES`).
  - `condition` (Function | number): Função ou valor que define a condição do filtro.
  - `scope` (object, opcional): Contexto de execução para o filtro. Se não fornecido, utiliza o `navMesh`.
- **Comportamento:**
  - Verifica se a camada está registrada; caso contrário, lança um erro.
  - Registra o filtro na estrutura de filtros da camada.
  - Emite o evento `filterAdded` no `navMesh`.

### 5. Aplicação de Filtros

```js
applyFilters(nodes, context = {})
```

- **Parâmetros:**
  - `nodes` (Array): Lista de nós a serem filtrados.
  - `context` (object, opcional): Contexto do agente para avaliação dos filtros.
- **Retorno:**
  - Array de nós que passaram na avaliação dos filtros.
- **Comportamento:**
  - Para cada nó, recupera a configuração da camada e chama o método privado `_evaluateFilters`.

### 6. Avaliação de Filtros (Privado)

```js
_evaluateFilters(layerConfig, node, context)
```

- **Parâmetros:**
  - `layerConfig`: Configurações e filtros da camada.
  - `node`: Nó a ser avaliado.
  - `context`: Contexto do agente.
- **Retorno:**
  - Booleano: `true` se o nó passa em todos os filtros; `false` caso contrário.
- **Lógica:**
  - Para cada filtro cadastrado:
    - **INCLUSION:** O nó deve satisfazer a condição.
    - **EXCLUSION:** O nó deve **não** satisfazer a condição.
    - **COST_MODIFIER:** Multiplica o custo de travessia do nó de acordo com a condição (função ou valor).

### 7. Cálculo do Custo de Aresta

```js
calculateEdgeCost(edge, context)
```

- **Parâmetros:**
  - `edge`: Objeto da aresta contendo propriedades `a`, `b` e `peso`.
  - `context`: Contexto do agente.
- **Retorno:**
  - Número representando o custo total da aresta, calculado como a média dos custos de travessia dos nós envolvidos, multiplicada pelo peso da aresta.

---

## Exemplos de Uso

### Exemplo 1: Registro de Camadas e Filtros

```js
// Suponha que 'navMesh' seja a instância da NavMesh utilizada.
const layerSystem = new LayerSystem(navMesh);

// Registra uma nova camada "water" com custo de travessia elevado
layerSystem.registerLayer("water", {
  color: "#0000ff",
  traversalCost: 5.0
});

// Adiciona um filtro de inclusão para a camada "water"
// Exemplo: somente incluir nós se a profundidade for menor que um valor (função fictícia)
layerSystem.addFilter("water", LayerSystem.FILTER_TYPES.INCLUSION, (node, context) => {
  return node.depth < 3; // condição: profundidade menor que 3
});
```

### Exemplo 2: Aplicação de Filtros em um Conjunto de Nós

```js
// Suponha que 'nodes' seja um array de nós obtidos do grafo da NavMesh.
const context = { agentType: "boat" }; // Contexto do agente
const filteredNodes = layerSystem.applyFilters(nodes, context);
console.log("Nós filtrados:", filteredNodes);
```

### Exemplo 3: Cálculo de Custo de Aresta

```js
// Suponha que 'edge' seja uma aresta com propriedades 'a', 'b' e 'peso'
const cost = layerSystem.calculateEdgeCost(edge, {});
console.log("Custo da aresta:", cost);
```

---

## Boas Práticas e Dicas

- **Defina Camadas Coerentes:**  
  Ao registrar novas camadas, utilize cores e custos que façam sentido para a sua aplicação (por exemplo, "lava" com custo alto e cor vibrante).

- **Utilize Filtros para Personalizar a Navegação:**  
  Use filtros de inclusão e exclusão para garantir que apenas os nós apropriados sejam considerados, conforme o perfil do agente ou outras condições do contexto.

- **Modifique Custos Quando Necessário:**  
  Filtros do tipo **COST_MODIFIER** permitem ajustar dinamicamente o custo de travessia, influenciando a escolha do caminho pelo algoritmo de pathfinding.

- **Emita Eventos para Integração:**  
  O **LayerSystem** emite eventos (`layerRegistered` e `filterAdded`) que podem ser úteis para depuração ou para acionar atualizações em outros módulos.

---

## Conclusão

O **LayerSystem** oferece uma abordagem poderosa para gerenciar camadas e filtros na navegação, permitindo personalizar os custos de travessia e restringir os nós disponíveis para o pathfinding. Ao utilizar este sistema, você pode definir diferentes tipos de superfícies e regras de navegação, garantindo que os algoritmos de busca de caminhos considerem todas as particularidades do ambiente.

Explore e combine as funcionalidades do **LayerSystem** com os demais módulos da biblioteca para criar sistemas de navegação ricos e adaptáveis.

Boas implementações!