/* Gogma Artian skill planner — seed search + future sight for Gogma weapon
 * Set/Group skill rolls (Monster Hunter Wilds TU4).
 *
 * RNG core: a from-spec port of the skill stream reverse-engineered by
 * WiseHorror (Gogma Artian Roll Planner / GARP), following the published
 * RNG_SPEC of GogmaSeedFinder (MIT). Verified against the golden fixtures
 * in tests/fixtures/skill_stream_v0.9.3.json (see tests/gogma_fixture_test.js).
 *
 * Model: effectiveSeed = (baseSeed + weaponType*1000 + attributeForce) XOR 0x00AC9365.
 * One skillCounter is shared by all weapons; the roll at saved counter C sits
 * C*10+1 RNG steps after init (counter gate >= 0x36 assumed); each further
 * roll is 10 steps later. tableIndex = w % 294 -> set = idx/14, group = idx%14.
 *
 * This file is environment-agnostic: in the browser it also builds the UI;
 * in a Web Worker it only exposes GogmaCore; in Node it exports GogmaCore.
 */
(function () {
  "use strict";

  /* ================= RNG core ================= */
  var SEED_XOR_MASK = 0x00AC9365;
  var SKILL_GATE = 0x36;
  var TABLE_SIZE = 294;
  var SEED_MAX = 99999999;
  var DEFAULT_COUNTER_START = 0;
  var DEFAULT_COUNTER_END = 99;      // standard pass: sequence positions 0..99
  var DEEP_COUNTER_START = 100;
  var DEEP_COUNTER_END = 499;        // deep pass: positions 100..499
  var CHUNK_SEEDS = 100000;          // progress-reporting chunk

  function effectiveSeed(baseSeed, weaponType, attributeForce) {
    return ((baseSeed + weaponType * 1000 + attributeForce) >>> 0) ^ SEED_XOR_MASK;
  }

  /* Literal port of the 100-round initializer (matches rng-core / Python port). */
  function initState(seed) {
    var ss = seed >>> 0;
    var x = 0x159A55E5, y = 0x1F123BB5, z = 0x05491333, w = 0x05491333;
    for (var it = 1; it <= 100; it++) {
      var mixed = ((0x65AC9365 >>> (ss & 3)) ^ ss) >>> 0;
      ss = ((mixed << 4) ^ (mixed << 3) ^ (mixed >>> 3) ^ (mixed >>> 4) ^ mixed) >>> 0;
      var t = (ss ^ (ss << 15)) >>> 0;
      var nw = (z ^ (z >>> 21) ^ t ^ (t >>> 4)) >>> 0;
      w = nw;
      if (it < 100) { x = y; y = z; z = nw; }
    }
    return [x, y, z, w];
  }

  function stepState(st) {
    var t = (st[0] ^ (st[0] << 15)) >>> 0;
    var nw = (st[3] ^ (st[3] >>> 21) ^ t ^ (t >>> 4)) >>> 0;
    st[0] = st[1]; st[1] = st[2]; st[2] = st[3]; st[3] = nw;
    return nw;
  }

  /* `count` consecutive table indices starting at the saved skill counter.
   * counterGate < 0x36 -> the game ignores the saved counter (position 0). */
  function skillIndices(baseSeed, weaponType, attributeForce, skillCounter, counterGate, count) {
    var st = initState(effectiveSeed(baseSeed, weaponType, attributeForce));
    var steps = counterGate < SKILL_GATE ? 0 : skillCounter * 10;
    for (var i = 0; i < steps; i++) stepState(st);
    stepState(st);
    var out = [];
    for (var r = 0; r < count; r++) {
      if (r > 0) for (var j = 0; j < 10; j++) stepState(st);
      out.push(st[3] % TABLE_SIZE);
    }
    return out;
  }

  /* Joint seed x counter search over one seed slice, GogmaSeedFinder-style:
   * per seed, ONE init; the walk starts at counterStart (counterStart*10+1
   * steps) and adjacent counters are reached with 10 direct steps; a counter
   * position is rejected on the first mismatching observation.
   * onCandidate(baseSeed, counterOfFirstObservation) fires per match.
   * onProgress(seedsDoneInSlice) fires every CHUNK_SEEDS seeds.
   * Returns the number of seeds processed. */
  function searchSlice(weaponType, attributeForce, indices, counterStart, counterEnd,
                       seedStart, seedEnd, seedStep, onCandidate, onProgress) {
    var K = indices.length, o0 = indices[0];
    var step = seedStep || 1;
    var processed = 0, sinceReport = 0;
    for (var base = seedStart; base <= seedEnd; base += step) {
      var seed = ((base + weaponType * 1000 + attributeForce) >>> 0) ^ SEED_XOR_MASK;
      var ss = seed >>> 0;
      var x = 0x159A55E5, y = 0x1F123BB5, z = 0x05491333, w = 0x05491333;
      for (var it = 1; it <= 100; it++) {
        var mixed = ((0x65AC9365 >>> (ss & 3)) ^ ss) >>> 0;
        ss = ((mixed << 4) ^ (mixed << 3) ^ (mixed >>> 3) ^ (mixed >>> 4) ^ mixed) >>> 0;
        var tt = (ss ^ (ss << 15)) >>> 0;
        var nw0 = (z ^ (z >>> 21) ^ tt ^ (tt >>> 4)) >>> 0;
        w = nw0;
        if (it < 100) { x = y; y = z; z = nw0; }
      }
      var pre = counterStart * 10 + 1;
      for (var p = 0; p < pre; p++) {
        var t1 = (x ^ (x << 15)) >>> 0;
        var nw1 = (w ^ (w >>> 21) ^ t1 ^ (t1 >>> 4)) >>> 0;
        x = y; y = z; z = w; w = nw1;
      }
      for (var c = counterStart; c <= counterEnd; c++) {
        if ((w % TABLE_SIZE) === o0) {
          var ax = x, ay = y, az = z, aw = w, ok = true;
          for (var k = 1; k < K; k++) {
            for (var j = 0; j < 10; j++) {
              var t2 = (ax ^ (ax << 15)) >>> 0;
              var nw2 = (aw ^ (aw >>> 21) ^ t2 ^ (t2 >>> 4)) >>> 0;
              ax = ay; ay = az; az = aw; aw = nw2;
            }
            if ((aw % TABLE_SIZE) !== indices[k]) { ok = false; break; }
          }
          if (ok && onCandidate) onCandidate(base, c);
        }
        if (c < counterEnd) {
          for (var s = 0; s < 10; s++) {
            var t3 = (x ^ (x << 15)) >>> 0;
            var nw3 = (w ^ (w >>> 21) ^ t3 ^ (t3 >>> 4)) >>> 0;
            x = y; y = z; z = w; w = nw3;
          }
        }
      }
      processed++; sinceReport++;
      if (onProgress && sinceReport >= CHUNK_SEEDS) { sinceReport = 0; onProgress(processed); }
    }
    if (onProgress && sinceReport > 0) onProgress(processed);
    return processed;
  }

  var Core = {
    SEED_MAX: SEED_MAX,
    DEFAULT_COUNTER_START: DEFAULT_COUNTER_START,
    DEFAULT_COUNTER_END: DEFAULT_COUNTER_END,
    DEEP_COUNTER_START: DEEP_COUNTER_START,
    DEEP_COUNTER_END: DEEP_COUNTER_END,
    effectiveSeed: effectiveSeed,
    initState: initState,
    stepState: stepState,
    skillIndices: skillIndices,
    searchSlice: searchSlice,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  if (typeof globalThis !== "undefined") globalThis.GogmaCore = Core;

  /* ================= UI (browser only) ================= */
  if (typeof document === "undefined" || typeof window === "undefined" || !window.GOGMA_DATA || !window.I18N) return;

  var I = window.I18N;
  var D = window.GOGMA_DATA;
  var LS_KEY = "gogma-planner-v1";
  var ROLL_COST_Z = 9000;

  function t(key, vars) { return I.t(key, vars); }
  function nm(entry) { return entry ? (entry[I.lang] || entry.en) : ""; }
  function fmtInt(n) { return n.toLocaleString("en-US"); }
  function $(id) { return document.getElementById(id); }
  function forceOf(attrIdx) { return D.attributes[attrIdx].force; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  var S = {
    // step 1
    wType: 10, attrIdx: 3, k: 6,
    obs: [],              // [{set:-1, group:-1} x k]
    searching: false, deep: false, candidates: [], searchDone: false, searchMax: DEFAULT_COUNTER_END, autoPicked: false,
    // step 2 (persisted)
    seed: null, counter: null, colWType: 10, colAttrIdx: 3,
    targetSet: -1, targetGroup: -1, shown: 100, undoAvailable: false, lastK: 6,
  };
  for (var i0 = 0; i0 < S.k; i0++) S.obs.push({ set: -1, group: -1 });

  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        seed: S.seed, counter: S.counter, colWType: S.colWType, colAttrIdx: S.colAttrIdx,
        targetSet: S.targetSet, targetGroup: S.targetGroup,
      }));
    } catch (e) {}
  }
  function restore() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var p = JSON.parse(raw);
      if (typeof p.seed === "number" && typeof p.counter === "number") {
        S.seed = p.seed; S.counter = p.counter;
        S.colWType = p.colWType || 0; S.colAttrIdx = p.colAttrIdx || 0;
        S.targetSet = typeof p.targetSet === "number" ? p.targetSet : -1;
        S.targetGroup = typeof p.targetGroup === "number" ? p.targetGroup : -1;
        S.wType = S.colWType; S.attrIdx = S.colAttrIdx;
      }
    } catch (e) {}
  }

  /* ---------- step 1 rendering ---------- */
  function optionsHTML(list, selected, placeholder) {
    var h = "";
    if (placeholder !== null) h += '<option value="-1"' + (selected === -1 ? " selected" : "") + ">" + esc(placeholder) + "</option>";
    list.forEach(function (e, i) {
      h += '<option value="' + i + '"' + (i === selected ? " selected" : "") + ">" + esc(nm(e)) + "</option>";
    });
    return h;
  }

  function renderStep1Controls() {
    $("gogmaWeapon").innerHTML = optionsHTML(D.weapons, S.wType, null);
    $("gogmaAttr").innerHTML = optionsHTML(D.attributes, S.attrIdx, null);
    var kSel = $("gogmaK");
    kSel.innerHTML = [4, 5, 6, 7, 8].map(function (n) {
      return '<option value="' + n + '"' + (n === S.k ? " selected" : "") + ">" + n + "</option>";
    }).join("");
  }

  function renderObsRows() {
    var wrap = $("gogmaObsRows");
    var h = "";
    S.obs.forEach(function (row, i) {
      h += '<div class="skill-row gogma-obs-row' + (row.set >= 0 && row.group >= 0 ? " filled" : "") + '">' +
        '<div class="skill-row-head"><span class="skill-row-label">' + esc(t("gogma_roll_n", { n: i + 1 })) + "</span></div>" +
        '<div class="skill-controls">' +
        '<select data-obs-set="' + i + '" aria-label="' + esc(t("gogma_set")) + '">' + optionsHTML(D.sets, row.set, t("gogma_pick")) + "</select>" +
        '<select data-obs-group="' + i + '" aria-label="' + esc(t("gogma_group")) + '">' + optionsHTML(D.groups, row.group, t("gogma_pick")) + "</select>" +
        "</div></div>";
    });
    wrap.innerHTML = h;
    wrap.querySelectorAll("select[data-obs-set]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        S.obs[+sel.getAttribute("data-obs-set")].set = +sel.value;
        renderObsRows();
        clearWarnIfComplete();
      });
    });
    wrap.querySelectorAll("select[data-obs-group]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        S.obs[+sel.getAttribute("data-obs-group")].group = +sel.value;
        renderObsRows();
        clearWarnIfComplete();
      });
    });
  }

  function clearWarnIfComplete() {
    var box = $("gogmaSearchResult");
    if (!box || !box.getAttribute("data-warn")) return;
    if (S.obs.every(function (r) { return r.set >= 0 && r.group >= 0; })) {
      box.innerHTML = "";
      box.removeAttribute("data-warn");
    }
  }

  function setK(k) {
    while (S.obs.length < k) S.obs.push({ set: -1, group: -1 });
    S.obs.length = k;
    S.k = k;
    renderObsRows();
  }

  /* ---------- seed search orchestration ---------- */
  var workers = [], searchId = 0, aggDone = 0, aggTotal = SEED_MAX + 1;
  // Counter bands, searched in order: most saves sit at low counters, so the
  // first band is ~4x cheaper per seed than the full 0-99 pass.
  var BANDS_STD = [[0, 24], [25, 99]];
  var BANDS_DEEP = [[100, 249], [250, 499]];
  var curBands = BANDS_STD, curBand = 0, curIndices = null;

  function stopWorkers() {
    workers.forEach(function (w) { try { w.terminate(); } catch (e) {} });
    workers = [];
  }

  function startSearch(deep) {
    var indices = [];
    for (var i = 0; i < S.k; i++) {
      if (S.obs[i].set < 0 || S.obs[i].group < 0) {
        var wbox = $("gogmaSearchResult");
        wbox.innerHTML = '<p class="gogma-warn">' + esc(t("gogma_incomplete")) + "</p>";
        wbox.setAttribute("data-warn", "1");
        return;
      }
      indices.push(S.obs[i].set * 14 + S.obs[i].group);
    }
    curIndices = indices;
    stopWorkers();
    S.searching = true; S.deep = deep; S.candidates = []; S.searchDone = false; S.autoPicked = false;
    curBands = deep ? BANDS_DEEP : BANDS_STD;
    S.searchMax = curBands[curBands.length - 1][1];
    $("gogmaSearchResult").innerHTML = "";
    $("gogmaSearchResult").removeAttribute("data-warn");
    $("gogmaDeepRow").hidden = true;
    $("gogmaFind").disabled = true;
    $("gogmaCancel").hidden = false;
    runBand(0);
  }

  function setProgressText(pct) {
    $("gogmaProgressFill").style.width = pct + "%";
    $("gogmaProgressText").textContent = t("gogma_searching", { pct: pct }) + " — " +
      t("gogma_band", { a: curBands[curBand][0], b: curBands[curBand][1] });
  }

  function runBand(bi) {
    curBand = bi;
    aggDone = 0;
    var id = ++searchId;
    var cStart = curBands[bi][0], cEnd = curBands[bi][1];
    $("gogmaProgress").hidden = false;
    setProgressText(0);
    // Striped assignment: every worker strides across the whole seed range,
    // so a match surfaces as soon as ANY worker reaches it, wherever it sits.
    var W = Math.min(8, (navigator.hardwareConcurrency || 4));
    var finished = 0;
    for (var wi = 0; wi < W; wi++) {
      (function (wi) {
        var wk = new Worker("js/gogma-worker.js?v=3");
        var lastDone = 0;
        wk.onmessage = function (e) {
          var d = e.data;
          if (d.id !== id) return;
          if (d.type === "progress") {
            aggDone += d.done - lastDone; lastDone = d.done;
            setProgressText(Math.min(100, Math.floor(aggDone / aggTotal * 100)));
          } else if (d.type === "candidate") {
            var cand = { seed: d.seed, counter: d.counter };
            S.candidates.push(cand);
            if (!S.autoPicked) { S.autoPicked = true; selectCandidate(cand, true); }
            renderCandidates();
          } else if (d.type === "done") {
            finished++;
            if (finished === W) bandDone();
          }
        };
        wk.onerror = function () { finished++; if (finished === W) bandDone(); };
        workers.push(wk);
        wk.postMessage({
          type: "search", id: id, weaponType: S.wType, attributeForce: forceOf(S.attrIdx),
          indices: curIndices, counterStart: cStart, counterEnd: cEnd,
          seedStart: wi, seedEnd: SEED_MAX, seedStep: W,
        });
      })(wi);
    }
  }

  function bandDone() {
    if (!S.searching) return; // cancelled meanwhile
    if (S.candidates.length > 0 || curBand >= curBands.length - 1) { finishSearch(); return; }
    stopWorkers();
    runBand(curBand + 1);
  }

  function finishSearch() {
    S.searching = false; S.searchDone = true;
    stopWorkers();
    $("gogmaProgress").hidden = true;
    $("gogmaFind").disabled = false;
    $("gogmaCancel").hidden = true;
    renderCandidates();
    if (S.candidates.length === 0) {
      $("gogmaSearchResult").innerHTML = '<p class="gogma-warn">' +
        esc(t(S.deep ? "gogma_notfound_deep" : "gogma_notfound", { max: S.searchMax })) + "</p>";
      $("gogmaDeepRow").hidden = S.deep;
    } else if (S.candidates.length === 1 && !S.autoPicked) {
      selectCandidate(S.candidates[0], true);
    }
  }

  function renderCandidates() {
    if (!S.candidates.length) return;
    var box = $("gogmaSearchResult");
    box.removeAttribute("data-warn");
    if (S.searching) {
      var hs = '<p class="gogma-found">' + esc(t("gogma_found_searching", {
        seed: fmtInt(S.candidates[0].seed),
      })) + "</p>";
      if (S.candidates.length > 1) hs += candidatesChipsHTML();
      box.innerHTML = hs;
      wireCandidateChips(box);
      return;
    }
    if (S.candidates.length === 1 && S.searchDone) {
      box.innerHTML = '<p class="gogma-found">' + esc(t("gogma_found_one", {
        seed: fmtInt(S.candidates[0].seed), n: S.candidates[0].counter + S.k,
      })) + "</p>";
      return;
    }
    box.innerHTML = '<p class="gogma-found">' + esc(t("gogma_found_multi", { n: S.candidates.length })) + "</p>" + candidatesChipsHTML();
    wireCandidateChips(box);
  }

  function candidatesChipsHTML() {
    var h = '<div class="gogma-candidates">';
    S.candidates.forEach(function (c, i) {
      h += '<button class="chip" data-cand="' + i + '">' + esc(t("gogma_candidate_btn", {
        seed: fmtInt(c.seed), n: c.counter + S.k,
      })) + "</button>";
    });
    return h + "</div>";
  }

  function wireCandidateChips(box) {
    box.querySelectorAll("[data-cand]").forEach(function (b) {
      b.addEventListener("click", function () { selectCandidate(S.candidates[+b.getAttribute("data-cand")], false); });
    });
  }

  function selectCandidate(cand, auto) {
    S.seed = cand.seed;
    S.lastK = S.k;
    // The K observed rolls were real rolls: the saved counter now sits just
    // past the last one. (Undo button covers the quit-without-saving case.)
    S.counter = cand.counter + S.k;
    S.colWType = S.wType; S.colAttrIdx = S.attrIdx;
    S.undoAvailable = true;
    S.shown = 100;
    persist();
    renderPlanner();
    if (!auto && !S.searching) {
      $("gogmaSearchResult").innerHTML = '<p class="gogma-found">' + esc(t("gogma_found_one", {
        seed: fmtInt(cand.seed), n: cand.counter + S.k,
      })) + "</p>";
    }
    var el = $("gogmaStep2");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- step 2: future sight ---------- */
  function renderPlanner() {
    var has = S.seed !== null && S.counter !== null;
    $("gogmaNeedSeed").hidden = has;
    $("gogmaPlanner").hidden = !has;
    if (!has) return;
    $("gogmaSeedVal").textContent = fmtInt(S.seed);
    $("gogmaPosVal").textContent = t("gogma_position", { n: fmtInt(S.counter + 1) });
    $("gogmaUndoSave").hidden = !S.undoAvailable;
    $("gogmaUndoSave").textContent = t("gogma_undo_save", { k: S.lastK });
    $("gogmaTargetSet").innerHTML = optionsHTML(D.sets, S.targetSet, t("gogma_any"));
    $("gogmaTargetGroup").innerHTML = optionsHTML(D.groups, S.targetGroup, t("gogma_any"));
    $("gogmaColWeapon").innerHTML = optionsHTML(D.weapons, S.colWType, null);
    $("gogmaColAttr").innerHTML = optionsHTML(D.attributes, S.colAttrIdx, null);
    renderFuture();
  }

  function renderFuture() {
    if (S.seed === null) return;
    var count = S.shown;
    var idxs = Core.skillIndices(S.seed, S.colWType, forceOf(S.colAttrIdx), S.counter, 200, count);
    var hasTarget = S.targetSet >= 0 || S.targetGroup >= 0;
    var firstHit = -1;
    var rows = "";
    idxs.forEach(function (ix, i) {
      var si = Math.floor(ix / 14), gi = ix % 14;
      var hit = hasTarget && (S.targetSet < 0 || si === S.targetSet) && (S.targetGroup < 0 || gi === S.targetGroup);
      if (hit && firstHit < 0) firstHit = i;
      rows += '<tr class="' + (hit ? "hit" : "") + '"><td class="step">' + (i + 1) + "</td><td>" +
        esc(nm(D.sets[si])) + "</td><td>" + esc(nm(D.groups[gi])) + "</td></tr>";
    });
    $("gogmaTableWrap").innerHTML =
      '<table class="gogma-table"><thead><tr><th>' + esc(t("gogma_th_step")) + "</th><th>" +
      esc(t("gogma_th_set")) + "</th><th>" + esc(t("gogma_th_group")) + "</th></tr></thead><tbody>" +
      rows + "</tbody></table>";
    var call = $("gogmaCallout");
    if (hasTarget && firstHit >= 0) {
      var n = firstHit + 1;
      call.hidden = false;
      call.innerHTML = esc(t("gogma_first_hit", { n: n, m: n - 1, cost: fmtInt(n * ROLL_COST_Z) }));
    } else if (hasTarget) {
      call.hidden = false;
      call.innerHTML = esc(t("gogma_no_hit", { n: count }));
    } else {
      call.hidden = true;
      call.innerHTML = "";
    }
    $("gogmaMore").hidden = S.shown >= 1000;
  }

  /* ---------- wiring ---------- */
  function renderAllGogma() {
    renderStep1Controls();
    renderObsRows();
    if (S.candidates.length) renderCandidates();
    renderPlanner();
  }

  function init() {
    restore();
    if (S.seed !== null) { S.wType = S.colWType; S.attrIdx = S.colAttrIdx; }
    renderStep1Controls();
    renderObsRows();
    renderPlanner();

    $("gogmaWeapon").addEventListener("change", function () { S.wType = +this.value; });
    $("gogmaAttr").addEventListener("change", function () { S.attrIdx = +this.value; });
    $("gogmaK").addEventListener("change", function () { setK(+this.value); });
    $("gogmaFind").addEventListener("click", function () { startSearch(false); });
    $("gogmaDeep").addEventListener("click", function () { startSearch(true); });
    $("gogmaCancel").addEventListener("click", function () {
      searchId++; stopWorkers(); S.searching = false;
      $("gogmaProgress").hidden = true;
      $("gogmaFind").disabled = false;
      $("gogmaCancel").hidden = true;
    });
    $("gogmaPlusOne").addEventListener("click", function () {
      if (S.counter === null) return;
      S.counter++; S.undoAvailable = false; persist(); renderPlanner();
    });
    $("gogmaUndoSave").addEventListener("click", function () {
      if (S.counter === null || !S.undoAvailable) return;
      S.counter -= S.lastK; S.undoAvailable = false; persist(); renderPlanner();
    });
    $("gogmaReset").addEventListener("click", function () {
      S.seed = null; S.counter = null; S.candidates = []; S.searchDone = false; S.undoAvailable = false;
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      $("gogmaSearchResult").innerHTML = "";
      $("gogmaDeepRow").hidden = true;
      renderPlanner();
    });
    $("gogmaTargetSet").addEventListener("change", function () { S.targetSet = +this.value; S.shown = 100; persist(); renderFuture(); });
    $("gogmaTargetGroup").addEventListener("change", function () { S.targetGroup = +this.value; S.shown = 100; persist(); renderFuture(); });
    $("gogmaColWeapon").addEventListener("change", function () { S.colWType = +this.value; persist(); renderFuture(); });
    $("gogmaColAttr").addEventListener("change", function () { S.colAttrIdx = +this.value; persist(); renderFuture(); });
    $("gogmaMore").addEventListener("click", function () { S.shown = 1000; renderFuture(); });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { I.setLang(btn.getAttribute("data-lang"), renderAllGogma); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
