/* ===========================================================
   一封写给你的信

   ★ 你只需要改下面这个 CONFIG，就够用了。
     改完存一下，刷新网页就能看到新的内容。
   =========================================================== */

const CONFIG = {

  /* 信纸开头的那句称呼 */
  salutation: "致 我的宝贝",

  /* 信件正文。一个引号里是一段，想写几段就写几段。
     段与段之间会自动空一行，不用自己加空行。 */
  paragraphs: [
    "今天是你的生日。想说的话其实很多，可真正提起笔来，最先冒出来的还是那三个字——遇见你，是我这几年里最好的运气。",
    "谢谢你陪我走过那些平平常常的日子。你笑起来的样子、你认真做事的样子、你赖床的样子，我都很喜欢，喜欢了很久。",
    "往后的每一年，我都想陪你过生日。愿你被这个世界温柔以待，愿你想做的事都来得及，愿你的每一天都比昨天更快乐一点。",
  ],

  /* 落款 */
  signature: "你的名字",

  /* 日期。填 null 就是「打开网页的那一天」，也可以自己写死，比如 "2026年10月4日" */
  date: null,

  /* 音乐文件放在 assets 文件夹里，名字要和这里一致 */
  musicFile: "assets/music.mp3",

  /* 音乐音量，0 到 1 之间。想更轻一点就写 0.35 */
  volume: 0.55,

  /* 音乐淡入的时间（毫秒），避免一开口就很大声 */
  fadeInMs: 1500,

  /* 逐字显现的速度：每个字停多少毫秒。数字越大写得越慢 */
  typeSpeedMs: 38,

  /* 遇到逗号句号时多停一下（毫秒） */
  punctuationPauseMs: 220,

  /* 换段时多停一下（毫秒） */
  paragraphPauseMs: 460,

  /* 整封信最长写多久（毫秒）。内容太长会自动加快，不会让人等太久 */
  maxTypingMs: 22000,
};


/* ===========================================================
   下面都是程序本身，一般不需要改
   =========================================================== */

(function () {
  "use strict";

  const html        = document.documentElement;
  const envelope    = document.getElementById("envelope");
  const letterPaper = document.getElementById("letterPaper");
  const salutationE = document.getElementById("salutation");
  const bodyE       = document.getElementById("letterBody");
  const signatureE  = document.getElementById("signature");
  const dateE       = document.getElementById("letterDate");
  const audio       = document.getElementById("audio");
  const toggle      = document.getElementById("audioToggle");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINAL_DELAY  = reduceMotion ? 0 : 1020;

  let opened = false;

  /* ---------- 把配置里的文字放进信纸 ---------- */

  salutationE.textContent = CONFIG.salutation;
  signatureE.textContent  = CONFIG.signature;
  dateE.textContent       = CONFIG.date === null ? todayInChinese() : CONFIG.date;

  function todayInChinese() {
    const d = new Date();
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
  }

  /* ---------- 音乐 ---------- */

  let fadeTimer = null;

  audio.loop    = true;
  audio.preload = "auto";
  audio.volume  = 0;
  audio.src     = CONFIG.musicFile;

  // 音频加载不出来（比如文件还没放进去）时，把按钮藏起来，动画照常走
  audio.addEventListener("error", function () {
    toggle.hidden = true;
    toggle.classList.remove("is-visible", "is-playing");
  });

  function fadeVolume(to, duration) {
    if (fadeTimer) {
      window.clearInterval(fadeTimer);
      fadeTimer = null;
    }
    const from  = audio.volume;
    const start = performance.now();

    fadeTimer = window.setInterval(function () {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = t * t * (3 - 2 * t); // 平滑一点
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      if (t >= 1) {
        window.clearInterval(fadeTimer);
        fadeTimer = null;
      }
    }, 40);
  }

  function showToggle() {
    toggle.hidden = false;
    // 让 display 先生效，再加类，过渡才会跑
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        toggle.classList.add("is-visible");
      });
    });
  }

  function startMusic() {
    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(function () {
        showToggle();
        toggle.classList.add("is-playing");
        toggle.setAttribute("aria-pressed", "true");
        toggle.setAttribute("aria-label", "暂停音乐");
        fadeVolume(CONFIG.volume, CONFIG.fadeInMs);
      }).catch(function () {
        // 浏览器拦了自动播放，或者文件还没有：安静地退场
        toggle.hidden = true;
      });
    }
  }

  toggle.addEventListener("click", function () {
    if (audio.paused) {
      audio.play().then(function () {
        toggle.classList.add("is-playing");
        toggle.setAttribute("aria-pressed", "true");
        toggle.setAttribute("aria-label", "暂停音乐");
        fadeVolume(CONFIG.volume, 700);
      }).catch(function () {});
    } else {
      fadeVolume(0, 240);
      window.setTimeout(function () { audio.pause(); }, 250);
      toggle.classList.remove("is-playing");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "继续播放音乐");
    }
  });

  /* ---------- 逐字写作 ---------- */

  const PUNCTUATION = "，。、！？；：…—～·,.;:!?";

  /* 信纸先按内容量一次高度，短的紧凑、长的可滚动，
     而且开始写之后高度不再变化，不会一跳一跳 */
  function sizePaperToContent() {
    const cap = letterPaper.offsetHeight;
    CONFIG.paragraphs.forEach(function (t) {
      const p = document.createElement("p");
      p.textContent = t;
      bodyE.appendChild(p);
    });
    letterPaper.style.height = "auto";
    const natural = letterPaper.offsetHeight;
    letterPaper.style.height = Math.round(Math.min(natural, cap)) + "px";
    bodyE.textContent = "";
  }

  function typeLetter() {
    const paragraphs = [];

    CONFIG.paragraphs.forEach(function (text) {
      const p = document.createElement("p");
      bodyE.appendChild(p);
      // 用 Array.from 拆字，表情符号之类的才不会被拆坏
      paragraphs.push({ el: p, chars: Array.from(text), node: null, index: 0 });
    });

    if (reduceMotion) {
      paragraphs.forEach(function (item) { item.el.textContent = item.text; });
      letterPaper.classList.add("is-signed");
      return;
    }

    // 先估一下要写多久，太长就自动提速
    let estimate = 0;
    paragraphs.forEach(function (item, i) {
      item.chars.forEach(function (ch) {
        estimate += CONFIG.typeSpeedMs + (PUNCTUATION.indexOf(ch) >= 0 ? CONFIG.punctuationPauseMs : 0);
      });
      estimate += CONFIG.paragraphPauseMs;
    });
    const speed = estimate > CONFIG.maxTypingMs
      ? Math.max(10, CONFIG.typeSpeedMs * (CONFIG.maxTypingMs / estimate))
      : CONFIG.typeSpeedMs;

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");

    let pi = 0;
    let lastScroll = 0;

    function step() {
      // 换到下一段
      while (pi < paragraphs.length && paragraphs[pi].index >= paragraphs[pi].chars.length) {
        pi += 1;
        if (pi < paragraphs.length) {
          window.setTimeout(step, CONFIG.paragraphPauseMs);
          return;
        }
      }

      if (pi >= paragraphs.length) {
        finish();
        return;
      }

      const item = paragraphs[pi];

      if (item.node === null) {
        item.node = document.createTextNode("");
        item.el.appendChild(item.node);
        item.el.appendChild(cursor);
      }

      const ch = item.chars[item.index];
      item.node.data += ch;
      item.index += 1;

      // 光标别跑出可视区
      const now = performance.now();
      if (now - lastScroll > 120) {
        lastScroll = now;
        keepVisible();
      }

      const wait = speed + (PUNCTUATION.indexOf(ch) >= 0 ? CONFIG.punctuationPauseMs : 0);
      window.setTimeout(step, wait);
    }

    function keepVisible() {
      const bottomSafe = letterPaper.scrollTop + letterPaper.clientHeight * 0.72;
      if (cursor.offsetTop > bottomSafe) {
        letterPaper.scrollTo({
          top: cursor.offsetTop - letterPaper.clientHeight * 0.5,
          behavior: "smooth",
        });
      }
    }

    function finish() {
      cursor.classList.remove("cursor");
      cursor.classList.add("cursor", "is-resting");
      window.setTimeout(function () { cursor.remove(); }, 3800);
      // 信写完了，落款再浮现出来
      window.setTimeout(function () { letterPaper.classList.add("is-signed"); }, 280);
    }

    window.setTimeout(step, 260);
  }

  /* ---------- 打开信封 ---------- */

  function openLetter() {
    if (opened) { return; }
    opened = true;

    startMusic();               // 必须紧跟这次点击，浏览器才允许出声
    sizePaperToContent();
    html.classList.add("is-open");

    window.setTimeout(function () {
      if (!reduceMotion) { envelope.style.pointerEvents = "none"; }
    }, 60);

    window.setTimeout(typeLetter, FINAL_DELAY + (reduceMotion ? 0 : 700));
  }

  envelope.addEventListener("click", openLetter);

  envelope.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      openLetter();
    }
  });

  /* 兜底：如果浏览器直接跳到了「已经打开」的状态（比如从缓存恢复），
     避免出现一张永远空白的信纸 */
  window.addEventListener("pageshow", function () {
    if (opened && !bodyE.childElementCount && !reduceMotion) {
      typeLetter();
    }
  });

})();
