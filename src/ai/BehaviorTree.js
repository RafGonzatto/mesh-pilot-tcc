// src/ai/BehaviorTree.js

import { NodeStatus } from "./Nodes.js";

export default class BehaviorTree {
  constructor(rootNode) {
    this.root = rootNode;
  }

  /**
   * Executa a árvore de comportamento.
   * @param {Object} blackboard - objeto com dados do NPC
   */
  tick(blackboard) {
    if (!this.root) {
      console.warn("BehaviorTree: raiz não definida.");
      return NodeStatus.FAILURE;
    }
    return this.root.tick(blackboard);
  }
}
