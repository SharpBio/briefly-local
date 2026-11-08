/* Briefly Local · 可选云端语音识别
   参考 video-report-agent 的文件转写链路：
   取音频流 -> getPolicy -> OSS 直传 -> 提交异步任务 -> 轮询 -> 结果 URL -> 时间戳逐字稿。
   默认关闭；只在「采集结果没有字幕」且用户启用时才会调用。 */
(function () {
  "use strict";

  var KEY = "brief_local_asr_config";
  var TEXT_PREFIX = "brief_local_asr_";
  var TASK_PREFIX = "brief_local_asr_task_";
  var CHUNK_BYTES = 4 * 1024 * 1024;

  var DEFAULTS = {
    enabled: false,
    baseUrl: "https://dashscope.aliyuncs.com/api/v1",
    model: "paraformer-v2",
    apiKey: "",
    pollSeconds: 5,
    maxWaitSeconds: 1800,
    maxAudioMB: 250
  };

  var MODELS = [
    "paraformer-v2",
    "fun-asr",
    "fun-asr-2025-08-25",
    "fun-asr-2025-11-07",
    "fun-asr-mtl",
    "fun-asr-mtl-2025-08-25"
  ];

  var PARAFORMER_PARAMS = {
    channel_id: [0],
    language_hints: ["zh", "en"],
    timestamp_alignment_enabled: true,
    disfluency_removal_enabled: false
  };
  var FUN_ASR_PARAMS = { channel_id: [0], language_hints: ["zh"] };

  function getConfig() {
    return chrome.storage.local.get(KEY).then(function (d) {
      return Object.assign({}, DEFAULTS, (d && d[KEY]) || {});
    });
  }
  function saveConfig(cfg) {
    var o = {}; o[KEY] = Object.assign({}, DEFAULTS, cfg || {});
    return chrome.storage.local.set(o);
  }
  function resetConfig() { return chrome.storage.local.remove(KEY); }

  function normalizeBase(v) { return String(v || "").trim().replace(/\/+$/, ""); }

  function validate(cfg) {
    cfg = cfg || {};
    var base = normalizeBase(cfg.baseUrl);
    var url;
    try { url = new URL(base); } catch (e) { return "接口地址不是合法 URL"; }
    if (url.username || url.password) return "接口地址不能包含用户名或密码";
    if (url.search || url.hash) return "接口地址不能带查询参数或片段";
    if (url.protocol !== "https:") return "接口地址必须使用 https";
    if (MODELS.indexOf(cfg.model) === -1) return "不支持的文件转写模型：" + cfg.model;
    function num(v, min, max, label) {
      var n = Number(v);
      return (!isFinite(n) || n < min || n > max) ? label + " 需在 " + min + "～" + max + " 之间" : null;
    }
    return num(cfg.pollSeconds, 2, 60, "轮询间隔") ||
      num(cfg.maxWaitSeconds, 60, 3600, "最长等待") ||
      num(cfg.maxAudioMB, 1, 900, "音频大小上限") || null;
  }

  function parameters(model) {
    if (model === "paraformer-v2") return Object.assign({}, PARAFORMER_PARAMS);
    if (MODELS.indexOf(model) !== -1 && model.indexOf("fun-asr") === 0) return Object.assign({}, FUN_ASR_PARAMS);
    return null;
  }

  /* 用一个必然被服务端拒绝的载荷探测密钥；400 类响应说明密钥被接受。 */
  function testConnection(cfg) {
    if (!String(cfg.apiKey || "").trim()) return Promise.reject(new Error("还没有填语音识别 API Key"));
    var err = validate(cfg);
    if (err) return Promise.reject(new Error(err));
    return fetch(normalizeBase(cfg.baseUrl) + "/services/audio/asr/transcription", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + String(cfg.apiKey).trim(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "invalid-probe", input: { file_urls: [] } })
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) {
        return { ok: false, status: r.status, message: "密钥被拒绝（HTTP " + r.status + "），请检查 API Key" };
      }
      return { ok: true, status: r.status, message: "密钥已接受（HTTP " + r.status + "）" };
    }, function (e) {
      throw new Error("连不上语音识别服务：" + (e && e.message ? e.message : "Failed to fetch") +
        "。检查网络、接口地址和扩展主机权限。");
    });
  }

  /* ---------------- 云端文件转写 ---------------- */

  function asrError(stage, msg, extra) {
    var e = new Error(msg);
    e.stage = stage;
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    return e;
  }
  function redact(s) {
    return String(s || "").slice(0, 240)
      .replace(/(?:https?:\/\/|oss:\/\/)[^\s"'<>]+/g, "[地址已省略]")
      .replace(/\b(?:sk-[\w-]+|Bearer\s+\S+)/g, "[密钥已省略]");
  }
  function providerCode(body) {
    var c = body && body.code;
    return (typeof c === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,100}$/.test(c) && c.indexOf("sk-") !== 0) ? c : "";
  }
  function request(url, init, stage, taskId) {
    return fetch(url, init).then(function (r) { return { r: r, stage: stage, taskId: taskId }; },
      function (e) {
        throw asrError(stage, "语音识别请求失败（" + stage + "）：" + redact(e && e.message) +
          "。检查网络与接口地址。", { taskId: taskId });
      });
  }
  function needOk(ctx) {
    if (ctx.r.ok) return ctx;
    return ctx.r.clone().json().catch(function () { return {}; }).then(function (body) {
      var code = providerCode(body);
      throw asrError(ctx.stage, "语音识别失败（" + ctx.stage + "）：HTTP " + ctx.r.status +
        (code ? " / " + code : ""), { taskId: ctx.taskId, httpStatus: ctx.r.status, providerCode: code });
    });
  }

  function getPolicy(cfg) {
    var url = new URL(normalizeBase(cfg.baseUrl) + "/uploads");
    url.searchParams.set("action", "getPolicy");
    url.searchParams.set("model", cfg.model);
    return request(url.toString(), {
      method: "GET",
      headers: { "Authorization": "Bearer " + String(cfg.apiKey).trim() }
    }, "获取上传凭证", null).then(needOk).then(function (ctx) {
      return ctx.r.json().then(function (body) {
        var p = body && body.data;
        if (!p || !p.upload_host || !p.upload_dir) {
          throw asrError("获取上传凭证", "上传凭证不完整（缺少 upload_host / upload_dir）");
        }
        if (p.upload_host.indexOf("https://") !== 0) {
          throw asrError("获取上传凭证", "上传地址不是 https，浏览器会拦截混合内容，请更换接口地址。");
        }
        return p;
      });
    });
  }

  /* OSS 表单字段顺序是硬性要求：file 必须最后，签名只覆盖它之前的字段。 */
  function uploadToOss(policy, blob, filename) {
    ["oss_access_key_id", "signature", "policy", "x_oss_object_acl", "x_oss_forbid_overwrite"]
      .forEach(function (k) {
        if (policy[k] == null) throw asrError("上传音频", "上传凭证缺少字段 " + k);
      });
    var form = new FormData();
    form.append("OSSAccessKeyId", policy.oss_access_key_id);
    form.append("Signature", policy.signature);
    form.append("policy", policy.policy);
    form.append("x-oss-object-acl", policy.x_oss_object_acl);
    form.append("x-oss-forbid-overwrite", policy.x_oss_forbid_overwrite);
    form.append("key", policy.upload_dir + "/" + filename);
    form.append("success_action_status", "200");
    form.append("file", blob, filename);
    return fetch(policy.upload_host, { method: "POST", body: form }).then(function (r) {
      if (r.ok) return policy.upload_dir + "/" + filename;
      return r.text().catch(function () { return ""; }).then(function (t) {
        throw asrError("上传音频", "音频上传失败（HTTP " + r.status + "）。" + redact(t));
      });
    }, function (e) {
      throw asrError("上传音频", "连不上音频上传地址：" + redact(e && e.message));
    });
  }

  function submitTask(cfg, objectKey, params) {
    var url = normalizeBase(cfg.baseUrl) + "/services/audio/asr/transcription";
    var body = {
      model: cfg.model,
      input: { file_urls: ["oss://" + objectKey] },
      parameters: params
    };
    return fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + String(cfg.apiKey).trim(),
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
        "X-DashScope-OssResourceResolve": "enable"
      },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        var taskId = data && data.output && data.output.task_id;
        if (!r.ok) {
          var code = providerCode(data);
          throw asrError("提交任务", "提交识别任务失败：HTTP " + r.status + (code ? " / " + code : ""));
        }
        /* 5xx 且没拿到 task_id 时状态未知，绝不自动重提（可能重复计费）。 */
        if (!taskId) {
          throw asrError("提交任务", r.status >= 500
            ? "任务可能已提交但没返回任务号，未自动重提；请稍后在控制台查看任务。"
            : "提交成功但没有返回任务号（HTTP " + r.status + "）");
        }
        return taskId;
      });
    }, function (e) {
      if (e && e.stage) throw e;
      /* 网络中断时任务可能已经建立，同样不自动重提。 */
      throw asrError("提交任务", "提交请求没发出去（" + redact(e && e.message) + "），未自动重提，避免重复计费。");
    });
  }

  function pollTask(cfg, taskId, onProgress) {
    var url = normalizeBase(cfg.baseUrl) + "/tasks/" + encodeURIComponent(taskId);
    var started = Date.now();
    var maxMs = Number(cfg.maxWaitSeconds) * 1000;
    function once() {
      return request(url, {
        method: "GET",
        headers: { "Authorization": "Bearer " + String(cfg.apiKey).trim() }
      }, "等待识别", taskId).then(needOk).then(function (ctx) {
        return ctx.r.json().then(function (body) {
          var out = body && body.output || {};
          var state = out.task_status;
          if (state === "SUCCEEDED") return body;
          if (state !== "PENDING" && state !== "RUNNING") {
            throw asrError("等待识别", "识别任务未成功：" + state, { taskId: taskId, providerCode: state });
          }
          var elapsed = Date.now() - started;
          if (elapsed >= maxMs) {
            throw asrError("等待识别", "识别超时（" + cfg.maxWaitSeconds + " 秒）；任务可能仍在云端运行，任务号 " + taskId, { taskId: taskId });
          }
          if (onProgress) onProgress({ stage: "poll", taskId: taskId, elapsed: Math.round(elapsed / 1000), status: state });
          var wait = Math.min(Number(cfg.pollSeconds) * 1000, maxMs - elapsed);
          return new Promise(function (resolve) { setTimeout(resolve, Math.max(200, wait)); }).then(once);
        });
      });
    }
    return once();
  }

  function fetchResult(completed, taskId) {
    var out = completed && completed.output || {};
    var first = (out.results || [])[0];
    if (!first || !first.transcription_url) throw asrError("读取结果", "识别结果里没有结果地址", { taskId: taskId });
    if (first.subtask_status && first.subtask_status !== "SUCCEEDED") {
      throw asrError("读取结果", "识别子任务未成功：" + first.subtask_status, { taskId: taskId });
    }
    /* 结果地址不需要带密钥，也不能带，避免把凭证发给第三方存储域。 */
    return request(first.transcription_url, { method: "GET" }, "读取结果", taskId)
      .then(needOk).then(function (ctx) { return ctx.r.json(); })
      .then(function (payload) {
        var list = payload && payload.transcripts || [];
        var track = list.filter(function (x) { return x && x.channel_id === 0; })[0] || list[0];
        if (!track) throw asrError("读取结果", "识别结果中没有可用的转写", { taskId: taskId });
        var rows = (track.sentences || []).map(function (s) {
          return {
            start: Number(s.begin_time || 0) / 1000,
            end: Number(s.end_time || 0) / 1000,
            text: String(s.text || "")
          };
        });
        return { rows: rows, durationMs: track.content_duration_in_milliseconds || 0 };
      });
  }

  /* ---------------- 在原视频页里取音频 ----------------
     注入页面的函数只带函数体，不能引用本模块任何变量，常量一律用 args 传。 */

  async function readStreamsInPage() {
    var urls = [];
    var problems = [];
    function push(u) {
      if (!u || typeof u !== "string") return;
      if (u.indexOf("http://") === 0) u = "https://" + u.slice(7);
      if (u.indexOf("https://") !== 0) return;
      if (urls.indexOf(u) === -1) urls.push(u);
    }
    var href = window.location.href;
    var platform = /bilibili\.com/.test(href) ? "bilibili"
      : /youtube\.com|youtu\.be/.test(href) ? "youtube" : "web";
    try {
      var info = window.__playinfo__;
      var data = info && (info.data || info);
      if (data && data.dash && data.dash.audio) {
        var audio = data.dash.audio.slice().sort(function (a, b) {
          return (Number(b.bandwidth) || 0) - (Number(a.bandwidth) || 0);
        });
        audio.forEach(function (t) {
          push(t.baseUrl || t.base_url);
          (t.backup_url || []).forEach(push);
        });
      }
      if (data && data.durl) {
        data.durl.forEach(function (t) {
          push(t.url);
          (t.backup_url || []).forEach(push);
        });
      }
    } catch (e) { problems.push("playinfo:" + e.name); }

    var encryptedYt = false;
    try {
      var pr = window.ytInitialPlayerResponse;
      var formats = (pr && pr.streamingData && pr.streamingData.adaptiveFormats) || [];
      formats.forEach(function (f) {
        if (!/^audio\//.test(String(f.mimeType || ""))) return;
        if (f.url) push(f.url);
        else if (f.signatureCipher) encryptedYt = true;
      });
    } catch (e) { problems.push("playerResponse:" + e.name); }

    /* 页面里没有 playinfo（切分 P / 未播放）时，向站内接口再要一次音频流。 */
    if (!urls.length && platform === "bilibili") {
      try {
        var bv = (href.match(/BV[0-9A-Za-z]{10}/) || [])[0];
        var cid = window.cid || (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.cid) ||
          (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData &&
            window.__INITIAL_STATE__.videoData.cid) || 0;
        if (bv && cid) {
          return fetch("https://api.bilibili.com/x/player/playurl?bvid=" + bv +
            "&cid=" + cid + "&fnval=16&fnver=0&fourk=1", { credentials: "include" })
            .then(function (r) { return r.json(); }).then(function (j) {
              var d = j && (j.data || j.result) || {};
              ((d.dash && d.dash.audio) || []).forEach(function (t) {
                push(t.baseUrl || t.base_url);
                (t.backup_url || []).forEach(push);
              });
              ((d.durl) || []).forEach(function (t) { push(t.url); });
              return { ok: urls.length > 0, urls: urls.slice(0, 8), platform: platform, problems: problems };
            }).catch(function (e) {
              problems.push("playurl:" + e.name);
              return { ok: false, urls: [], platform: platform, problems: problems };
            });
        }
      } catch (e) { problems.push("playurl:" + e.name); }
    }

    return {
      ok: urls.length > 0,
      urls: urls.slice(0, 8),
      platform: platform,
      encryptedYt: encryptedYt,
      problems: problems,
      title: document.title || ""
    };
  }

  async function downloadInPage(urls, maxBytes, referrer) {
    var state = "__briefAudioFetch";
    var failures = [];
    var modes = [
      { credentials: "omit", referrer: referrer, referrerPolicy: "unsafe-url" },
      { credentials: "include", referrer: referrer, referrerPolicy: "unsafe-url" },
      { credentials: "omit", referrerPolicy: "no-referrer" }
    ];
    function attempt(i, m) {
      if (m >= modes.length) {
        return Promise.resolve({ ok: false, message: failures.slice(0, 6).join("；") || "没有可用的音频地址" });
      }
      if (i >= urls.length) return attempt(0, m + 1);
      var init = Object.assign({ method: "GET" }, modes[m]);
      return fetch(urls[i], init).then(function (r) {
        if (!r.ok) { failures.push("HTTP " + r.status); return attempt(i + 1, m); }
        var declared = Number(r.headers.get("content-length")) || 0;
        if (declared > maxBytes) {
          failures.push("超过大小上限");
          return attempt(i + 1, m);
        }
        var reader = r.body.getReader();
        var chunks = [], total = 0;
        function step() {
          return reader.read().then(function (x) {
            if (x.done) {
              var buf = new Uint8Array(total), off = 0;
              chunks.forEach(function (c) { buf.set(c, off); off += c.byteLength; });
              window[state] = { bytes: buf, contentType: r.headers.get("content-type") || "" };
              return {
                ok: true, size: total,
                contentType: r.headers.get("content-type") || "audio/mp4",
                url: urls[i], credentialMode: m
              };
            }
            total += x.value.byteLength;
            if (total > maxBytes) {
              throw new Error("音频超过 " + Math.round(maxBytes / 1048576) + " MB 上限");
            }
            chunks.push(x.value);
            return step();
          });
        }
        return step();
      }).catch(function (e) {
        failures.push((e && e.message) || e.name || "网络错误");
        return attempt(i + 1, m);
      });
    }
    return attempt(0, 0);
  }

  function pullInPage(offset, length) {
    var state = "__briefAudioFetch";
    var held = window[state];
    if (!held) return { ok: false, message: "页面里没有已下载的音频" };
    var end = Math.min(held.bytes.length, offset + length);
    if (offset >= end) {
      delete window[state];
      return { ok: true, done: true, length: 0 };
    }
    var slice = held.bytes.subarray(offset, end);
    var binary = "", block = 0x8000;
    for (var i = 0; i < slice.length; i += block) {
      binary += String.fromCharCode.apply(null, slice.subarray(i, i + block));
    }
    return { ok: true, base64: btoa(binary), length: slice.length };
  }

  function exec(tabId, func, args, world) {
    return chrome.scripting.executeScript({
      target: { tabId: tabId }, world: world || "MAIN", func: func, args: args || []
    }).then(function (res) {
      return res && res[0] && res[0].result;
    });
  }

  function normalizeUrl(u) {
    try {
      var x = new URL(u);
      x.hash = "";
      ["spm_id_from", "vd_source", "t", "share_source", "unique_k"].forEach(function (k) {
        x.searchParams.delete(k);
      });
      return x.toString();
    } catch (e) { return String(u || ""); }
  }
  function videoKey(d) {
    var u = String((d && d.sourceUrl) || "");
    var bv = (u.match(/BV[0-9A-Za-z]{10}/) || [])[0];
    if (bv) return bv;
    var yt = (u.match(/[?&]v=([A-Za-z0-9_-]{11})/) || [])[0];
    if (yt) return yt.slice(3);
    try { return new URL(u).pathname; } catch (e) { return ""; }
  }
  function findTab(d) {
    return chrome.tabs.query({}).then(function (tabs) {
      var target = normalizeUrl(d && d.sourceUrl);
      var key = videoKey(d);
      var list = tabs || [];
      var exact = list.filter(function (t) { return t.url && normalizeUrl(t.url) === target; })[0];
      if (exact) return exact;
      var byKey = key && list.filter(function (t) { return t.url && t.url.indexOf(key) !== -1; })[0];
      if (byKey) return byKey;
      return null;
    });
  }

  function b64Bytes(s) {
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  /* 从原视频页拿到一个可直接上传的 Blob。 */
  function captureAudio(d, cfg, onProgress) {
    var maxBytes = Number(cfg.maxAudioMB) * 1048576;
    return findTab(d).then(function (tab) {
      if (!tab) {
        throw asrError("获取音频", "找不到原视频标签页。请保持原视频页打开后再生成。");
      }
      return exec(tab.id, readStreamsInPage, []).then(function (streams) {
        if (!streams) throw asrError("获取音频", "原视频页没有返回结果，请刷新视频页后重试。");
        if (!streams.ok) {
          var why = streams.platform === "youtube" && streams.encryptedYt
            ? "YouTube 音频流被签名保护，且该视频没有可用字幕轨，暂时无法云端识别；请用带字幕的视频。"
            : "原视频页没有暴露音频流地址（可能需要登录、视频未开始播放，或平台限制）。";
          throw asrError("获取音频", why + " " + (streams.problems || []).join(" ").trim());
        }
        if (onProgress) onProgress({ stage: "download", candidates: streams.urls.length });
        return exec(tab.id, downloadInPage, [streams.urls, maxBytes, tab.url || ""]).then(function (down) {
          if (!down || !down.ok) {
            throw asrError("获取音频", "音频下载失败：" + ((down && down.message) || "未知原因") +
              "。可尝试刷新原视频页、让视频播放几秒后重试。");
          }
          if (!down.size) throw asrError("获取音频", "下载到的音频是空文件。");
          var parts = [], offset = 0;
          function pull() {
            return exec(tab.id, pullInPage, [offset, CHUNK_BYTES]).then(function (chunk) {
              if (!chunk || !chunk.ok) {
                throw asrError("获取音频", "音频分片读取失败：" + ((chunk && chunk.message) || "未知原因"));
              }
              if (chunk.done) return null;
              parts.push(b64Bytes(chunk.base64));
              offset += chunk.length;
              if (onProgress) onProgress({ stage: "chunks", received: offset, total: down.size });
              if (offset >= down.size) {
                /* 再多取一次，让页面清理掉内存里的音频。 */
                return exec(tab.id, pullInPage, [down.size, CHUNK_BYTES]).then(function () { return null; });
              }
              return pull();
            });
          }
          return pull().then(function () {
            var merged = new Uint8Array(down.size), pos = 0;
            parts.forEach(function (p) { merged.set(p, pos); pos += p.byteLength; });
            if (pos !== down.size) {
              throw asrError("获取音频", "音频分片不完整（" + pos + "/" + down.size + " 字节）。");
            }
            return {
              blob: new Blob([merged], { type: down.contentType || "audio/mp4" }),
              size: down.size,
              contentType: down.contentType || "audio/mp4",
              platform: streams.platform
            };
          });
        });
      });
    });
  }

  /* ---------------- 对外主流程 ---------------- */

  function clock(sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return (h ? p(h) + ":" : "") + p(m) + ":" + p(ss);
  }
  /* 与字幕逐字稿同格式，结果页的时间戳跳转和搜索可以直接复用。 */
  function rowsToText(rows) {
    var lines = [], lastEnd = -1;
    (rows || []).forEach(function (r) {
      var text = String(r.text || "").replace(/\s+/g, " ").trim();
      var start = Number(r.start) || 0, end = Number(r.end) || 0;
      if (!text || end <= start) return;
      if (lastEnd >= 0 && start < lastEnd - 0.001) return; /* 重叠片段丢弃，避免重复内容 */
      lastEnd = end;
      lines.push("[" + clock(start) + "] " + text);
    });
    return lines.join("\n");
  }

  function cachedText(pid) {
    if (!pid) return Promise.resolve("");
    return chrome.storage.local.get(TEXT_PREFIX + pid).then(function (d) {
      var v = d && d[TEXT_PREFIX + pid];
      return (v && v.text) || "";
    });
  }
  function saveText(pid, info) {
    if (!pid) return Promise.resolve();
    var o = {}; o[TEXT_PREFIX + pid] = info;
    return chrome.storage.local.set(o);
  }
  function taskOf(pid) {
    if (!pid) return Promise.resolve(null);
    return chrome.storage.local.get(TASK_PREFIX + pid).then(function (d) {
      return (d && d[TASK_PREFIX + pid]) || null;
    });
  }
  function saveTask(pid, info) {
    if (!pid) return Promise.resolve();
    var o = {}; o[TASK_PREFIX + pid] = info;
    return chrome.storage.local.set(o);
  }
  function clearTask(pid) {
    if (!pid) return Promise.resolve();
    return chrome.storage.local.remove(TASK_PREFIX + pid);
  }
  function clearFor(pid) {
    if (!pid) return Promise.resolve();
    return chrome.storage.local.remove([TEXT_PREFIX + pid, TASK_PREFIX + pid]);
  }

  /* 完整链路：读缓存 -> 取音频 -> 云端识别 -> 写缓存。
     onProgress({stage, ...}) 供结果页更新加载文案。 */
  function run(doc, pid, cfg, onProgress) {
    var err = validate(cfg);
    if (err) return Promise.reject(asrError("配置检查", "语音识别配置有误：" + err));
    if (!String(cfg.apiKey || "").trim()) {
      return Promise.reject(asrError("配置检查", "还没填语音识别 API Key，请到「模型设置」里填写。"));
    }
    function progress(x) { if (onProgress) onProgress(x); }
    return cachedText(pid).then(function (cached) {
      if (cached) {
        progress({ stage: "cached", chars: cached.length });
        return cached;
      }
      return taskOf(pid).then(function (checkpoint) {
        if (checkpoint && checkpoint.taskId) {
          progress({ stage: "resume", taskId: checkpoint.taskId });
          return { blob: null, checkpoint: checkpoint };
        }
        progress({ stage: "download" });
        return captureAudio(doc, cfg, progress).then(function (audio) {
          progress({ stage: "audio", size: audio.size, platform: audio.platform });
          return { blob: audio.blob, filename: "brief-audio.m4a", checkpoint: null };
        });
      }).then(function (input) {
        var params = parameters(cfg.model);
        if (!params) throw asrError("配置检查", "不支持的文件转写模型：" + cfg.model);
        var taskId = null, objectKey = null;
        function submitted() {
          progress({ stage: "submitted", taskId: taskId });
          return saveTask(pid, { taskId: taskId, objectKey: objectKey, savedAt: Date.now(), model: cfg.model });
        }
        function go() {
          if (taskId) return Promise.resolve();
          progress({ stage: "policy" });
          return getPolicy(cfg).then(function (policy) {
            progress({ stage: "upload", size: input.blob.size });
            return uploadToOss(policy, input.blob, input.filename);
          }).then(function (key) {
            objectKey = key;
            progress({ stage: "submit" });
            return submitTask(cfg, objectKey, params);
          }).then(function (id) {
            taskId = id;
            return submitted();
          });
        }
        if (input.checkpoint) {
          taskId = input.checkpoint.taskId;
          objectKey = input.checkpoint.objectKey || null;
        }
        return go().then(function () {
          progress({ stage: "poll", taskId: taskId, elapsed: 0, status: "PENDING" });
          return pollTask(cfg, taskId, progress);
        }).then(function (completed) {
          progress({ stage: "result", taskId: taskId });
          return fetchResult(completed, taskId);
        }).then(function (out) {
          var text = rowsToText(out.rows);
          if (!text) throw asrError("读取结果", "云端识别没有返回可用的文字片段", { taskId: taskId });
          progress({ stage: "done", chars: text.length, taskId: taskId });
          return saveText(pid, {
            text: text, taskId: taskId, model: cfg.model,
            durationMs: out.durationMs, savedAt: Date.now()
          }).then(function () { return clearTask(pid); }).then(function () { return text; });
        });
      });
    });
  }

  window.BRIEF_ASR = {
    DEFAULTS: DEFAULTS, MODELS: MODELS, CONFIG_KEY: KEY,
    TEXT_PREFIX: TEXT_PREFIX, TASK_PREFIX: TASK_PREFIX,
    getConfig: getConfig, saveConfig: saveConfig, resetConfig: resetConfig,
    validate: validate, parameters: parameters, testConnection: testConnection,
    captureAudio: captureAudio, rowsToText: rowsToText,
    cachedText: cachedText, clearFor: clearFor, run: run
  };
})();
