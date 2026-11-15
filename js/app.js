/* Wilds Talisman Calculator — UI wiring. Vanilla JS, no framework. i18n via window.I18N. */
(function () {
  "use strict";

  var data = window.TALISMAN_DATA;
  var calc = window.TalismanCalc;
  var I = window.I18N;
  var index = calc.buildIndex(data);
  var skillById = {};
  var skillByName = {};
  data.skills.forEach(function (s) { skillById[s.id] = s; skillByName[s.name] = s; });

  var SHOP_URL = "https://kiwigg.com/products/monster-hunter-wilds-ps5-save-edit-service-we-edit-your-save";
  var SLOT_PATTERNS = [
    { label: "", slots: [] },
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
    { key: "pace_20", perHour: 20 },
    { key: "pace_40", perHour: 40 },
    { key: "pace_80", perHour: 80 },
  ];

  var state = {
    rows: [{ skill: "", level: null }, { skill: "", level: null }, { skill: "", level: null }],
    slots: [],
    pace: 40,
  };

  var $ = function (sel) { return document.querySelector(sel); };
  function t(key, vars) { return I.t(key, vars); }
  function punct() { return I.lang === "en" ? "." : "。"; }
  function sName(skill) { return I.skillName(skill); }
  function sNameEn(enName) { return I.skillNameByEn(enName, skillByName); }

  /* ---------- skill rows ---------- */
  function skillOptions(selectedId, excludeIds) {
    var html = '<option value="">' + t("choose_skill") + "</option>";
    [["weapon", "group_weapon"], ["armor", "group_armor"], ["both", "group_both"]].forEach(function (pair) {
      var group = data.skills.filter(function (s) { return s.kind === pair[0]; });
      if (!group.length) return;
      html += '<optgroup label="' + t(pair[1]) + '">';
      group.forEach(function (s) {
        var dis = excludeIds.indexOf(s.id) !== -1 && s.id !== selectedId ? " disabled" : "";
        html += '<option value="' + s.id + '"' + (s.id === selectedId ? " selected" : "") + dis + ">" + sName(s) + "</option>";
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
        '<div class="skill-row-head"><span class="skill-row-label">' + t("skill_n", { n: i + 1 }) + "</span>" +
        (row.skill ? '<button class="skill-clear" data-clear="' + i + '" aria-label="Clear skill ' + (i + 1) + '">×</button>' : "") +
        "</div>" +
        '<div class="skill-controls">' +
        '<select data-skill="' + i + '" aria-label="Skill ' + (i + 1) + '">' + skillOptions(row.skill, others) + "</select>" +
        '<select data-level="' + i + '" aria-label="Level for skill ' + (i + 1) + '"' + (row.skill ? "" : " disabled") + ">" +
        (row.skill ? levels.map(function (lv) { return '<option value="' + lv + '"' + (lv === row.level ? " selected" : "") + ">Lv " + lv + "</option>"; }).join("") : "<option>Lv —</option>") +
        "</select></div>";
      wrap.appendChild(div);
    });
    wrap.querySelectorAll("select[data-skill]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var i = +sel.getAttribute("data-skill");
        var id = sel.value;
        state.rows[i].skill = id;
        state.rows[i].level = id ? skillById[id].levels[skillById[id].levels.length - 1] : null;
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
      return { label: p.label, slots: p.slots, html: p.slots.length ? '<span class="slot-glyph">' + p.label.replace(/\[W\]/g, '<span class="w-chip">W</span>') + "</span>" : t("any_slots") };
    }), function (item) {
      return JSON.stringify(item.slots) === JSON.stringify(state.slots);
    }, function (item) {
      state.slots = item.slots;
      renderSlotChips(); renderResult();
    });
  }
  function renderPaceChips() {
    renderChips("#paceChips", PACES.map(function (p) { return { label: t(p.key), perHour: p.perHour }; }),
      function (item) { return item.perHour === state.pace; }, function (item) {
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
    if (h < 1) return t("u_min", { n: Math.round(h * 60) });
    if (h < 48) return t("u_hours", { n: (Math.round(h * 10) / 10).toLocaleString("en-US") });
    var days = h / 24;
    if (days < 365) return t("u_days", { n: (Math.round(days * 10) / 10).toLocaleString("en-US") });
    return t("u_years", { n: (Math.round((days / 365) * 10) / 10).toLocaleString("en-US") });
  }
  function groupShort(g) { return t("g_" + g); }

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
      name = I.charmName(data.rarities[rk]);
      rarityLabel = rk + " · " + Math.round(data.rarities[rk].weight * 100) + "% " + t("of_appraisals");
    } else {
      cls = "gem-bad"; rarityClass = ""; name = t("appraised_talisman");
      rarityLabel = t("not_in_tables");
    }
    var skills = targets.map(function (tg) {
      return '<div class="t-skill"><span>' + sName(skillById[tg.skill]) + "</span>" + pipsHTML(tg.level) + "</div>";
    }).join("");
    var slots = state.slots.length
      ? state.slots.map(function (s) { return '<span class="slot-box' + (s === -1 ? " w" : "") + '">' + (s === -1 ? "W" : s) + "</span>"; }).join("")
      : "<span>" + t("any_deco_slots") + "</span>";
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
      if (el._countToken !== token) return;
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
      var why = targets.map(function (tg) {
        var pools = res.skillPools[tg.skill].map(groupShort).join(", ");
        return "<li><strong>" + sName(skillById[tg.skill]) + " Lv" + tg.level + "</strong> " + t("can_only_roll") + " " + pools + punct() + "</li>";
      }).join("");
      var fix = "";
      if (targets.length > 1) {
        for (var i = 0; i < targets.length; i++) {
          var rest = targets.filter(function (_, j) { return j !== i; });
          if (calc.calculate(data, index, rest, state.slots).legal) {
            fix = '<div class="fix-hint">' + t("fix_drop", { name: sName(skillById[targets[i].skill]), lv: targets[i].level }) + (state.slots.length ? t("fix_with_slots") : "") + punct() + "</div>";
            break;
          }
        }
        if (!fix && state.slots.length) {
          if (calc.calculate(data, index, targets, []).legal) {
            fix = '<div class="fix-hint">' + t("fix_slots_skills") + "</div>";
          }
        }
      } else if (state.slots.length && calc.calculate(data, index, targets, []).legal) {
        fix = '<div class="fix-hint">' + t("fix_slots_skill") + "</div>";
      }
      body.innerHTML =
        previewHTML(targets, res) +
        '<span class="verdict illegal">' + t("verdict_illegal") + "</span>" +
        '<div class="illegal-why">' + t("illegal_why") + "<ul>" + why + "</ul></div>" +
        fix +
        '<div class="share-row"><button class="btn-share" id="btnShare">' + t("share_btn") + "</button></div>";
      wireShare(targets, res, null);
      return;
    }

    var grind = calc.expectedGrind(res.probability, state.pace);
    var maxR = Math.max.apply(null, Object.keys(res.byRarity).map(function (k) { return res.byRarity[k]; }));
    var bars = ["R5", "R6", "R7", "R8"].map(function (rk) {
      var v = res.byRarity[rk];
      var w = maxR > 0 ? Math.max(2, (v / maxR) * 100) : 0;
      return '<div class="rbar"><span class="tag ' + rk.toLowerCase() + '">' + rk + '</span><span class="track"><span class="fill ' + rk.toLowerCase() + '" data-w="' + (v > 0 ? w : 0) + '" style="display:block"></span></span><span class="val">' + (v > 0 ? (v / res.probability * 100).toFixed(1) + "% " + t("of_hits") : "—") + "</span></div>";
    }).join("");

    var brutal = res.oneIn >= 10000;
    var bridge =
      '<div class="bridge' + (brutal ? " brutal" : "") + '">' +
      "<p>" + (brutal ? t("bridge_brutal") : "") + t("bridge_p") + "</p>" +
      '<p class="bridge-sub">' + t("bridge_sub") + "</p>" +
      '<a class="cta" href="' + SHOP_URL + '" target="_blank" rel="noopener">' + t("bridge_cta") + "</a>" +
      "</div>";

    body.innerHTML =
      previewHTML(targets, res) +
      '<span class="verdict legal">' + t("verdict_legal") + "</span>" +
      '<div class="odds-big"><small>1 in&nbsp;</small><span id="oddsNum">0</span></div>' +
      '<div class="odds-pct">' + fmtPct(res.probability) + " " + t("pct_per") + "</div>" +
      '<div class="grind">' +
      '<div class="grind-box"><div class="num" id="apprNum">0</div><div class="lbl">' + t("expected_appraisals") + "</div></div>" +
      '<div class="grind-box"><div class="num">' + fmtHours(grind.hours) + '</div><div class="lbl">' + t("expected_grind", { n: state.pace }) + "</div></div>" +
      "</div>" +
      '<div class="rarity-bars"><h4>' + t("where_hit") + "</h4>" + bars + "</div>" +
      '<div class="best-line"><h4>' + t("most_likely") + "</h4><strong>" + res.best.rarity + "</strong> · " + res.best.groups.map(groupShort).join(" + ") + "</div>" +
      bridge +
      '<div class="share-row"><button class="btn-share" id="btnShare">' + t("share_btn") + "</button></div>";

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
        rarityName: res.legal ? I.charmName(data.rarities[res.best.rarity]) : "",
        skills: targets.map(function (tg) { return { name: sName(skillById[tg.skill]), level: tg.level }; }),
        slots: state.slots,
        oneInText: res.legal ? fmtInt(Math.round(res.oneIn)) : "",
        pctText: res.legal ? fmtPct(res.probability) : "",
        hoursText: grind ? fmtHours(grind.hours) : "",
        labels: {
          canRoll: t("share_can_roll"), cannotRoll: t("share_cannot_roll"),
          oddsSuffix: t("share_odds_suffix"), check: t("share_check"), slots: t("share_slots"),
          illegal1: t("share_illegal1"), illegal2: t("share_illegal2"),
          per: t("share_per", { h: grind ? fmtHours(grind.hours) : "" }),
          footerR: t("share_footer_r"), anySlots: t("any_slots"),
        },
      });
    });
  }

  /* ---------- builds ---------- */
  function decoChips(list) {
    return '<span class="deco-chips">' + list.map(function (d) { return '<span class="deco-chip">' + d + "</span>"; }).join("") + "</span>";
  }
  function skillLine(pairs) {
    return pairs.map(function (p) { return sNameEn(p[0]) + " " + p[1]; }).join(" · ");
  }
  function loadoutHTML(b) {
    var g = b.gear, tal = b.talisman;
    var h = '<div class="lo-row"><span class="lo-part">' + t("weapon_label") + '</span><div class="lo-main">' +
      '<div class="lo-name">' + g.weapon.name + '</div><div class="lo-meta">' + g.weapon.meta + "</div>" +
      decoChips(g.weapon.decos) + "</div></div>";
    if (g.mods) {
      h += '<div class="lo-row"><span class="lo-part">' + t("mods_label") + '</span><div class="lo-main"><div class="lo-meta">' + g.mods + "</div></div></div>";
    }
    g.armor.forEach(function (piece) {
      h += '<div class="lo-row"><span class="lo-part">' + t("part_" + piece.part) + '</span><div class="lo-main">' +
        '<div class="lo-name">' + piece.name + '</div><div class="lo-meta">' + skillLine(piece.skills) + "</div></div></div>";
    });
    h += '<div class="lo-row"><span class="lo-part">' + t("armor_decos_label") + '</span><div class="lo-main">' +
      decoChips(g.armorDecos) + '<div class="lo-note">' + t("armor_decos_note") + "</div></div></div>";
    // talisman row
    h += '<div class="lo-row lo-talisman"><span class="lo-part">' + t("talisman_label") + '</span><div class="lo-main">';
    if (tal.kind === "crafted") {
      h += '<div class="lo-name">' + tal.label + '</div><span class="crafted-badge">' + t("crafted_badge") + "</span>";
    } else {
      var talSkills = tal.skills.map(function (p) { return sNameEn(p[0]) + " Lv" + p[1]; }).join(" · ");
      var labelText = "";
      if (tal.label) {
        var rar = null;
        Object.keys(data.rarities).forEach(function (k) { if (data.rarities[k].name === tal.label) rar = data.rarities[k]; });
        labelText = (rar ? I.charmName(rar) : tal.label) + " — ";
      }
      h += '<div class="lo-name">' + labelText + talSkills + "</div>";
      if (tal.decos && tal.decos.length) h += '<div class="lo-meta">' + t("socketed_label") + ": " + tal.decos.join(" · ") + "</div>";
    }
    h += "</div></div>";
    // final skills
    var f = b.finalSkills;
    h += '<div class="lo-finals"><div class="lo-finals-title">' + t("final_skills") + "</div>" +
      '<div class="lo-fs"><span>' + t("fs_weapon") + ":</span> " + skillLine(f.weapon) + "</div>" +
      '<div class="lo-fs"><span>' + t("fs_armor") + ":</span> " + skillLine(f.armor) + "</div>" +
      '<div class="lo-fs"><span>' + t("fs_set") + ":</span> " + f.set.join(" · ") + "</div></div>";
    return h;
  }

  function buildSummary(b) {
    if (I.lang === "zh") return b.summaryZh || b.summary;
    if (I.lang === "tw") return b.summaryTw || b.summary;
    if (I.lang === "ja") return b.summaryJa || b.summary;
    return b.summary;
  }

  function renderBuilds() {
    var builds = window.TALISMAN_BUILDS || [];
    if (!builds.length) return;
    $("#builds").hidden = false;
    $("#navBuilds").hidden = false;
    var weapons = [];
    builds.forEach(function (b) { if (weapons.indexOf(b.weapon) === -1) weapons.push(b.weapon); });
    var filters = $("#buildFilters");
    filters.innerHTML = "";
    var grid = $("#buildGrid");
    grid.innerHTML = "";
    function setActiveFilter(active) {
      filters.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === active); });
    }
    function filterBuilds(w) {
      grid.querySelectorAll(".build-card").forEach(function (card) {
        card.style.display = !w || card.getAttribute("data-weapon") === w ? "" : "none";
      });
    }
    var all = document.createElement("button");
    all.className = "chip active"; all.textContent = t("all_weapons");
    all.addEventListener("click", function () { filterBuilds(""); setActiveFilter(all); });
    filters.appendChild(all);
    weapons.forEach(function (w) {
      var c = document.createElement("button");
      c.className = "chip"; c.textContent = I.weaponName(w);
      c.addEventListener("click", function () { filterBuilds(w); setActiveFilter(c); });
      filters.appendChild(c);
    });
    builds.forEach(function (b) {
      var card = document.createElement("div");
      card.className = "build-card";
      card.setAttribute("data-weapon", b.weapon);
      var tal = b.talisman;
      var talHTML;
      if (tal.kind === "crafted") {
        talHTML = '<div class="build-talisman"><span class="t-label">' + t("ideal_talisman") + "</span>" + tal.label +
          '<div class="crafted-note">' + t("crafted_note") + "</div></div>";
      } else {
        var line = tal.skills.map(function (p) { return sNameEn(p[0]) + " Lv" + p[1]; }).join(" · ");
        if (tal.slots && tal.slots.length) line += "  ·  " + tal.slots.map(function (s) { return s === -1 ? "[W]" : "[" + s + "]"; }).join("");
        talHTML = '<div class="build-talisman"><span class="t-label">' + t("ideal_talisman") + "</span>" + line + "</div>";
      }
      card.innerHTML =
        '<span class="weapon-tag">' + I.weaponName(b.weapon) + "</span>" +
        "<h3>" + b.name + "</h3>" +
        "<p>" + buildSummary(b) + "</p>" +
        talHTML +
        '<div class="loadout" hidden>' + loadoutHTML(b) + "</div>" +
        '<p class="build-source">' + t("source_label") + ' <a href="' + b.sourceUrl + '" target="_blank" rel="noopener">' + b.sourceName + "</a> · " + b.version + "</p>" +
        '<div class="build-actions">' +
        '<button class="btn-loadout">' + t("full_loadout") + "</button>" +
        (tal.kind === "appraised" ? '<button class="btn-odds">' + t("check_odds") + "</button>" : "") +
        "</div>";
      var lo = card.querySelector(".loadout");
      var loBtn = card.querySelector(".btn-loadout");
      loBtn.addEventListener("click", function () {
        lo.hidden = !lo.hidden;
        loBtn.textContent = lo.hidden ? t("full_loadout") : t("hide_loadout");
      });
      var oddsBtn = card.querySelector(".btn-odds");
      if (oddsBtn) {
        oddsBtn.addEventListener("click", function () {
          state.rows = [{ skill: "", level: null }, { skill: "", level: null }, { skill: "", level: null }];
          tal.skills.forEach(function (p, i) {
            var match = skillByName[p[0]];
            if (match && i < 3) state.rows[i] = { skill: match.id, level: p[1] };
          });
          state.slots = tal.slots || [];
          renderRows(); renderSlotChips(); renderResult();
          document.querySelector("#calculator").scrollIntoView({ behavior: "smooth" });
        });
      }
      grid.appendChild(card);
    });
  }

  /* ---------- language ---------- */
  function renderAll() {
    renderRows(); renderSlotChips(); renderPaceChips(); renderResult(); renderBuilds();
  }
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      I.setLang(btn.getAttribute("data-lang"), renderAll);
    });
  });
  document.documentElement.lang = I.lang === "zh" ? "zh-CN" : I.lang === "tw" ? "zh-TW" : I.lang;
  I.applyStatic();
  renderAll();
})();
