/*
 * Talisman odds engine — original implementation.
 *
 * Model (from the game's published talisman mechanics):
 *  1. A rarity is rolled first: R5 59% / R6 27% / R7 11% / R8 3%.
 *  2. Inside a rarity, one template row is picked (rows are equally
 *     likely — relative row weights have never been published).
 *  3. Each skill slot of the template draws one entry uniformly from
 *     its skill pool. A talisman "hits" when every requested skill can
 *     be assigned to a distinct slot whose pool contains that exact
 *     skill at that exact level. Unrequested slots are free.
 *  4. Decoration slots roll one of the template's slot patterns
 *     (equal odds, except R8: [W] 50% / [W,1] 33% / [W,1,1] 17%).
 *
 * Probability = sum over rarities/templates of
 *   rarityWeight x (1 / templatesInRarity) x skillChance x slotChance.
 */
(function (global) {
  "use strict";

  function buildIndex(data) {
    var poolByGroup = {}; // groupId -> Map "skillId|level" -> count, plus size
    data.groups.forEach(function (g) {
      var counts = new Map();
      g.entries.forEach(function (e) {
        var key = e.skill + "|" + e.level;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      poolByGroup[g.id] = { size: g.entries.length, counts: counts };
    });
    var skillById = {};
    data.skills.forEach(function (s) { skillById[s.id] = s; });
    return { poolByGroup: poolByGroup, skillById: skillById };
  }

  // All ways to assign each target skill to a distinct template slot.
  // Returns summed probability of drawing exactly those skills.
  function skillChance(templateGroups, targets, index) {
    var used = new Array(templateGroups.length).fill(false);
    var total = 0;
    function walk(ti, acc) {
      if (ti === targets.length) { total += acc; return; }
      var t = targets[ti];
      for (var gi = 0; gi < templateGroups.length; gi++) {
        if (used[gi]) continue;
        var pool = index.poolByGroup[templateGroups[gi]];
        var hits = pool.counts.get(t.skill + "|" + t.level) || 0;
        if (hits === 0) continue;
        used[gi] = true;
        walk(ti + 1, acc * (hits / pool.size));
        used[gi] = false;
      }
    }
    walk(0, 1);
    return total;
  }

  function sameSlots(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.slice().sort(function (x, y) { return x - y; });
    var sb = b.slice().sort(function (x, y) { return x - y; });
    return sa.every(function (v, i) { return v === sb[i]; });
  }

  // Chance that a template's decoration-slot roll matches the request.
  // Empty request = any pattern (chance 1).
  function slotChance(template, wantedSlots) {
    if (!wantedSlots || wantedSlots.length === 0) return 1;
    var totalWeight = template.slotWeights.reduce(function (s, w) { return s + w; }, 0);
    var hit = 0;
    template.slots.forEach(function (pattern, i) {
      if (sameSlots(pattern, wantedSlots)) hit += template.slotWeights[i];
    });
    return hit / totalWeight;
  }

  /**
   * targets: [{skill: skillId, level: n}] (1..3, distinct skills)
   * wantedSlots: [] for any, or e.g. [3], [2,1], [-1,1] (-1 = weapon slot)
   * Returns { legal, probability, oneIn, byRarity: {R5: p, ...},
   *           best: {rarity, groups, p} | null,
   *           skillPools: {skillId: [groupIds that can roll it at that level]} }
   */
  function calculate(data, index, targets, wantedSlots) {
    var skillPools = {};
    targets.forEach(function (t) {
      var gs = [];
      data.groups.forEach(function (g) {
        if (index.poolByGroup[g.id].counts.has(t.skill + "|" + t.level)) gs.push(g.id);
      });
      skillPools[t.skill] = gs;
    });

    var byRarity = {};
    var best = null;
    var total = 0;

    Object.keys(data.rarities).forEach(function (rkey) {
      var rarity = data.rarities[rkey];
      var templateShare = 1 / rarity.templates.length;
      var sum = 0;
      rarity.templates.forEach(function (template) {
        var sc = slotChance(template, wantedSlots);
        if (sc === 0) return;
        var kc = skillChance(template.groups, targets, index);
        if (kc === 0) return;
        var p = rarity.weight * templateShare * kc * sc;
        sum += p;
        if (!best || p > best.p) best = { rarity: rkey, groups: template.groups.slice(), p: p };
      });
      byRarity[rkey] = sum;
      total += sum;
    });

    return {
      legal: total > 0,
      probability: total,
      oneIn: total > 0 ? 1 / total : Infinity,
      byRarity: byRarity,
      best: best,
      skillPools: skillPools,
    };
  }

  // Expected grind at a given pace (appraisals per hour).
  function expectedGrind(probability, appraisalsPerHour) {
    if (!(probability > 0)) return null;
    var appraisals = Math.max(1, Math.round(1 / probability));
    var hours = appraisals / appraisalsPerHour;
    return { appraisals: appraisals, hours: hours };
  }

  var api = { buildIndex: buildIndex, calculate: calculate, expectedGrind: expectedGrind, sameSlots: sameSlots };
  global.TalismanCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
