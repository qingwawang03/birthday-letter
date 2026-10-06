/* ===========================================================
   一封写给你的信

   ★ 你只需要改下面这个 CONFIG，就够用了。
     改完存一下，刷新网页就能看到新的内容。
   =========================================================== */

const CONFIG = {

  /* 信纸开头的那句称呼 */
  salutation: "亲爱的蔡雅慧：",

  /* 信件正文。一个引号里是一段，想写几段就写几段。
     段与段之间会自动空一行，不用自己加空行。 */
  paragraphs: [
    "这两天在B站看了《给阿嬷的情书》，果然很好看，南洋和汕头的距离被一张张侨批的信纸缩短。有一张远方来信，就日有所期。同样，有一张回信等待被书写，日子也会有了盼头。",
    "我便萌生了一个念头，给大埔仔村的你，写一封电子信。",
    "祝你23岁生日快乐！",
    "你是敢闯之人！独身闯香港，扎根大埔仔。你一个人去观塘、去坑口、去将军澳、去大巴站、去深圳、去高山、去海角。我由衷的敬佩你。每每想到如果我去留学，我会敢乘巴士跨城旅行吗？我会敢和司机喊下一站下车吗？我会敢在商城问售货员吗？我会敢给老师发邮件吗？当我还在内心提前紧张时，你已经让自己的生活步入了正轨，你做到了！",
    "你是敢打之人！你敢打蟑螂打蜘蛛打蛾子，内心的恐惧被你克服，关关难过关关过。你敢打反诈中心电话，主动发现生活的疑点，积极解决每一道难题。勇气和智力在你身上结合的恰到好处。",
    "你是敢爱之人！你爱王嘉尔。爱一个人是很了不起的能力，它不是三分钟的热度，也不是浮于表面的欢喜，而是持久的，深沉的，热烈的。我不追星也没有最喜欢的球队，不是因为他们不够好，是我不敢认真了解，不敢全心全意。因此我再次由衷的敬佩你，自始至终的爱，是你最打动人的地方。",
    "于是我选了专辑作为礼物，选了《Dear》作为背景音乐。",
    "原来Dear是一首写亲情的歌啊，祝愿你在疲惫沉沦难过时也会想起家人，那里有依靠，有光照。当然，也欢迎你想起我。",
    "希望演唱会开到广东！给你抢票！",
  ],

  /* 落款 */
  signature: "徐远哲",

  /* 日期。填 null 就是「打开网页的那一天」，写死就用你写的那天 */
  date: "2026年10月7日",

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

  /* 整封信最长写多久（毫秒）。内容太长会自动加快，不会让人等太久。
     对方也可以点一下信纸，直接把剩下的一次读完 */
  maxTypingMs: 24000,
};


/* ===========================================================
   下面都是程序本身，一般不需要改
   =========================================================== */

(function () {
  "use strict";

  const html        = document.documentElement;
  const envelope    = document.getElementById("envelope");
  const letterCard  = document.getElementById("letterCard");
  const letterPaper = document.getElementById("letterPaper");
  const salutationE = document.getElementById("salutation");
  const bodyE       = document.getElementById("letterBody");
  const signatureE  = document.getElementById("signature");
  const dateE       = document.getElementById("letterDate");
  const audio       = document.getElementById("audio");
  const toggle      = document.getElementById("audioToggle");
  const skipHint    = document.getElementById("skipHint");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINAL_DELAY  = reduceMotion ? 0 : 1020;

  let opened = false;
  let typed  = false;

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
  const HINT_AFTER_MS = 9000;   // 预计要写这么久以上，就给一个「直接读完」的出口

  let typer = null;             // 当前这次逐字写作的状态

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
    // 只允许写一次：任何重复触发都不会把整封信写两遍
    if (typed) { return; }
    typed = true;

    const paragraphs = [];

    CONFIG.paragraphs.forEach(function (text) {
      const p = document.createElement("p");
      bodyE.appendChild(p);
      // 用 Array.from 拆字，表情符号之类的才不会被拆坏
      paragraphs.push({ el: p, chars: Array.from(text), node: null, index: 0 });
    });

    if (reduceMotion) {
      paragraphs.forEach(function (item) { item.el.textContent = item.chars.join(""); });
      letterPaper.classList.add("is-signed");
      return;
    }

    // 先估一下要写多久。太长就把每个字的间隔和停顿一起缩短，
    // 保证整封信在 maxTypingMs 之内写完
    let estimate = 0;
    paragraphs.forEach(function (item) {
      item.chars.forEach(function (ch) {
        estimate += CONFIG.typeSpeedMs + (PUNCTUATION.indexOf(ch) >= 0 ? CONFIG.punctuationPauseMs : 0);
      });
      estimate += CONFIG.paragraphPauseMs;
    });
    const scale   = estimate > CONFIG.maxTypingMs ? Math.max(0.2, CONFIG.maxTypingMs / estimate) : 1;
    const charMs  = Math.max(9, CONFIG.typeSpeedMs * scale);
    const punctMs = CONFIG.punctuationPauseMs * scale;
    const paraMs  = CONFIG.paragraphPauseMs * scale;

    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");

    typer = { paragraphs: paragraphs, cursor: cursor, timer: null, finished: false };

    let pi = 0;
    let lastScroll = 0;

    if (estimate > HINT_AFTER_MS) { showSkipHint(); }

    function step() {
      // 换到下一段
      while (pi < paragraphs.length && paragraphs[pi].index >= paragraphs[pi].chars.length) {
        pi += 1;
        if (pi < paragraphs.length) {
          typer.timer = window.setTimeout(step, paraMs);
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

      const wait = charMs + (PUNCTUATION.indexOf(ch) >= 0 ? punctMs : 0);
      typer.timer = window.setTimeout(step, wait);
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
      typer.finished = true;
      hideSkipHint();
      cursor.classList.add("is-resting");
      window.setTimeout(function () { cursor.remove(); }, 3800);
      // 信写完了，落款再浮现出来
      window.setTimeout(function () { letterPaper.classList.add("is-signed"); }, 280);
    }

    typer.timer = window.setTimeout(step, 260);
  }

  function showSkipHint() {
    skipHint.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { skipHint.classList.add("is-visible"); });
    });
  }

  function hideSkipHint() {
    skipHint.classList.remove("is-visible");
    window.setTimeout(function () { skipHint.hidden = true; }, 560);
  }

  /* 点一下信纸，把还没写的部分一次写完（不想等的时候用） */
  function skipTyping() {
    if (!typer || typer.finished) { return; }
    window.clearTimeout(typer.timer);
    typer.finished = true;

    typer.paragraphs.forEach(function (item) {
      if (item.node === null) {
        item.node = document.createTextNode("");
        item.el.appendChild(item.node);
      }
      item.node.data = item.chars.join("");
      item.index = item.chars.length;
    });

    typer.cursor.remove();
    hideSkipHint();
    letterPaper.classList.add("is-signed");
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

  // 信写到一半时，点信纸就能直接读完
  letterCard.addEventListener("click", skipTyping);

  envelope.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      openLetter();
    }
  });

})();
