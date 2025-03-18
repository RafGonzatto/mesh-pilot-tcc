/**
 * @module LayerSystem
 * Sistema de camadas e filtros para navegação avançada
 */
export class LayerSystem {
  /**
   * Tipos de filtros disponíveis
   * @readonly
   * @enum {string}
   */
  static FILTER_TYPES = {
    INCLUSION: "include",
    EXCLUSION: "exclude",
    COST_MODIFIER: "cost",
  };

  constructor(navMesh) {
    this.navMesh = navMesh;
    this.registeredLayers = new Set();
    this.layerFilters = new Map();
    this._initDefaultLayers();
  }

  /**
   * Inicializa camadas padrão
   * @private
   */
  _initDefaultLayers() {
    this.registerLayer("default", {
      color: "#4a4a4a",
      traversalCost: 1.0,
    });
  }

  /**
   * Registra uma nova camada
   * @param {string} name - Nome único da camada
   * @param {Object} config - Configurações da camada
   * @param {string} config.color - Cor para debug visual
   * @param {number} config.traversalCost - Custo de movimento base
   */
  registerLayer(name, config) {
    if (this.registeredLayers.has(name)) {
      throw new Error(`Camada ${name} já registrada`);
    }
    this.registeredLayers.add(name);

    // Inclua imageId no objeto
    this.layerFilters.set(name, {
      color: config.color || "#ffffff",
      traversalCost: config.traversalCost || 1.0,
      imageId: config.imageId || null,
      filters: new Map(),
    });

    this.navMesh.emit("layerRegistered", { name, config });
  }
  /**
   * Adiciona filtro a uma camada
   * @param {string} layer - Camada alvo
   * @param {string} type - Tipo de filtro (FILTER_TYPES)
   * @param {Function|number} condition - Função/valor do filtro
   * @param {Object} [scope] - Contexto de aplicação
   */
  addFilter(layer, type, condition, scope) {
    if (!this.layerFilters.has(layer)) {
      throw new Error(`Camada ${layer} não registrada`);
    }

    const filter = {
      type,
      condition,
      scope: scope || this.navMesh,
    };

    this.layerFilters.get(layer).filters.set(type, filter);
    this.navMesh.emit("filterAdded", { layer, filter });
  }

  /**
   * Aplica filtros a um conjunto de nós
   * @param {Array} nodes - Nós para filtrar
   * @param {Object} [context] - Contexto do agente
   * @returns {Array} Nós filtrados
   */
  applyFilters(nodes, context = {}) {
    return nodes.filter((node) => {
      const layerConfig = this.layerFilters.get(node.polygon.layer);
      return this._evaluateFilters(layerConfig, node, context);
    });
  }

  /**
   * Avalia filtros para um nó
   * @private
   */
  _evaluateFilters(layerConfig, node, context) {
    let result = true;

    layerConfig.filters.forEach((filter, type) => {
      switch (type) {
        case LayerSystem.FILTER_TYPES.INCLUSION:
          result = result && filter.condition.call(filter.scope, node, context);
          break;

        case LayerSystem.FILTER_TYPES.EXCLUSION:
          result =
            result && !filter.condition.call(filter.scope, node, context);
          break;

        case LayerSystem.FILTER_TYPES.COST_MODIFIER:
          node.traversalCost *=
            typeof filter.condition === "function"
              ? filter.condition.call(filter.scope, node, context)
              : filter.condition;
          break;
      }
    });

    return result;
  }

  /**
   * Calcula custo de movimento para uma aresta
   * @param {Object} edge - Aresta do grafo
   * @param {Object} context - Contexto do agente
   * @returns {number} Custo total
   */
  calculateEdgeCost(edge, context) {
    const nodeA = this.navMesh.graph.getNode(edge.a);
    const nodeB = this.navMesh.graph.getNode(edge.b);

    const costA = this.layerFilters.get(nodeA.polygon.layer).traversalCost;
    const costB = this.layerFilters.get(nodeB.polygon.layer).traversalCost;

    return ((costA + costB) / 2) * edge.peso;
  }
}
