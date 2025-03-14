/////////////////////// main.js ///////////////////////
import { Polygon } from '../../src/navmesh/Polygon.js';
import { NavMesh } from '../../src/navmesh/NavMesh.js';
import { Pathfinder } from '../../src/pathfinding/Pathfinder.js';


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const logDiv = document.getElementById('log');

function logMessage(msg) {
  const div = document.createElement('div');
  div.className = 'log-line';
  div.innerHTML = msg;
  logDiv.appendChild(div);
  logDiv.scrollTop = logDiv.scrollHeight;
}

/**
 * Caso de colisão
 */
function onCollisionObstacle(entity, obstacle) {
  logMessage(`<span class="highlight">${entity.color.toUpperCase()} colidiu</span> com obstáculo – recalculando rota...`);
  // se for o NPC, força recalcular rota
  if (entity instanceof Npc) {
    entity._recalcularRota(true); 
  }
}

/**
 * Helper – checa se "circle" colide com "polygon"
 */
function circleIntersectsPolygon(entity, polygon) {
  // 1) se centro está dentro do polígono
  if (polygon.containsPoint({x:entity.x, y:entity.y})) return true;
  // 2) se alguma aresta está a <= radius do centro
  const edges = polygon.getEdges();
  for (const e of edges) {
    const distSeg = distancePointToSegment(entity, e.start, e.end);
    if (distSeg <= entity.radius) return true;
  }
  return false;
}
function distancePointToSegment(p, a, b) {
  const segLen2 = sqDist(a,b);
  if (segLen2===0) return Math.sqrt(sqDist(p,a));
  let t = ((p.x - a.x)*(b.x - a.x) + (p.y - a.y)*(b.y - a.y)) / segLen2;
  t = Math.max(0, Math.min(1, t));
  const proj = {
    x: a.x + t*(b.x-a.x),
    y: a.y + t*(b.y-a.y)
  };
  return Math.sqrt(sqDist(p, proj));
}
function sqDist(a,b){
  const dx = b.x - a.x, dy = b.y - a.y;
  return dx*dx + dy*dy;
}

// ===================================================
// 1) NavMesh e Polígonos Caminháveis
// ===================================================

const navMesh = new NavMesh(true); // logs ativados no console

// Polígonos do “mapa”
const walkPoly1 = new Polygon([
  {x:50,  y:50},   {x:450, y:50},
  {x:450, y:250},  {x:50,  y:250}
]);
const walkPoly2 = new Polygon([
  {x:450, y:50},   {x:750, y:50},
  {x:750, y:250},  {x:450, y:250}
]);
const walkPoly3 = new Polygon([
  {x:50,  y:250},  {x:280, y:250},
  {x:280, y:450},  {x:50,  y:450}
]);
const walkPoly4 = new Polygon([
  {x:280, y:250},  {x:750, y:250},
  {x:750, y:450},  {x:280, y:450}
]);

navMesh.addPolygon(walkPoly1);
navMesh.addPolygon(walkPoly2);
navMesh.addPolygon(walkPoly3);
navMesh.addPolygon(walkPoly4);

// ===================================================
// 2) Obstáculos
// ===================================================

const obstacles = [
  new Polygon([
    {x:250,y:200}, {x:270,y:230}, {x:210,y:230}
  ]),
  new Polygon([
    {x:600,y:200}, {x:640,y:200}, {x:640,y:240}, {x:600,y:240}
  ]),
  new Polygon([
    {x:300,y:350}, {x:400,y:390}, {x:340,y:450}, {x:300,y:410}
  ])
];

// **Construir** o grafo já levando em conta os obstáculos
navMesh.buildGraphConsideringObstacles(obstacles);
logMessage('NavMesh criado com base nos obstáculos. Rotas bloqueadas não aparecem no grafo.');

// ===================================================
// 3) Classes de Entidade (Player, NPC)
// ===================================================

class Entity {
  constructor(x,y,radius,color){
    this.x = x; this.y = y; 
    this.radius = radius;
    this.color = color;
    this.speed = 2;
  }

  tryMove(tx,ty) {
    const oldX = this.x, oldY = this.y;
    this.x = tx; 
    this.y = ty;
    // Checar colisão com cada obstáculo
    for (const obs of obstacles) {
      if (circleIntersectsPolygon(this, obs)) {
        // colidiu, reverte
        this.x = oldX;
        this.y = oldY;
        onCollisionObstacle(this, obs);
        return false;
      }
    }
    return true;
  }
}

const player = new Entity(100,100,10,'green');

class Npc extends Entity {
  constructor(x,y) {
    super(x,y,10,'red');
    this.currentPath = [];
    this.nextTargetIndex=0;
    this.currentPolyId=-1;
    this.playerPolyId=-1;
    this.recalcTimer=0;
  }

  update() {
    // Descobrir em qual polígono estou
    this.currentPolyId = findPolygon(navMesh.polygons, this.x, this.y);
    // A cada ~1s recalcula rota
    this.recalcTimer--;
    if (this.recalcTimer<=0) {
      this.recalcTimer=60;
      this._recalcularRota(false);
    }

    // Se estou no mesmo polígono do player, vou direto até player.x/y
    if (this.currentPolyId === this.playerPolyId && this.playerPolyId>=0) {
      this._moveTowards(player.x, player.y);
      return;
    }
    // Caso contrário, sigo a rota polígono -> polígono
    if (this.currentPath.length>1 && this.nextTargetIndex<this.currentPath.length) {
      const pid = this.currentPath[this.nextTargetIndex];
      const poly = navMesh.polygons[pid];
      if (!poly) {
        this.nextTargetIndex++;
        return;
      }
      const {x:tx,y:ty} = poly.getCenter();
      this._moveTowards(tx, ty, ()=>{
        this.nextTargetIndex++;
      });
    }
  }

  /**
   * Recalcula BFS. Se `atualizarGrafo` for true, 
   * recria o grafo considerando obstáculos (caso algum mude).
   */
  _recalcularRota(atualizarGrafo=false) {
    this.currentPolyId = findPolygon(navMesh.polygons, this.x, this.y);
    this.playerPolyId  = findPolygon(navMesh.polygons, player.x, player.y);

    if (atualizarGrafo) {
      navMesh.buildGraphConsideringObstacles(obstacles);
      logMessage('Re-build do grafo c/ obstáculos após colisão.');
    }

    if (this.currentPolyId<0 || this.playerPolyId<0) {
      this.currentPath=[];
      this.nextTargetIndex=0;
      logMessage('<span class="highlight">NPC</span> fora ou Player fora do NavMesh => sem rota.');
      return;
    }

    logMessage(`<span class="highlight">NPC BFS</span> de ${this.currentPolyId} → ${this.playerPolyId}`);
    const path = Pathfinder.bfs(navMesh.graph, this.currentPolyId, this.playerPolyId, true);
    if (path.length>0) {
      this.currentPath = path;
      this.nextTargetIndex = 1;
      logMessage(`NPC BFS path: [${path.join('->')}]`);
    } else {
      this.currentPath=[];
      this.nextTargetIndex=0;
      logMessage('NPC BFS => Sem caminho encontrado.');
    }
  }

  /**
   * Move-se em direção a (tx,ty). Tenta a cada frame.
   */
  _moveTowards(tx, ty, onArrive) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist>this.speed) {
      const stepX = this.x + (dx/dist)*this.speed;
      const stepY = this.y + (dy/dist)*this.speed;
      this.tryMove(stepX, stepY);
    } else {
      if (this.tryMove(tx, ty)) {
        if (onArrive) onArrive();
      }
    }
  }
}

const npc = new Npc(700,100);

// ===================================================
// 4) Movimento do Player via Teclado
// ===================================================

const keys={};
document.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()]=true; });
document.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });

function updatePlayer() {
  let mx=0, my=0;
  if(keys['arrowleft']||keys['a']) mx=-player.speed;
  if(keys['arrowright']||keys['d']) mx= player.speed;
  if(keys['arrowup']||keys['w']) my=-player.speed;
  if(keys['arrowdown']||keys['s']) my= player.speed;
  if (mx!==0 || my!==0) {
    player.tryMove(player.x+mx, player.y+my);
  }
}

// ===================================================
// 5) Funções auxiliares
// ===================================================
function findPolygon(polyList, x, y) {
  for (let i=0; i<polyList.length; i++){
    const p = polyList[i];
    if(p && p.containsPoint({x,y})) return i;
  }
  return -1;
}

// ===================================================
// 6) Loop Principal
// ===================================================
function update() {
  updatePlayer();
  npc.update();
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // NavMesh (azul)
  navMesh.polygons.forEach(poly=>{
    ctx.beginPath();
    poly.vertices.forEach((v,i)=>{
      if(i===0) ctx.moveTo(v.x,v.y);
      else ctx.lineTo(v.x,v.y);
    });
    ctx.closePath();
    ctx.fillStyle = '#cceeff';
    ctx.fill();
    ctx.strokeStyle = '#3399cc';
    ctx.stroke();
  });

  // Obstáculos (cinza)
  obstacles.forEach(obs=>{
    ctx.beginPath();
    obs.vertices.forEach((v,i)=>{
      if(i===0) ctx.moveTo(v.x,v.y);
      else ctx.lineTo(v.x,v.y);
    });
    ctx.closePath();
    ctx.fillStyle = '#aaaaaa';
    ctx.fill();
    ctx.strokeStyle = '#888888';
    ctx.stroke();
  });

  // Arestas do grafo
  if(navMesh.graph) {
    for(const node of navMesh.graph.nodes) {
      const cA = node.polygon.getCenter();
      for(const {nodeId} of navMesh.graph.getAdjacencias(node.id)) {
        const cB = navMesh.polygons[nodeId].getCenter();
        ctx.beginPath();
        ctx.moveTo(cA.x,cA.y);
        ctx.lineTo(cB.x,cB.y);
        ctx.strokeStyle='blue';
        ctx.lineWidth=1;
        ctx.stroke();
      }
    }
  }

  // Player e NPC
  drawCircle(player.x,player.y,player.radius,player.color);
  drawCircle(npc.x,npc.y,npc.radius,npc.color);

  // Caminho do NPC
  if(npc.currentPath.length>1) {
    ctx.beginPath();
    ctx.moveTo(npc.x,npc.y);
    for(let i=0; i<npc.currentPath.length; i++){
      const pid = npc.currentPath[i];
      const c = navMesh.polygons[pid].getCenter();
      ctx.lineTo(c.x,c.y);
    }
    ctx.setLineDash([5,3]);
    ctx.strokeStyle='red';
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCircle(x,y,r,color) {
  ctx.beginPath();
  ctx.arc(x,y,r,0,2*Math.PI);
  ctx.fillStyle=color;
  ctx.fill();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

logMessage(`
  <strong>Jogabilidade:</strong><br>
  1) O NavMesh ignora as linhas centro→centro bloqueadas por obstáculos.<br>
  2) Se o NPC colidir com um obstáculo, ele recalcula a rota (buildGraphConsideringObstacles + BFS).<br>
  3) Player move-se com setas/WASD, NPC tenta te alcançar no NavMesh.<br>
  4) Veja console para logs detalhados (enableLogs=true).<br>
`);