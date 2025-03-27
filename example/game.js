import {
  NavMesh,
  Polygon,
  DebugVisualizer,
  AgentProfile,
} from "../../src/index.js";

/**
 * Stringify seguro para objetos com referências circulares.
 * @param {Object} obj
 * @param {number} [space=2]
 * @returns {string}
 */
function safeStringify(obj, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return;
        seen.add(value);
      }
      return value;
    },
    space
  );
}

/**
 * Formata dados de debug em HTML para exibir no modal.
 * @param {Object} data - Objeto com informações de debug.
 * @returns {string} HTML formatado.
 */
function formatDebugData(data) {
  let html = '<div class="debug-summary">';
  html += `<p><strong>Polygons:</strong> ${data.polygons}</p>`;
  html += `<p><strong>Nodes:</strong> ${data.nodes}</p>`;
  html += `<p><strong>Obstacles:</strong> ${data.obstacles}</p>`;
  if (data.spatialGrid) {
    const { cellSize, cells } = data.spatialGrid;
    html += `<p><strong>Spatial Grid:</strong> cellSize: ${cellSize}, cells: ${cells}</p>`;
  }
  html += "</div>";

  if (data.agentPaths?.length) {
    html += "<h4>Agent Paths:</h4><ul>";
    data.agentPaths.forEach((agent) => {
      html += `<li><strong>${agent.id} (${agent.type})</strong>: ${agent.currentPath.length} nodes`;
      if (agent.currentPath.length) {
        html += "<ul>";
        agent.currentPath.forEach((pt, i) => {
          html += `<li>${i}: x=${pt.x.toFixed(2)}, y=${pt.y.toFixed(2)}</li>`;
        });
        html += "</ul>";
      }
      html += "</li>";
    });
    html += "</ul>";
  }
  html += "<h4>Configuração:</h4><pre>" + safeStringify(data.config) + "</pre>";
  return html;
}

/**
 * Pré-carrega imagens via ID (document.getElementById).
 * @param {string[]} ids - IDs de elementos <img>.
 * @returns {Promise<void>}
 */
function preloadImages(ids) {
  return new Promise((resolve) => {
    let loaded = 0;
    ids.forEach((id) => {
      const img = document.getElementById(id);
      if (img.complete) {
        if (++loaded === ids.length) resolve();
      } else {
        img.onload = () => {
          if (++loaded === ids.length) resolve();
        };
      }
    });
  });
}

/**
 * Classe principal do Jogo, com NavMesh, agentes e loop de renderização.
 */
class Game {
  constructor() {
    /** @type {HTMLCanvasElement} */
    this.canvas = document.getElementById("gameCanvas");
    /** @type {HTMLCanvasElement} */
    this.debugCanvas = document.getElementById("debugCanvas");
    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext("2d");
    /** @type {CanvasRenderingContext2D} */
    this.debugCtx = this.debugCanvas.getContext("2d");

    this.paused = false;
    this.selectedAgentId = "agent1"; // Agente selecionado inicialmente

    this._setupCanvases();
    this._initNavMesh();
    this._setupEvents();
    this._startGameLoop();
  }

  /**
   * Ajusta tamanho dos canvases para a janela.
   */
  _setupCanvases() {
    const w = window.innerWidth,
      h = window.innerHeight;
    [this.canvas, this.debugCanvas].forEach((c) => {
      c.width = w;
      c.height = h;
    });
  }

  /**
   * Inicializa NavMesh, configura camadas, cria grade e agentes.
   */
  _initNavMesh() {
    this.navMesh = new NavMesh(true);
    this.navMesh.enableDynamicObstacles({
      cellSize: 80,
      autoUpdate: true,
      obstacleLayer: "dynamic",
    });
    const ls = this.navMesh.layerSystem;
    ls.registerLayer("dynamic", { color: "rgba(255,0,0,0.5)" });
    ls.registerLayer("ground", { color: "#4a4a4a", imageId: "groundImage" });
    ls.registerLayer("water", { color: "#006994", imageId: "waterImage" });
    ls.registerLayer("road", { color: "#505050", imageId: "roadImage" });
    ls.registerLayer("bridge", { color: "#8b4513", imageId: "bridgeImage" });

    this._createGridGeometry(20, 20);

    this.navMesh.buildGraphConsideringObstacles(
      this.navMesh.dynamicObstacleManager.obstacles
    );
    this.debug = new DebugVisualizer(this.debugCtx, this.navMesh, {
      debugEventLog: true,
      showLabels: true,
      showSpatialGrid: true,
    });
    this.debug.toggle(true);

    this.agentManager = this.navMesh.agentManager;
    // Registra perfis de agentes
    this.agentManager.registerProfile(
      "human",
      new AgentProfile({
        radius: 5,
        minPathWidth: 10,
        maxSlope: 45,
        allowedLayers: new Set(["water", "ground", "road", "bridge"]),
        terrainCosts: { water: 1000, ground: 1, road: 50, bridge: 100 },
      })
    );
    this.agentManager.registerProfile(
      "car",
      new AgentProfile({
        radius: 10,
        minPathWidth: 20,
        maxSlope: 45,
        allowedLayers: new Set(["water", "ground", "road", "bridge"]),
        terrainCosts: { road: 1, bridge: 50, ground: 1000, water: 1000 },
      })
    );
    this.agentManager.registerProfile(
      "boat",
      new AgentProfile({
        radius: 5,
        minPathWidth: 10,
        maxSlope: 45,
        allowedLayers: new Set(["water", "ground", "road", "bridge"]),
        terrainCosts: { water: 1, ground: 1000, road: 100, bridge: 50 },
      })
    );
    // Cria agentes
    this.agentManager.createAgent("agent1", "human", { x: 50, y: 50 });
    this.agentManager.createAgent("agent2", "car", { x: 300, y: 300 });
    this.agentManager.createAgent("agent3", "boat", { x: 500, y: 100 });

    this._updateUI();
  }

  /**
   * Cria grid de polígonos (colunas x linhas), atribuindo camadas aleatórias.
   * @param {number} cols
   * @param {number} rows
   */
  _createGridGeometry(cols, rows) {
    const w = this.canvas.width,
      h = this.canvas.height;
    const cellW = w / cols,
      cellH = h / rows;
    const layers = ["ground", "water", "road", "bridge"];
    this.grid = [];

    for (let r = 0; r < rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const x1 = Math.round(c * cellW),
          y1 = Math.round(r * cellH),
          x2 = Math.round((c + 1) * cellW),
          y2 = Math.round((r + 1) * cellH);

        const poly = new Polygon(
          [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x2, y: y2 },
            { x: x1, y: y2 },
          ],
          { layer: layers[Math.floor(Math.random() * layers.length)] }
        );

        this.navMesh.addPolygon(poly);
        this.grid[r][c] = poly;
      }
    }
    // Conecta polígonos vizinhos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = this.grid[r][c];
        if (c < cols - 1) this._connectPolygons(current, this.grid[r][c + 1]);
        if (r < rows - 1) this._connectPolygons(current, this.grid[r + 1][c]);
      }
    }
  }

  /**
   * Conecta dois polígonos como vizinhos.
   * @param {Polygon} polyA
   * @param {Polygon} polyB
   */
  _connectPolygons(polyA, polyB) {
    polyA.neighbors = polyA.neighbors || [];
    polyB.neighbors = polyB.neighbors || [];
    polyA.neighbors.push(polyB);
    polyB.neighbors.push(polyA);
  }

  /**
   * Registra eventos de resize e clique/duplo clique no canvas.
   */
  _setupEvents() {
    window.addEventListener("resize", () => this._setupCanvases());
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const target = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.agentManager.setAgentTarget(this.selectedAgentId, target, true);
    });
    this.canvas.addEventListener("dblclick", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      this._addObstacleAt(x, y);
    });
    document.getElementById("agentList").addEventListener("click", (e) => {
      if (e.target?.dataset?.id) {
        this.selectedAgentId = e.target.dataset.id;
        this._updateUI();
      }
    });
  }

  /**
   * Adiciona obstáculo (polígono) em (x,y).
   * @param {number} x
   * @param {number} y
   */
  _addObstacleAt(x, y) {
    const size = 100;
    const obstacle = new Polygon(
      [
        { x: x - size / 2, y: y - size / 2 },
        { x: x + size / 2, y: y - size / 2 },
        { x: x + size / 2, y: y + size / 2 },
        { x: x - size / 2, y: y + size / 2 },
      ],
      {
        layer: "dynamic",
        metadata: {
          imageId: "obstacleImage",
          width: 64,
          height: 64,
          walkable: false,
        },
      }
    );
    this.navMesh.addPolygon(obstacle);
    this.navMesh.dynamicObstacleManager.addObstacle(obstacle);
    const allObs = Array.from(
      this.navMesh.dynamicObstacleManager.obstacles.values()
    );
    this.navMesh.buildGraphConsideringObstacles(allObs);
  }

  /**
   * Inicia loop de jogo, atualizando e renderizando canvas.
   */
  _startGameLoop() {
    // Define um destino inicial básico para cada agente
    this.agentManager.activeAgents.forEach((agent) => {
      const target = { x: agent.position.x + 100, y: agent.position.y + 100 };
      this.agentManager.setAgentTarget(agent.id, target, true);
    });

    const loop = () => {
      if (!this.paused) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Desenha cada polígono do NavMesh
        this.navMesh.polygons.forEach((poly) => {
          if (poly.layer === "dynamic" && poly.metadata?.imageId) {
            const img = document.getElementById(poly.metadata.imageId);
            if (img && img.complete) {
              const c = poly.getCenter(),
                w = poly.metadata.width || 50,
                h = poly.metadata.height || 50;
              this.ctx.drawImage(img, c.x - w / 2, c.y - h / 2, w, h);
            } else {
              this._fillPolygon(poly);
            }
          } else {
            this._fillPolygon(poly);
          }
        });
        // Atualiza e desenha agentes
        this.agentManager.activeAgents.forEach((agent) => {
          this.agentManager.updateAgent(agent.id, 2);
          this._drawAgent(agent);
        });
        // Desenha linhas de debug
        if (this.debug.config.enabled) this.debug.drawAllAgentPaths();
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Desenha um agente.
   * @param {Object} agent
   */
  _drawAgent(agent) {
    const img = document.getElementById(`${agent.type}Image`);
    if (img && img.complete) {
      const size = 32;
      this.ctx.drawImage(
        img,
        agent.position.x - size / 2,
        agent.position.y - size / 2,
        size,
        size
      );
    } else {
      this.ctx.fillStyle = "#ff0000";
      this.ctx.beginPath();
      this.ctx.arc(agent.position.x, agent.position.y, 10, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  /**
   * Preenche o polígono com cor ou textura.
   * @param {Polygon} poly
   */
  _fillPolygon(poly) {
    const lc = this.navMesh.layerSystem.layerFilters.get(poly.layer);
    let pattern = null;
    if (lc?.imageId) {
      const tex = document.getElementById(lc.imageId);
      if (tex && tex.complete) pattern = this.ctx.createPattern(tex, "repeat");
    }
    this.ctx.fillStyle = pattern || (lc ? lc.color : "#000");
    this.ctx.beginPath();
    poly.vertices.forEach((v, i) => {
      i === 0 ? this.ctx.moveTo(v.x, v.y) : this.ctx.lineTo(v.x, v.y);
    });
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Atualiza UI (debug, pause, lista de agentes, custos).
   */
  _updateUI() {
    document.getElementById("debugStatus").textContent =
      "Debug: " + (this.debug.config.enabled ? "Ativo" : "Inativo");
    document.getElementById("pauseStatus").textContent =
      "Jogo: " + (this.paused ? "Pausado" : "Executando");

    let html = "";
    this.agentManager.activeAgents.forEach((agent) => {
      const cls =
        agent.id === this.selectedAgentId
          ? "agentSelector selected"
          : "agentSelector";
      html += `<div class="${cls}" data-id="${agent.id}">${agent.type} (${agent.id})</div>`;
    });
    document.getElementById("agentList").innerHTML = html;

    const agent = Array.from(this.agentManager.activeAgents.values()).find(
      (a) => a.id === this.selectedAgentId
    );

    let costHtml = "";
    if (agent) {
      const profile = this.agentManager.agentProfiles.get(agent.type);
      if (profile?.terrainCosts) {
        Object.entries(profile.terrainCosts).forEach(([terrain, cost]) => {
          costHtml += `<div>${terrain}: ${cost}</div>`;
        });
      }
    }
    document.getElementById(
      "layerLegend"
    ).innerHTML = `<h4>Custos do Agente</h4>${costHtml}`;
  }

  /**
   * Ativa/Desativa o modo debug.
   */
  toggleDebug() {
    this.debug.toggle(!this.debug.config.enabled);
    document.getElementById("debugStatus").textContent =
      "Debug: " + (this.debug.config.enabled ? "Ativo" : "Inativo");
  }

  /**
   * Pausa ou retoma o loop do jogo.
   */
  togglePause() {
    this.paused = !this.paused;
    document.getElementById("pauseStatus").textContent =
      "Jogo: " + (this.paused ? "Pausado" : "Executando");
  }

  /**
   * Abre o modal de debug, exibindo informações capturadas.
   */
  openDebugModal() {
    const modal = document.getElementById("debugModal");
    const log = document.getElementById("debugLog");
    const updateModal = () => {
      const debugData = this.debug.captureDebugData();
      log.innerHTML = formatDebugData(debugData);
    };
    updateModal();
    this._debugModalInterval = setInterval(updateModal, 1000);
    modal.style.display = "block";
  }

  /**
   * Fecha o modal de debug.
   */
  closeDebugModal() {
    const modal = document.getElementById("debugModal");
    clearInterval(this._debugModalInterval);
    modal.style.display = "none";
  }
}

/* ================== Funções globais (usadas pelos botões) ================== */
window.addEventListener("load", async () => {
  await preloadImages([
    "groundImage",
    "waterImage",
    "roadImage",
    "bridgeImage",
    "humanImage",
    "carImage",
    "boatImage",
    "obstacleImage",
  ]);
  const game = new Game();
  window.game = game; // Expondo pra console/debug

  // Ligando funções que são chamadas pelos botões do HTML
  window.toggleDebug = () => game.toggleDebug();
  window.togglePause = () => game.togglePause();
  window.openDebugModal = () => game.openDebugModal();
  window.closeDebugModal = () => game.closeDebugModal();
});
