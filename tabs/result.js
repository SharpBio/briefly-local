(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var status = $("status"), content = $("content"), toc = $("toc"), heroSlot = $("heroSlot");
  var pid = new URLSearchParams(location.search).get("publicId");
  var docKey = pid ? "brief_local_doc_" + pid : null;
  var resKey = pid ? "brief_local_result_" + pid : null;
  var HISTORY_KEY = "brief_local_history";
  var doc = null, rawText = "", result = null, lastMd = "", controller = null, busy = false;

  var OPT_TITLES = {
    three_takeaway: "核心认知", key_numbers: "关键数字", timeline: "时间线",
    before_after: "前后对比", books: "推荐书单", fun_facts: "延伸趣闻",
    story: "全片锐评", predictions: "趋势预判", advice: "照做就能救回来", sharp_review: "全片锐评"
  };
  var CHUNK_PROMPT = "你是资料整理员。从下面这段素材里提取可用于撰写精华版的要点：关键论点、具体数字、专名、值得引用的原句（保留原语言并注明时间戳）、以及生词术语。用中文短句列点，原句要原样抄录，不要评论素材之外的内容，不要写套话。";

  /* ===== 生成进度层状态机 =====
     流程：采集 -> 打开结果页 -> 等待素材与模型输出 -> 完成后渲染。
     等待期间显示进度卡片与骨架屏，完成后淡出。 */
  var LOADING_SUB = "正在准备内容，请稍候";
  var loading = {
    overlay: $("loadingOverlay"), placeholder: $("loadingPlaceholder"),
    shell: document.querySelector(".app-shell"),
    main: $("loadingMain"), dots: $("loadingDots"), sub: $("loadingSub"),
    source: $("loadingSource"), sourceIcon: $("loadingSourceIcon"),
    sourceTitle: $("loadingSourceTitle"), sourceDur: $("loadingSourceDuration"),
    progress: $("loadingProgress"), bar: $("loadingProgressBar"), label: $("loadingProgressLabel"),
    notify: $("notifyBtn")
  };
  var prog = { cur: 0, target: 8, finished: false, failed: false, subscribed: false };
  var progTimer = null, dotsTimer = null, dotCount = 2;

  function setProgressTarget(v) {
    if (prog.finished || prog.failed) return;
    prog.target = Math.max(prog.target, Math.min(96, v));
  }
  function paintProgress() {
    if (!loading.bar) return;
    loading.bar.style.width = prog.cur.toFixed(2) + "%";
    loading.label.textContent = Math.round(prog.cur) + "%";
    loading.progress.setAttribute("aria-valuenow", String(Math.round(prog.cur)));
  }
  function tickProgress() {
    if (prog.finished || prog.failed) return;
    if (prog.target < 94) prog.target = Math.min(94, prog.target + 0.28);
    prog.cur += (prog.target - prog.cur) * 0.11;
    if (prog.target - prog.cur < 0.2) prog.cur = prog.target;
    paintProgress();
  }
  function startLoading() {
    if (!loading.overlay || progTimer) return;
    progTimer = setInterval(tickProgress, 120);
    dotsTimer = setInterval(function () {
      dotCount = dotCount % 3 + 1;
      loading.dots.textContent = new Array(dotCount + 1).join(".");
    }, 420);
    paintProgress();
  }
  function fillSource(d) {
    if (!d || !loading.sourceTitle) return;
    var title = d.title || document.title || "未命名内容";
    loading.sourceTitle.textContent = title;
    loading.source.setAttribute("title", title);
    var secs = Number(d.durationSeconds || d.duration || 0);
    if (!secs && d.meta && d.meta.duration) secs = Number(d.meta.duration) || 0;
    if (secs > 0) {
      var ss = Math.floor(secs % 60), mm = Math.floor(secs / 60) % 60, hh = Math.floor(secs / 3600);
      loading.sourceDur.textContent = [hh, mm, ss].map(function (n) { return String(n).padStart(2, "0"); }).join(":");
    } else loading.sourceDur.textContent = "";
    var st = String(d.sourceType || "").toLowerCase();
    loading.sourceIcon.src = st.indexOf("youtube") >= 0 ? "../youtube.svg"
      : st.indexOf("bili") >= 0 ? "../bili.svg" : "../bili.svg";
  }
  function finishLoading() {
    if (prog.finished || !loading.overlay) return;
    prog.finished = true;
    clearInterval(progTimer); progTimer = null;
    clearInterval(dotsTimer); dotsTimer = null;
    prog.cur = 100; prog.target = 100; paintProgress();
      setTimeout(function () {
        loading.overlay.classList.add("is-leaving");
        if (loading.shell) loading.shell.classList.remove("brief-is-loading");
        if (loading.placeholder) loading.placeholder.remove();
      }, 320);
  }
  function restartLoading() {
    if (!loading.overlay) return;
    prog.cur = 0; prog.target = 8; prog.finished = false; prog.failed = false;
    progTimer = null; dotsTimer = null;
    loading.overlay.classList.remove("is-leaving");
    if (loading.shell) loading.shell.classList.add("brief-is-loading");
    if (loading.main) {
      loading.main.classList.remove("is-error");
      loading.main.innerHTML = '正在生成精华版<span class="brief-loading-dots" id="loadingDots">..</span>';
      loading.dots = $("loadingDots");
    }
    if (loading.sub) { loading.sub.classList.remove("is-error"); loading.sub.textContent = LOADING_SUB; }
    if (loading.notify) {
      loading.notify.textContent = prog.subscribed ? "已订阅 · 完成后提醒你" : "生成完成后提醒我";
      loading.notify.disabled = prog.subscribed;
    }
    startLoading();
  }
  function failLoading(msg) {
    if (prog.finished || prog.failed || !loading.overlay) return;
    prog.failed = true;
    clearInterval(progTimer); progTimer = null;
    clearInterval(dotsTimer); dotsTimer = null;
    loading.main.classList.add("is-error");
    loading.main.textContent = "这份精华版没生成出来";
    loading.sub.classList.add("is-error");
    loading.sub.textContent = msg || LOADING_SUB;
    loading.notify.textContent = "重新加载";
    loading.notify.disabled = false;
  }
  function notifyDone(title) {
    if (!prog.subscribed) return;
    try {
      var p = chrome.runtime.sendMessage({
        type: "show-brief-result-notification",
        data: { title: "精华版已生成", message: title || "点开查看这份精华版", resultUrl: location.href }
      });
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  if (loading.notify) {
    loading.notify.addEventListener("click", function () {
      if (prog.subscribed || prog.failed) return;
      prog.subscribed = true;
      loading.notify.textContent = "已订阅 · 完成后提醒你";
      loading.notify.disabled = true;
    });
    loading.notify.addEventListener("click", function () {
      if (prog.failed) location.reload();
    });
  }

  function say(msg, kind) {
    status.textContent = msg || "";
    status.style.color = kind === "err" ? "#B42318" : kind === "ok" ? "#047857" : "";
    if (loading.sub && !prog.finished && !prog.failed) loading.sub.textContent = msg || LOADING_SUB;
  }
  function setBusy(v) {
    busy = v;
    ["regen", "copy", "download", "saveHtml", "print"].forEach(function (k) { $(k).disabled = v; });
  }

  /* ===== 打开原视频 =====
     主操作按钮沿用 .top-btn.primary 胶囊样式，href 取自采集结果中的 sourceUrl。 */
  function isVideoDoc(d) {
    var st = String((d && d.sourceType) || "").toLowerCase();
    return st === "youtube" || st === "bilibili" ||
      /^https?:\/\/(?:[a-z0-9-]+\.)?(?:youtube\.com\/watch|youtu\.be\/|bilibili\.com\/video|bilibili\.com\/bangumi)/i.test(String((d && d.sourceUrl) || ""));
  }
  function normalizeSourceUrl(u) {
    try {
      var x = new URL(u);
      x.hash = "";
      // 分享链接常带 spm/vd_source 等追踪参数，原标签页通常没有
      ["briefWelcome", "spm_id_from", "vd_source", "share_source", "from_source", "time_continue"].forEach(function (k) { x.searchParams.delete(k); });
      return x.origin + x.pathname + x.search;
    } catch (e) { return String(u || "").split("#")[0]; }
  }
  function setupSourceLink(d) {
    var a = $("openSource"), label = $("openSourceLabel");
    if (!a) return;
    var url = String((d && (d.sourceUrl || d.url || d.tabUrl)) || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      a.style.display = "none";
      // 极老的缓存结果可能没存 sourceUrl，从生成历史里补一次
      if (pid) chrome.storage.local.get(HISTORY_KEY, function (saved) {
        var list = saved && saved[HISTORY_KEY];
        var hit = (Array.isArray(list) ? list : []).filter(function (x) { return x && x.pid === pid; })[0];
        if (hit && hit.sourceUrl) setupSourceLink({ sourceUrl: hit.sourceUrl, sourceType: hit.sourceType });
      });
      return;
    }
    a.href = url;
    a.title = (isVideoDoc(d) ? "打开原视频：" : "打开原文：") + url;
    if (label) label.textContent = isVideoDoc(d) ? "打开原视频" : "打开原文";
    a.style.display = "";
  }
  (function () {
    var a = $("openSource");
    if (!a) return;
    a.addEventListener("click", function (ev) {
      var url = a.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(url)) { ev.preventDefault(); return; }
      if (!(chrome.tabs && chrome.tabs.query)) return; // 让 <a> 原生新开标签
      ev.preventDefault();
      var key = normalizeSourceUrl(url);
      try {
        chrome.tabs.query({}, function (tabs) {
          var hit = (tabs || []).filter(function (t) { return t.url && normalizeSourceUrl(t.url) === key; })[0];
          if (hit && hit.id != null) {
            chrome.tabs.update(hit.id, { active: true }, function () {
              if (chrome.runtime.lastError) chrome.tabs.create({ url: url, active: true });
            });
          } else chrome.tabs.create({ url: url, active: true });
        });
      } catch (e) { chrome.tabs.create({ url: url, active: true }); }
    });
  })();

  function pad2(n) { return String(n).padStart(2, "0"); }
  function isEN(r) { return (r.meta && r.meta.source_language) === "en"; }

  function tsLink(time) {
    if (!time) return "";
    var url = LL.timestampUrl(doc && doc.sourceUrl, doc && doc.sourceType, time);
    return '<a class="ts-badge ts-badge-link" href="' + LL.esc(url) + '" target="_blank" rel="noopener">' + LL.esc(time) + "</a>";
  }
  function annotate(text, notes) {
    var t = LL.esc(text);
    (notes || []).forEach(function (n) {
      var k = LL.esc(String(n.keyword || "").trim());
      if (!k) return;
      var i = t.toLowerCase().indexOf(k.toLowerCase());
      if (i >= 0) t = t.slice(0, i) + '<span class="ann">' + t.slice(i, i + k.length) + "</span>" + t.slice(i + k.length);
    });
    return t;
  }
  function quoteHtml(q, en) {
    var notes = q.annotations || [];
    return '<div class="quote-with-notes' + (notes.length ? " has-notes" : "") + '">' +
      '<div class="quote-body">' +
      (q.original_text ? '<div class="' + (en ? "quote-en" : "quote-zh-primary") + '">' + annotate(q.original_text, notes) + "</div>" : "") +
      (q.zh_translation ? '<div class="quote-zh-secondary">' + LL.esc(q.zh_translation) + "</div>" : "") +
      (q.timestamp_start ? "<div>" + tsLink(q.timestamp_start) + "</div>" : "") +
      "</div>" +
      (notes.length ? '<div class="quote-notes">' + notes.map(function (n, i) {
        return '<div class="note-item"><span class="note-n">' + pad2(i + 1) + '</span><div class="note-body"><em>' +
          LL.esc(n.keyword) + '</em><span class="note-sep">—</span><span class="note-exp">' + LL.esc(n.explanation) + "</span></div></div>";
      }).join("") + "</div>" : "") +
      "</div>";
  }

  function chip(label, value) {
    return '<span class="meta-chip"><strong>' + LL.esc(label) + "</strong>" + LL.esc(value) + "</span>";
  }
  function heroHtml(r, extra) {
    var meta = r.meta || {}, chips = [];
    if (meta.duration) chips.push(chip("时长", meta.duration));
    if (doc && doc.publishedAt) chips.push(chip("发布", String(doc.publishedAt).slice(0, 10)));
    var src = doc && (doc.author || doc.publisher);
    if (!src && doc && doc.sourceUrl) { try { src = new URL(doc.sourceUrl).hostname; } catch (e) { src = ""; } }
    if (src) chips.push(chip("来源", src));
    if (rawText) chips.push(chip("逐字稿", rawText.length.toLocaleString() + " 字符"));
    (extra || []).forEach(function (x) { chips.push(chip("生成", x)); });
    var topics = (r.main_structure || []).map(function (s) { return s.title || s.section_title || ""; })
      .filter(Boolean).slice(0, 6);
    var cover = doc && doc.coverUrl
      ? '<div class="hero-cover"><img class="hero-cover-img" src="' + LL.esc(doc.coverUrl) + '" alt=""></div>' : "";
    return '<section class="hero" id="hero">' +
      '<div class="hero-bg-pattern"></div>' +
      '<div class="hero-row"><div class="hero-text">' +
        '<h1 class="hero-title">' + LL.esc(r.title_zh || (doc && doc.title) || "提炼结果") + "</h1>" +
        (r.one_liner ? '<p class="hero-subtitle">' + LL.esc(r.one_liner) + "</p>" : "") +
        '<div class="hero-meta">' + chips.join("") + "</div>" +
      "</div>" + cover + "</div>" +
      (topics.length ? '<div class="topics-block"><span class="topics-label">内容主题</span>' +
        '<div class="progress-bar">' + topics.map(function (t) {
          return '<div class="topic-seg" style="flex:1"><span class="topic-label">' + LL.esc(t) + "</span></div>";
        }).join("") + "</div></div>" : "") +
      "</section>";
  }
  function spotlightHtml(r) {
    var cq = r.core_quote || {};
    if (!cq.original_text && !cq.zh_translation) return "";
    var main = cq.zh_translation || cq.original_text;
    var orig = cq.zh_translation && cq.original_text && cq.original_text !== cq.zh_translation
      ? '<p class="cq-orig">' + LL.esc(cq.original_text) + "</p>" : "";
    var author = (doc && (doc.author || doc.publisher)) || "";
    return '<section class="module spotlight" id="core-quote">' +
      '<span class="spotlight-mark spotlight-mark-open">“</span>' +
      "<blockquote><p class=\"cq-main\">" + LL.esc(main) + "</p>" + orig +
      (author ? "<footer>— " + LL.esc(author) + "</footer>" : "") +
      "</blockquote><span class=\"spotlight-mark spotlight-mark-close\">”</span></section>";
  }

  function highlightsHtml(r) {
    if (!r.main_structure.length) return "";
    var en = isEN(r);
    var cards = r.main_structure.map(function (s, i) {
      var title = s.title || s.section_title || "";
      var summary = s.summary || s.section_thesis || "";
      var time = s.timestamp_estimate || s.coverage_start ||
        ((s.quotes || []).filter(function (q) { return q.timestamp_start; })[0] || {}).timestamp_start || "";
      return '<section class="section section-card" id="section-' + LL.esc(s.id || i) + '">' +
        '<div class="section-number">' + pad2(i + 1) + "</div>" +
        '<div class="section-header"><h2>' + LL.esc(title) + "</h2>" + tsLink(time) + "</div>" +
        (summary ? '<p class="section-intro">' + LL.esc(summary) + "</p>" : "") +
        '<div class="quotes-stack">' + (s.quotes || []).map(function (q) { return quoteHtml(q, en); }).join("") + "</div>" +
        "</section>";
    }).join("");
    return '<section class="module highlights" id="highlights"><h2 class="highlights-title">本片亮点</h2>' +
      '<div class="highlights-grid">' + cards + "</div></section>";
  }

  function genericItems(items) {
    return '<ul class="generic-list">' + (items || []).map(function (x) {
      return "<li>" + LL.esc(typeof x === "string" ? x : (x.text || x.content || x.title || JSON.stringify(x))) + "</li>";
    }).join("") + "</ul>";
  }
  var OPT_CLASS = {
    three_takeaway: "opt-takeaway", key_numbers: "opt-numbers", advice: "opt-advice",
    sharp_review: "sharp-review", story: "sharp-review"
  };
  function optionalHtml(o) {
    var d = o.data || {}, items = d.items || [];
    var cls = OPT_CLASS[o.key] || ("opt-" + o.key);
    var title = LL.esc(d.title || OPT_TITLES[o.key] || o.key);
    var body = "";
    if (o.key === "three_takeaway") {
      body = '<div class="takeaway-list">' + items.map(function (x, k) {
        return '<article class="tkw-card"><span class="tkw-bar"></span><div class="tkw-num"><span>' + pad2(k + 1) +
          '</span></div><p class="tkw-text">' + LL.esc(typeof x === "string" ? x : (x.text || x.content || "")) + "</p></article>";
      }).join("") + "</div>";
    } else if (o.key === "key_numbers") {
      body = '<div class="stats-grid">' + items.map(function (x) {
        return '<article class="stat-card"><div class="stat-number">' + LL.esc(x.number) +
          '</div><div class="stat-desc">' + LL.esc(x.caption || x.desc || "") + '</div><div class="stat-accent"></div></article>';
      }).join("") + "</div>";
    } else if (o.key === "advice" || o.key === "predictions") {
      body = '<div class="action-steps">' + (items.length ? items : (d.steps || [])).map(function (x, k) {
        var t = typeof x === "string" ? x : (x.text || x.content || x.step || "");
        return '<div class="action-item"><span class="action-num">' + pad2(k + 1) + "</span><span>" + LL.esc(t) + "</span></div>";
      }).join("") + "</div>";
    } else if (o.key === "timeline") {
      body = '<div class="tl-flow">' + items.map(function (x) {
        return '<article class="tl-node"><div class="tl-marker"><span class="tl-dot"></span><span class="tl-connector"></span></div>' +
          '<div class="tl-content"><span class="tl-time">' + LL.esc(x.time) + '</span><span class="tl-text">' + LL.esc(x.content) + "</span></div></article>";
      }).join("") + "</div>";
    } else if (o.key === "before_after") {
      body = (d.pairs || []).map(function (x) {
        return '<div class="ba-row"><span class="ba-cell before">' + LL.esc(x.before) + '</span><span class="ba-arrow-sm">→</span><span class="ba-cell after">' + LL.esc(x.after) + "</span></div>";
      }).join("");
    } else if (o.key === "books") {
      body = '<div class="book-shelf">' + items.map(function (x, k) {
        return '<article class="book-card"><div class="book-eyebrow">NO.' + pad2(k + 1) + '</div><div class="book-title">' + LL.esc(x.title) +
          '</div><div class="book-author">' + LL.esc(x.author || "") + '</div><div class="book-reason">' + LL.esc(x.reason || "") + "</div></article>";
      }).join("") + "</div>";
    } else if (o.key === "story" || o.key === "sharp_review") {
      var st = d.text || d.story || d.content || (items[0] && (items[0].text || items[0])) || "";
      body = '<p class="story-text">' + LL.esc(st) + "</p>";
    } else {
      body = genericItems(items.length ? items : (d.points || d.list || []));
      if (body === '<ul class="generic-list"></ul>' && typeof d === "object") {
        body = genericItems(Object.keys(d).map(function (k) { return k + "：" + d[k]; }));
      }
    }
    if (!body || body === '<ul class="generic-list"></ul>') return "";
    var deco = o.key === "key_numbers" ? '<span class="kn-deco"></span>'
      : (o.key === "advice" ? '<span class="ad-deco"></span>' : "");
    return '<section class="module module-card ' + cls + '" id="' + LL.esc(o._id || ("opt-" + o.key)) + '">' +
      '<div class="card-header"><h2 class="opt-title">' + title + deco + "</h2></div>" + body + "</section>";
  }

  function transcriptHtml() {
    if (!rawText) return "";
    return '<section class="transcript-section module" id="module-transcript">' +
      '<div class="transcript-section-header"><div>' +
      '<h2 class="transcript-title">完整逐字稿</h2>' +
      '<p class="transcript-subtitle">共约 ' + rawText.length.toLocaleString() + ' 字符 · 可搜索关键词</p>' +
      "</div></div>" +
      '<div class="transcript-toolbar no-pdf-export">' +
      '<label class="transcript-search" for="tsSearch"><input id="tsSearch" type="text" placeholder="输入关键词搜索逐字稿…"></label>' +
      '<div class="transcript-actions"><button type="button" class="top-btn ghost" id="tsClear">清除</button>' +
      '<button type="button" class="top-btn primary" id="tsDownload">下载逐字稿</button></div></div>' +
      '<div class="transcript-body"><pre id="tsBody"></pre></div>' +
      '<p class="transcript-subtitle" id="tsCount"></p></section>';
  }

  function buildToc(r, head, tail) {
    var n = 0, rows = [];
    function add(href, label, kind) { rows.push({ href: href, label: label, num: pad2(++n), kind: kind || "" }); }
    add("#hero", "概览");
    if ((r.core_quote || {}).original_text || (r.core_quote || {}).zh_translation) add("#core-quote", "最佳金句");
    head.forEach(function (o) { add("#" + o._id, (o.data && o.data.title) || OPT_TITLES[o.key] || o.key); });
    if (r.main_structure.length) {
      var h = { href: "#highlights", label: "本片亮点", num: pad2(++n), kind: "group", children: [] };
      r.main_structure.forEach(function (s, i) {
        h.children.push({ href: "#section-" + (s.id || i), label: pad2(i + 1) + " · " + (s.title || s.section_title || "第 " + (i + 1) + " 段") });
      });
      rows.push(h);
    }
    tail.forEach(function (o) { add("#" + o._id, (o.data && o.data.title) || OPT_TITLES[o.key] || o.key); });
    if (rawText) add("#module-transcript", "完整逐字稿", "transcript");
    toc.innerHTML = rows.map(function (x) {
      var inner = x.kind === "transcript"
        ? '<span class="toc-transcript-icon" aria-hidden="true"><span></span><span></span><span></span></span>'
        : '<span class="toc-num">' + x.num + "</span>";
      var link = '<div class="toc-item-wrap"><a class="toc-link ' + (x.kind === "transcript" ? "toc-link-transcript " : "") +
        (x.kind === "group" ? "toc-link-group" : "") + '" href="' + LL.esc(x.href) + '">' + inner +
        '<span class="toc-label">' + LL.esc(x.label) + "</span></a>";
      if (x.children) {
        link += '<div class="toc-children">' + x.children.map(function (c) {
          return '<a class="toc-child" href="' + LL.esc(c.href) + '">' + LL.esc(c.label) + "</a>";
        }).join("") + "</div>";
      }
      return link + "</div>";
    }).join("");
    var links = Array.prototype.slice.call(toc.querySelectorAll(".toc-link"));
    var tick = false;
    function update() {
      var best = links[0], top = 140;
      links.forEach(function (a) {
        var el = document.getElementById(String(a.getAttribute("href")).slice(1));
        if (el && el.getBoundingClientRect().top <= top) best = a;
      });
      links.forEach(function (a) { a.classList.toggle("active", a === best); });
      tick = false;
    }
    window.addEventListener("scroll", function () {
      if (!tick) { tick = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function bindTranscript() {
    var box = $("tsBody"), search = $("tsSearch");
    if (!box) return;
    function draw() {
      var q = String(search.value || "").trim();
      var lines = rawText.split(/\r?\n/);
      var shown = q ? lines.filter(function (l) { return l.toLowerCase().indexOf(q.toLowerCase()) !== -1; }) : lines;
      $("tsCount").textContent = q ? "匹配 " + shown.length + " 行" : "共 " + lines.length + " 行";
      box.innerHTML = shown.map(function (l) {
        var t = LL.esc(l);
        if (q) {
          var i = t.toLowerCase().indexOf(LL.esc(q).toLowerCase());
          if (i >= 0) t = t.slice(0, i) + "<mark>" + t.slice(i, i + q.length) + "</mark>" + t.slice(i + q.length);
        }
        return t;
      }).join("\n");
    }
    search.addEventListener("input", draw);
    var clear = $("tsClear");
    if (clear) clear.addEventListener("click", function () { search.value = ""; draw(); });
    draw();
    $("tsDownload").addEventListener("click", function () {
      download("text/plain;charset=utf-8", ".txt", rawText);
    });
  }

  function renderResult(r, extra) {
    result = r;
    lastMd = LL.toMarkdown(r, rawText);
    document.title = (r.title_zh || "Briefly") + " · Briefly Local 精华版";
    heroSlot.innerHTML = heroHtml(r, extra);
    (r.optionals || []).forEach(function (o, i) { o._id = "opt-" + (o.key || "x") + "-" + i; });
    var isHead = function (o) { return o.key === "three_takeaway" || o.key === "key_numbers"; };
    var head = r.optionals.filter(isHead), tail = r.optionals.filter(function (o) { return !isHead(o); });
    content.innerHTML = spotlightHtml(r) + head.map(optionalHtml).join("") +
      highlightsHtml(r) + tail.map(optionalHtml).join("") + transcriptHtml();
    buildToc(r, head, tail);
    bindTranscript();
    if (r.degraded) say("模型没按 JSON 输出，已降级展示原文。建议换更强模型或开启 JSON 模式。", "err");
  }

  function download(type, ext, text) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = LL.safeName((result && result.title_zh) || (doc && doc.title)) + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function material(d, text, note) {
    return ["【标题】" + (d.title || "未提供"), "【来源】" + (d.sourceUrl || "未提供"),
      "【类型】" + (d.sourceType || "未提供"), "【素材说明】" + note, "",
      "----- 素材开始 -----", text, "----- 素材结束 -----"].join("\n");
  }
  function friendlyError(e) {
    var m = String(e && e.message || e);
    if (/abort|AbortError/i.test(m)) return "已取消。";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) {
      return "连不上模型服务：" + m + " · 检查服务是否启动 / 地址 / Key / 模型名";
    }
    return m;
  }

  function generate() {
    if (busy || !doc) return;
    LL.getConfig().then(function (cfg) {
      if (!cfg.baseUrl || !cfg.model) { say("还没配置模型，请点「模型设置」。", "err"); return null; }
      if (controller) controller.abort();
      controller = new AbortController();
      var signal = controller.signal;
      setBusy(true);
      if (prog.finished) restartLoading();
      setProgressTarget(34);
      var t0 = Date.now();
      var split = LL.splitText(rawText, cfg.chunkSize, cfg.maxChunks);
      var note = split.total > 1
        ? "长稿已切成 " + split.total + " 段" + (split.truncated ? "，本次只处理前 " + split.parts.length + " 段" : "")
        : "完整稿";
      var chain;
      if (split.parts.length <= 1) {
        say("正在生成精华版（" + rawText.length.toLocaleString() + " 字符）…");
        setProgressTarget(86);
        chain = LL.chat([
          { role: "system", content: cfg.prompt },
          { role: "user", content: material(doc, split.parts[0] || rawText, note) }
        ], cfg, signal, !!cfg.strictJson);
      } else {
        chain = Promise.resolve([]);
        split.parts.forEach(function (part, i) {
          chain = chain.then(function (acc) {
            say("正在提炼第 " + (i + 1) + "/" + split.parts.length + " 段…");
            setProgressTarget(34 + 52 * (i + 1) / split.parts.length);
            return LL.chat([
              { role: "system", content: CHUNK_PROMPT },
              { role: "user", content: material(doc, part, "第 " + (i + 1) + "/" + split.parts.length + " 段") }
            ], cfg, signal).then(function (t) { acc.push("【第 " + (i + 1) + " 段要点】\n" + t); return acc; });
          });
        });
        chain = chain.then(function (notes) {
          say("正在汇总成精华版…");
          setProgressTarget(94);
          return LL.chat([
            { role: "system", content: cfg.prompt + "\n\n下面是从长稿分段提炼的要点，请据此输出最终 JSON；不要提及分段、块号或处理过程。金句必须来自要点中抄录的原句。" },
            { role: "user", content: material(doc, notes.join("\n\n"), "分段要点汇总，共 " + split.parts.length + " 段" + (split.truncated ? "（原稿更长，已截断）" : "")) }
          ], cfg, signal, !!cfg.strictJson);
        });
      }
      return chain.then(function (text) {
        var secs = ((Date.now() - t0) / 1000).toFixed(1);
        var parsed = LL.parseResult(text, doc && doc.title);
        renderResult(parsed, ["模型：" + cfg.model, "耗时 " + secs + "s"]);
        finishLoading();
        notifyDone(parsed.title_zh || doc.title);
        say("生成完成，用时 " + secs + " 秒。", "ok");
        var o = {}; o[resKey] = { json: parsed, md: lastMd, savedAt: Date.now() };
        touchHistory(parsed.title_zh || doc.title);
        return chrome.storage.local.set(o);
      }).catch(function (e) {
        var msg = friendlyError(e);
        say(msg, "err");
        failLoading(msg);
      }).then(function () { setBusy(false); });
    });
  }

  $("regen").addEventListener("click", function (ev) {
    /* Shift + 重新生成：清掉识别缓存与任务断点，强制重新识别。
       默认复用缓存，避免重复计费；强制重来会产生一次新的云端费用。 */
    if (!ev.shiftKey || !window.BRIEF_ASR || !pid) { generate(); return; }
    if (busy) return;
    if (!window.confirm("重新识别会重新上传音频，并产生一次新的云端识别费用。确定继续？")) return;
    BRIEF_ASR.clearFor(pid).then(function () {
      rawText = "";
      if (prog.finished) restartLoading();
      setProgressTarget(10);
      say("正在重新获取音频并调用云端语音识别…");
      return ensureText();
    }).then(function (ok) {
      if (!ok) { failLoading(loading.sub.textContent || "重新识别失败。"); return; }
      generate();
    }).catch(function (e) {
      var msg = "重新识别失败：" + (e && e.message ? e.message : e);
      say(msg, "err"); failLoading(msg);
    });
  });
  $("settings").addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/local.html") });
  });
  $("print").addEventListener("click", function () { window.print(); });
  $("copy").addEventListener("click", function () {
    if (!lastMd) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastMd).then(function () { say("已复制精华版 Markdown。", "ok"); },
        function () { say("复制失败，可用「下载 .md」。", "err"); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = lastMd; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); say("已复制精华版 Markdown。", "ok"); }
      catch (e) { say("复制失败，可用「下载 .md」。", "err"); }
      document.body.removeChild(ta);
    }
  });
  $("download").addEventListener("click", function () {
    if (lastMd) download("text/markdown;charset=utf-8", ".md", lastMd);
  });

  $("saveHtml").addEventListener("click", function () {
    if (!doc || !content.innerHTML.trim()) { say("还没有可保存的内容。", "err"); return; }
    fetch(chrome.runtime.getURL("tabs/result-style.css")).then(function (r) { return r.text(); })
      .catch(function () { return ""; }).then(function (rawCss) {
      var css = rawCss.replace(/@font-face\s*\{[^}]*\}/g, "");
      var title = (result && result.title_zh) || doc.title || "Briefly Local 精华版";
      var srcUrl = String(doc.sourceUrl || "");
      var srcSafe = /^https?:\/\//i.test(srcUrl) ? srcUrl : "";
      var srcLink = srcSafe
        ? '<a class="export-source-link" href="' + LL.esc(srcSafe) + '" target="_blank" rel="noreferrer">'
          + (isVideoDoc(doc) ? "打开原视频" : "打开原文") + ' ↗</a>'
          + '<span class="export-source-url">' + LL.esc(srcSafe) + '</span>'
        : "未提供";
      var note = '<div class="export-note"><p><b>Briefly Local · 精华版</b></p><p>来源：' + srcLink
        + '　|　导出时间：' + LL.esc(new Date().toLocaleString("zh-CN")) + '</p></div>';
      var override = '\n.top-bar,.sidebar,.toc,.transcript-toolbar,.top-actions{display:none!important}'
        + '\n.page-grid{display:block!important;gap:0}'
        + '\n.page-shell{max-width:900px;margin:0 auto;padding:28px 24px 60px}'
        + '\n.topic-seg{flex:1}'
        + '\n.transcript-body pre{white-space:pre-wrap;word-break:break-word}'
        + '\n.export-source-link{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:999px;background:linear-gradient(135deg,#1a1a1a,#2a2a2a);color:#fff!important;text-decoration:none;font-size:12px;font-weight:700;vertical-align:middle}'
        + '\n.export-source-url{font-size:11px;color:#6b7280;margin-left:8px;word-break:break-all}'
        + '\n';
      var html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head><meta charset="utf-8">\n'
        + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + '<title>' + LL.esc(title) + '</title>\n<style>\n' + css + override
        + '</style>\n</head>\n<body>\n'
        + '<div class="app-shell result-shell"><div class="result-shell-refined">'
        + '<div class="page-shell result-export-root">' + note
        + '<div id="heroSlot">' + heroSlot.innerHTML + '</div>'
        + '<div class="page-grid"><main class="content">' + content.innerHTML + '</main></div>'
        + '</div></div></div>\n</body>\n</html>';
      download("text/html;charset=utf-8", ".html", html);
      say("已保存为独立 HTML 文件（样式已内嵌，可直接双击打开）。", "ok");
    });
  });

  function waitDoc(key, timeout) {
    return new Promise(function (resolve, reject) {
      var done = false, timer, iv;
      function cleanup() { clearTimeout(timer); clearInterval(iv); chrome.storage.onChanged.removeListener(onChange); }
      function finish(v) { if (done) return; done = true; cleanup(); resolve(v); }
      function fail() { if (done) return; done = true; cleanup(); reject(new Error("等待采集内容超时")); }
      function check() { chrome.storage.local.get(key, function (d) { if (d && d[key]) finish(d[key]); }); }
      function onChange(ch, area) { if (area === "local" && ch[key] && ch[key].newValue) finish(ch[key].newValue); }
      chrome.storage.onChanged.addListener(onChange);
      check();
      iv = setInterval(check, 600);
      timer = setTimeout(fail, timeout || 25000);
    });
  }
  function pickSource(d) {
    var ts = LL.toText(d.transcriptTs), plain = LL.toText(d.articleText);
    return (ts.length > plain.length ? ts : plain) || LL.toText(d.description) || "";
  }
  /* ===== 没有自带字幕时的可选云端语音识别 =====
     顺序：字幕 -> 平台字幕补抓 -> （启用时）音频取流与云端文件转写。 */
  function asrProgress(x) {
    var s = x || {}, stage = s.stage;
    if (stage === "cached") {
      say("沿用上次云端识别的逐字稿…");
    } else if (stage === "download" || stage === "chunks") {
      setProgressTarget(12);
      say(s.total
        ? "正在从原视频页取音频（" + (s.received / 1048576).toFixed(1) + " / " + (s.total / 1048576).toFixed(1) + " MB）…"
        : "正在从原视频页读取音频流…");
    } else if (stage === "audio") {
      setProgressTarget(18);
      say("音频已就绪（" + (s.size / 1048576).toFixed(1) + " MB），准备上传…");
    } else if (stage === "policy" || stage === "upload") {
      setProgressTarget(22); say("正在上传音频到识别服务…");
    } else if (stage === "submit") {
      setProgressTarget(26); say("正在提交识别任务…");
    } else if (stage === "resume") {
      setProgressTarget(26); say("接着等待上次已提交的识别任务…");
    } else if (stage === "submitted") {
      setProgressTarget(28); say("任务已提交，等待云端识别…");
    } else if (stage === "poll") {
      setProgressTarget(30); say("云端识别中… 已等待 " + (s.elapsed || 0) + " 秒");
    } else if (stage === "result" || stage === "done") {
      setProgressTarget(31); say("识别完成，正在整理逐字稿…");
    }
  }

  function ensureText() {
    if (rawText.trim()) return Promise.resolve(true);
    if (!isVideoDoc(doc)) {
      say("采集完成但没有可用文本（网页正文为空）。", "err");
      return Promise.resolve(false);
    }
    if (!window.BRIEF_ASR) {
      say("语音识别模块没加载成功，请刷新结果页或重新加载扩展。", "err");
      return Promise.resolve(false);
    }
    function captions() {
      /* 来源类型字段可能来自不同采集路径，用地址兜底判断，避免误走云端识别。 */
      var src = String((doc && doc.sourceUrl) || "");
      var isYt = (doc && doc.sourceType === "youtube") || /youtube\.com|youtu\.be/.test(src);
      if (!isYt) return Promise.resolve(null);
      say("采集结果没带回字幕，正在从视频页补抓…");
      return LL.youtubeTranscript(doc).then(function (r) { return r || null; },
        function (e) { return { ok: false, error: e.message }; });
    }
    return BRIEF_ASR.getConfig().then(function (asrCfg) {
      return captions().then(function (r) {
        if (r && r.ok && r.text) {
          rawText = r.text;
          say("已补抓 " + rawText.length.toLocaleString() + " 字符字幕（" + (r.language || "auto") + "），开始生成…");
          return true;
        }
        if (!asrCfg.enabled) {
          var detail = r && r.error ? "字幕补抓失败：" + r.error + "。" : "";
          say(detail + "采集完成但没有可用文本（视频可能没有字幕）。可在「模型设置」里启用语音识别。", "err");
          return false;
        }
        say("没有自带字幕，正在调用云端语音识别…");
        setProgressTarget(10);
        return BRIEF_ASR.run(doc, pid, asrCfg, asrProgress).then(function (text) {
          rawText = text;
          say("云端识别完成，得到 " + text.length.toLocaleString() + " 字符逐字稿，开始生成…");
          return true;
        });
      });
    }).catch(function (e) {
      say("语音识别失败：" + (e && e.message ? e.message : e) +
        (e && e.taskId ? "（任务号 " + e.taskId + "，任务可能仍在云端运行）" : ""), "err");
      return false;
    });
  }
  function touchHistory(title) {
    if (!pid || !doc) return;
    chrome.storage.local.get(HISTORY_KEY, function (d) {
      var list = Array.isArray(d[HISTORY_KEY]) ? d[HISTORY_KEY] : [];
      list = list.filter(function (x) { return x && x.pid !== pid; });
      list.unshift({
        pid: pid,
        title: title || doc.title || "未命名",
        sourceUrl: doc.sourceUrl || "",
        sourceType: doc.sourceType || "",
        savedAt: Date.now()
      });
      if (list.length > 80) list.length = 80;
      var o = {}; o[HISTORY_KEY] = list;
      chrome.storage.local.set(o);
    });
  }

  function useDoc(d, cached) {
    doc = d; rawText = pickSource(doc);
    fillSource(doc);
    setupSourceLink(doc);
    touchHistory(doc.title);
    ensureText().then(function (ok) {
      if (!ok) { failLoading(loading.sub.textContent || "采集到的内容里没有可用文本。"); return; }
      if (cached && cached.json) {
        renderResult(cached.json, ["上次生成的结果"]);
        finishLoading();
        say("已显示上次生成的结果，可点「重新生成」。", "ok");
      } else generate();
    });
  }
  function boot() {
    if (!pid) {
      content.innerHTML = '<p class="empty-note">这个页面由扩展自动打开。请到视频页或文章页点扩展图标使用。</p>';
      say("缺少 publicId", "err");
      startLoading();
      failLoading("缺少 publicId，请回到视频页重新点击 Briefly。");
      return;
    }
    chrome.storage.local.get([docKey, resKey], function (saved) {
      if (saved[docKey] && saved[resKey] && saved[resKey].json) finishLoading();
      else startLoading();
      if (saved[docKey]) useDoc(saved[docKey], saved[resKey]);
      else {
        say("正在等待后台采集字幕 / 正文…");
        waitDoc(docKey).then(function (d) { useDoc(d, null); })
          .catch(function (e) {
            var msg = e.message + "。请回到原页面重新点击 Briefly。";
            say(msg, "err");
            failLoading(msg);
          });
      }
    });
  }
  boot();
})();
