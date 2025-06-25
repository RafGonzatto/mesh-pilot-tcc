import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import os from 'os';
import path from 'path';

const resultsDir = path.resolve('results');
fs.mkdirSync(resultsDir, { recursive: true });

const env = {
  cpu: os.cpus()[0].model,
  cores: os.cpus().length,
  ramGB: Math.round(os.totalmem() / 1e9),
  platform: process.platform,
  node: process.version,
};
fs.writeFileSync(path.join(resultsDir, 'env.json'), JSON.stringify(env, null, 2));

const times = {};

function runTimed(cmd, args) {
  const t0 = performance.now();
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  const elapsed = performance.now() - t0;
  if (result.status !== 0) process.exit(result.status);
  return { output: result.stdout, time: elapsed };
}

let res = runTimed('npm', ['test']);
times['Jest'] = res.time;

res = runTimed('node', ['benchmarks/navmesh_npcs.js']);
const m1 = res.output.match(/NPCs → ([\d.]+) ms\/run/);
times['Benchmark NPCs'] = m1 ? parseFloat(m1[1]) : res.time;

res = runTimed('node', ['benchmarks/libs_comparison.js']);
const libs = {};
for (const line of res.output.trim().split(/\r?\n/)) {
  const parts = line.split(' → ');
  if (parts.length === 2) libs[parts[0]] = parseFloat(parts[1]);
}
times['Benchmark Libs'] = libs;

fs.writeFileSync(path.join(resultsDir, 'times.json'), JSON.stringify(times, null, 2));
