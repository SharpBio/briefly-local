var e,t;"function"==typeof(e=globalThis.define)&&(t=e,e=null),function(t,n,i,o,r){var a="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},l="function"==typeof a[o]&&a[o],d=l.cache||{},s="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function u(e,n){if(!d[e]){if(!t[e]){var i="function"==typeof a[o]&&a[o];if(!n&&i)return i(e,!0);if(l)return l(e,!0);if(s&&"string"==typeof e)return s(e);var r=Error("Cannot find module '"+e+"'");throw r.code="MODULE_NOT_FOUND",r}p.resolve=function(n){var i=t[e][1][n];return null!=i?i:n},p.cache={};var c=d[e]=new u.Module(e);t[e][0].call(c.exports,p,c,c.exports,this)}return d[e].exports;function p(e){var t=p.resolve(e);return!1===t?{}:u(t)}}u.isParcelRequire=!0,u.Module=function(e){this.id=e,this.bundle=u,this.exports={}},u.modules=t,u.cache=d,u.parent=l,u.register=function(e,n){t[e]=[function(e,t){t.exports=n},{}]},Object.defineProperty(u,"root",{get:function(){return a[o]}}),a[o]=u;for(var c=0;c<n.length;c++)u(n[c]);if(i){var p=u(i);"object"==typeof exports&&"undefined"!=typeof module?module.exports=p:"function"==typeof e&&e.amd?e(function(){return p}):r&&(this[r]=p)}}({b4ayS:[function(e,t,n){var i=e("@bundler/runtime-helpers");i.defineInteropFlag(n),i.export(n,"config",()=>o),e("./m/lib/browser-compat");let o={matches:["https://www.youtube.com/*","https://youtube.com/*","https://www.bilibili.com/video/*","https://www.bilibili.com/bangumi/*"],run_at:"document_idle"},r="brief-video-theater-root",a="brief-video-theater-overlay",l="brief-video-theater-stage",d="brief-video-theater-shine",s="brief-video-theater-style",u="brief-video-theater-active",c="brief-video-theater-target",p="briefWelcome",m=["#movie_player","#full-bleed-container ytd-player","ytd-player#ytd-player","#player"],f=[".bpx-player-container","#bilibili-player","#bilibiliPlayer",".bilibili-player-video-wrap","#player_module"];function y(e){if(!(e instanceof HTMLElement))return!1;let t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>80&&t.height>80&&"none"!==n.display&&"hidden"!==n.visibility}function h(){return w(window.location.href)?"youtube":!function(e){try{let t=new URL(e),n=t.hostname.toLowerCase();if(!n.endsWith("bilibili.com"))return!1;return/^\/video\/(?:BV[0-9A-Za-z]+|av\d+)/i.test(t.pathname)||/^\/bangumi\/play\/ep\d+/i.test(t.pathname)}catch{return!1}}(window.location.href)?"unknown":"bilibili"}function w(e){try{let t=new URL(e),n=t.hostname.toLowerCase().replace(/^www\./,""),i="youtu.be"===n?[t.pathname.split("/").filter(Boolean)[0]||""]:"youtube.com"===n?["/watch"===t.pathname&&t.searchParams.get("v")||"",t.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/)?.[1]||"",t.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/)?.[1]||""]:[];return i.find(e=>/^[A-Za-z0-9_-]{11}$/.test(e))||""}catch{return""}}function b(e){try{let t=new URL(e),n=t.hostname.toLowerCase().replace(/^www\./,"");if("youtube.com"===n||"youtu.be"===n){let i=w(e);return i?`youtube:${i}`:`${n}${t.pathname}`}if(n.endsWith("bilibili.com")){let i=e.match(/BV[0-9A-Za-z]+/)?.[0],o=e.match(/ep\d+/i)?.[0];return i?`bilibili:${i}`:o?`bilibili:${o}`:`${n}${t.pathname}`}return`${n}${t.pathname}`}catch{return e.trim()}}function g(e){let t=document.getElementById(d);t&&t.remove()}let v=null,E=null,x=null,$=0;function L(){!function(){if(document.getElementById(s))return;let e=document.createElement("style");e.id=s,e.textContent=`
    html.${u},
    body.${u} {
      overflow-x: clip;
    }

    #${a} {
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      background: transparent;
      box-shadow:
        0 0 0 9999px rgba(7, 11, 18, 0.72),
        0 0 80px rgba(255, 210, 120, 0.12);
      opacity: 0;
      pointer-events: none;
      transition:
        opacity 260ms ease,
        top 180ms ease,
        left 180ms ease,
        width 180ms ease,
        height 180ms ease;
      z-index: 2147483000;
    }

    #${l} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483001;
    }

    #${r}.${u} #${a} {
      opacity: 1;
    }

    .${c} {
      pointer-events: auto !important;
      position: relative !important;
      z-index: 2147483001 !important;
      transform-origin: center center;
      transition:
        transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
        box-shadow 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
        filter 280ms ease;
      box-shadow:
        0 32px 90px rgba(0, 0, 0, 0.52),
        0 0 0 1px rgba(255, 255, 255, 0.06),
        0 0 48px rgba(255, 214, 102, 0.12);
      filter: saturate(1.04) brightness(1.03);
    }

    #${r}.${u} .${c} {
      transform: translateY(-6px) scale(1.018);
    }

    #${d} {
      position: fixed;
      pointer-events: none;
      opacity: 0;
      overflow: hidden;
      z-index: 2147483002;
      transition: opacity 220ms ease;
    }

    #${d}::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        115deg,
        transparent 0%,
        transparent 32%,
        rgba(255, 255, 255, 0.14) 42%,
        rgba(255, 244, 186, 0.55) 50%,
        rgba(255, 255, 255, 0.14) 58%,
        transparent 68%,
        transparent 100%
      );
      background-size: 220% 100%;
      background-position: 140% 0;
      mix-blend-mode: screen;
      animation: brief-video-theater-shine 2.8s ease-in-out infinite;
    }

    #${r}.${u} #${d} {
      opacity: 1;
    }

    @keyframes brief-video-theater-shine {
      0% {
        background-position: 140% 0;
      }

      65% {
        background-position: -70% 0;
      }

      100% {
        background-position: -70% 0;
      }
    }
  `,document.documentElement.appendChild(e)}();let e=function(){let e=document.getElementById(r);if(!e){(e=document.createElement("div")).id=r;let t=document.createElement("div");t.id=a,e.appendChild(t);let n=document.createElement("div");n.id=l,e.appendChild(n),document.documentElement.appendChild(e)}return e}(),t=b(window.location.href);if(E===t&&v&&document.documentElement.contains(v)&&y(v)&&e.classList.contains(u))return;let n=function(){let e="youtube"===h()?m:f;for(let t of e){let e=document.querySelector(t);if(y(e))return e}let t=Array.from(document.querySelectorAll("video")).find(e=>y(e.closest("div")||e));return t?t.closest("div")||t:null}();n&&(v&&v!==n&&(v.classList.remove(c),g(v)),v=n,E=t,v.classList.add(c),function(e){let t=e.querySelector(`#${l}`);if(!t||document.getElementById(d))return;let n=document.createElement("div");n.id=d,t.appendChild(n)}(e),function(e,t){x?.();let n=function(e,t){let n=new Map;return t.forEach(t=>{n.set(t,e.style.getPropertyValue(t)||null)}),()=>{t.forEach(t=>{let i=n.get(t);i?e.style.setProperty(t,i):e.style.removeProperty(t)})}}(t,["position","transform","z-index"]),i=()=>{if(!v||v!==t)return;let e=document.getElementById(a),n=document.getElementById(d),i=t.getBoundingClientRect();t.style.setProperty("position","relative","important"),t.style.setProperty("transform","translateY(-6px) scale(1.018)","important"),t.style.setProperty("z-index","2147483001","important"),e instanceof HTMLElement&&(e.style.top=`${i.top}px`,e.style.left=`${i.left}px`,e.style.width=`${i.width}px`,e.style.height=`${i.height}px`,e.style.borderRadius=window.getComputedStyle(t).borderRadius||"0px"),n instanceof HTMLElement&&(n.style.top=`${i.top}px`,n.style.left=`${i.left}px`,n.style.width=`${i.width}px`,n.style.height=`${i.height}px`,n.style.borderRadius=window.getComputedStyle(t).borderRadius||"0px")},o=()=>{cancelAnimationFrame($),$=requestAnimationFrame(i)};i(),window.addEventListener("scroll",o,!0),window.addEventListener("resize",o),x=()=>{cancelAnimationFrame($),window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),n()}}(0,v),e.classList.add(u),document.documentElement.classList.add(u),document.body?.classList.add(u))}function _(){E=null,document.getElementById(r)?.classList.remove(u),document.documentElement.classList.remove(u),document.body?.classList.remove(u),v&&(v.classList.remove(c),g(v),x?.(),x=null,v=null)}/* Hovering the floating trigger opens the spotlight view: dim the page,
   lift the player and sweep a highlight. Runs in the same world as the
   built-in L()/_() helpers, with a 90ms leave delay to avoid flicker. */
!function(){var W="brief-welcome-translate-root",on=!1,tid=0;function hit(t){return !!(t&&t.closest&&t.closest("#"+W))}function enter(){window.clearTimeout(tid),on=!0;let t=document.getElementById(r);(!t||!t.classList.contains(u))&&L()}function leave(){window.clearTimeout(tid),tid=window.setTimeout(()=>{on&&(on=!1,_())},90)}document.addEventListener("mouseover",e=>{hit(e.target)&&enter()},!0),document.addEventListener("mouseout",e=>{if(!hit(e.target))return;let t=e.relatedTarget,n=document.getElementById(W);(t&&(hit(t)||n&&n.contains(t)))||leave()},!0),document.addEventListener("focusin",e=>{hit(e.target)&&enter()},!0),document.addEventListener("focusout",e=>{hit(e.target)&&!hit(e.relatedTarget)&&leave()},!0),document.addEventListener("touchstart",e=>{hit(e.target)&&enter()},!0),document.addEventListener("touchend",e=>{hit(e.target)&&leave()},!0)}(),chrome.runtime.onMessage.addListener(e=>{e?.type==="spotlight"&&(e.enabled?L():_())}),window.addEventListener("brief-spotlight",e=>{let t=e instanceof CustomEvent?e.detail:null;t?.enabled?L():_()}),window.addEventListener("message",e=>{e.source===window&&e.data?.type==="BRIEF_SPOTLIGHT"&&(e.data.enabled?L():_())}),window.addEventListener("pagehide",_),window.addEventListener("beforeunload",_),document.addEventListener("visibilitychange",()=>{"hidden"===document.visibilityState&&_()}),function(){let e=function(){let e=new URLSearchParams(window.location.search).get(p)||new URLSearchParams(window.location.hash.replace(/^#/,"")).get(p);if(!e)return null;try{let t=JSON.parse(e),n="string"==typeof t.url&&t.url?t.url:window.location.href,i="string"==typeof t.normalizedUrl&&t.normalizedUrl?t.normalizedUrl:b(n);if(i!==b(window.location.href))return null;return{platform:"string"==typeof t.platform?t.platform:h(),uniqueIdentifier:"string"==typeof t.uniqueIdentifier?t.uniqueIdentifier:i,url:n,normalizedUrl:i,title:"string"==typeof t.title?t.title:document.title||"",duration:"string"==typeof t.duration?t.duration:"",createdAt:"number"==typeof t.createdAt?t.createdAt:Date.now()}}catch{return null}}();if(!e)return;let t=()=>{window.dispatchEvent(new CustomEvent("brief-welcome-video-target",{detail:e})),window.postMessage({type:"BRIEF_WELCOME_VIDEO_TARGET",target:e},window.location.origin)};t(),window.setTimeout(t,450),window.setTimeout(t,1200)}()},{"./m/lib/browser-compat":"5J0om","@bundler/runtime-helpers":"fRZO2"}],"5J0om":[function(e,t,n){let i={"storage.local":["get","set","remove","clear"],runtime:["sendMessage"],tabs:["create","sendMessage","query","update","remove"],windows:["update"],notifications:["create","clear"],permissions:["contains"],scripting:["executeScript"]};function o(e,t){return t.split(".").reduce((e,t)=>e?e[t]:void 0,e)}!function(){if("undefined"!=typeof browser&&browser?.runtime&&"undefined"!=typeof chrome&&chrome?.runtime)for(let[e,t]of Object.entries(i)){let n=o(chrome,e),i=o(browser,e);if(n&&i)for(let e of t){if("function"!=typeof n[e]||"function"!=typeof i[e])continue;let t=n[e].bind(n),o=i[e].bind(i);n[e]=(...e)=>e.length>0&&"function"==typeof e[e.length-1]?t(...e):o(...e)}}}()},{}],fRZO2:[function(e,t,n){n.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},n.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.exportAll=function(e,t){return Object.keys(e).forEach(function(n){"default"===n||"__esModule"===n||t.hasOwnProperty(n)||Object.defineProperty(t,n,{enumerable:!0,get:function(){return e[n]}})}),t},n.export=function(e,t,n){Object.defineProperty(e,t,{enumerable:!0,get:n})}},{}]},["b4ayS"],"b4ayS","parcelRequire42d0"),globalThis.define=t;