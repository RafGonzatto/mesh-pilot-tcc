import { Pathfinder } from "./Pathfinder.js";

/**
 * @module DebugVisualizer
 * Sistema de visualização debug para a NavMesh e componentes relacionados
 */
export class DebugVisualizer {
  constructor(ctx, navMesh, config = {}) {
    this.ctx = ctx;
    this.navMesh = navMesh;
    this.config = {
      showPolygons: true,
      showEdges: true,
      showObstacles: true,
      showPath: true,
      showNodes: false,
      showSpatialGrid: false,
      showLabels: false,
      polygonColor: "rgba(100, 200, 255, 0.3)",
      edgeColor: "rgba(255, 255, 255, 0.5)",
      obstacleColor: "rgba(255, 50, 50, 0.4)",
      pathColor: "#00ff88",
      nodeColor: "#ffffff",
      spatialGridColor: "rgba(200, 200, 200, 0.2)",
      labelColor: "#ffffff",
      debugEventLog: true, // nova opção para log global
      enabled: true,
      ...config,
    };

    this.currentPath = [];
    this.activeObstacles = new Map();
    this.eventLog = []; // log de eventos para debug
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // NavMesh
    this.navMesh.on("polygonadded", (data) => {
      console.log("[DebugVisualizer] polygonadded", data);
      this.eventLog.push({ event: "polygonadded", data });
      this._requestRedraw();
    });
    this.navMesh.on("graphbuilt", (data) => {
      console.log("[DebugVisualizer] graphbuilt", data);
      this.eventLog.push({ event: "graphbuilt", data });
      this._requestRedraw();
    });
    this.navMesh.on("graphupdated", (data) => {
      console.log("[DebugVisualizer] graphupdated", data);
      this.eventLog.push({ event: "graphupdated", data });
      this._requestRedraw();
    });
    this.navMesh.on("error", (data) => {
      console.error("[DebugVisualizer] navMesh error", data);
      this.eventLog.push({ event: "error", data });
    });

    // Obstáculos dinâmicos
    if (this.navMesh.dynamicObstacleManager) {
      this.navMesh.dynamicObstacleManager.on("obstacleadded", (data) => {
        console.log("[DebugVisualizer] obstacleadded", data);
        this.eventLog.push({ event: "obstacleadded", data });
        this.activeObstacles.set(data.id, data.obstacle);
        this._requestRedraw();
      });
      this.navMesh.dynamicObstacleManager.on("obstacleremoved", (data) => {
        console.log("[DebugVisualizer] obstacleremoved", data);
        this.eventLog.push({ event: "obstacleremoved", data });
        this.activeObstacles.delete(data.id);
        this._requestRedraw();
      });
    }

    // Eventos do Pathfinder
    Pathfinder.on("pathfound", (result) => {
      console.log("[DebugVisualizer] pathfound", result);
      this.eventLog.push({ event: "pathfound", data: result });
      this.currentPath = result.points;
      this._requestRedraw();
    });
    Pathfinder.on("pathblocked", (result) => {
      console.log("[DebugVisualizer] pathblocked", result);
      this.eventLog.push({ event: "pathblocked", data: result });
      this.currentPath = [];
      this._requestRedraw();
    });

    // Eventos do AgentManager
    if (this.navMesh.agentManager) {
      this.navMesh.agentManager.on("agentCreated", (agent) => {
        console.log("[DebugVisualizer] agentCreated", agent);
        this.eventLog.push({ event: "agentCreated", data: agent });
      });
      this.navMesh.agentManager.on("agentPathUpdated", (data) => {
        console.log("[DebugVisualizer] agentPathUpdated", data);
        this.eventLog.push({ event: "agentPathUpdated", data });
      });
      this.navMesh.agentManager.on("agentUpdated", (data) => {
        console.log("[DebugVisualizer] agentUpdated", data);
        this.eventLog.push({ event: "agentUpdated", data });
      });
    }

    // Global listener
    if (this.config.debugEventLog) {
      this.navMesh.addGlobalListener((event) => {
        console.log("[DebugVisualizer] Global event", event);
        this.eventLog.push({ event: "global", data: event });
      });
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._requestRedraw();
  }

  _requestRedraw() {
    if (!this.config.enabled) return;
    this.draw();
  }

  draw() {
    this._clearCanvas();
    if (this.config.showPolygons) this._drawPolygons();
    if (this.config.showEdges) this._drawEdges();
    if (this.config.showObstacles) this._drawObstacles();
    if (this.config.showPath) this._drawPath();
    if (this.config.showNodes) this._drawNodes();
    if (this.config.showSpatialGrid) this._drawSpatialGrid();
    if (this.config.showLabels) this._drawLabels();
  }

  _clearCanvas() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  _drawPolygons() {
    this.navMesh.polygons.forEach((poly) => {
      this.ctx.fillStyle = this.config.polygonColor;
      this.ctx.beginPath();
      poly.vertices.forEach((v, i) => {
        i === 0 ? this.ctx.moveTo(v.x, v.y) : this.ctx.lineTo(v.x, v.y);
      });
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  _drawEdges() {
    this.ctx.strokeStyle = this.config.edgeColor;
    this.ctx.lineWidth = 1;
    this.navMesh.graph.adjList.forEach((edges, nodeId) => {
      const node = this.navMesh.graph.getNode(Number(nodeId));
      edges.forEach((edge) => {
        const neighbor = this.navMesh.graph.getNode(edge.nodeId);
        const start = node.polygon.getCenter();
        const end = neighbor.polygon.getCenter();
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
      });
    });
  }

  _drawObstacles() {
    this.ctx.fillStyle = this.config.obstacleColor;
    this.activeObstacles.forEach((obstacle) => {
      this.ctx.beginPath();
      obstacle.vertices.forEach((v, i) => {
        i === 0 ? this.ctx.moveTo(v.x, v.y) : this.ctx.lineTo(v.x, v.y);
      });
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  _drawPath() {
    if (this.currentPath.length < 2) return;
    this.ctx.strokeStyle = this.config.pathColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.currentPath.forEach((p, i) => {
      i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();
    // Pontos da rota
    this.ctx.fillStyle = this.config.pathColor;
    this.currentPath.forEach((p) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  _drawNodes() {
    this.ctx.fillStyle = this.config.nodeColor;
    this.navMesh.graph.nodes.forEach((node) => {
      const center = node.polygon.getCenter();
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  _drawSpatialGrid() {
    if (!this.navMesh.dynamicObstacleManager) return;
    this.ctx.strokeStyle = this.config.spatialGridColor;
    this.ctx.lineWidth = 0.5;
    this.navMesh.dynamicObstacleManager.spatialGrid.grid.forEach(
      (cells, key) => {
        const [x, y] = key.split(",").map(Number);
        const size = this.navMesh.dynamicObstacleManager.options.cellSize;
        this.ctx.strokeRect(x * size, y * size, size, size);
      }
    );
  }

  _drawLabels() {
    this.ctx.fillStyle = this.config.labelColor;
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "center";
    // Rótulos para nodes
    this.navMesh.graph.nodes.forEach((node) => {
      const center = node.polygon.getCenter();
      this.ctx.fillText(`N${node.id}`, center.x, center.y - 10);
    });
    // Rótulos para obstáculos
    this.activeObstacles.forEach((obstacle, id) => {
      const center = obstacle.getCenter();
      this.ctx.fillText(`O${id.slice(0, 4)}`, center.x, center.y);
    });
    // Info da rota
    if (this.currentPath.length > 0) {
      const firstPoint = this.currentPath[0];
      this.ctx.fillText(
        `Path: ${this.currentPath.length} nodes`,
        firstPoint.x,
        firstPoint.y - 20
      );
    }
  }

  toggle(enabled = true, newConfig = {}) {
    this.config.enabled = enabled;
    if (newConfig) this.updateConfig(newConfig);
    if (enabled) this.draw();
    else this._clearCanvas();
  }

  /**
   * Captura dados de debug para inspeção
   * @returns {Object} Estado atual do sistema
   */
  captureDebugData() {
    const agentPaths = Array.from(
      this.navMesh.agentManager.activeAgents.values()
    ).map((agent) => ({
      id: agent.id,
      type: agent.type,
      currentPath: agent.currentPath,
    }));
    return {
      polygons: this.navMesh.polygons.length,
      nodes: this.navMesh.graph.nodes.length,
      obstacles: this.activeObstacles.size,
      agentPaths, // agora com o currentPath de cada agente
      spatialGrid: {
        cellSize: this.navMesh.dynamicObstacleManager?.options.cellSize,
        cells: this.navMesh.dynamicObstacleManager?.spatialGrid.grid.size,
      },
      eventLog: this.eventLog.slice(-50),
      config: this.config,
    };
  }

  /**
   * Destaca áreas acessíveis para um perfil específico
   * @param {AgentProfile} profile
   */
  highlightAccessibleAreas(profile) {
    const accessibleNodes = this.navMesh.graph.nodes.filter(
      (node) =>
        node.polygon.traversalCost <= profile.maxSlope &&
        node.polygon.getWidth() >= profile.minPathWidth &&
        profile.allowedLayers.has(node.polygon.layer)
    );

    this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
    accessibleNodes.forEach((node) => {
      const center = node.polygon.getCenter();
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  /**
   * Desenha caminhos de todos os agentes ativos
   */
  drawAllAgentPaths() {
    this.navMesh.agentManager?.activeAgents.forEach((agent, id) => {
      if (agent.currentPath.length > 1) {
        this.ctx.strokeStyle = agent.profile.color || "#ff0000";
        this.ctx.beginPath();
        agent.currentPath.forEach((p, i) => {
          i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y);
        });
        this.ctx.stroke();
      }
    });
  }
  /**
   * Destaca camadas específicas
   * @param {Array<string>} layers - Lista de camadas
   * @param {string} highlightColor - Cor de destaque
   */
  highlightLayers(layers, highlightColor = "rgba(255, 255, 0, 0.3)") {
    this.navMesh.polygons.forEach((poly) => {
      if (layers.includes(poly.layer)) {
        const center = poly.getCenter();
        this.ctx.fillStyle = highlightColor;
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
}
