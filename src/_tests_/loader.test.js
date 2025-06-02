import { fileURLToPath } from "url";
import path from "path";

import fs from "fs";
import { JSDOM } from "jsdom";

test("UMD bundle cria window.MeshPilot", async () => {
  // 1) Cria um JSDOM vazio com permissões para rodar scripts
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    runScripts: "dangerously",
    resources: "usable",
  });
  const { window } = dom;

  // 2) Lê o bundle UMD como texto
  const umdPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../dist/mesh-pilot.umd.js"
  );
  const scriptContent = fs.readFileSync(umdPath, "utf8");

  // 3) Injeta esse texto dentro de um <script> no DOM
  const scriptEl = window.document.createElement("script");
  scriptEl.textContent = scriptContent;
  window.document.body.appendChild(scriptEl);

  // 4) Aguarda um tick para o script ser executado
  await new Promise((resolve) => setTimeout(resolve, 0));

  // 5) Verifica se window.MeshPilot existe e tem método NavMesh
  expect(window.MeshPilot).toBeDefined();
  expect(typeof window.MeshPilot.NavMesh).toBe("function");
});
