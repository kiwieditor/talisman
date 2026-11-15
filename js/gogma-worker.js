/* Gogma seed-search worker. Loads the shared core from gogma.js (UI part is
 * inert without a document) and runs one seed slice per worker instance.
 * In : {type:"search", id, weaponType, attributeForce, indices[],
 *       counterStart, counterEnd, seedStart, seedEnd}
 * Out: {type:"progress", id, done} | {type:"candidate", id, seed, counter}
 *      | {type:"done", id}
 * `counter` in a candidate is the saved-counter position of the FIRST
 * observed roll. */
importScripts("gogma.js");

self.onmessage = function (e) {
  var d = e.data;
  if (!d || d.type !== "search") return;
  var core = self.GogmaCore;
  core.searchSlice(
    d.weaponType, d.attributeForce, d.indices,
    d.counterStart, d.counterEnd, d.seedStart, d.seedEnd, d.seedStep || 1,
    function (seed, counter) {
      self.postMessage({ type: "candidate", id: d.id, seed: seed, counter: counter });
    },
    function (done) {
      self.postMessage({ type: "progress", id: d.id, done: done });
    }
  );
  self.postMessage({ type: "done", id: d.id });
};
