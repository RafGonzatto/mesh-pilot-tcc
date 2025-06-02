/**
 * Executa o script de smoke-test e falha se ele lançar erro.
 * O teste é síncrono – basta dar `require` no arquivo.
 */
test("smoke test (node-smoke.js)", () => {
  // O caminho é relativo a este arquivo de teste
  require("../../example/smoke-test/node-smoke");
});
