/* Gogma seed-search worker.
 * Primary engine: gogma-core.wasm (Rust port of the same algorithm,
 * ~40-60x faster than the JS core). Fallback: the JS core from gogma.js.
 * In : {type:"search", id, weaponType, attributeForce, indices[],
 *       counterStart, counterEnd, seedStart, seedEnd, seedStep}
 * Out: {type:"progress", id, done} | {type:"candidate", id, seed, counter}
 *      | {type:"done", id}
 * `counter` in a candidate is the saved-counter position of the FIRST
 * observed roll. `done` counts seeds processed within this worker's slice.
 * The WASM engine runs in chunks so progress posts stay frequent; the
 * worker is terminated by the main thread to cancel. */
importScripts("gogma.js?v=3");

var wasm = null;
var wasmPromise = null;

function ensureWasm() {
  if (wasm) return Promise.resolve(true);
  if (wasmPromise) return wasmPromise;
  wasmPromise = fetch("gogma-core.wasm?v=3")
    .then(function (r) { return r.arrayBuffer(); })
    .then(function (buf) { return WebAssembly.instantiate(buf, {}); })
    .then(function (res) { wasm = res.instance.exports; return true; })
    .catch(function () { return false; });
  return wasmPromise;
}

var CHUNK_STEPS = 200000; // stride steps per WASM call (~200k seeds)

function runWasmSearch(d) {
  var mem = new Uint32Array(wasm.memory.buffer);
  var ip = wasm.indices_ptr() / 4;
  for (var i = 0; i < d.indices.length; i++) mem[ip + i] = d.indices[i];
  var cp = wasm.cands_ptr() / 4;
  var step = d.seedStep || 1;
  var totalSteps = Math.floor((d.seedEnd - d.seedStart) / step) + 1;
  var doneSteps = 0;
  while (doneSteps < totalSteps) {
    var nSteps = Math.min(CHUNK_STEPS, totalSteps - doneSteps);
    var subStart = d.seedStart + doneSteps * step;
    var subEnd = subStart + (nSteps - 1) * step;
    var n = wasm.search_chunk(
      d.weaponType, d.attributeForce, d.indices.length,
      d.counterStart, d.counterEnd, subStart, subEnd, step
    );
    // memory may have been re-viewed after instantiation; refresh per chunk
    mem = new Uint32Array(wasm.memory.buffer);
    cp = wasm.cands_ptr() / 4;
    for (var j = 0; j < n; j++) {
      self.postMessage({ type: "candidate", id: d.id, seed: mem[cp + j * 2], counter: mem[cp + j * 2 + 1] });
    }
    doneSteps += nSteps;
    self.postMessage({ type: "progress", id: d.id, done: doneSteps });
  }
}

function runJsSearch(d) {
  self.GogmaCore.searchSlice(
    d.weaponType, d.attributeForce, d.indices,
    d.counterStart, d.counterEnd, d.seedStart, d.seedEnd, d.seedStep || 1,
    function (seed, counter) {
      self.postMessage({ type: "candidate", id: d.id, seed: seed, counter: counter });
    },
    function (done) {
      self.postMessage({ type: "progress", id: d.id, done: done });
    }
  );
}

self.onmessage = function (e) {
  var d = e.data;
  if (!d || d.type !== "search") return;
  ensureWasm().then(function (ok) {
    if (ok) runWasmSearch(d); else runJsSearch(d);
    self.postMessage({ type: "done", id: d.id });
  });
};
