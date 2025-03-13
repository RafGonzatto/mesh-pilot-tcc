// src/ai/FiniteStateMachine.js

export default class FiniteStateMachine {
  constructor(initialState) {
    this.currentState = initialState;
    if (this.currentState && this.currentState.enter) {
      this.currentState.enter();
    }
  }

  update() {
    if (!this.currentState) return;

    // Executa lógica do estado
    if (this.currentState.execute) {
      this.currentState.execute();
    }

    // Verifica transições
    if (this.currentState.checkTransitions) {
      const nextState = this.currentState.checkTransitions();
      if (nextState && nextState !== this.currentState) {
        // Sair do estado atual
        if (this.currentState.exit) {
          this.currentState.exit();
        }
        // Entrar no novo estado
        this.currentState = nextState;
        if (this.currentState.enter) {
          this.currentState.enter();
        }
      }
    }
  }
}
