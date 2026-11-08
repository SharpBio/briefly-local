/* Briefly Local - config, model client, official-style result schema, renderers */
(function () {
  "use strict";

  var KEY = "brief_local_config";

  /* 结果页由结构化 JSON 渲染，而不是 Markdown；字段定义见下方 SCHEMA_PROMPT。 */
  var SCHEMA_PROMPT = [
    "你是 Briefly 的中文精华版编辑。把用户提供的视频字幕或网页正文，整理成一份「结构化中文精华版」。",
    "只输出一个 JSON 对象：不要 Markdown 代码块、不要解释、不要前后缀。所有字符串必须是合法 JSON（引号要转义）。",
    "",
    "JSON 结构（字段名严格保持一致，没有内容就给空数组或空字符串）：",
    "{",
    '  "title_zh": "提炼后的中文标题，不是原标题直译",',
    '  "one_liner": "一句话结论，30-60 字，说清这条内容最值得知道的事",',
    '  "meta": { "source_language": "en 或 zh", "duration": "例如 52 分钟" },',
    '  "core_quote": { "original_text": "最能代表全篇的一句原文（保留原语言）", "zh_translation": "它的中文意译" },',
    '  "main_structure": [',
    '    { "id": "s1", "title": "中文小标题 8-16 字", "summary": "这一段的核心信息，1-2 句，尽量带具体数字",',
    '      "timestamp_estimate": "mm:ss", "quotes": [',
    '        { "original_text": "素材中真实出现的原文金句", "zh_translation": "中文意译", "timestamp_start": "mm:ss",',
    '          "annotations": [ { "keyword": "原文里的生词或术语（必须能在 original_text 中原样找到）", "explanation": "中文解释" } ] }',
    "      ] }",
    "  ],",
    '  "optionals": [',
    '    { "key": "three_takeaway", "data": { "items": ["核心认知1", "核心认知2", "核心认知3"] } },',
    '    { "key": "key_numbers", "data": { "items": [ { "number": "1.2亿", "caption": "对应事实" } ] } },',
    '    { "key": "timeline", "data": { "title": "时间线", "items": [ { "time": "00:00", "content": "这段讲了什么" } ] } },',
    '    { "key": "before_after", "data": { "title": "前后对比", "pairs": [ { "before": "之前", "after": "之后" } ] } },',
    '    { "key": "books", "data": { "items": [ { "title": "书名", "author": "作者", "reason": "为什么相关" } ] } },',
    '    { "key": "fun_facts", "data": { "items": ["素材里的有趣事实"] } },',
    '    { "key": "story", "data": { "text": "素材里值得完整复述的一段故事" } }',
    "  ]",
    "}",
    "",
    "规则：",
    "1. main_structure 3-6 段，按素材顺序组织，每段至少 1 条金句；金句必须是素材里真实出现的句子，不许编造。",
    "2. 所有叙述用中文；original_text 保留原语言；数字、专名、引语保持原样。",
    "3. 素材没有时间戳时，时间戳字段填空字符串，并省略 timeline 模块；没有数字/书单/故事时省略对应 optionals，不要硬凑。",
    "4. annotations.keyword 必须能在该条 original_text 里原样找到（页面会高亮它）。",
    "5. 不写「总结」「以下是」之类的套话，不复述任务，不补充素材之外的背景。"
  ].join("\n");

  var DEFAULTS = {
    baseUrl: "http://localhost:11434/v1",
    apiKey: "",
    model: "qwen2.5:7b",
    temperature: 0.3,
    chunkSize: 12000,
    maxChunks: 12,
    strictJson: false,
    prompt: SCHEMA_PROMPT
  };

  var PRESETS = {
    ollama: { baseUrl: "http://localhost:11434/v1", apiKey: "", model: "qwen2.5:7b" },
    deepseek: { baseUrl: "https://api.deepseek.com", apiKey: "", model: "deepseek-chat" },
    siliconflow: { baseUrl: "https://api.siliconflow.cn/v1", apiKey: "", model: "Qwen/Qwen2.5-7B-Instruct" },
    zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: "", model: "glm-4-flash" },
    openai: { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" }
  };

  function getConfig() {
    return chrome.storage.local.get(KEY).then(function (d) {
      return Object.assign({}, DEFAULTS, (d && d[KEY]) || {});
    });
  }
  function saveConfig(cfg) { var o = {}; o[KEY] = cfg; return chrome.storage.local.set(o); }
  function resetConfig() { return chrome.storage.local.remove(KEY); }

  function endpoint(base) {
    var b = String(base || "").trim().replace(/\/+$/, "");
    if (/\/chat\/completions$/.test(b)) return b;
    return b + "/chat/completions";
  }

  function chat(messages, cfg, signal, jsonMode) {
    var headers = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers.Authorization = "Bearer " + cfg.apiKey;
    var payload = {
      model: cfg.model, messages: messages, stream: false,
      temperature: Number(cfg.temperature) || 0.3
    };
    if (jsonMode) {
      if (/11434|ollama/i.test(cfg.baseUrl)) payload.format = "json";
      else payload.response_format = { type: "json_object" };
    }
    return fetch(endpoint(cfg.baseUrl), {
      method: "POST", headers: headers, body: JSON.stringify(payload), signal: signal || undefined
    }).then(function (r) {
      if (!r.ok) {
        return r.text().catch(function () { return ""; }).then(function (t) {
          throw new Error("HTTP " + r.status + " " + r.statusText + (t ? " · " + t.slice(0, 240) : ""));
        });
      }
      return r.json();
    }).then(function (j) {
      var text = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) ||
        (j && j.message && j.message.content) || (j && j.response) || "";
      if (!text) throw new Error("模型返回为空：" + JSON.stringify(j).slice(0, 240));
      return String(text).trim();
    });
  }

  function testConnection(cfg) {
    return chat([{ role: "user", content: "只回复两个字：可用" }], cfg);
  }

  function parseResult(text, fallbackTitle) {
    var t = String(text || "").trim();
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    var a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    var obj = null;
    try { obj = JSON.parse(t); } catch (e) {
      try { obj = JSON.parse(t.replace(/,\s*([}\]])/g, "$1")); } catch (e2) {}
    }
    if (!obj || typeof obj !== "object") {
      return {
        degraded: true, title_zh: fallbackTitle || "提炼结果", one_liner: "",
        meta: {}, core_quote: {},
        main_structure: [{ id: "s1", title: "模型原始输出", summary: String(text || "").slice(0, 4000), timestamp_estimate: "", quotes: [] }],
        optionals: []
      };
    }
    obj.main_structure = Array.isArray(obj.main_structure) ? obj.main_structure : [];
    obj.optionals = Array.isArray(obj.optionals) ? obj.optionals : [];
    obj.meta = obj.meta || {};
    obj.core_quote = obj.core_quote || {};
    return obj;
  }

  function toMarkdown(r, rawText) {
    var L = [];
    L.push("# " + (r.title_zh || "Briefly 精华版"));
    if (r.one_liner) L.push("", "> " + r.one_liner);
    if (r.core_quote && r.core_quote.original_text) {
      L.push("", "**核心金句** " + r.core_quote.original_text);
      if (r.core_quote.zh_translation) L.push("", r.core_quote.zh_translation);
    }
    if (r.main_structure.length) {
      L.push("", "## 本片亮点");
      r.main_structure.forEach(function (s, i) {
        L.push("", "### " + String(i + 1).padStart(2, "0") + " " + (s.title || s.section_title || ""));
        if (s.timestamp_estimate) L.push("`" + s.timestamp_estimate + "`");
        if (s.summary || s.section_thesis) L.push("", s.summary || s.section_thesis);
        (s.quotes || []).forEach(function (q) {
          if (q.original_text) L.push("", "> " + q.original_text + (q.timestamp_start ? "  `" + q.timestamp_start + "`" : ""));
          if (q.zh_translation) L.push("", q.zh_translation);
          (q.annotations || []).forEach(function (n) { L.push("- **" + n.keyword + "** — " + n.explanation); });
        });
      });
    }
    var TITLES = {
      three_takeaway: "核心认知", key_numbers: "关键数字", timeline: "时间线",
      before_after: "前后对比", books: "推荐书单", fun_facts: "延伸趣闻",
      story: "故事", predictions: "预测", advice: "建议"
    };
    r.optionals.forEach(function (o) {
      var d = o.data || {}, items = d.items || [];
      L.push("", "## " + (d.title || TITLES[o.key] || o.key));
      if (o.key === "key_numbers") items.forEach(function (x) { L.push("- **" + x.number + "** " + (x.caption || "")); });
      else if (o.key === "timeline") items.forEach(function (x) { L.push("- `" + x.time + "` " + x.content); });
      else if (o.key === "before_after") (d.pairs || []).forEach(function (x) { L.push("- " + x.before + " → " + x.after); });
      else if (o.key === "books") items.forEach(function (x) { L.push("- 《" + x.title + "》" + (x.author ? " / " + x.author : "") + " — " + (x.reason || "")); });
      else if (o.key === "story") L.push(String(d.text || d.story || d.content || ""));
      else items.forEach(function (x) { L.push("- " + (typeof x === "string" ? x : JSON.stringify(x))); });
    });
    if (rawText) L.push("", "## 全文逐字稿", "", "```text", rawText, "```");
    return L.join("\n");
  }

  function splitText(text, size, maxChunks) {
    var limit = Math.max(2000, Number(size) || 12000);
    var cap = Math.max(1, Number(maxChunks) || 12);
    var lines = String(text || "").split(/\r?\n/);
    var out = [], buf = "";
    function flush() { if (buf.trim()) out.push(buf); buf = ""; }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.length > limit) {
        flush();
        for (var k = 0; k < line.length; k += limit) out.push(line.slice(k, k + limit));
        continue;
      }
      if (buf.length + line.length + 1 > limit) flush();
      buf += (buf ? "\n" : "") + line;
    }
    flush();
    if (out.length > cap) return { parts: out.slice(0, cap), truncated: true, total: out.length };
    return { parts: out, truncated: false, total: out.length };
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function markdown(text) {
    var lines = String(text || "").split(/\r?\n/), out = [], list = false;
    function flushList() { if (list) { out.push("</ul>"); list = false; } }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (/^\s*$/.test(l)) { flushList(); continue; }
      var h = /^(#{1,6})\s+(.*)$/.exec(l);
      if (h) { flushList(); out.push("<h" + h[1].length + ">" + esc(h[2]) + "</h" + h[1].length + ">"); continue; }
      var li = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(l);
      if (li) { if (!list) { out.push("<ul>"); list = true; } out.push("<li>" + esc(li[1]) + "</li>"); continue; }
      if (/^>\s?/.test(l)) { flushList(); out.push("<blockquote>" + esc(l.replace(/^>\s?/, "")) + "</blockquote>"); continue; }
      flushList(); out.push("<p>" + esc(l) + "</p>");
    }
    flushList();
    return out.join("\n");
  }

  function fmtTime(v) {
    var n = Number(v);
    if (!isFinite(n) || n < 0) return String(v);
    n = Math.floor(n);
    var m = Math.floor(n / 60), s = n % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function toText(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map(function (x) {
      if (typeof x === "string") return x;
      if (x && x.text) return (x.start != null ? "[" + fmtTime(x.start) + "] " : "") + x.text;
      return JSON.stringify(x);
    }).join("\n");
    return JSON.stringify(v, null, 2);
  }
  function safeName(s) {
    return String(s || "brief").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim().slice(0, 60) || "brief";
  }
  function timeToSeconds(t) {
    var p = String(t || "").trim().split(":").map(Number);
    if (!p.length || p.some(function (x) { return !isFinite(x); })) return 0;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return Math.floor(p[0] || 0);
  }
  function timestampUrl(sourceUrl, sourceType, time) {
    if (!sourceUrl || !time) return sourceUrl || "";
    var sec = Math.floor(timeToSeconds(time));
    try {
      var u = new URL(sourceUrl);
      if (sourceType === "youtube" || /youtube\.com|youtu\.be/.test(u.hostname)) u.searchParams.set("t", sec + "s");
      else if (sourceType === "bilibili" || /bilibili\.com/.test(u.hostname)) u.searchParams.set("t", String(sec));
      return u.toString();
    } catch (e) { return sourceUrl; }
  }

  function videoIdOf(d) {
    var u = String((d && d.uniqueIdentifier) || "");
    if (/^youtube:/.test(u)) return u.slice(8);
    try {
      var url = new URL((d && d.sourceUrl) || "");
      var v = url.searchParams.get("v");
      if (v) return v;
      var m = url.pathname.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
      return m ? m[1] : "";
    } catch (e) { return ""; }
  }

  /* Official build lets its server fetch YouTube captions. Local build
     re-reads captionTracks from the still-open tab and fetches timedtext
     in the page's MAIN world (same origin, cookies included). */
  function youtubeTranscript(d) {
    var vid = videoIdOf(d);
    if (!vid) return Promise.resolve({ ok: false, error: "无法从来源地址识别视频 ID" });
    return chrome.tabs.query({}).then(function (tabs) {
      var tab = (tabs || []).filter(function (t) { return t.url && t.url.indexOf(vid) !== -1; })[0];
      if (!tab) return { ok: false, error: "找不到对应的视频标签页（请保持原视频页打开）" };
      return chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: async function () {
          function mmss(n) {
            var s = Math.max(0, Math.floor(Number(n) || 0));
            var m = Math.floor(s / 60);
            return (m < 10 ? "0" : "") + m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
          }
          var tracks = [];
          try {
            var pr = window.ytInitialPlayerResponse;
            tracks = (pr && pr.captions && pr.captions.playerCaptionsTracklistRenderer &&
              pr.captions.playerCaptionsTracklistRenderer.captionTracks) || [];
          } catch (e) {}
          if (!tracks.length) {
            try {
              var m2 = document.documentElement.innerHTML.match(/"captionTracks":(\[[\s\S]*?\])/);
              if (m2) tracks = JSON.parse(m2[1]);
            } catch (e) {}
          }
          if (!tracks.length) return { ok: false, error: "页面没有可用字幕轨（该视频可能无字幕）" };
          var pick = tracks.filter(function (t) { return t.kind !== "asr" && /^en/i.test(t.languageCode || ""); })[0] ||
            tracks.filter(function (t) { return t.kind !== "asr"; })[0] || tracks[0];
          var u = pick.baseUrl;
          try { var url = new URL(u); url.searchParams.set("fmt", "json3"); u = url.toString(); }
          catch (e) { u += (u.indexOf("?") === -1 ? "?" : "&") + "fmt=json3"; }
          var r = await fetch(u, { credentials: "include" });
          if (!r.ok) return { ok: false, error: "字幕请求 HTTP " + r.status };
          var txt = await r.text();
          var lines = [];
          try {
            var j = JSON.parse(txt);
            (j.events || []).forEach(function (ev) {
              var s = (ev.segs || []).map(function (x) { return x.utf8 || ""; }).join("").replace(/\s+/g, " ").trim();
              if (s) lines.push("[" + mmss((ev.tStartMs || 0) / 1000) + "] " + s);
            });
          } catch (e) {
            var xd = new DOMParser().parseFromString(txt, "text/xml");
            Array.prototype.forEach.call(xd.querySelectorAll("text"), function (n) {
              var s = (n.textContent || "").replace(/\s+/g, " ").trim();
              if (s) lines.push("[" + mmss(parseFloat(n.getAttribute("start") || "0")) + "] " + s);
            });
          }
          return { ok: true, text: lines.join("\n"), language: pick.languageCode || "", tracks: tracks.length };
        }
      }).then(function (res) {
        return (res && res[0] && res[0].result) || { ok: false, error: "页面脚本未返回结果" };
      });
    });
  }

  window.LL = {
    DEFAULTS: DEFAULTS, PRESETS: PRESETS, SCHEMA_PROMPT: SCHEMA_PROMPT,
    getConfig: getConfig, saveConfig: saveConfig, resetConfig: resetConfig,
    endpoint: endpoint, chat: chat, testConnection: testConnection,
    parseResult: parseResult, toMarkdown: toMarkdown,
    splitText: splitText, markdown: markdown, esc: esc, toText: toText, safeName: safeName,
    timeToSeconds: timeToSeconds, timestampUrl: timestampUrl,
    videoIdOf: videoIdOf, youtubeTranscript: youtubeTranscript
  };
})();
