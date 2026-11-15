/* Gogma Artian skill tables — fixed in-game lottery order (21 Set x 14 Group = 294).
 * EN order: GogmaSeedFinder rng-core ARTIAN_SET_ORDER / ARTIAN_GROUP_ORDER (from WiseHorror's GARP).
 * ZH (Simplified): official game text, from our save-editing dataset (gogma-skill-pairs.json, all 294 pairs).
 * TW: official Traditional text (names4.json pairs, cross-checked vs GogmaSeedFinder web/i18n.js). JA: official game text.
 * attributes are in DISPLAY order; `force` is the game's internal attributeForce value (Ice/Thunder swapped).
 */
var GOGMA_DATA = {
 "sets": [
  {
   "en": "Doshaguma's Might",
   "zh": "辟兽之力",
   "tw": "闢獸之力",
   "ja": "闢獣の力"
  },
  {
   "en": "Rathalos's Flare",
   "zh": "火龙之力",
   "tw": "火龍之力",
   "ja": "火竜の力"
  },
  {
   "en": "Xu Wu's Vigor",
   "zh": "暗器蛸之力",
   "tw": "暗器鱆之力",
   "ja": "暗器蛸の力"
  },
  {
   "en": "Gravios's Protection",
   "zh": "铠龙之守护",
   "tw": "鎧龍之守護",
   "ja": "鎧竜の守護"
  },
  {
   "en": "Blangonga's Spirit",
   "zh": "雪狮子王之斗志",
   "tw": "雪獅子王之鬥志",
   "ja": "雪獅子の闘志"
  },
  {
   "en": "Ebony Odogaron's Power",
   "zh": "凶爪龙之力",
   "tw": "兇爪龍之力",
   "ja": "兇爪竜の力"
  },
  {
   "en": "Fulgur Anjanath's Will",
   "zh": "雷颚龙之斗志",
   "tw": "雷顎龍之鬥志",
   "ja": "雷顎竜の闘志"
  },
  {
   "en": "Uth Duna's Cover",
   "zh": "波衣龙之守护",
   "tw": "波衣龍之守護",
   "ja": "波衣竜の守護"
  },
  {
   "en": "Rey Dau's Voltage",
   "zh": "煌雷龙之力",
   "tw": "煌雷龍之力",
   "ja": "煌雷竜の力"
  },
  {
   "en": "Nu Udra's Mutiny",
   "zh": "狱焰蛸之反叛",
   "tw": "獄焰鱆之叛逆",
   "ja": "獄焔蛸の反逆"
  },
  {
   "en": "Jin Dahaad's Revolt",
   "zh": "冻峰龙之反叛",
   "tw": "凍峰龍之叛逆",
   "ja": "凍峰竜の反逆"
  },
  {
   "en": "Gore Magala's Tyranny",
   "zh": "黑蚀龙之力",
   "tw": "黑蝕龍之力",
   "ja": "黒蝕竜の力"
  },
  {
   "en": "Arkveld's Hunger",
   "zh": "锁刃龙之饥饿",
   "tw": "鎖刃龍之飢餓",
   "ja": "鎖刃竜の飢餓"
  },
  {
   "en": "Guardian Arkveld's Vitality",
   "zh": "护锁刃龙之命脉",
   "tw": "護鎖刃龍之命脈",
   "ja": "護鎖刃竜の命脈"
  },
  {
   "en": "Mizutsune's Prowess",
   "zh": "泡狐龙之力",
   "tw": "泡狐龍之力",
   "ja": "泡狐竜の力"
  },
  {
   "en": "Zoh Shia's Pulse",
   "zh": "白炽龙之脉动",
   "tw": "白熾龍的脈動",
   "ja": "白熾龍の脈動"
  },
  {
   "en": "Leviathan's Fury",
   "zh": "海龙的涡雷",
   "tw": "海龍的渦雷",
   "ja": "海竜の渦雷"
  },
  {
   "en": "Seregios's Tenacity",
   "zh": "千刃龙的斗志",
   "tw": "千刃龍之鬥志",
   "ja": "千刃竜の闘志"
  },
  {
   "en": "Gogmapocalypse",
   "zh": "巨戟龙的默示录",
   "tw": "巨戟龍的啟示錄",
   "ja": "巨戟龍の黙示録"
  },
  {
   "en": "Soul of the Dark Knight",
   "zh": "暗黑骑士之证",
   "tw": "暗黑騎士之證",
   "ja": "暗黒騎士の証"
  },
  {
   "en": "Omega Resonance",
   "zh": "欧米茄共鸣",
   "tw": "歐米茄共鳴",
   "ja": "オメガレゾナンス"
  }
 ],
 "groups": [
  {
   "en": "Neopteron Alert",
   "zh": "甲虫之直觉",
   "tw": "甲蟲的直覺",
   "ja": "甲虫の知らせ"
  },
  {
   "en": "Neopteron Camouflage",
   "zh": "甲虫之拟态",
   "tw": "甲蟲的擬態",
   "ja": "甲虫の擬態"
  },
  {
   "en": "Flexible Leathercraft",
   "zh": "皮革制品之柔韧",
   "tw": "皮革製品的柔韌性",
   "ja": "革細工の柔性"
  },
  {
   "en": "Buttery Leathercraft",
   "zh": "皮革制品之顺滑",
   "tw": "皮革製品的滑順質感",
   "ja": "革細工の滑性"
  },
  {
   "en": "Scaling Prowess",
   "zh": "铺鳞之技法",
   "tw": "鋪排鱗片的技巧",
   "ja": "鱗張りの技法"
  },
  {
   "en": "Scale Layering",
   "zh": "叠鳞之工艺",
   "tw": "堆疊鱗片的手藝",
   "ja": "鱗重ねの工夫"
  },
  {
   "en": "Fortifying Pelt",
   "zh": "毛皮之昂扬",
   "tw": "毛皮的昂揚",
   "ja": "毛皮の昂揚"
  },
  {
   "en": "Alluring Pelt",
   "zh": "毛皮之诱惑",
   "tw": "毛皮的誘惑",
   "ja": "毛皮の誘惑"
  },
  {
   "en": "Lord's Favor",
   "zh": "霸主之骄傲",
   "tw": "霸主的自尊",
   "ja": "ヌシの誇り"
  },
  {
   "en": "Lord's Fury",
   "zh": "霸主之愤慨",
   "tw": "霸主的盛怒",
   "ja": "ヌシの憤激"
  },
  {
   "en": "Guardian's Pulse",
   "zh": "护龙之脉动",
   "tw": "護龍的脈動",
   "ja": "護竜の脈動"
  },
  {
   "en": "Guardian's Protection",
   "zh": "护龙之守护",
   "tw": "護龍的守護",
   "ja": "護竜の守り"
  },
  {
   "en": "Imparted Wisdom",
   "zh": "前辈之指引",
   "tw": "前輩的指引",
   "ja": "先達の導き"
  },
  {
   "en": "Lord's Soul",
   "zh": "霸主之魂",
   "tw": "霸主之魂",
   "ja": "ヌシの魂"
  }
 ],
 "weapons": [
  {
   "en": "Great Sword",
   "zh": "大剑",
   "tw": "大劍",
   "ja": "大剣"
  },
  {
   "en": "Sword & Shield",
   "zh": "单手剑",
   "tw": "單手劍",
   "ja": "片手剣"
  },
  {
   "en": "Dual Blades",
   "zh": "双剑",
   "tw": "雙劍",
   "ja": "双剣"
  },
  {
   "en": "Long Sword",
   "zh": "太刀",
   "tw": "太刀",
   "ja": "太刀"
  },
  {
   "en": "Hammer",
   "zh": "大锤",
   "tw": "大錘",
   "ja": "ハンマー"
  },
  {
   "en": "Hunting Horn",
   "zh": "狩猎笛",
   "tw": "狩獵笛",
   "ja": "狩猟笛"
  },
  {
   "en": "Lance",
   "zh": "长枪",
   "tw": "長槍",
   "ja": "ランス"
  },
  {
   "en": "Gunlance",
   "zh": "铳枪",
   "tw": "銃槍",
   "ja": "ガンランス"
  },
  {
   "en": "Switch Axe",
   "zh": "斩斧",
   "tw": "斬擊斧",
   "ja": "スラッシュアックス"
  },
  {
   "en": "Charge Blade",
   "zh": "盾斧",
   "tw": "充能斧",
   "ja": "チャージアックス"
  },
  {
   "en": "Insect Glaive",
   "zh": "操虫棍",
   "tw": "操蟲棍",
   "ja": "操虫棍"
  },
  {
   "en": "Bow",
   "zh": "弓",
   "tw": "弓",
   "ja": "弓"
  },
  {
   "en": "Heavy Bowgun",
   "zh": "重弩炮",
   "tw": "重弩炮",
   "ja": "ヘビィボウガン"
  },
  {
   "en": "Light Bowgun",
   "zh": "轻弩炮",
   "tw": "輕弩炮",
   "ja": "ライトボウガン"
  }
 ],
 "attributes": [
  {
   "en": "None",
   "zh": "无",
   "tw": "無",
   "ja": "無",
   "force": 0
  },
  {
   "en": "Fire",
   "zh": "火",
   "tw": "火",
   "ja": "火",
   "force": 1
  },
  {
   "en": "Water",
   "zh": "水",
   "tw": "水",
   "ja": "水",
   "force": 2
  },
  {
   "en": "Thunder",
   "zh": "雷",
   "tw": "雷",
   "ja": "雷",
   "force": 4
  },
  {
   "en": "Ice",
   "zh": "冰",
   "tw": "冰",
   "ja": "氷",
   "force": 3
  },
  {
   "en": "Dragon",
   "zh": "龙",
   "tw": "龍",
   "ja": "龍",
   "force": 5
  },
  {
   "en": "Poison",
   "zh": "毒",
   "tw": "毒",
   "ja": "毒",
   "force": 6
  },
  {
   "en": "Paralysis",
   "zh": "麻痹",
   "tw": "麻痺",
   "ja": "麻痺",
   "force": 7
  },
  {
   "en": "Sleep",
   "zh": "睡眠",
   "tw": "睡眠",
   "ja": "睡眠",
   "force": 8
  },
  {
   "en": "Blast",
   "zh": "爆破",
   "tw": "爆破",
   "ja": "爆破",
   "force": 9
  }
 ]
};
if (typeof window !== "undefined") window.GOGMA_DATA = GOGMA_DATA;
if (typeof module !== "undefined" && module.exports) module.exports = GOGMA_DATA;
