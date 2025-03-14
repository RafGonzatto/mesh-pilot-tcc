/////////////////////// main.js ///////////////////////
import { Polygon } from '../../src/navmesh/Polygon.js';
import { NavMesh } from '../../src/navmesh/NavMesh.js';
import { Pathfinder } from '../../src/pathfinding/Pathfinder.js';

/*
 * Jogo que usa logs para mostrar:
 *  - Adjacência calculada no NavMesh
 *  - Passos do BFS
 *  - Movimentações do NPC
 */

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const logDiv = document.getElementById('log');

/** Função para exibir logs em tela */
function logMessage(msg) {
  const div = document.createElement('div');
  div.className = 'log-line';
  div.innerHTML = msg;
  logDiv.appendChild(div);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// 1) Cria NavMesh com função de log para exibir processos de buildGraph
const navMesh = new NavMesh(logMessage);

// Polígonos (grande “mapa” dividindo áreas)
const walkPoly1 = new Polygon([
  {x:50,  y:50},   {x:350, y:50},
  {x:350, y:300},  {x:50,  y:300}
]);
const walkPoly2 = new Polygon([
  {x:350, y:50},   {x:700, y:50},
  {x:700, y:300},  {x:350, y:300}
]);
const walkPoly3 = new Polygon([
  {x:50,  y:300},  {x:280, y:300},
  {x:280, y:550},  {x:50,  y:550}
]);
const walkPoly4 = new Polygon([
  {x:280, y:300},  {x:700, y:300},
  {x:700, y:580},  {x:280, y:580}
]);

const walkPoly5 = new Polygon([
  {x:710, y:50}, {x:780, y:50}, 
  {x:780, y:300}, {x:710, y:300}
]);

const walkPoly6 = new Polygon([
  {x:700, y:310}, {x:780, y:310},
  {x:780, y:580}, {x:700, y:580}
]);

// Adicionamos todos
[walkPoly1, walkPoly2, walkPoly3, walkPoly4, walkPoly5, walkPoly6]
  .forEach(p => navMesh.addPolygon(p));

// Monta o grafo
navMesh.buildGraph();

// Obstáculos (exclusivamente visuais)
const obstacles = [
  new Polygon([
    {x:200,y:200}, {x:220,y:230}, {x:180,y:260}, {x:140,y:210}
  ]),
  new Polygon([
    {x:500,y:200}, {x:520,y:260}, {x:470,y:240}
  ]),
  new Polygon([
    {x:600,y:400}, {x:630,y:450}, {x:560,y:480}, {x:540,y:420}
  ])
];

// ========== ENTIDADES ==========

class Entity {
  constructor(x, y, radius, color) {
    this.x = x; 
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speed = 2;
  }
}

const player = new Entity(100, 100, 10, 'green');

/**
 * NPC que faz BFS e logs do processo,
 * indo de polígono em polígono (centro a centro)
 * e, se estiver no mesmo polígono do Player, vai direto no Player.
 */
class Npc extends Entity {
  constructor(x,y){
    super(x,y,10,'red');
    this.currentPath = [];
    this.nextTargetIndex = 0;
    this.recalcTimer = 0;
    this.currentPolyId = -1;   
    this.playerPolyId = -1;    
  }

  update() {
    this.recalcTimer--;
    if (this.recalcTimer<=0) {
      this.recalcTimer = 60; 
      this._recalcularRota();
    }

    // se NPC e Player no mesmo polígono → vai direto
    if (this.currentPolyId === this.playerPolyId && this.playerPolyId>=0) {
      this._moveDirect(player.x, player.y);
      return;
    }

    // caso contrário, segue o path de centro em centro
    if (this.currentPath.length>1 && this.nextTargetIndex < this.currentPath.length) {
      const polyId = this.currentPath[this.nextTargetIndex];
      const poly = navMesh.polygons[polyId];
      if (!poly) {
        this.nextTargetIndex++;
        return;
      }
      const {x:tx, y:ty} = poly.getCenter();
      this._moveDirect(tx, ty, ()=>{ this.nextTargetIndex++; });
    }
  }

  _moveDirect(tx, ty, onArrive) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > this.speed) {
      this.x += (dx/dist)*this.speed;
      this.y += (dy/dist)*this.speed;
    } else {
      // chegou
      this.x = tx;
      this.y = ty;
      if (onArrive) onArrive();
    }
  }

  _recalcularRota() {
    this.currentPolyId = findPolygon(navMesh.polygons, {x:this.x,y:this.y});
    this.playerPolyId = findPolygon(navMesh.polygons, {x:player.x,y:player.y});

    logMessage(`
      <span class="highlight">
      [NPC] Recalculando rota. NPC poly=${this.currentPolyId}, Player poly=${this.playerPolyId}
      </span>
    `);

    // se NPC ou Player estiver fora do NavMesh
    if (this.currentPolyId<0 || this.playerPolyId<0) {
      this.currentPath = [];
      this.nextTargetIndex=0;
      return;
    }

    // BFS com logs
    this.currentPath = Pathfinder.bfs(
      navMesh.graph, 
      this.currentPolyId, 
      this.playerPolyId, 
      logMessage
    );

    this.nextTargetIndex = (this.currentPath.length>1)? 1 : 0;
  }
}

const npc = new Npc(600, 150);

// ========== TECLADO ==========

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function updatePlayer() {
  let moveX=0, moveY=0;
  if (keys['arrowleft'] || keys['a']) moveX = -player.speed;
  if (keys['arrowright'] || keys['d']) moveX = player.speed;
  if (keys['arrowup'] || keys['w']) moveY = -player.speed;
  if (keys['arrowdown'] || keys['s']) moveY = player.speed;

  const newX = player.x + moveX;
  const newY = player.y + moveY;
  if (canMoveTo(newX, newY)) {
    player.x = newX;
    player.y = newY;
  }
}

function canMoveTo(x, y) {
  const pid = findPolygon(navMesh.polygons, {x,y});
  return (pid>=0);
}

function findPolygon(polyList, point) {
  for (let i=0; i<polyList.length; i++){
    if (!polyList[i]) continue;
    if (polyList[i].containsPoint(point)) return i;
  }
  return -1;
}

// ========== LOOP PRINCIPAL ==========

function update() {
  updatePlayer();
  npc.update();
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Desenha polígonos caminháveis (azuis)
  navMesh.polygons.forEach((poly,idx)=>{
    const vs = poly.vertices;
    ctx.beginPath();
    vs.forEach((v,i)=>{
      i===0 ? ctx.moveTo(v.x,v.y) : ctx.lineTo(v.x,v.y);
    });
    ctx.closePath();
    ctx.fillStyle = '#cceeff';
    ctx.fill();
    ctx.strokeStyle = '#3399cc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // opcional: ID do polígono
    const c = poly.getCenter();
    ctx.font = '13px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`P${idx}`, c.x+5, c.y);
  });

  // Obstáculos (cinza)
  obstacles.forEach(obs=>{
    ctx.beginPath();
    obs.vertices.forEach((v,i)=>{
      i===0 ? ctx.moveTo(v.x,v.y) : ctx.lineTo(v.x,v.y);
    });
    ctx.closePath();
    ctx.fillStyle = '#aaaaaa';
    ctx.fill();
    ctx.strokeStyle = '#888888';
    ctx.stroke();
  });

  // Arestas do grafo
  if (navMesh.graph) {
    for (const node of navMesh.graph.nodes) {
      const cA = node.polygon.getCenter();
      const adjs = navMesh.graph.getAdjacencias(node.id);
      for (const {nodeId} of adjs) {
        const cB = navMesh.polygons[nodeId].getCenter();
        ctx.beginPath();
        ctx.moveTo(cA.x, cA.y);
        ctx.lineTo(cB.x, cB.y);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Player
  drawCircle(player.x, player.y, player.radius, player.color);

  // NPC
  drawCircle(npc.x, npc.y, npc.radius, npc.color);

  // Se NPC tiver rota, desenha caminho em vermelho tracejado
  if (npc.currentPath.length>1) {
    ctx.beginPath();
    ctx.moveTo(npc.x, npc.y);
    for (let i=0; i<npc.currentPath.length; i++){
      const pid = npc.currentPath[i];
      const c = navMesh.polygons[pid].getCenter();
      ctx.lineTo(c.x, c.y);
    }
    ctx.strokeStyle = 'red';
    ctx.setLineDash([4,2]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCircle(x,y,radius,color) {
  ctx.beginPath();
  ctx.arc(x,y,radius,0,2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Mensagem inicial
logMessage(`
  <strong>Controles:</strong> Use setas ou W/A/S/D para mover o Player (verde).<br>
  O NPC (vermelho) recalcula rota a cada 1 segundo com BFS.<br>
  Se estiver no mesmo polígono do Player, irá direto no jogador.<br>
  Acompanhe nos logs cada passo do NavMesh e BFS!
`);