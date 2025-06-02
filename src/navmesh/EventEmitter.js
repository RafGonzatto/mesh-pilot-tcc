/**
 * @module EventSystem
 * Sistema centralizado de eventos para toda a biblioteca.
 * Permite inscrição e emissão de eventos, além de suportar listeners globais.
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
    this._globalListeners = new Set();
  }

  /**
   * Inscreve um listener para um evento específico.
   * @param {string} event - Nome do evento.
   * @param {Function} listener - Função callback a ser executada quando o evento ocorrer.
   */
  on(event, listener) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(listener);
  }

  /**
   * Remove um listener de um evento específico.
   * @param {string} event - Nome do evento.
   * @param {Function} listener - Função callback a ser removida.
   */
  off(event, listener) {
    if (this._events.has(event)) {
      this._events.get(event).delete(listener);
    }
  }

  /**
   * Emite um evento, executando os listeners globais e os específicos.
   * @param {string} event - Nome do evento.
   * @param {...any} args - Argumentos a serem passados aos listeners.
   */
  emit(event, ...args) {
    // Notifica os listeners globais (que ouvem todos os eventos)
    this._globalListeners.forEach((listener) => {
      try {
        listener({ event, data: args });
      } catch (e) {
        console.error(e);
      }
    });

    // Notifica os listeners específicos do evento
    if (this._events.has(event)) {
      this._events.get(event).forEach((listener) => {
        try {
          listener(...args);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  /**
   * Adiciona um listener global que será notificado para todos os eventos.
   * @param {Function} listener - Função callback.
   */
  addGlobalListener(listener) {
    this._globalListeners.add(listener);
  }

  /**
   * Remove um listener global.
   * @param {Function} listener - Função callback a ser removida.
   */
  removeGlobalListener(listener) {
    this._globalListeners.delete(listener);
  }
}
