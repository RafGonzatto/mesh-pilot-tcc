// src/ai/Nodes.js

/**
 * Resultado padrão que um nó de Behavior Tree pode retornar:
 * - SUCCESS
 * - FAILURE
 * - RUNNING
 */
export const NodeStatus = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  RUNNING: "RUNNING",
};

export class BaseNode {
  constructor() {}
  tick(blackboard) {
    throw new Error("tick() deve ser sobrescrito pelos nós concretos");
  }
}

export class ActionNode extends BaseNode {
  /**
   * @param {function} actionFn: função que recebe blackboard e retorna NodeStatus
   */
  constructor(actionFn) {
    super();
    this.actionFn = actionFn;
  }

  tick(blackboard) {
    return this.actionFn(blackboard);
  }
}

export class ConditionNode extends BaseNode {
  /**
   * @param {function} conditionFn: função que recebe blackboard e retorna boolean
   */
  constructor(conditionFn) {
    super();
    this.conditionFn = conditionFn;
  }

  tick(blackboard) {
    return this.conditionFn(blackboard)
      ? NodeStatus.SUCCESS
      : NodeStatus.FAILURE;
  }
}

/**
 * Composite Nodes
 */

export class SequenceNode extends BaseNode {
  constructor(children = []) {
    super();
    this.children = children;
    this.currentIndex = 0;
  }

  tick(blackboard) {
    for (; this.currentIndex < this.children.length; this.currentIndex++) {
      const status = this.children[this.currentIndex].tick(blackboard);
      if (status !== NodeStatus.SUCCESS) {
        // Se FAIL ou RUNNING, retorna imediatamente
        if (status === NodeStatus.RUNNING) {
          return NodeStatus.RUNNING;
        } else {
          // FAIL
          this.currentIndex = 0;
          return NodeStatus.FAILURE;
        }
      }
    }
    // Se todos os filhos retornaram SUCCESS
    this.currentIndex = 0;
    return NodeStatus.SUCCESS;
  }
}

export class SelectorNode extends BaseNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  tick(blackboard) {
    for (const child of this.children) {
      const status = child.tick(blackboard);
      if (status !== NodeStatus.FAILURE) {
        // Se for SUCCESS ou RUNNING
        return status;
      }
    }
    return NodeStatus.FAILURE;
  }
}
