//EventEmmiter.js
/**
 * @module EventSystem
 * Sistema centralizado de eventos para toda a biblioteca
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
    this._globalListeners = new Set();
  }

  on(event, listener) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(listener);
  }

  off(event, listener) {
    if (this._events.has(event)) {
      this._events.get(event).delete(listener);
    }
  }

  emit(event, ...args) {
    // Global listeners (ouvem todos os eventos)
    this._globalListeners.forEach((listener) => {
      try {
        listener({ event, data: args });
      } catch (e) {
        console.error(e);
      }
    });

    // Listeners específicos
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

  addGlobalListener(listener) {
    this._globalListeners.add(listener);
  }

  removeGlobalListener(listener) {
    this._globalListeners.delete(listener);
  }
}
