var e,t;"function"==typeof(e=globalThis.define)&&(t=e,e=null),function(t,n,i,o,r){var a="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},s="function"==typeof a[o]&&a[o],l=s.cache||{},p="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function c(e,n){if(!l[e]){if(!t[e]){var i="function"==typeof a[o]&&a[o];if(!n&&i)return i(e,!0);if(s)return s(e,!0);if(p&&"string"==typeof e)return p(e);var r=Error("Cannot find module '"+e+"'");throw r.code="MODULE_NOT_FOUND",r}f.resolve=function(n){var i=t[e][1][n];return null!=i?i:n},f.cache={};var d=l[e]=new c.Module(e);t[e][0].call(d.exports,f,d,d.exports,this)}return l[e].exports;function f(e){var t=f.resolve(e);return!1===t?{}:c(t)}}c.isParcelRequire=!0,c.Module=function(e){this.id=e,this.bundle=c,this.exports={}},c.modules=t,c.cache=l,c.parent=s,c.register=function(e,n){t[e]=[function(e,t){t.exports=n},{}]},Object.defineProperty(c,"root",{get:function(){return a[o]}}),a[o]=c;for(var d=0;d<n.length;d++)c(n[d]);if(i){var f=c(i);"object"==typeof exports&&"undefined"!=typeof module?module.exports=f:"function"==typeof e&&e.amd?e(function(){return f}):r&&(this[r]=f)}}({NA1En:[function(e,t,n){e("a99d12414556563e").register(JSON.parse('{"aU7Ph":"notice.js","k4pd1":"bulb.png"}'))},{a99d12414556563e:"ekZfu"}],ekZfu:[function(e,t,n){var i={};t.exports.register=function(e){for(var t=Object.keys(e),n=0;n<t.length;n++)i[t[n]]=e[t[n]]},t.exports.resolve=function(e){var t=i[e];if(null==t)throw Error("Could not resolve bundle with id "+e);return t}},{}],"5A5Vt":[function(e,t,n){var i=e("@bundler/runtime-helpers");i.defineInteropFlag(n),i.export(n,"config",()=>l),e("./m/lib/compat");var o=e("./asset-empty.png"),r=i.interopDefault(o),a=e("./m/lib/iap"),s=e("./m/lib/state");let l={matches:["http://*/*","https://*/*"],run_at:"document_idle"},p=s.DEFAULT_PRICING;async function c(){try{let e=await chrome.runtime.sendMessage({type:"brief-get-local-state"}),t=e?.pricing;e?.ok&&t?.vip&&Array.isArray(t?.points)&&(p=t)}catch{}}c();let d=function(e){try{return new URL(e).toString()}catch{let t=e.split("/").filter(Boolean).pop();return t?chrome.runtime.getURL(t):e}}(r.default),f="brief-notice-root",u="brief-notice-style";function m(e){let t;!function(){if(document.getElementById(u))return;let e=document.createElement("style");e.id=u,e.textContent=`
    #${f} {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.68);
      backdrop-filter: blur(16px);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      opacity: 0;
      transition: opacity 220ms ease;
    }
    #${f}.is-open { opacity: 1; }
    .lf-card {
      background: #fff;
      border-radius: 20px;
      padding: 32px 28px 28px;
      max-width: 420px;
      width: calc(100vw - 48px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      position: relative;
      transform: translateY(16px) scale(0.97);
      transition: transform 260ms cubic-bezier(0.2,0.8,0.2,1), opacity 260ms;
      opacity: 0;
    }
    #${f}.is-open .lf-card { transform: none; opacity: 1; }
    .lf-close {
      position: absolute;
      top: 16px; right: 18px;
      background: none; border: none;
      font-size: 20px; color: #9ca3af;
      cursor: pointer; line-height: 1;
      padding: 4px;
    }
    .lf-close:hover { color: #374151; }
    .lf-title {
      font-size: 17px; font-weight: 700;
      color: #111827; margin-bottom: 20px;
      line-height: 1.4; padding-right: 20px;
    }
    .lf-btn-primary {
      display: block; width: 100%;
      background: #111; color: #fff;
      border: none; border-radius: 12px;
      padding: 14px 16px; font-size: 14px; font-weight: 700;
      cursor: pointer; line-height: 1.4; text-align: center;
      transition: opacity 120ms;
    }
    .lf-btn-primary:hover { opacity: 0.85; }
    .lf-btn-hint {
      font-size: 12px; color: #9ca3af;
      margin-top: 8px; text-align: center; line-height: 1.5;
    }
    .lf-pkg-row {
      display: flex; align-items: center;
      justify-content: space-between;
      background: #fdf6f0;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .lf-pkg-row.featured { border: 2px solid #f87171; }
    .lf-pkg-left {}
    .lf-pkg-points {
      font-size: 15px; font-weight: 700; color: #111;
      display: flex; align-items: center; gap: 6px;
    }
    .lf-pkg-tag {
      font-size: 11px; font-weight: 600;
      color: #ef4444; background: #fee2e2;
      border-radius: 6px; padding: 2px 6px;
    }
    .lf-pkg-desc {
      font-size: 12px; color: #6b7280; margin-top: 4px; line-height: 1.4;
    }
    .lf-pkg-btn {
      position: relative;
      background: #111; color: #fff;
      border: none; border-radius: 12px;
      padding: 10px 18px; font-size: 14px; font-weight: 700;
      cursor: pointer; white-space: nowrap; min-width: 80px;
      transition: opacity 120ms;
    }
    .lf-pkg-btn:hover { opacity: 0.85; }
    .lf-pkg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .lf-pkg-badge {
      position: absolute;
      top: -8px; right: -6px;
      background: #ef4444; color: #fff;
      font-size: 10px; font-weight: 700;
      border-radius: 6px; padding: 2px 5px;
    }
    .lf-link {
      display: block; text-align: center; margin-top: 14px;
      font-size: 12px; color: #6b7280; cursor: pointer; text-decoration: underline;
    }
    .lf-link:hover { color: #111; }
    .lf-pay-confirm {
      margin-top: 20px;
      display: flex; gap: 10px;
    }
    .lf-pay-confirm button {
      flex: 1; padding: 12px; border-radius: 10px;
      font-size: 13px; font-weight: 600; cursor: pointer; border: none;
    }
    .lf-pay-ok { background: #111; color: #fff; }
    .lf-pay-cancel { background: #f3f4f6; color: #374151; }
    .lf-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .lf-pay-hint {
      margin-top: 10px;
      font-size: 12px; line-height: 1.5;
      color: #ef4444; text-align: center;
    }
    .lf-pay-hint.shake { animation: lf-shake 360ms ease; }
    @keyframes lf-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }

    /* ---- \u63d0\u793a\u5f39\u7a97\u6837\u5f0f ---- */
    .lf-popup-wrapper {
      position: relative;
      padding-top: 56px;
      animation: lf-pop-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes lf-pop-in {
      from { transform: scale(0.75) translateY(16px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
    .lf-mascot {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 116px; height: 116px;
      object-fit: contain;
      filter: drop-shadow(0 6px 14px rgba(0,0,0,0.30));
      z-index: 20;
      pointer-events: none;
    }
    .lf-card-v2 {
      background: #FFFFFF;
      border-radius: 22px;
      width: 312px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.40);
      position: relative;
      overflow: hidden;
    }
    .lf-close-v2 {
      position: absolute;
      top: 12px; right: 12px;
      width: 24px; height: 24px;
      border-radius: 50%;
      background: #F0F0F0;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #999; font-size: 11px; font-weight: 700;
      z-index: 5; transition: background 0.12s;
    }
    .lf-close-v2:hover { background: #E0E0E0; color: #555; }
    .lf-body-v2 {
      padding: 60px 22px 18px;
      text-align: center;
    }
    .lf-title-v2 {
      font-size: 20px; font-weight: 800;
      color: #111111; letter-spacing: -0.4px;
      margin-bottom: 4px;
    }
    .lf-desc-v2 {
      font-size: 13px; color: #AAAAAA;
      line-height: 1.5; margin-bottom: 14px;
    }
    .lf-divider { height: 1px; background: #F0F0F0; margin: 0 0 18px; }
    .lf-cta-btn {
      position: relative; width: 100%; height: 56px;
      border: none; border-radius: 14px;
      background: linear-gradient(180deg, #1F1F1F 0%, #0A0A0A 100%);
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 18px 0 20px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.15);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .lf-cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 18px rgba(0,0,0,0.30), 0 14px 32px rgba(0,0,0,0.20);
    }
    .lf-cta-btn:active {
      transform: translateY(0);
      box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 6px rgba(0,0,0,0.25);
    }
    .lf-cta-sticker {
      position: absolute; top: -11px; right: 12px;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px 5px; border-radius: 999px;
      background: linear-gradient(135deg, #FFE08A 0%, #FFC23D 60%, #FF9F1A 100%);
      color: #3B1F00; line-height: 1; white-space: nowrap;
      box-shadow: 0 4px 12px rgba(255,160,30,0.45), 0 1px 0 rgba(255,255,255,0.5) inset;
      transform: rotate(8deg); transform-origin: center;
      pointer-events: none;
      animation: lf-sticker-bob 2.6s ease-in-out infinite;
    }
    @keyframes lf-sticker-bob {
      0%, 100% { transform: rotate(8deg) translateY(0); }
      50%      { transform: rotate(8deg) translateY(-1.5px); }
    }
    .lf-sticker-tag { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; }
    .lf-sticker-old { font-size: 10px; font-weight: 700; text-decoration: line-through; text-decoration-thickness: 1.2px; opacity: 0.55; letter-spacing: 0.2px; }
    .lf-cta-text { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; line-height: 1; }
    .lf-cta-main { font-size: 15.5px; font-weight: 700; letter-spacing: 0.2px; }
    .lf-cta-sub { font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,0.55); letter-spacing: 0.2px; }
    .lf-cta-price { display: flex; align-items: baseline; line-height: 1; gap: 1px; }
    .lf-price-symbol { font-size: 13px; font-weight: 600; opacity: 0.88; }
    .lf-price-num { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .lf-price-mo { font-size: 11px; font-weight: 500; opacity: 0.55; margin-left: 1px; }
    .lf-arrow { margin-left: 6px; font-size: 16px; font-weight: 400; opacity: 0.6; transition: transform 0.15s ease, opacity 0.15s ease; }
    .lf-cta-btn:hover .lf-arrow { transform: translateX(3px); opacity: 1; }
    .lf-footer-v2 { text-align: center; font-size: 11px; color: #CCCCCC; margin-top: 10px; letter-spacing: 0.3px; }

    /* ---- \u63d0\u793a\u5f39\u7a97\u6837\u5f0f ---- */
    .lf-body-pkg { padding: 60px 18px 18px; text-align: center; }
    .lf-divider-sm { height: 1px; background: #F0F0F0; margin: 0 0 14px; }
    .lf-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .lf-opt-row {
      position: relative;
      border: 1.5px solid #EBEBEB; border-radius: 14px;
      padding: 11px 14px;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; background: #FAFAFA; text-align: left;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.12s;
    }
    .lf-opt-row:hover { border-color: #CCCCCC; transform: translateY(-1px); }
    .lf-opt-row.lf-selected {
      background: #FFFFFF; border: 2px solid #111111;
      box-shadow: 0 2px 10px rgba(0,0,0,0.10); transform: translateY(-1px);
    }
    .lf-opt-left { display: flex; flex-direction: column; gap: 4px; }
    .lf-opt-pts { font-size: 15px; font-weight: 700; color: #111111; letter-spacing: -0.2px; }
    .lf-opt-tag { font-size: 10.5px; font-weight: 500; color: #BBBBBB; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .lf-hi-amber { color: #D97706; font-weight: 700; }
    .lf-hi-green { color: #16A34A; font-weight: 700; }
    .lf-hi-muted { color: #AAAAAA; }
    .lf-dot-sep { color: #DDDDDD; }
    .lf-opt-price { display: flex; align-items: baseline; gap: 1px; line-height: 1; flex-shrink: 0; margin-left: 8px; }
    .lf-opt-sym { font-size: 12px; font-weight: 600; color: #444; }
    .lf-opt-num { font-size: 20px; font-weight: 900; color: #111; letter-spacing: -0.5px; }
    .lf-cta-center-btn {
      width: 100%; height: 56px; border: none; border-radius: 14px;
      background: linear-gradient(180deg, #1F1F1F 0%, #0A0A0A 100%);
      color: white; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.15);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .lf-cta-center-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 18px rgba(0,0,0,0.30), 0 14px 32px rgba(0,0,0,0.20);
    }
    .lf-cta-center-btn:active {
      transform: translateY(0);
      box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 6px rgba(0,0,0,0.25);
    }
    .lf-cta-center-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .lf-cta-center-main { font-size: 15.5px; font-weight: 700; letter-spacing: 0.2px; line-height: 1; }

    /* ---- \u786e\u8ba4\u5f39\u7a97 ---- */
    .lf-confirm-wrapper { animation: lf-pop-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .lf-body-confirm { padding: 28px 22px 22px; text-align: center; }
  `,document.documentElement.appendChild(e)}();let n=((t=document.getElementById(f))||((t=document.createElement("div")).id=f,document.documentElement.appendChild(t)),t);n.innerHTML=e,requestAnimationFrame(()=>n.classList.add("is-open"))}function g(){let e=document.getElementById(f);e&&(e.classList.remove("is-open"),setTimeout(()=>e.remove(),280))}chrome.runtime.onMessage.addListener((e,t,n)=>{if("SHOW_BRIEF_SUBTITLE_CONFIRM"===e.type)return function(e){let t="brief-subtitle-confirm-root";document.getElementById(t)?.remove();let n=document.createElement("div");n.id=t,n.style.cssText="all:initial;position:fixed;inset:0;z-index:2147483647;display:block;";let i=n.attachShadow({mode:"open"});i.innerHTML=`
    <style>
      * { box-sizing: border-box; }
      .backdrop { position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
        font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif; }
      .card { background:white;border-radius:22px;padding:32px 28px 24px;width:92%;max-width:400px;
        box-shadow:0 32px 80px rgba(0,0,0,.22); }
      h2 { margin:0 0 12px;font-size:17px;font-weight:800;color:#1a1a1a;letter-spacing:-.3px; }
      p { margin:0 0 24px;font-size:13px;color:#666;line-height:1.7; }
      .buttons { display:flex;gap:10px; }
      button { flex:1;padding:12px;border-radius:12px;font-size:14px;cursor:pointer;font-family:inherit; }
      .confirm { background:#1a1a1a;color:white;border:none;font-weight:700; }
      .cancel { background:transparent;color:#666;border:1.5px solid #e5e7eb;font-weight:600; }
      button:disabled { cursor:wait;opacity:.6; }
      .error { color:#b91c1c;margin:12px 0 0; }
    </style>
    <div class="backdrop">
      <div class="card" role="dialog" aria-modal="true" aria-labelledby="subtitle-confirm-title">
        <h2 id="subtitle-confirm-title">\u63d0\u793a</h2>
        <p>\u5f53\u524d\u89c6\u9891\u6ca1\u6709\u5b57\u5e55\uff0c\u662f\u5426\u8c03\u7528\u4e91\u7aef\u8bed\u97f3\u8bc6\u522b\uff1f\u53ef\u80fd\u9700\u8981\u7b49\u5f85\u51e0\u5206\u949f</p>
        <div class="buttons"><button class="confirm" type="button">\u7ee7\u7eed</button><button class="cancel" type="button">\u53d6\u6d88</button></div>
        <p class="error" role="alert" hidden></p>
      </div>
    </div>`,document.body.appendChild(n);let o=i.querySelector(".confirm"),r=i.querySelector(".cancel"),a=!1,s=()=>{n.style.display="none",n.remove(),window.dispatchEvent(new CustomEvent("brief-spotlight",{detail:{enabled:!1}})),window.postMessage({type:"BRIEF_SPOTLIGHT",enabled:!1},window.location.origin)},l=()=>{a||s()};r.onclick=l,i.querySelector(".backdrop").addEventListener("click",e=>{e.target===e.currentTarget&&l()}),n.addEventListener("keydown",e=>{"Escape"===e.key&&l()}),o.onclick=async()=>{if(!a){a=!0,o.disabled=r.disabled=!0;try{let t=await chrome.runtime.sendMessage({type:"confirm-subtitle-translate",...e});if(!t?.ok)throw Error(t?.error||"\u542f\u52a8\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");s()}catch(t){let e=i.querySelector(".error");e.textContent=t instanceof Error?t.message:"\u542f\u52a8\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",e.hidden=!1,a=!1,o.disabled=r.disabled=!1}}},o.focus()}({providerId:e.providerId,expectedUrl:e.expectedUrl}),n({shown:!0}),!0;if("SHOW_BRIEF_NONMEMBER_MODAL"===e.type)return c().then(()=>void(m(`
    <div class="lf-popup-wrapper">
      <img class="lf-mascot" src="${d}" alt="">
      <div class="lf-card-v2">
        <button class="lf-close-v2" id="lf-close-btn">\u2715</button>
        <div class="lf-body-v2">
          <div class="lf-title-v2">\u670d\u52a1\u6682\u4e0d\u53ef\u7528</div>
          <div class="lf-desc-v2">\u5f53\u524d\u670d\u52a1\u6682\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5</div>
          <div class="lf-divider"></div>
          <button class="lf-cta-btn" id="lf-buy-member-btn">
            <span class="lf-cta-sticker">
              <span class="lf-sticker-tag">\u9650\u65f65\u6298</span>
              <span class="lf-sticker-old">\xa536</span>
            </span>
            <div class="lf-cta-text">
              <span class="lf-cta-main">\u7ee7\u7eed</span>
              <span class="lf-cta-sub">\u672c\u5730\u751f\u6210\u4e0d\u9650\u6b21\u6570</span>
            </div>
            <span class="lf-cta-price">
              <span class="lf-price-symbol">\xa5</span>
              <span class="lf-price-num">${p.vip.yearlyNew.perMonth}</span>
              <span class="lf-price-mo">/\u6708</span>
              <span class="lf-arrow">\u203a</span>
            </span>
          </button>
          <div class="lf-footer-v2">\u6309\u6708\u8ba1\u8d39 \xb7 \u5230\u671f\u81ea\u52a8\u505c\u6b62</div>
        </div>
      </div>
    </div>
  `),document.getElementById("lf-close-btn")?.addEventListener("click",g),document.getElementById("lf-buy-member-btn")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"REPORT_FUNNEL_EVENT",eventType:"BUY_CLICKED",subType:"NONMEMBER"}),chrome.runtime.sendMessage({type:"OPEN_SETTINGS_TAB",section:"subscription"}),g()}))),n({shown:!0}),!0;if("SHOW_BRIEF_MEMBER_MODAL"===e.type){let t=e.jobId,i=e.pendingPublicId;return c().then(()=>(function(e){let t=null,n="STANDARD";async function i(){let t=document.getElementById("lf-pay-done-btn");t&&(t.disabled=!0);let n=await chrome.runtime.sendMessage({type:"brief-check-local-eligibility",jobId:e.jobId});n?.eligible?(g(),chrome.runtime.sendMessage({type:"brief-resume-generation",jobId:e.jobId})):(t&&(t.disabled=!1),l("\u64cd\u4f5c\u5c1a\u672a\u751f\u6548\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"))}async function o(e){if(e.disabled=!0,chrome.runtime.sendMessage({type:"REPORT_FUNNEL_EVENT",eventType:"BUY_CLICKED",subType:"MEMBER_EXTRA_PACKAGE"}),(0,a.isSafari)()){try{let t=await chrome.runtime.sendMessage({type:"brief-open-local-action",packageType:n});if(!t?.ok){e.disabled=!1;return}m(`
      <div class="lf-confirm-wrapper">
        <div class="lf-card-v2">
          <button class="lf-close-v2" id="lf-close-btn">\u2715</button>
          <div class="lf-body-confirm">
            <div class="lf-title-v2">\u8bf7\u5b8c\u6210\u64cd\u4f5c</div>
            <div class="lf-desc-v2">\u5df2\u4e3a\u4f60\u6253\u5f00 Briefly \u5e94\u7528\uff0c<br>\u5b8c\u6210\u540e\u56de\u5230\u6b64\u5904\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae</div>
            <div class="lf-divider"></div>
            <div class="lf-pay-confirm">
              <button class="lf-pay-ok" id="lf-pay-done-btn">\u5df2\u5b8c\u6210</button>
              <button class="lf-pay-cancel" id="lf-pay-cancel-btn">\u53d6\u6d88</button>
            </div>
            <div class="lf-pay-hint" id="lf-pay-hint" style="display:none"></div>
          </div>
        </div>
      </div>
    `),document.getElementById("lf-close-btn")?.addEventListener("click",g),document.getElementById("lf-pay-done-btn")?.addEventListener("click",i),document.getElementById("lf-pay-cancel-btn")?.addEventListener("click",g)}catch{e.disabled=!1}return}try{let i=await chrome.runtime.sendMessage({type:"brief-create-points-purchase",packageType:n});if(!i?.ok||!i.outTradeNo){e.disabled=!1;return}t=i.outTradeNo,m(`
      <div class="lf-confirm-wrapper">
        <div class="lf-card-v2">
          <button class="lf-close-v2" id="lf-close-btn">\u2715</button>
          <div class="lf-body-confirm">
            <div class="lf-title-v2">\u8bf7\u5b8c\u6210\u64cd\u4f5c</div>
            <div class="lf-desc-v2">\u5df2\u5728\u65b0\u6807\u7b7e\u9875\u6253\u5f00\u9875\u9762\uff0c<br>\u5b8c\u6210\u540e\u8bf7\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae</div>
            <div class="lf-divider"></div>
            <div class="lf-pay-confirm">
              <button class="lf-pay-ok" id="lf-pay-done-btn">\u5df2\u5b8c\u6210</button>
              <button class="lf-pay-cancel" id="lf-pay-cancel-btn">\u5c1a\u672a\u5b8c\u6210</button>
            </div>
            <div class="lf-pay-hint" id="lf-pay-hint" style="display:none"></div>
          </div>
        </div>
      </div>
    `),document.getElementById("lf-close-btn")?.addEventListener("click",g),document.getElementById("lf-pay-done-btn")?.addEventListener("click",r),document.getElementById("lf-pay-cancel-btn")?.addEventListener("click",g)}catch{e.disabled=!1}}async function r(){if(!t)return;let n=document.getElementById("lf-pay-done-btn");n&&(n.disabled=!0);let i=await chrome.runtime.sendMessage({type:"brief-check-order-status",outTradeNo:t});if(i?.paid){let t=await chrome.runtime.sendMessage({type:"brief-check-local-eligibility",jobId:e.jobId});t?.eligible?(g(),chrome.runtime.sendMessage({type:"brief-resume-generation",jobId:e.jobId})):(n&&(n.disabled=!1),l("\u64cd\u4f5c\u5c1a\u672a\u751f\u6548\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"))}else n&&(n.disabled=!1),l("\u672a\u68c0\u6d4b\u5230\u5b8c\u6210\u72b6\u6001\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5")}function l(e){let t=document.getElementById("lf-pay-hint");t&&(t.textContent=e,t.style.display="block",t.classList.remove("shake"),t.offsetWidth,t.classList.add("shake"))}!function(){var e,t;m(`
      <div class="lf-popup-wrapper">
        <img class="lf-mascot" src="${d}" alt="">
        <div class="lf-card-v2">
          <button class="lf-close-v2" id="lf-close-btn">\u2715</button>
          <div class="lf-body-pkg">
            <div class="lf-title-v2">\u5f53\u524d\u4e0d\u53ef\u7528</div>
            <div class="lf-desc-v2">\u8bf7\u7a0d\u540e\u91cd\u8bd5</div>
            <div class="lf-divider-sm"></div>
            <div class="lf-options">
              ${(e=p,t=n,["BASIC","STANDARD","PREMIUM"].map(n=>{let i=(0,s.pointPkg)(e,n),o=n===t?" lf-selected":"",r=i.discount?`<span class="lf-hi-amber">${i.discount}</span><span class="lf-dot-sep">\xb7</span><span>${i.tag}</span>${i.save?`<span class="lf-dot-sep">\xb7</span><span class="lf-hi-green">\u7701 \xa5${i.save}</span>`:""}`:`<span class="lf-hi-muted">\u539f\u4ef7</span><span class="lf-dot-sep">\xb7</span><span>${i.tag}</span>`;return`
      <div class="lf-opt-row${o}" data-pkg="${n}">
        <div class="lf-opt-left">
          <span class="lf-opt-pts">${i.points} \u70b9</span>
          <span class="lf-opt-tag">${r}</span>
        </div>
        <div class="lf-opt-price"><span class="lf-opt-sym">\xa5</span><span class="lf-opt-num">${i.price}</span></div>
      </div>`}).join(""))}
            </div>
            <button class="lf-cta-center-btn" id="lf-buy-btn">
              <span class="lf-cta-center-main">\u77e5\u9053\u4e86</span>
            </button>
            <div class="lf-footer-v2">\u672c\u5730\u751f\u6210\u4e0d\u9650\u6b21\u6570 \xb7 \u65e0\u9700\u989d\u5916\u5f00\u901a</div>
          </div>
        </div>
      </div>
    `),document.querySelectorAll(".lf-opt-row").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".lf-opt-row").forEach(e=>e.classList.remove("lf-selected")),e.classList.add("lf-selected"),n=e.dataset.pkg})});let i=document.getElementById("lf-buy-btn");document.getElementById("lf-close-btn")?.addEventListener("click",g),i&&i.addEventListener("click",()=>o(i))}()})({jobId:t,pendingPublicId:i})),n({shown:!0}),!0}})},{"./m/lib/compat":"5J0om","./asset-empty.png":"1ryWA","./m/lib/iap":"ilkAf","./m/lib/state":"9qeAi","@bundler/runtime-helpers":"fRZO2"}],"5J0om":[function(e,t,n){let i={"storage.local":["get","set","remove","clear"],runtime:["sendMessage"],tabs:["create","sendMessage","query","update","remove"],windows:["update"],notifications:["create","clear"],permissions:["contains"],scripting:["executeScript"]};function o(e,t){return t.split(".").reduce((e,t)=>e?e[t]:void 0,e)}!function(){if("undefined"!=typeof browser&&browser?.runtime&&"undefined"!=typeof chrome&&chrome?.runtime)for(let[e,t]of Object.entries(i)){let n=o(chrome,e),i=o(browser,e);if(n&&i)for(let e of t){if("function"!=typeof n[e]||"function"!=typeof i[e])continue;let t=n[e].bind(n),o=i[e].bind(i);n[e]=(...e)=>e.length>0&&"function"==typeof e[e.length-1]?t(...e):o(...e)}}}()},{}],"1ryWA":[function(e,t,n){t.exports=e("f7dbd52f0e6ffd94").getBundleURL("aU7Ph")+e("68c430dd3f52fc7e").resolve("k4pd1")},{f7dbd52f0e6ffd94:"lqLMJ","68c430dd3f52fc7e":"ekZfu"}],lqLMJ:[function(e,t,n){var i={};function o(e){return(""+e).replace(/^((?:https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/.+)\/[^/]+$/,"$1")+"/"}n.getBundleURL=function(e){var t=i[e];return t||(t=function(){try{throw Error()}catch(t){var e=(""+t.stack).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^)\n]+/g);if(e)return o(e[2])}return"/"}(),i[e]=t),t},n.getBaseURL=o,n.getOrigin=function(e){var t=(""+e).match(/(https?|file|ftp|(chrome|moz|safari-web)-extension):\/\/[^/]+/);if(!t)throw Error("Origin not found");return t[0]}},{}],ilkAf:[function(e,t,n){var i=e("@bundler/runtime-helpers");i.defineInteropFlag(n),i.export(n,"APPLE_PRODUCT_IDS",()=>r),i.export(n,"isSafari",()=>s),i.export(n,"productIdOfPurchaseType",()=>l),i.export(n,"productIdOfPointsPackage",()=>p),i.export(n,"openAppPurchase",()=>c);var o=e("./env");let r={vipMonthly:"local.premium.monthly",vipMonthlyRenew:"local.premium.monthly.renew",vipYearly:"local.premium.yearly",vipYearlyRenew:"local.premium.yearly.renew",pointsBasic:"com.localvendor.brief.points.basic",pointsStandard:"com.localvendor.brief.points.standard",pointsPremium:"com.localvendor.brief.points.premium"};function a(){try{if("undefined"!=typeof browser&&browser?.runtime?.sendNativeMessage)return browser.runtime}catch{}try{let e=chrome;if(void 0!==e&&e?.runtime?.sendNativeMessage)return e.runtime}catch{}return null}function s(){try{let e=navigator.userAgent||"",t=/^((?!chrome|chromium|crios|edg|android|fxios|firefox).)*safari/i.test(e);return t||!!a()}catch{return!1}}function l(e){switch(e){case"MONTHLY_NEW":default:return r.vipMonthly;case"MONTHLY_EARLY_RENEW":case"YEARLY_ADD_MONTH":return r.vipMonthlyRenew;case"YEARLY_NEW":return r.vipYearly;case"YEARLY_EARLY_RENEW":case"MONTHLY_UPGRADE_TO_YEARLY":return r.vipYearlyRenew}}function p(e){switch(e.toUpperCase()){case"STANDARD":return r.pointsStandard;case"PREMIUM":return r.pointsPremium;default:return r.pointsBasic}}async function c(e,t){if(!e)return{ok:!1,message:"\u672a\u914d\u7f6e productId"};let n=`brief://buy?pid=${encodeURIComponent(e)}&token=${encodeURIComponent(t)}&api=${encodeURIComponent(o.config.apiDomain)}`;try{let e=await function(e){let t=a(),n=new Promise(t?(n,i)=>{try{let o=t.sendNativeMessage(e,e=>{let o=t.lastError;if(o){i(Error(o.message||"native error"));return}n(e)});o&&"function"==typeof o.then&&o.then(n,i)}catch(e){i(e)}}:(t,n)=>{try{let i=chrome.runtime.sendMessage({type:"IAP_NATIVE",payload:e},e=>{let i=chrome.runtime?.lastError;if(i){n(Error(i.message||"background relay error"));return}t(e)});i&&"function"==typeof i.then&&i.then(t,n)}catch(e){n(e)}}),i=new Promise((e,t)=>setTimeout(()=>t(Error("\u539f\u751f\u5c42\u65e0\u54cd\u5e94\uff08\u8d85\u65f6\uff09")),15e3));return Promise.race([n,i])}({action:"iap.openApp",url:n});if(e?.ok===!1)return{ok:!1,message:e?.error||"\u5524\u8d77 Briefly \u5e94\u7528\u5931\u8d25"};return{ok:!0}}catch(e){return console.error("[IAP] openAppPurchase error",e),{ok:!1,message:e?.message||"\u5524\u8d77 Briefly \u5e94\u7528\u5931\u8d25"}}}},{"./env":"fFvBB","@bundler/runtime-helpers":"fRZO2"}],fFvBB:[function(e,t,n){var i=e("@bundler/runtime-helpers");i.defineInteropFlag(n),i.export(n,"getEnvConfig",()=>a),i.export(n,"currentEnv",()=>s),i.export(n,"config",()=>l),i.export(n,"DEFAULT_BACKEND_URL",()=>p),i.export(n,"WEB_URL_PATTERNS",()=>c);let o={development:{name:"development",apiDomain:"https://dev.invalid/backend",webDomain:"https://dev.invalid"},test:{name:"test",apiDomain:"https://staging.invalid/backend",webDomain:"https://staging.invalid"},production:{name:"production",apiDomain:"https://local.invalid/backend",webDomain:"https://local.invalid"}};function r(){return!function(){try{return location?.hostname==="dev.invalid"}catch{return!1}}()?"production":"development"}function a(){let e=r();return o[e]||o.production}let s=r(),l=a(),p=l.apiDomain,c=Array.from(new Set([`${l.webDomain}/*`,"https://dev.invalid/*"]))},{"@bundler/runtime-helpers":"fRZO2"}],fRZO2:[function(e,t,n){n.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},n.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.exportAll=function(e,t){return Object.keys(e).forEach(function(n){"default"===n||"__esModule"===n||t.hasOwnProperty(n)||Object.defineProperty(t,n,{enumerable:!0,get:function(){return e[n]}})}),t},n.export=function(e,t,n){Object.defineProperty(e,t,{enumerable:!0,get:n})}},{}],"9qeAi":[function(e,t,n){var i=e("@bundler/runtime-helpers");i.defineInteropFlag(n),i.export(n,"DEFAULT_PRICING",()=>a),i.export(n,"fetchPricing",()=>s),i.export(n,"pointPkg",()=>l);var o=e("./env"),r=e("./apple-iap");let a={vip:{monthlyNew:{price:"25",perMonth:"25"},monthlyRenew:{price:"20",perMonth:"20"},yearlyNew:{price:"216",perMonth:"18",original:"308",save:"92"},yearlyRenew:{price:"199",perMonth:"16.6",original:"308",save:"109"}},points:[{key:"BASIC",points:2e3,price:"6",tag:"\u968f\u4e70\u968f\u7528"},{key:"STANDARD",points:6e3,price:"15.3",discount:"85\u6298",tag:"\u6700\u591a\u4eba\u8d2d\u5165",save:"2.7",original:"18"},{key:"PREMIUM",points:18e3,price:"43.2",discount:"8\u6298",tag:"\u8001\u7528\u6237\u9996\u9009",save:"7.8",original:"51"}]};async function s(){try{let e=(0,r.isSafari)()?"APPLE":"ALIPAY",t=await fetch(`${o.config.apiDomain}/`+["local","v1","catalog"].join("/")+`?channel=${e}`),n=await t.json();if(0===n.code&&n.data?.vip&&Array.isArray(n.data?.points))return n.data}catch{}return a}function l(e,t){return e.points.find(e=>e.key===t)||{key:t,points:0,price:""}}},{"./env":"fFvBB","./apple-iap":"ilkAf","@bundler/runtime-helpers":"fRZO2"}]},["NA1En","5A5Vt"],"5A5Vt","parcelRequire42d0"),globalThis.define=t;