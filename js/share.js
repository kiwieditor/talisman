/* Share-image export: draws a 1200x630 card on canvas and downloads it as PNG. */
(function (global) {
  "use strict";

  var SITE_NAME = "Wilds Talisman Calculator · talisman.kiwieditor.com";

  function slotText(slots) {
    if (!slots || slots.length === 0) return "Any slots";
    return slots.map(function (s) { return s === -1 ? "[W]" : "[" + s + "]"; }).join(" ");
  }

  function drawCard(model) {
    var W = 1200, H = 630;
    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");

    // background
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#14171c");
    bg.addColorStop(1, "#0c0e11");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    var glow = ctx.createRadialGradient(W - 140, 40, 30, W - 140, 40, 480);
    glow.addColorStop(0, "rgba(232,179,75,0.22)");
    glow.addColorStop(1, "rgba(232,179,75,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#2a3038";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.strokeStyle = "rgba(230,185,92,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // gem mark
    ctx.save();
    ctx.translate(70, 58);
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(44, 18); ctx.lineTo(24, 46); ctx.lineTo(4, 18); ctx.closePath();
    ctx.fillStyle = "#e8b34b"; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(33, 18); ctx.lineTo(24, 46); ctx.lineTo(15, 18); ctx.closePath();
    ctx.fillStyle = "#f5cd6e"; ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#eef1f4";
    ctx.font = "700 30px Cinzel, 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("MONSTER HUNTER WILDS", 128, 84);
    ctx.fillStyle = "#9aa5b1";
    ctx.font = "600 22px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(model.rarityName ? model.rarityName + " — talisman odds check" : "Talisman odds check", 128, 116);

    // verdict pill
    var pillText = model.legal ? "✓ CAN ROLL — IT EXISTS" : "✕ CANNOT ROLL — IMPOSSIBLE COMBO";
    ctx.font = "800 24px 'Segoe UI', system-ui, sans-serif";
    var pillW = ctx.measureText(pillText).width + 44;
    ctx.fillStyle = model.legal ? "rgba(87,199,133,0.16)" : "rgba(224,101,95,0.16)";
    ctx.beginPath();
    ctx.roundRect(70, 148, pillW, 52, 26);
    ctx.fill();
    ctx.fillStyle = model.legal ? "#57c785" : "#e0655f";
    ctx.fillText(pillText, 92, 183);

    // skills
    ctx.fillStyle = "#eef1f4";
    ctx.font = "700 44px 'Segoe UI', system-ui, sans-serif";
    var y = 268;
    model.skills.forEach(function (s) {
      ctx.fillText(s.name, 70, y);
      var nameW = ctx.measureText(s.name).width;
      ctx.fillStyle = "#f5cd6e";
      ctx.fillText(" Lv" + s.level, 70 + nameW, y);
      ctx.fillStyle = "#eef1f4";
      y += 58;
    });
    ctx.fillStyle = "#9aa5b1";
    ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Slots: " + slotText(model.slots), 70, y + 6);

    if (model.legal) {
      ctx.fillStyle = "#e8b34b";
      ctx.font = "800 92px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText("1 in " + model.oneInText, 70, 520);
      ctx.fillStyle = "#9aa5b1";
      ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(model.pctText + " per appraisal  ·  ≈ " + model.hoursText + " of grinding", 72, 562);
    } else {
      ctx.fillStyle = "#9aa5b1";
      ctx.font = "600 27px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText("No template in the game can hold this combination.", 70, 500);
      ctx.fillText("Don't waste your melding points on it.", 70, 542);
    }

    // footer watermark
    ctx.fillStyle = "#5c6672";
    ctx.font = "700 22px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(SITE_NAME, 70, H - 42);
    ctx.textAlign = "right";
    ctx.fillText("Exact odds · No guesswork", W - 70, H - 42);
    ctx.textAlign = "left";

    return canvas;
  }

  function share(model) {
    var canvas = drawCard(model);
    var a = document.createElement("a");
    a.download = "wilds-talisman-odds.png";
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  global.TalismanShare = { share: share };
})(typeof window !== "undefined" ? window : globalThis);
