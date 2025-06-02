// src/_tests_/smoke.test.js
import { NavMesh } from "../index.js";

test("smoke – API principal carrega", () => {
  expect(typeof NavMesh).toBe("function");
});
