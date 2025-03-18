/**
 * @module AgentManager
 * Sistema de gerenciamento de múltiplos agentes com perfis de navegação
 */
export class AgentManager {
  constructor(navMesh) {
    this.navMesh = navMesh;
    this.agentProfiles = new Map();
    this.activeAgents = new Map();
    this.cachedGraphs = new Map();
  }

  /**
   * Registra um novo perfil de agente
   * @param {string} profileName - Nome do perfil
   * @param {AgentProfile} profile - Configurações do agente
   */
  registerProfile(profileName, profile) {
    if (!(profile instanceof AgentProfile)) {
      throw new Error("Perfil deve ser uma instância de AgentProfile");
    }
    this.agentProfiles.set(profileName, profile);
    this.navMesh.emit("profileRegistered", { profileName, profile });
  }

  /**
   * Cria um novo agente com um perfil específico
   * @param {string} agentId - ID único do agente
   * @param {string} profileName - Nome do perfil registrado
   * @param {Object} initialPosition - Posição inicial {x, y}
   */
  createAgent(agentId, profileName, initialPosition) {
    const profile = this.agentProfiles.get(profileName);
    if (!profile) throw new Error(`Perfil ${profileName} não encontrado`);

    const agent = {
      id: agentId,
      profile,
      position: initialPosition,
      currentPath: [],
      active: true,
      graph: this._getAgentGraph(profile),
    };

    this.activeAgents.set(agentId, agent);
    this.navMesh.emit("agentCreated", agent);
    return agent;
  }

  /**
   * Atualiza o caminho de um agente
   * @param {string} agentId - ID do agente
   * @param {Object} target - Destino {x, y} ou ID do nó
   */
  updateAgentPath(agentId, target) {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.active) return;

    const pathResult = Pathfinder.findPath({
      graph: agent.graph,
      start: agent.position,
      end: target,
      validator: this._createAgentValidator(agent.profile),
    });

    if (pathResult.path.length > 0) {
      agent.currentPath = pathResult.points;
      this.navMesh.emit("pathUpdated", { agentId, path: pathResult });
    }
  }

  /**
   * Gera ou recupera grafo específico para o perfil do agente
   * @private
   */
  _getAgentGraph(profile) {
    const cacheKey = this._getProfileCacheKey(profile);

    if (!this.cachedGraphs.has(cacheKey)) {
      const filteredNodes = this.navMesh.graph.nodes.filter((node) =>
        this._isNodeAccessible(node, profile)
      );

      const filteredEdges = [];
      // Recupera os custos por camada que você passou ao criar o AgentProfile
      const terrainCosts = profile.terrainCosts || {};

      this.navMesh.graph.adjList.forEach((edges, nodeId) => {
        edges.forEach((edge) => {
          if (this._isEdgeTraversable(edge, profile)) {
            const polygonA = this.navMesh.graph.getNode(nodeId).polygon;
            const polygonB = this.navMesh.graph.getNode(edge.nodeId).polygon;
            const costA =
              terrainCosts[polygonA.layer] !== undefined
                ? terrainCosts[polygonA.layer]
                : 1;
            const costB =
              terrainCosts[polygonB.layer] !== undefined
                ? terrainCosts[polygonB.layer]
                : 1;
            // Calcula o custo efetivo como média dos multiplicadores
            const multiplier = (costA + costB) / 2;
            const effectiveCost = edge.peso * multiplier;
            filteredEdges.push([Number(nodeId), edge.nodeId, effectiveCost]);
          }
        });
      });

      this.cachedGraphs.set(cacheKey, new Graph(filteredNodes, filteredEdges));
    }

    return this.cachedGraphs.get(cacheKey);
  }

  /**
   * Validador de navegação específico para o agente
   * @private
   */
  _createAgentValidator(profile) {
    return (edge, node) => {
      const edgeWidth = this._calculateEdgeWidth(edge);
      const canTraverse =
        edgeWidth >= profile.minPathWidth &&
        node.polygon.traversalCost <= profile.maxSlope &&
        profile.allowedLayers.has(node.polygon.layer);

      return canTraverse;
    };
  }

  /**
   * Calcula largura efetiva de uma aresta
   * @private
   */
  _calculateEdgeWidth(edge) {
    // Implementação simplificada - considerar bounding boxes dos polígonos
    const nodeA = this.navMesh.graph.getNode(edge.a);
    const nodeB = this.navMesh.graph.getNode(edge.b);
    return Math.min(nodeA.polygon.getWidth(), nodeB.polygon.getWidth());
  }

  /**
   * Gera chave única para cache de grafos
   * @private
   */
  _getProfileCacheKey(profile) {
    return [
      profile.minPathWidth,
      profile.maxSlope,
      [...profile.allowedLayers].sort().join(","),
    ].join("|");
  }
}

/**
 * @class AgentProfile
 * Define as características de navegação de um tipo de agente
 */
export class AgentProfile {
  /**
   * @param {Object} config
   * @param {number} config.radius - Raio do agente (unidades do mundo)
   * @param {number} config.minPathWidth - Largura mínima de passagem
   * @param {number} config.maxSlope - Inclinação máxima permitida (graus)
   * @param {Set<string>} config.allowedLayers - Camadas permitidas
   * @param {number} config.stepHeight - Altura máxima de degrau
   * @param {number} config.jumpHeight - Altura máxima de salto
   * @param {Object} config.terrainCosts - Objeto mapeando layer -> custo
   */
  constructor({
    radius = 1,
    minPathWidth = 2,
    maxSlope = 45,
    allowedLayers = new Set(["default"]),
    stepHeight = 0.5,
    jumpHeight = 0,
    // <-- Adicione terrainCosts no objeto de configuração do construtor
    terrainCosts = {},
  }) {
    this.radius = radius;
    this.minPathWidth = minPathWidth;
    this.maxSlope = maxSlope;
    this.allowedLayers = allowedLayers;
    this.stepHeight = stepHeight;
    this.jumpHeight = jumpHeight;

    // Guarde a propriedade terrainCosts no AgentProfile
    this.terrainCosts = terrainCosts;

    this._validate();
  }

  _validate() {
    if (this.minPathWidth < this.radius * 2) {
      throw new Error("Largura mínima deve ser pelo menos o dobro do raio");
    }
    if (this.maxSlope < 0 || this.maxSlope > 90) {
      throw new Error("Inclinação deve estar entre 0 e 90 graus");
    }
  }
}
