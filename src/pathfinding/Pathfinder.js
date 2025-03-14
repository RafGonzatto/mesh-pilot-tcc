import { Graph } from './Graph.js';

/**
 * @module Pathfinder
 * Algoritmos de pathfinding (BFS). Logamos cada passo de expansão.
 */
export class Pathfinder {
  /**
   * BFS para encontrar caminho (sequência de IDs) no grafo.
   * @param {Graph} graph 
   * @param {number} startId 
   * @param {number} goalId 
   * @param {(msg:string)=>void} logger Função para logar mensagens de debug
   * @returns {number[]} sequência de IDs do caminho
   */
  static bfs(graph, startId, goalId, logger=null) {
    const log = logger || (()=>{});
    log(`[BFS] Iniciando busca de ${startId} até ${goalId}...`);

    if (!graph.getNode(startId) || !graph.getNode(goalId)) {
      log(`[BFS] startId ou goalId inválidos. Sem caminho.\n`);
      return [];
    }
    if (startId === goalId) {
      log(`[BFS] startId == goalId. Caminho é [${startId}].\n`);
      return [startId];
    }

    const queue = [startId];
    const visited = new Set([startId]);
    const parent = new Map();

    while (queue.length) {
      const current = queue.shift();
      log(`[BFS] Visitando nó ${current}. Fila=[${queue.join(', ')}]`);

      const adj = graph.getAdjacencias(current);
      log(`[BFS] Adjacências de ${current}: ${adj.map(a=>a.nodeId).join(', ')}`);

      for (const {nodeId} of adj) {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          parent.set(nodeId, current);
          queue.push(nodeId);
          log(`[BFS]   -> Adicionando nó ${nodeId} à fila.`);
          if (nodeId === goalId) {
            // Reconstrói caminho
            const path = Pathfinder._reconstruirCaminho(parent, startId, goalId);
            log(`[BFS] Objetivo encontrado! Caminho final: ${path.join(' -> ')}\n`);
            return path;
          }
        }
      }
    }
    log(`[BFS] Não encontrou caminho.\n`);
    return [];
  }

  static _reconstruirCaminho(parent, startId, goalId) {
    const path = [];
    let atual = goalId;
    while (atual !== undefined) {
      path.push(atual);
      if (atual === startId) break;
      atual = parent.get(atual);
    }
    return path.reverse();
  }
}
