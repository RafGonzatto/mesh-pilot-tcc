import { Graph } from './Graph.js';


/**
 * @module Pathfinder
 * Algoritmos de pathfinding.
 */
export class Pathfinder {
    /**
     * BFS (busca em largura) que retorna sequência de IDs no caminho.
     * @param {Graph} graph 
     * @param {number} startId 
     * @param {number} goalId 
     * @param {boolean} verbose Se true, faz logs passo a passo
     * @returns {number[]}
     */
    static bfs(graph, startId, goalId, verbose=false) {
      if (!graph.getNode(startId) || !graph.getNode(goalId)) return [];
      if (startId === goalId) return [startId];
  
      if (verbose) console.log(`[BFS] Iniciando de ${startId} até ${goalId}...`);
  
      const queue = [startId];
      const visited = new Set([startId]);
      const parent = new Map();
  
      while (queue.length) {
        const current = queue.shift();
        if (verbose) console.log(`[BFS] Retirou ${current} da fila. Adjacências:`, graph.getAdjacencias(current));
  
        for (const {nodeId} of graph.getAdjacencias(current)) {
          if (!visited.has(nodeId)) {
            visited.add(nodeId);
            parent.set(nodeId, current);
            queue.push(nodeId);
            if (verbose) console.log(`[BFS] Visitando ${nodeId}. Pai=${current}`);
            if (nodeId === goalId) {
              // Achou destino
              if (verbose) console.log(`[BFS] Chegou em ${goalId}, reconstruindo caminho...`);
              return Pathfinder._reconstruirCaminho(parent, startId, goalId);
            }
          }
        }
      }
      if (verbose) console.log('[BFS] Nenhum caminho encontrado.');
      return [];
    }
  
    static _reconstruirCaminho(parentMap, startId, goalId) {
      const path = [];
      let atual = goalId;
      while (atual !== undefined) {
        path.push(atual);
        if (atual === startId) break;
        atual = parentMap.get(atual);
      }
      return path.reverse();
    }
  }
