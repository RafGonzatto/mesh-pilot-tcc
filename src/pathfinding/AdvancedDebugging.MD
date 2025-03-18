# Como Usar o Debug Visual

## Inicialização

```javascript
// No seu arquivo principal (ex: game.js)
import { NavMesh } from "./pathfinding/NavMesh.js";
import { DebugVisualizer } from "./pathfinding/DebugVisualizer.js";

// 1. Crie a NavMesh normalmente
const navMesh = new NavMesh();
navMesh.addPolygon(poly1);
navMesh.addPolygon(poly2);
navMesh.buildGraph();

// 2. Habilite obstáculos dinâmicos
const obstacleManager = navMesh.enableDynamicObstacles({
  cellSize: 50,
  autoUpdate: true,
});

// 3. Crie o Debug Visual
const canvas = document.getElementById("debugCanvas");
const ctx = canvas.getContext("2d");
const debug = new DebugVisualizer(ctx, navMesh, {
  showPolygons: true,
  showEdges: true,
  showPath: true,
});

// 4. Ative o debug
debug.toggle(true);
```

## Atualização Dinâmica

```javascript
// Durante o gameloop
function gameLoop() {
  // Sua lógica de jogo...

  // Atualiza o debug visual
  debug.draw();

  requestAnimationFrame(gameLoop);
}
gameLoop();
```

## Controle por Interface

```javascript
// Adicione controles HTML
<label>
  <input type="checkbox" id="togglePolygons" checked> Mostrar Polígonos
</label>
<label>
  <input type="checkbox" id="togglePath" checked> Mostrar Caminhos
</label>

<script>
  document.getElementById('togglePolygons').addEventListener('change', (e) => {
    debug.updateConfig({ showPolygons: e.target.checked });
  });

  document.getElementById('togglePath').addEventListener('change', (e) => {
    debug.updateConfig({ showPath: e.target.checked });
  });
</script>
```

## Verificação Final

```javascript
// Exemplo de importação no DebugVisualizer.js
import { SpatialGrid } from "../utils/SpatialGrid.js";
import { EventEmitter } from "../core/EventSystem.js";
```

```html
<canvas id="debugCanvas" width="800" height="600"></canvas>
```

## Verificação Final

1. Criar NavMesh
2. Construir grafo
3. Criar DebugVisualizer
4. Iniciar gameloop

## Funcionalidades

- Visualizar todos os polígonos da NavMesh
- Exibir arestas do grafo de navegação
- Mostrar obstáculos dinâmicos
- Apresentar caminhos calculados
- Exibir a estrutura do spatial grid
- Mostrar labels informativos
