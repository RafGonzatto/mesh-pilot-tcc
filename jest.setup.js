// <rootDir>/jest.setup.js
import { TextEncoder, TextDecoder } from "util";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// CommonJS helpers dentro dos módulos ESM de teste
global.require = createRequire(import.meta.url);
