(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var fields = ["baseUrl", "apiKey", "model", "temperature", "chunkSize", "maxChunks", "prompt"];
  var status = $("status");

  function say(msg, kind) {
    status.textContent = msg || "";
    status.className = "status" + (kind ? " " + kind : "");
  }
  function fill(cfg) {
    fields.forEach(function (k) { $(k).value = cfg[k] == null ? "" : cfg[k]; });
    $("strictJson").checked = !!cfg.strictJson;
  }
  function read() {
    var cfg = {};
    fields.forEach(function (k) {
      var v = $(k).value;
      if (["temperature", "chunkSize", "maxChunks"].indexOf(k) !== -1) v = Number(v);
      cfg[k] = v;
    });
    cfg.baseUrl = String(cfg.baseUrl).trim();
    cfg.model = String(cfg.model).trim();
    cfg.apiKey = String(cfg.apiKey).trim();
    cfg.strictJson = $("strictJson").checked;
    return cfg;
  }
  function validate(cfg) {
    if (!cfg.baseUrl) return "请填 Base URL";
    if (!cfg.model) return "请填模型名";
    if (!/^https?:\/\//.test(cfg.baseUrl)) return "Base URL 需以 http:// 或 https:// 开头";
    return null;
  }

  LL.getConfig().then(fill);

  /* ===== 语音识别：独立存储，改动即存，不会被上面的模型表单覆盖 ===== */
  var ASR = window.BRIEF_ASR;
  var asrText = ["baseUrl", "apiKey"];
  var asrNums = ["pollSeconds", "maxWaitSeconds", "maxAudioMB"];
  var asrStatus = $("asr-status");
  function asrSay(msg, kind) {
    asrStatus.textContent = msg || "";
    asrStatus.className = "status" + (kind ? " " + kind : "");
  }
  function fillAsr(cfg) {
    $("asr-enabled").value = cfg.enabled ? "true" : "false";
    $("asr-model").value = cfg.model;
    asrText.concat(asrNums).forEach(function (k) { $("asr-" + k).value = cfg[k]; });
  }
  function readAsr() {
    var cfg = { enabled: $("asr-enabled").value === "true", model: $("asr-model").value };
    asrText.forEach(function (k) { cfg[k] = String($("asr-" + k).value || "").trim(); });
    asrNums.forEach(function (k) {
      var n = Number($("asr-" + k).value);
      cfg[k] = isFinite(n) && n > 0 ? n : ASR.DEFAULTS[k];
    });
    return cfg;
  }
  function saveAsr() { return ASR.saveConfig(readAsr()); }
  ASR.MODELS.forEach(function (m) {
    var opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    $("asr-model").appendChild(opt);
  });
  ASR.getConfig().then(fillAsr);
  ["asr-enabled", "asr-model", "asr-baseUrl", "asr-apiKey",
    "asr-pollSeconds", "asr-maxWaitSeconds", "asr-maxAudioMB"].forEach(function (id) {
    $(id).addEventListener("change", function () {
      saveAsr().then(function () { asrSay("已自动保存。", "ok"); });
    });
  });
  $("test-asr").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    asrSay("正在测试…");
    saveAsr().then(function () { return ASR.testConnection(readAsr()); })
      .then(function (r) { asrSay(r.message, r.ok ? "ok" : "err"); })
      .catch(function (e) { asrSay("测试失败：" + e.message, "err"); })
      .then(function () { btn.disabled = false; });
  });

  var names = { ollama: "Ollama 本地", deepseek: "DeepSeek", siliconflow: "SiliconFlow", zhipu: "智谱 GLM", openai: "OpenAI" };
  Object.keys(LL.PRESETS).forEach(function (key) {
    var b = document.createElement("button");
    b.textContent = names[key] || key;
    b.addEventListener("click", function () {
      LL.getConfig().then(function (cfg) {
        fill(Object.assign({}, cfg, LL.PRESETS[key]));
        say("已填入 " + b.textContent + " 预设，记得点保存。Key 需要自己填。");
      });
    });
    $("presets").appendChild(b);
  });

  $("save").addEventListener("click", function () {
    var cfg = read();
    var err = validate(cfg);
    if (err) { say(err, "err"); return; }
    LL.saveConfig(cfg).then(function () { return saveAsr(); })
      .then(function () { say("已保存。现在可以去视频页点 Briefly 了。", "ok"); });
  });

  $("reset").addEventListener("click", function () {
    LL.resetConfig().then(function () { fill(LL.DEFAULTS); say("已恢复默认（Ollama 本地）。", "ok"); });
  });

  $("test").addEventListener("click", function () {
    var cfg = read();
    var err = validate(cfg);
    if (err) { say(err, "err"); return; }
    var btn = $("test");
    btn.disabled = true;
    say("正在请求 " + LL.endpoint(cfg.baseUrl) + " ...");
    LL.testConnection(cfg).then(function (text) {
      say("连接成功，模型回复：" + text.slice(0, 120), "ok");
    }).catch(function (e) {
      var hint = "";
      if (/Failed to fetch|NetworkError|Load failed/i.test(String(e.message))) {
        hint = "\n排查：1) 服务是否启动（Ollama 用 ollama serve）；2) 地址端口是否正确；3) 云 API 的 Key 与额度；4) 扩展 host_permissions 是否覆盖该域名。";
      }
      say("连接失败：" + e.message + hint, "err");
    }).then(function () { btn.disabled = false; });
  });

  var HIST_KEY = "brief_local_history";
  var histBox = $("history");
  var histStatus = $("histStatus");

  function histSay(msg, kind) {
    histStatus.textContent = msg || "";
    histStatus.className = "status" + (kind ? " " + kind : "");
  }
  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return "本地内容"; }
  }
  function drawHistory(list) {
    histBox.innerHTML = "";
    if (!list.length) {
      var p = document.createElement("div");
      p.className = "hist-empty";
      p.textContent = "还没有生成记录。去视频页或文章页点一次 Briefly 就会出现在这里。";
      histBox.appendChild(p);
      return;
    }
    list.forEach(function (it) {
      if (!it || !it.pid) return;
      var row = document.createElement("div"); row.className = "hist-item";
      var main = document.createElement("div"); main.className = "hist-main";
      var a = document.createElement("a"); a.className = "hist-link";
      a.textContent = it.title || "未命名";
      a.href = "result.html?publicId=" + encodeURIComponent(it.pid);
      a.target = "_blank";
      var meta = document.createElement("div"); meta.className = "hist-meta";
      meta.textContent = (it.sourceType ? it.sourceType + " · " : "") + host(it.sourceUrl || "")
        + " · " + new Date(it.savedAt || Date.now()).toLocaleString("zh-CN");
      main.appendChild(a); main.appendChild(meta);
      var del = document.createElement("button"); del.className = "hist-del";
      del.textContent = "删除";
      del.addEventListener("click", function () { removeOne(it.pid); });
      row.appendChild(main); row.appendChild(del);
      histBox.appendChild(row);
    });
  }
  function loadHistory() {
    chrome.storage.local.get(null, function (all) {
      var list = Array.isArray(all[HIST_KEY]) ? all[HIST_KEY].slice() : [];
      var known = {};
      list.forEach(function (x) { if (x && x.pid) known[x.pid] = true; });
      // Recover results generated before the history index existed.
      Object.keys(all).forEach(function (k) {
        if (k.indexOf("brief_local_doc_") !== 0) return;
        var pid = k.slice("brief_local_doc_".length);
        if (known[pid]) return;
        var d = all[k] || {}, r = all["brief_local_result_" + pid];
        list.push({
          pid: pid,
          title: (r && r.json && r.json.title_zh) || d.title || "未命名",
          sourceUrl: d.sourceUrl || "", sourceType: d.sourceType || "",
          savedAt: (r && r.savedAt) || d.savedAt || Date.now()
        });
        known[pid] = true;
      });
      list.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
      if (list.length > 80) list.length = 80;
      drawHistory(list);
    });
  }
  function removeOne(pid) {
    chrome.storage.local.get(HIST_KEY, function (d) {
      var list = (Array.isArray(d[HIST_KEY]) ? d[HIST_KEY] : []).filter(function (x) { return x && x.pid !== pid; });
      var o = {}; o[HIST_KEY] = list;
      chrome.storage.local.set(o, function () {
        chrome.storage.local.remove([
          "brief_local_doc_" + pid, "brief_local_result_" + pid,
          ASR.TEXT_PREFIX + pid, ASR.TASK_PREFIX + pid
        ]);
        drawHistory(list);
        histSay("已删除该条记录及对应的原文与结果。", "ok");
      });
    });
  }
  $("clearHistory").addEventListener("click", function () {
    chrome.storage.local.get(null, function (all) {
      var keys = Object.keys(all).filter(function (k) {
        return k === HIST_KEY || k.indexOf("brief_local_doc_") === 0 ||
          k.indexOf("brief_local_result_") === 0 ||
          (k.indexOf(ASR.TEXT_PREFIX) === 0 && k !== ASR.CONFIG_KEY);
      });
      if (!keys.length) { histSay("没有可清空的记录。"); return; }
      chrome.storage.local.remove(keys, function () {
        drawHistory([]);
        histSay("已清空 " + keys.length + " 项，模型设置已保留。", "ok");
      });
    });
  });
  chrome.storage.onChanged.addListener(function (ch, area) {
    if (area === "local" && ch[HIST_KEY]) loadHistory();
  });
  loadHistory();
})();
