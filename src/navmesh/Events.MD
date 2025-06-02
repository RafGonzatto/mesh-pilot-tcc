# Guia do Sistema de Eventos (EventSystem)

O **EventEmitter** é o núcleo do sistema de eventos da biblioteca. Ele centraliza a inscrição e a emissão de eventos, permitindo que diversas partes do sistema se comuniquem de forma desacoplada. Este guia explica como utilizar o **EventEmitter**, seus métodos e boas práticas para integração com a sua aplicação.

---

## Visão Geral

O **EventEmitter** permite:

- **Inscrever callbacks para eventos específicos:** usando o método `on()`.
- **Remover inscrições de eventos:** com o método `off()`.
- **Emitir eventos:** que disparam callbacks inscritos, tanto de forma específica quanto global.
- **Utilizar listeners globais:** que serão notificados de qualquer evento emitido.

Esta abordagem possibilita a criação de um sistema flexível onde diferentes componentes podem reagir a mudanças sem estarem diretamente acoplados uns aos outros.

---

## API do EventEmitter

### 1. **Construtor**

```js
constructor() {
  this._events = new Map();
  this._globalListeners = new Set();
}
```

- **Descrição:** Inicializa o objeto com um `Map` para armazenar eventos e seus listeners, e um `Set` para listeners globais.

---

### 2. **Inscrição de Eventos**

#### **on(event, listener)**

```js
on(event, listener)
```

- **Parâmetros:**
  - `event` (string): Nome do evento a ser inscrito.
  - `listener` (Function): Callback que será executada quando o evento ocorrer.
- **Uso:**
  - Inscreve um callback para um evento específico.
- **Exemplo:**

  ```js
  const emitter = new EventEmitter();
  emitter.on("dataReceived", (data) => {
    console.log("Dados recebidos:", data);
  });
  ```

#### **off(event, listener)**

```js
off(event, listener)
```

- **Parâmetros:**
  - `event` (string): Nome do evento.
  - `listener` (Function): Callback a ser removida.
- **Uso:**
  - Remove um listener previamente inscrito para um evento.
- **Exemplo:**

  ```js
  const handleData = (data) => console.log("Dados:", data);
  emitter.on("dataReceived", handleData);
  // Em algum momento, para parar de ouvir:
  emitter.off("dataReceived", handleData);
  ```

---

### 3. **Emissão de Eventos**

#### **emit(event, ...args)**

```js
emit(event, ...args)
```

- **Parâmetros:**
  - `event` (string): Nome do evento a ser emitido.
  - `...args`: Argumentos que serão passados para os listeners.
- **Uso:**
  - Emite o evento, acionando todos os listeners inscritos (tanto específicos quanto globais).
- **Exemplo:**

  ```js
  emitter.emit("dataReceived", { id: 1, value: "exemplo" });
  ```

- **Funcionamento Interno:**
  - Primeiro, notifica todos os **listeners globais**, passando um objeto com `{ event, data: args }`.
  - Em seguida, executa todos os **listeners específicos** do evento, passando os argumentos diretamente.

---

### 4. **Listeners Globais**

#### **addGlobalListener(listener)**

```js
addGlobalListener(listener)
```

- **Parâmetros:**
  - `listener` (Function): Callback que será executada para **todos** os eventos emitidos.
- **Uso:**
  - Útil para depuração ou para funcionalidades que precisam reagir a qualquer evento.
- **Exemplo:**

  ```js
  emitter.addGlobalListener((eventData) => {
    console.log("Evento global:", eventData.event, eventData.data);
  });
  ```

#### **removeGlobalListener(listener)**

```js
removeGlobalListener(listener)
```

- **Parâmetros:**
  - `listener` (Function): Callback a ser removida dos listeners globais.
- **Uso:**
  - Remove um listener global previamente adicionado.
- **Exemplo:**

  ```js
  const globalLogger = (eventData) => {
    console.log("Global log:", eventData);
  };
  emitter.addGlobalListener(globalLogger);
  // Para remover:
  emitter.removeGlobalListener(globalLogger);
  ```

---

## Boas Práticas

1. **Gerenciamento de Listeners:**  
   - Sempre remova listeners que não são mais necessários para evitar vazamentos de memória.
   - Utilize `off()` e `removeGlobalListener()` quando o componente for desmontado ou quando o evento não for mais relevante.

2. **Tratamento de Erros:**  
   - O `emit()` envolve chamadas aos listeners dentro de blocos `try/catch`.  
   - Mesmo assim, garanta que seus listeners sejam resilientes a erros para evitar que um erro em um callback interrompa a cadeia de eventos.

3. **Uso de Listeners Globais:**  
   - Os listeners globais podem ser úteis para log ou para funcionalidades que precisam monitorar todos os eventos.  
   - Contudo, use-os com moderação para não sobrecarregar a aplicação com muitos callbacks executados a cada evento.

4. **Desacoplamento:**  
   - Aproveite o EventEmitter para criar uma arquitetura desacoplada onde os módulos se comunicam via eventos.  
   - Isso torna o sistema mais modular e facilita a manutenção e a escalabilidade.

---

## Exemplos de Uso em um Cenário Real

### Exemplo 1: Comunicação entre Módulos

Imagine que você tenha um módulo de **DataService** que emite eventos quando novos dados são carregados e um módulo de **UI** que precisa atualizar a interface.

```js
// DataService.js
class DataService extends EventEmitter {
  fetchData() {
    // Simula carregamento de dados
    setTimeout(() => {
      const data = { id: 123, value: "Informação importante" };
      this.emit("dataLoaded", data);
    }, 1000);
  }
}

// UI.js
const dataService = new DataService();
dataService.on("dataLoaded", (data) => {
  // Atualiza a interface com os dados
  console.log("Atualizando UI com dados:", data);
});
dataService.fetchData();
```

### Exemplo 2: Monitoramento Global

Você pode adicionar um listener global para monitorar todos os eventos que ocorrem na aplicação.

```js
const emitter = new EventEmitter();
emitter.addGlobalListener(({ event, data }) => {
  console.log(`Evento '${event}' foi emitido com os dados:`, data);
});

// Inscreve eventos específicos
emitter.on("userLogin", (user) => {
  console.log("Usuário logado:", user);
});

// Emite alguns eventos
emitter.emit("userLogin", { username: "rafa", id: 1 });
emitter.emit("dataUpdate", { field: "email", newValue: "rafa@example.com" });
```

---

## Conclusão

O **EventEmitter** é uma ferramenta poderosa que facilita a comunicação interna entre módulos e componentes da biblioteca, promovendo uma arquitetura modular e reativa. Ao dominar seus métodos (`on`, `off`, `emit`, `addGlobalListener` e `removeGlobalListener`), você estará apto a construir sistemas complexos com alto grau de desacoplamento e flexibilidade.

Explore o sistema de eventos em seus projetos e aproveite as vantagens de uma comunicação limpa e eficiente entre os módulos.

Boas implementações!