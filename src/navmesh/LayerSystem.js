/**
 * @module LayerSystem
 * Sistema de camadas e filtros para navegação avançada.
 * Permite registrar camadas, adicionar filtros e aplicá-los nos nós (nodes)
 * durante o cálculo de caminhos.
 */
export class LayerSystem {
  /**
   * Enumeração dos tipos de filtros disponíveis.
   * @readonly
   * @enum {string}
   */
  static FILTER_TYPES = {
    INCLUSION: "include",
    EXCLUSION: "exclude",
    COST_MODIFIER: "cost",
  };

  /**
   * Cria uma instância do sistema de camadas.
   * @param {NavMesh} navMesh - Instância da NavMesh que utilizará as camadas.
   */
  constructor(navMesh) {
    this.navMesh = navMesh;
    this.registeredLayers = new Set();
    this.layerFilters = new Map();
    this._initDefaultLayers();
  }

  /**
   * Inicializa as camadas padrão.
   * @private
   */
  _initDefaultLayers() {
    this.registerLayer("default", {
      color: "#4a4a4a",
      traversalCost: 1.0,
    });
  }

  /**
   * Registra uma nova camada com as configurações especificadas.
   * @param {string} name - Nome único da camada.
   * @param {Object} config - Configurações da camada.
   * @param {string} config.color - Cor para depuração visual.
   * @param {number} config.traversalCost - Custo base de movimento para a camada.
   */
  registerLayer(name, config) {
    if (this.registeredLayers.has(name)) {
      throw new Error(`Camada ${name} já registrada`);
    }
    this.registeredLayers.add(name);
    // Cria a estrutura de filtros e configurações para a camada
    this.layerFilters.set(name, {
      color: config.color || "#ffffff",
      traversalCost: config.traversalCost || 1.0,
      imageId: config.imageId || null,
      filters: new Map(),
    });
    this.navMesh.emit("layerRegistered", { name, config });
  }

  /**
   * Adiciona um filtro a uma camada específica.
   * @param {string} layer - Camada alvo.
   * @param {string} type - Tipo de filtro (usar LayerSystem.FILTER_TYPES).
   * @param {Function|number} condition - Função ou valor que define o filtro.
   * @param {Object} [scope] - Contexto de execução do filtro.
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
   * Aplica os filtros cadastrados a um conjunto de nós.
   * @param {Array<Object>} nodes - Lista de nós para filtrar.
   * @param {Object} [context={}] - Contexto do agente para avaliação dos filtros.
   * @returns {Array<Object>} Nós que passaram pelos filtros.
   */
  applyFilters(nodes, context = {}) {
    return nodes.filter((node) => {
      const layerConfig = this.layerFilters.get(node.polygon.layer);
      return this._evaluateFilters(layerConfig, node, context);
    });
  }

  /**
   * Avalia os filtros configurados para um nó.
   * @private
   * @param {Object} layerConfig - Configurações e filtros da camada.
   * @param {Object} node - Nó a ser avaliado.
   * @param {Object} context - Contexto do agente.
   * @returns {boolean} Verdadeiro se o nó passar em todos os filtros.
   */
  _evaluateFilters(layerConfig, node, context) {
    let result = true;
    layerConfig.filters.forEach((filter, type) => {
      switch (type) {
        case LayerSystem.FILTER_TYPES.INCLUSION:
          result = result && filter.condition.call(filter.scope, node, context);
          break;
        case LayerSystem.FILTER_TYPES.EXCLUSION:
          result = result && !filter.condition.call(filter.scope, node, context);
          break;
        case LayerSystem.FILTER_TYPES.COST_MODIFIER:
          node.traversalCost *= typeof filter.condition === "function"
            ? filter.condition.call(filter.scope, node, context)
            : filter.condition;
          break;
      }
    });
    return result;
  }

  /**
   * Calcula o custo de movimento para uma aresta, considerando os custos
   * das camadas dos nós envolvidos.
   * @param {Object} edge - Aresta do grafo com propriedades "a", "b" e "peso".
   * @param {Object} context - Contexto do agente.
   * @returns {number} Custo total da aresta.
   */
  calculateEdgeCost(edge, context) {
    const nodeA = this.navMesh.graph.getNode(edge.a);
    const nodeB = this.navMesh.graph.getNode(edge.b);
    const costA = this.layerFilters.get(nodeA.polygon.layer).traversalCost;
    const costB = this.layerFilters.get(nodeB.polygon.layer).traversalCost;
    return ((costA + costB) / 2) * edge.peso;
  }
}
