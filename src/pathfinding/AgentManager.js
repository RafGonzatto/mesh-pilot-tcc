import { EventEmitter } from "../navmesh/EventEmitter.js";
import { Pathfinder } from "../pathfinding/Pathfinder.js";
import { Graph } from "../pathfinding/Graph.js";

/**
 * @module AgentManager
 * Sistema de gerenciamento de múltiplos agentes com perfis de navegação.
 * Agora estende EventEmitter e escuta eventos do NavMesh para recalcular caminhos.
 */
export class AgentManager extends EventEmitter {
  constructor(navMesh) {
    super();
    this.navMesh = navMesh;
    this.agentProfiles = new Map();
    this.activeAgents = new Map();
    this.cachedGraphs = new Map();

    this.navMesh.on("graphupdated", (info) => {
      console.log("[AgentManager] graphupdated event captured:", info);
      this.cachedGraphs.clear();
      this.activeAgents.forEach((agent) => {
        if (agent.target) {
          console.log("[AgentManager] Recalculating path for agent:", agent.id);
          this.recalculateAgentPath(agent.id, true);
          console.log(
            "[AgentManager] New path for",
            agent.id,
            ":",
            agent.currentPath
          );
        }
      });
    });
  }
  /**
   * Registra um novo perfil de agente.
   * @param {string} profileName - Nome do perfil.
   * @param {AgentProfile} profile - Configurações do agente.
   */
  registerProfile(profileName, profile) {
    if (!(profile instanceof AgentProfile)) {
      throw new Error("Perfil deve ser uma instância de AgentProfile");
    }
    this.agentProfiles.set(profileName, profile);
    this.navMesh.emit("profileRegistered", { profileName, profile });
  }

  /**
   * Cria um novo agente com um perfil específico.
   * @param {string} agentId - ID único do agente.
   * @param {string} profileName - Nome do perfil registrado.
   * @param {Object} initialPosition - Posição inicial {x, y}.
   */
  createAgent(agentId, profileName, initialPosition) {
    const profile = this.agentProfiles.get(profileName);
    if (!profile) throw new Error(`Perfil ${profileName} não encontrado`);

    const agent = {
      id: agentId,
      profile,
      position: { ...initialPosition },
      currentPath: [],
      target: null,
      active: true,
      graph: this._getAgentGraph(profile),
      type: profileName, // Adiciona o tipo baseado no nome do perfil
    };

    this.activeAgents.set(agentId, agent);
    this.navMesh.emit("agentCreated", agent);
    return agent;
  }

  /**
   * Define destino e recalcula o caminho do agente.
   * @param {string} agentId - ID do agente.
   * @param {Object} target - Destino {x, y} ou ID do nó.
   * @param {boolean} [partial=true] - Se permite caminho parcial.
   */
  setAgentTarget(agentId, target, partial = true) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;
    agent.target = { ...target };
    this.recalculateAgentPath(agentId, partial);
  }

  /**
   * Recalcula o caminho do agente.
   */
  recalculateAgentPath(agentId, partial = true) {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.target) return;
    // Atualiza o grafo do agente com base no estado atual da NavMesh
    agent.graph = this._getAgentGraph(agent.profile);
    const result = Pathfinder.findPath({
      graph: agent.graph,
      start: agent.position,
      end: agent.target,
      partialPath: partial,
    });
    agent.currentPath = result.points;
    // Armazena uma cópia do caminho para debug
    agent.debugPath = [...result.points];
    this.emit("agentPathUpdated", {
      agentId,
      path: agent.currentPath,
      partial,
    });
  }

  /**
   * Atualiza a posição do agente dado um "step" de movimento.
   * @param {string} agentId - ID do agente.
   * @param {number} [step=2] - Distância a mover.
   */
  updateAgent(agentId, step = 2) {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.currentPath.length) return;
    const next = agent.currentPath[0];
    const dx = next.x - agent.position.x;
    const dy = next.y - agent.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= step) {
      agent.position.x = next.x;
      agent.position.y = next.y;
      agent.currentPath.shift();
      if (!agent.currentPath.length && agent.target) {
        // agent.position.x = agent.target.x;
        // agent.position.y = agent.target.y;
        agent.target = null;
      }
    } else {
      agent.position.x += (dx / dist) * step;
      agent.position.y += (dy / dist) * step;
    }

    this.emit("agentUpdated", {
      agentId,
      position: { ...agent.position },
      remainingPath: agent.currentPath,
    });
  }

  getAgent(agentId) {
    return this.activeAgents.get(agentId);
  }

  /**
   * Gera ou recupera o grafo específico para o perfil do agente.
   * @private
   */
  _getAgentGraph(profile) {
    // Debug: ignorar cache para garantir grafo fresco
    const filteredNodes = this.navMesh.graph.nodes.filter((node) =>
      this._isNodeAccessible(node, profile)
    );
    const filteredEdges = [];
    const terrainCosts = profile.terrainCosts || {};
    this.navMesh.graph.adjList.forEach((edges, nodeId) => {
      edges.forEach((edge) => {
        if (this._isEdgeTraversable(edge, profile)) {
          const polygonA = this.navMesh.graph.getNode(nodeId).polygon;
          const polygonB = this.navMesh.graph.getNode(edge.nodeId).polygon;
          const costA = terrainCosts[polygonA.layer] ?? 9999;
          const costB = terrainCosts[polygonB.layer] ?? 9999;
          const multiplier = (costA + costB) / 2;
          filteredEdges.push([
            Number(nodeId),
            edge.nodeId,
            edge.peso * multiplier,
          ]);
        }
      });
    });
    return new Graph(filteredNodes, filteredEdges);
  }

  _isNodeAccessible(node, profile) {
    return profile.allowedLayers.has(node.polygon.layer);
  }

  _isEdgeTraversable(edge, profile) {
    // Implementação simplificada – pode ser aprimorada para levar em conta minPathWidth, etc.
    return true;
  }

  _getProfileCacheKey(profile) {
    return JSON.stringify({
      minPathWidth: profile.minPathWidth,
      layers: [...profile.allowedLayers].sort(),
      costs: profile.terrainCosts,
    });
  }
}

/**
 * @class AgentProfile
 * Define as características de navegação de um tipo de agente.
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
    terrainCosts = {},
  }) {
    this.radius = radius;
    this.minPathWidth = minPathWidth;
    this.maxSlope = maxSlope;
    this.allowedLayers = allowedLayers;
    this.stepHeight = stepHeight;
    this.jumpHeight = jumpHeight;
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
