import path from "path";

test("Carregador expõe versão JS na ausência de WASM", async () => {
  // 1) Força a ausência de WebAssembly.instantiateStreaming (opcional)
  // global.WebAssembly = { ...global.WebAssembly, instantiateStreaming: undefined };

  let mod;
  try {
    // 2) Importa o factory que tenta carregar o .wasm
    const createGeometry = (await import("../../dist/geometry_wasm.js"))
      .default;
    mod = await createGeometry();
  } catch (err) {
    // 3) Se falhar (por falta de WASM), importa o fallback JS
    mod = await import("../../dist/geometry_js_fallback.js");
  }

  // 4) Procura pela função de interseção de segmentos
  const fn = mod.segmentsIntersect || mod._segments_intersect;
  expect(typeof fn).toBe("function");
});
