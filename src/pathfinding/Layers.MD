# Camadas

## Registrando Camadas:

```javascript
// Registrar camadas com configurações
navMesh.layerSystem.registerLayer("water", {
  color: "#00a0ff",
  traversalCost: 2.5,
});

navMesh.layerSystem.registerLayer("road", {
  color: "#505050",
  traversalCost: 0.8,
});
```

## Criando Polígonos com Cama:

```javascript
const waterPolygon = new Polygon(vertices, {
  layer: "water",
  allowedLayers: new Set(["water", "bridge"]),
});

const roadPolygon = new Polygon(vertices, { layer: "road" });
```

## Aplicando Filtros:

```javascript
// Filtro de exclusão para veículos anfíbios
navMesh.layerSystem.addFilter(
  "water",
  LayerSystem.FILTER_TYPES.INCLUSION,
  (node, context) => context.vehicleType === "amphibious"
);

// Modificador de custo para terreno difícil
navMesh.layerSystem.addFilter(
  "mud",
  LayerSystem.FILTER_TYPES.COST_MODIFIER,
  2.0 // Multiplica custo por 2
);
```

## Busca de Caminho com Contexto:

```javascript
const path = Pathfinder.findPath({
  start: player.position,
  end: target,
  layerContext: {
    vehicleType: "wheeled",
    hasSpecialEquipment: true,
  },
});
```

## Debug Visual:

```javascript
// Visualizar camadas
debug.highlightLayers(["water", "road"]);

// Configurar cores padrão
debug.updateConfig({
  layerColors: {
    water: "#00a0ff55",
    road: "#50505055",
  },
});
```

## Exemplo Complexo:

```javascript
// Criar camada dinâmica para construção
navMesh.layerSystem.registerLayer("construction", {
  color: "#ffa500",
  traversalCost: Infinity, // Bloqueado por padrão
});

// Adicionar filtro temporário para equipes de construção
navMesh.layerSystem.addFilter(
  "construction",
  LayerSystem.FILTER_TYPES.COST_MODIFIER,
  (node, context) => (context.hasHardHat ? 1.0 : Infinity)
);

// Buscar caminho para trabalhador equipado
Pathfinder.findPath({
  start: workerPos,
  end: sitePos,
  layerContext: { hasHardHat: true },
});
```

## Fluxo de Decisão

1. Validação de Acesso:

- Verifica se o agente tem permissão na camada principal do polígono
- Checa camadas alternativas permitidas pelo polígono
- Aplica filtros específicos da camada

2. Cálculo de Custo:

- Combina custo base da camada com modificadores
- Considera características do agente (contexto)
- Aplica multiplicadores dinâmicos

3. Atualização Dinâmica:

- Monitora mudanças nas camadas
- Atualiza grafos afetados
- Notifica sistemas dependentes

## Este sistema permite:

- Hierarquias complexas de terreno
- Restrições de movimento dinâmicas
- Cálculos de custo contextualizados
- Visualização intuitiva de áreas navegáveis
- Integração perfeita com outros subsistemas
