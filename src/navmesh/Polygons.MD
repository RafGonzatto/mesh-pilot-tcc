# Guia do Módulo Polygon

O módulo **Polygon** é o componente central para representar regiões 2D na biblioteca. Ele encapsula um polígono definido por uma lista de vértices e fornece funcionalidades essenciais, como cálculo de bounding box, determinação de arestas, centro geométrico, verificação se um ponto está contido e controle de camadas.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [API Detalhada](#api-detalhada)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas](#boas-práticas)
6. [Conclusão](#conclusão)

---

## Visão Geral

O **Polygon** representa um objeto 2D com pelo menos três vértices. Ele é utilizado para definir áreas de navegação, obstáculos, ou qualquer região que precise ser manipulada geometricamente dentro da biblioteca. Com ele, é possível:

- Calcular a **bounding box** que envolve o polígono.
- Obter a lista de **arestas** que compõem o polígono.
- Calcular o **centro geométrico**.
- Verificar se um ponto se encontra dentro do polígono.
- Controlar a camada à qual o polígono pertence e as camadas permitidas para travessia.

---

## Funcionalidades Principais

- **Construtor com Validação:** Garante que o polígono seja definido com pelo menos 3 vértices.
- **Caching Inteligente:** Utiliza caches para bounding box, arestas e centro, otimizando chamadas repetidas.
- **Métodos Geométricos:** Inclui métodos para cálculo de bounding box, arestas e centro.
- **Verificação de Ponto:** Implementa o algoritmo de interseção de raios para testar se um ponto está contido.
- **Gerenciamento de Camadas:** Permite definir uma camada padrão e camadas permitidas para controle de travessia.

---

## API Detalhada

### **Construtor**

```js
constructor(vertices, options = {})
```

- **Parâmetros:**
  - `vertices`: Array de objetos no formato `{ x: number, y: number }`. Deve conter no mínimo 3 vértices.
  - `options`: Objeto de configuração.
    - `layer` (string): Define a camada do polígono. Padrão: `"default"`.
    - `allowedLayers` (Set<string>): Conjunto de camadas permitidas para travessia. Se não definido, é criado um conjunto contendo a camada do polígono.

- **Comportamento:**
  - Se os vértices não forem um array ou tiverem menos de 3 elementos, lança um erro.
  - Inicializa caches internos para otimizar cálculos.

---

### **Métodos Geométricos**

#### **getBoundingBox()**

```js
getBoundingBox()
```

- **Retorno:** Um objeto `{ xmin, xmax, ymin, ymax }` representando a menor caixa retangular que envolve o polígono.
- **Detalhes:**  
  - Se a bounding box já foi calculada, retorna o valor em cache; caso contrário, realiza o cálculo e armazena o resultado.

#### **getEdges()**

```js
getEdges()
```

- **Retorno:** Array de objetos, onde cada objeto representa uma aresta no formato `{ start: { x, y }, end: { x, y } }`.
- **Detalhes:**  
  - Calcula as arestas ligando cada vértice ao próximo, fechando o polígono (o último vértice conecta ao primeiro).

#### **getCenter()**

```js
getCenter()
```

- **Retorno:** Um objeto `{ x, y }` com as coordenadas do centro geométrico (média dos vértices).
- **Detalhes:**  
  - Utiliza cache para evitar cálculos repetitivos.

#### **getWidth()**

```js
getWidth()
```

- **Retorno:** Número representando a largura do polígono, calculada com base na bounding box.
- **Detalhes:**  
  - É a diferença entre `xmax` e `xmin`.

#### **invalidateCache()**

```js
invalidateCache()
```

- **Descrição:**  
  - Remove os caches internos (bounding box, arestas e centro) para forçar a recalculação caso os vértices sejam modificados.

---

### **Verificação e Gerenciamento de Camadas**

#### **containsPoint(point)**

```js
containsPoint(point)
```

- **Parâmetros:**  
  - `point`: Objeto `{ x: number, y: number }` representando o ponto a ser testado.
- **Retorno:**  
  - Booleano: `true` se o ponto está dentro do polígono, `false` caso contrário.
- **Detalhes:**  
  - Utiliza o algoritmo de interseção de raios para determinar a contenção.

#### **hasLayer(layer)**

```js
hasLayer(layer)
```

- **Parâmetros:**  
  - `layer`: String representando o nome da camada a verificar.
- **Retorno:**  
  - Booleano: `true` se o polígono pertence ou permite a camada informada; `false` caso contrário.

---

## Exemplos de Uso

### Exemplo 1: Criação e Uso Básico

```js
import { Polygon } from "./Polygon.js";

// Definindo vértices para um retângulo
const vertices = [
  { x: 10, y: 10 },
  { x: 110, y: 10 },
  { x: 110, y: 60 },
  { x: 10, y: 60 }
];

// Cria o polígono com a camada padrão
const rectPolygon = new Polygon(vertices);

// Calcula a bounding box
const bbox = rectPolygon.getBoundingBox();
console.log("Bounding Box:", bbox);

// Obtém as arestas
const edges = rectPolygon.getEdges();
console.log("Edges:", edges);

// Calcula o centro
const center = rectPolygon.getCenter();
console.log("Center:", center);

// Verifica se um ponto está dentro do polígono
const point = { x: 50, y: 30 };
console.log("Contém ponto?", rectPolygon.containsPoint(point));

// Verifica a camada
console.log("Possui camada 'default'?", rectPolygon.hasLayer("default"));
```

### Exemplo 2: Atualizando o Polígono

```js
// Após modificar os vértices (por exemplo, adicionando um novo vértice ou alterando posições)
rectPolygon.vertices.push({ x: 60, y: 70 });
// Invalida os caches para recalcular os valores com a nova configuração
rectPolygon.invalidateCache();

// Recalcula os dados atualizados
console.log("Nova Bounding Box:", rectPolygon.getBoundingBox());
console.log("Novo Centro:", rectPolygon.getCenter());
```

---

## Boas Práticas

- **Validação dos Vértices:**  
  - Sempre garanta que o array de vértices contenha pelo menos três pontos para definir um polígono válido.

- **Uso de Cache:**  
  - Aproveite os métodos que utilizam cache para otimizar cálculos, mas lembre-se de chamar `invalidateCache()` sempre que modificar os vértices.

- **Gerenciamento de Camadas:**  
  - Utilize o método `hasLayer()` para verificar a compatibilidade com os filtros de navegação, garantindo que o polígono seja considerado em sistemas de travessia.

- **Consistência Geométrica:**  
  - Ao modificar os vértices de um polígono, assegure-se de que a forma resultante continue representando a área desejada.

---

## Conclusão

O módulo **Polygon** é fundamental para definir áreas e estruturas geométricas em aplicações 2D de navegação e pathfinding. Ao dominar seus métodos de cálculo e verificação, você estará apto a criar mapas precisos e a manipular regiões com eficiência, garantindo que os sistemas de navegação da biblioteca operem de forma correta e otimizada.

Explore as funcionalidades do **Polygon** em conjunto com os outros módulos da biblioteca para construir aplicações robustas e dinâmicas.

Boas implementações!