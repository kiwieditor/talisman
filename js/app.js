/* Wilds Talisman Calculator — UI wiring. Vanilla JS, no framework. */
(function () {
  "use strict";

  var data = window.TALISMAN_DATA;
  var calc = window.TalismanCalc;
  var index = calc.buildIndex(data);
  var skillById = {};
  data.skills.forEach(function (s) { skillById[s.id] = s; });

  var SHOP_URL = "https://kiwigg.com/products/monster-hunter-wilds-ps5-save-edit-service-we-edit-your-save";
  var SLOT_PATTERNS = [
    { label: "Any", slots: [] },
    { label: "[1]", slots: [1] },
    { label: "[1][1]", slots: [1, 1] },
    { label: "[2]", slots: [2] },
    { label: "[2][1]", slots: [2, 1] },
    { label: "[3]", slots: [3] },
    { label: "[W]", slots: [-1] },
    { label: "[W][1]", slots: [-1, 1] },
    { label: "[W][1][1]", slots: [-1, 1, 1] },
  ];
  var PACES = [
    { label: "Casual · 20/h", perHour: 20 },
    { label: "Focused · 40/h", perHour: 40 },
    { label: "No-life · 80/h", perHour: 80 },
  ];

  var state = {
    rows: [{ skill: "", level: null }, { skill: "", level: null }, { skill: "", level: null }],
    slots: [],
    pace: 40,
  };

  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- skill rows ---------- */
  function skillOptions(selectedId, excludeIds) {
    var html = '<option value="">— Choose a skill —</option>';
    [["weapon", "Weapon skills"], ["armor", "Armor skills"], ["both", "Weapon & armor skills"]].forEach(function (pair) {
      var group = data.skills.filter(function (s) { return s.kind === pair[0]; });
      if (!group.length) return;
      html += '<optgroup label="' + pair[1] + '">';
      group.forEach(function (s) {
        var dis = excludeIds.indexOf(s.id) !== -1 && s.id !== selectedId ? " disabled" : "";
        html += '<option value="' + s.id + '"' + (s.id === selectedId ? " selected" : "") + dis + ">" + s.name + "</option>";
      });
      html += "</optgroup>";
    });
    return html;
  }

  function renderRows() {
    var wrap = $("#skillRows");
    wrap.innerHTML = "";
    state.rows.forEach(function (row, i) {
      var others = state.rows.filter(function (_, j) { return j !== i; }).map(function (r) { return r.skill; }).filter(Boolean);
      var div = document.createElement("div");
      div.className = "skill-row" + (row.skill ? " filled" : "");
      var levels = row.skill ? skillById[row.skill].levels : [];
      div.innerHTML =
        '<div class="skill-row-head"><span class="skill-row-label">Skill ' + (i + 1) + "</span>" +
        (row.skill ? '<button class="skill-clear" data-clear="' + i + '" aria-label="Clear skill ' + (i + 1) + '">×</button>' : "") +
        "</div>" +
        '<div class="skill-controls">' +
        '<select data-skill="' + i + '" aria-label="Skill ' + (i + 1) + '">' + skillOptions(row.skill, others) + "</select>" +
        '<select data-level="' + i + '" aria-label="Level for skill ' + (i + 1) + '"' + (row.skill ? "" : " disabled") + ">" +
        (row.skill ? levels.map(function (lv) { return '<option value="' + lv + '"' + (lv === row.level ? " selected" : "") + ">Lv " + lv + "</option>"; }).join("") : '<option>Lv —</option>') +
        "</select></div>";
      wrap.appendChild(div);
    });
    wrap.querySelectorAll("select[data-skill]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var i = +sel.getAttribute("data-skill");
        var id = sel.value;
        state.rows[i].skill = id;
        state.rows[i].level = id ? skillById[id].levels[skillById[id].levels.length - 1] : null; // default to max level
        renderRows(); renderResult();
      });
    });
    wrap.querySelectorAll("select[data-level]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        state.rows[+sel.getAttribute("data-level")].level = +sel.value;
        renderResult();
      });
    });
    wrap.querySelectorAll("[data-clear]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = +btn.getAttribute("data-clear");
        state.rows[i] = { skill: "", level: null };
        renderRows(); renderResult();
      });
    });
  }

  /* ---------- chips ---------- */
  function renderChips(container, items, isActive, onPick) {
    var el = $(container);
    el.innerHTML = "";
    items.forEach(function (item) {
      var b = document.createElement("button");
      b.className = "chip" + (isActive(item) ? " active" : "");
      b.innerHTML = item.html || item.label;
      b.addEventListener("click", function () { onPick(item); });
      el.appendChild(b);
    });
  }
  function renderSlotChips() {
    renderChips("#slotChips", SLOT_PATTERNS.map(function (p) {
      return { label: p.label, slots: p.slots, html: p.slots.length ? '<span class="slot-glyph">' + p.label.replace(/\[W\]/g, '<span class="w-chip">W</span>') + "</span>" : "Any slots" };
    }), function (item) {
      return JSON.stringify(item.slots) === JSON.stringify(state.slots);
    }, function (item) {
      state.slots = item.slots;
      renderSlotChips(); renderResult();
    });
  }
  function renderPaceChips() {
    renderChips("#paceChips", PACES, function (item) { return item.perHour === state.pace; }, function (item) {
      state.pace = item.perHour;
      renderPaceChips(); renderResult();
    });
  }

  /* ---------- formatting ---------- */
  function fmtInt(n) { return n.toLocaleString("en-US"); }
  function fmtPct(p) {
    if (p >= 0.01) return (p * 100).toFixed(2) + "%";
    if (p >= 0.0001) return (p * 100).toFixed(4) + "%";
    return (p * 100).toFixed(6) + "%";
  }
  function fmtHours(h) {
    if (h < 1) return Math.round(h * 60) + " min";
    if (h < 48) return (Math.round(h * 10) / 10).toLocaleString("en-US") + " hours";
    var days = h / 24;
    if (days < 365) return (Math.round(days * 10) / 10).toLocaleString("en-US") + " days of non-stop grinding";
    return (Math.round((days / 365) * 10) / 10).toLocaleString("en-US") + " years of non-stop grinding";
  }
  function slotGlyphs(slots) {
    if (!slots || !slots.length) return "any slots";
    return slots.map(function (s) { return s === -1 ? '<span class="w-chip">W</span>' : "[" + s + "]"; }).join(" ");
  }
  var GROUP_SHORT = {
    G1: "Weapon T1", G2: "Weapon T2", G3: "Weapon T3", G4: "Weapon T4",
    G5: "Armor 1-slot (low)", G6: "Armor 1-slot (mid)", G7: "Armor 1-slot (high)",
    G8: "Armor 2-slot (low)", G9: "Armor 2-slot (high)", G10: "Armor 3-slot",
  };

  /* ---------- talisman preview card ---------- */
  function gemSVG() {
    return '<svg class="gem-svg" viewBox="0 0 64 64" aria-hidden="true">' +
      '<path class="f3" d="M32 4 L58 26 L32 60 L6 26 Z"/>' +
      '<path class="f2" d="M32 4 L46 26 L32 60 L18 26 Z"/>' +
      '<path class="f1" d="M32 4 L40 26 L32 60 L24 26 Z"/>' +
      '<path d="M6 26 H58" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>' +
      "</svg>";
  }
  function pipsHTML(level) {
    var s = '<span class="pips" aria-label="Level ' + level + '">';
    for (var i = 0; i < level; i++) s += '<span class="pip on"></span>';
    return s + "</span>";
  }
  function previewHTML(targets, res) {
    var cls, name, rarityLabel, rarityClass;
    if (res.legal) {
      var rk = res.best.rarity;
      cls = "gem-" + rk.toLowerCase();
      rarityClass = rk.toLowerCase();
      name = data.rarities[rk].name;
      rarityLabel = rk + " · " + Math.round(data.rarities[rk].weight * 100) + "% of appraisals";
    } else {
      cls = "gem-bad"; rarityClass = ""; name = "Appraised Talisman";
      rarityLabel = "Not in the game's tables";
    }
    var skills = targets.map(function (t) {
      return '<div class="t-skill"><span>' + skillById[t.skill].name + "</span>" + pipsHTML(t.level) + "</div>";
    }).join("");
    var slots = state.slots.length
      ? state.slots.map(function (s) { return '<span class="slot-box' + (s === -1 ? " w" : "") + '">' + (s === -1 ? "W" : s) + "</span>"; }).join("")
      : '<span>Any decoration slots</span>';
    return '<div class="talisman-card"><div class="gem-wrap ' + cls + '">' + gemSVG() + "</div>" +
      '<div class="talisman-meta"><div class="talisman-name">' + name + "</div>" +
      '<div class="talisman-rarity ' + rarityClass + '">' + rarityLabel + "</div>" +
      '<div class="talisman-skills">' + skills + "</div>" +
      '<div class="t-slots">' + slots + "</div></div></div>";
  }

  /* ---------- count-up animation ---------- */
  function countUp(el, to) {
    if (!el) return;
    var token = (el._countToken || 0) + 1;
    el._countToken = token;
    var dur = 650, t0 = null;
    function step(ts) {
      if (el._countToken !== token) return; // superseded by a newer render
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtInt(Math.round(to * eased));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function animateBars(scope) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scope.querySelectorAll(".fill[data-w]").forEach(function (f) { f.style.width = f.dataset.w + "%"; });
      });
    });
  }

  /* ---------- results ---------- */
  function currentTargets() {
    return state.rows.filter(function (r) { return r.skill; }).map(function (r) { return { skill: r.skill, level: r.level }; });
  }

  function renderResult() {
    var empty = $("#resultEmpty"), body = $("#resultBody");
    var targets = currentTargets();
    if (!targets.length) {
      empty.hidden = false; body.hidden = true; body.innerHTML = "";
      return;
    }
    empty.hidden = true; body.hidden = false;
    body.classList.remove("rise");
    void body.offsetWidth;
    body.classList.add("rise");

    var res = calc.calculate(data, index, targets, state.slots);

    if (!res.legal) {
      var why = targets.map(function (t) {
        var pools = res.skillPools[t.skill].map(function (g) { return GROUP_SHORT[g]; }).join(", ");
        return "<li><strong>" + skillById[t.skill].name + " Lv" + t.level + "</strong> can only roll from: " + pools + ".</li>";
      }).join("");
      // leave-one-out fix hint
      var fix = "";
      if (targets.length > 1) {
        for (var i = 0; i < targets.length; i++) {
          var rest = targets.filter(function (_, j) { return j !== i; });
          if (calc.calculate(data, index, rest, state.slots).legal) {
            fix = '<div class="fix-hint">Drop <strong>' + skillById[targets[i].skill].name + " Lv" + targets[i].level + "</strong> and the rest can roll. No template in the game combines all of these pools at once" + (state.slots.length ? " with that slot layout" : "") + ".</div>";
            break;
          }
        }
        if (!fix && state.slots.length) {
          if (calc.calculate(data, index, targets, []).legal) {
            fix = '<div class="fix-hint">The skills themselves can roll together — it\'s the <strong>slot layout</strong> that can\'t. Try “Any slots”.</div>';
          }
        }
      } else if (state.slots.length && calc.calculate(data, index, targets, []).legal) {
        fix = '<div class="fix-hint">The skill can roll — just never with that <strong>slot layout</strong>. Try “Any slots”.</div>';
      }
      body.innerHTML =
        previewHTML(targets, res) +
        '<span class="verdict illegal">✕ Cannot roll</span>' +
        '<div class="illegal-why">This combination does not exist in the game\'s talisman tables. No amount of melding will produce it.<ul>' + why + "</ul></div>" +
        fix +
        '<div class="share-row"><button class="btn-share" id="btnShare">Download share image</button></div>';
      wireShare(targets, res, null);
      return;
    }

    var grind = calc.expectedGrind(res.probability, state.pace);
    var maxR = Math.max.apply(null, Object.keys(res.byRarity).map(function (k) { return res.byRarity[k]; }));
    var bars = ["R5", "R6", "R7", "R8"].map(function (rk) {
      var v = res.byRarity[rk];
      var w = maxR > 0 ? Math.max(2, (v / maxR) * 100) : 0;
      return '<div class="rbar"><span class="tag ' + rk.toLowerCase() + '">' + rk + '</span><span class="track"><span class="fill ' + rk.toLowerCase() + '" data-w="' + (v > 0 ? w : 0) + '" style="display:block"></span></span><span class="val">' + (v > 0 ? (v / res.probability * 100).toFixed(1) + "% of hits" : "—") + "</span></div>";
    }).join("");

    var brutal = res.oneIn >= 10000;
    var bridge =
      '<div class="bridge' + (brutal ? " brutal" : "") + '">' +
      "<p>" + (brutal ? "That is a <em>lot</em> of melding points. " : "") + "Playing on PS5? Get this exact talisman on your own save — skip the grind.</p>" +
      '<p class="bridge-sub">We edit <strong>your own save</strong> — your hunter, progress and gear stay exactly as they are. Nothing is replaced. Use code <span class="code">KIWI10</span> for 10% off.</p>' +
      '<a class="cta" href="' + SHOP_URL + '" target="_blank" rel="noopener">Get it on your save →</a>' +
      "</div>";

    body.innerHTML =
      previewHTML(targets, res) +
      '<span class="verdict legal">✓ Legal — it can roll</span>' +
      '<div class="odds-big"><small>1 in&nbsp;</small><span id="oddsNum">0</span></div>' +
      '<div class="odds-pct">' + fmtPct(res.probability) + " chance per appraised talisman</div>" +
      '<div class="grind">' +
      '<div class="grind-box"><div class="num" id="apprNum">0</div><div class="lbl">expected appraisals to hit it once</div></div>' +
      '<div class="grind-box"><div class="num">' + fmtHours(grind.hours) + '</div><div class="lbl">expected grind at your pace (' + state.pace + "/h)</div></div>" +
      "</div>" +
      '<div class="rarity-bars"><h4>Where the hit comes from</h4>' + bars + "</div>" +
      '<div class="best-line"><h4>Most likely route</h4><strong>' + res.best.rarity + "</strong> · " + res.best.groups.map(function (g) { return GROUP_SHORT[g]; }).join(" + ") + "</div>" +
      bridge +
      '<div class="share-row"><button class="btn-share" id="btnShare">Download share image</button></div>';

    countUp($("#oddsNum"), Math.round(res.oneIn));
    countUp($("#apprNum"), grind.appraisals);
    animateBars(body);
    wireShare(targets, res, grind);
  }

  function wireShare(targets, res, grind) {
    var btn = $("#btnShare");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.TalismanShare.share({
        legal: res.legal,
        rarityName: res.legal ? data.rarities[res.best.rarity].name : "",
        skills: targets.map(function (t) { return { name: skillById[t.skill].name, level: t.level }; }),
        slots: state.slots,
        oneInText: res.legal ? fmtInt(Math.round(res.oneIn)) : "",
        pctText: res.legal ? fmtPct(res.probability) : "",
        hoursText: grind ? fmtHours(grind.hours) : "",
      });
    });
  }

  /* ---------- builds ---------- */
  function renderBuilds() {
    var builds = window.TALISMAN_BUILDS || [];
    if (!builds.length) return;
    $("#builds").hidden = false;
    $("#navBuilds").hidden = false;
    var weapons = [];
    builds.forEach(function (b) { if (weapons.indexOf(b.weapon) === -1) weapons.push(b.weapon); });
    var filters = $("#buildFilters");
    var all = document.createElement("button");
    all.className = "chip active"; all.textContent = "All weapons";
    all.addEventListener("click", function () { filterBuilds(""); setActiveFilter(all); });
    filters.appendChild(all);
    weapons.forEach(function (w) {
      var c = document.createElement("button");
      c.className = "chip"; c.textContent = w;
      c.addEventListener("click", function () { filterBuilds(w); setActiveFilter(c); });
      filters.appendChild(c);
    });
    var grid = $("#buildGrid");
    builds.forEach(function (b, bi) {
      var card = document.createElement("div");
      card.className = "build-card";
      card.setAttribute("data-weapon", b.weapon);
      var tal = b.talisman.skills.map(function (s) { return s.name + " Lv" + s.level; }).join(" · ");
      if (b.talisman.slots && b.talisman.slots.length) tal += "  ·  " + b.talisman.slots.map(function (s) { return s === -1 ? "[W]" : "[" + s + "]"; }).join("");
      card.innerHTML =
        '<span class="weapon-tag">' + b.weapon + "</span>" +
        "<h3>" + b.name + "</h3>" +
        "<p>" + b.summary + "</p>" +
        '<div class="build-talisman"><span class="t-label">Ideal talisman</span>' + tal + "</div>" +
        '<p class="build-source">Source: <a href="' + b.sourceUrl + '" target="_blank" rel="noopener">' + b.sourceName + "</a> · " + b.version + "</p>" +
        '<button class="btn-odds">Check the odds →</button>';
      card.querySelector(".btn-odds").addEventListener("click", function () {
        state.rows = [{ skill: "", level: null }, { skill: "", level: null }, { skill: "", level: null }];
        b.talisman.skills.forEach(function (s, i) {
          var match = data.skills.find(function (x) { return x.name === s.name; });
          if (match && i < 3) state.rows[i] = { skill: match.id, level: s.level };
        });
        state.slots = b.talisman.slots || [];
        renderRows(); renderSlotChips(); renderResult();
        document.querySelector("#calculator").scrollIntoView({ behavior: "smooth" });
      });
      grid.appendChild(card);
    });
    function setActiveFilter(active) {
      filters.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === active); });
    }
    function filterBuilds(w) {
      grid.querySelectorAll(".build-card").forEach(function (card) {
        card.style.display = !w || card.getAttribute("data-weapon") === w ? "" : "none";
      });
    }
  }

  renderRows();
  renderSlotChips();
  renderPaceChips();
  renderResult();
  renderBuilds();
})();
