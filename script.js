const CONFIG = {
  guestbookUrl: "https://script.google.com/macros/s/AKfycbwwtcx0T4JUFJE8LQNkjgKgnZhSKkQpiz5xF4JCKIblPmO0Iz0ludQQwQG4UMDMlrzNwg/exec",
  eventStart: "2026-11-27T09:30:00+07:00",
};

const REEL_FRAMES = [
  { src: "images/frames/01.jpg" },
  { text: "2026" },
  { src: "images/frames/02.jpg" },
  { src: "images/frames/03.jpg" },
  { text: "Bách Khoa" },
  { src: "images/frames/04.jpg" },
  { src: "images/frames/05.jpg" },
  { text: "27 · 11" },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function startCountdown() {
  const target = new Date(CONFIG.eventStart).getTime();
  const box = document.getElementById("countdown");
  const done = document.getElementById("countdown-done");
  const units = {};
  box.querySelectorAll("[data-unit]").forEach((el) => { units[el.dataset.unit] = el; });

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      box.hidden = true;
      done.hidden = false;
      return false;
    }
    const s = Math.floor(diff / 1000);
    units.days.textContent = String(Math.floor(s / 86400)).padStart(2, "0");
    units.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
    units.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    units.seconds.textContent = String(s % 60).padStart(2, "0");
    return true;
  }

  if (tick()) {
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
  }
}

function buildReel() {
  const track = document.getElementById("reel-track");
  const frames = [];
  for (let i = 0; i < 3; i++) frames.push(...REEL_FRAMES);
  const html = frames.map((f) => f.src
    ? `<div class="reel__frame"><img src="${f.src}" alt="" loading="lazy"></div>`
    : `<div class="reel__frame reel__frame--text">${f.text}</div>`).join("");
  track.innerHTML = html + html;
}

function startDust() {
  const canvas = document.getElementById("dust");
  const hero = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let width = 0;
  let height = 0;
  let motes = [];
  let embers = [];
  let running = false;
  let visible = true;
  let frame = 0;

  function makeMote(randomY) {
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + 10,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.25 + 0.05),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.01 + 0.004,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      warm: Math.random() < 0.6,
    };
  }

  function makeEmber() {
    const fromLeft = Math.random() < 0.5;
    return {
      x: fromLeft ? Math.random() * width * 0.4 : width * (0.6 + Math.random() * 0.4),
      y: height * (0.55 + Math.random() * 0.45),
      vx: (fromLeft ? 1 : -1) * (Math.random() * 0.6 + 0.3),
      vy: -(Math.random() * 1.1 + 0.6),
      life: 0,
      max: Math.random() * 140 + 120,
      len: Math.random() * 14 + 10,
    };
  }

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.round((width * height) / 11000));
    motes = Array.from({ length: count }, () => makeMote(true));
    embers = [];
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    for (const m of motes) {
      m.y += m.vy;
      m.sway += m.swaySpeed;
      m.twinkle += m.twinkleSpeed;
      m.x += Math.sin(m.sway) * 0.2;
      if (m.y < -10) Object.assign(m, makeMote(false));
      const heightFade = Math.min(1, (m.y / height) * 1.6);
      const a = (0.35 + 0.65 * Math.abs(Math.sin(m.twinkle))) * heightFade;
      ctx.fillStyle = m.warm ? `rgba(255, 196, 120, ${a})` : `rgba(255, 238, 205, ${a})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      if (m.r > 1.3 && a > 0.75) {
        ctx.fillStyle = `rgba(255, 220, 160, ${a * 0.15})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (embers.length < 5 && Math.random() < 0.02) embers.push(makeEmber());
    embers = embers.filter((e) => e.life < e.max);
    for (const e of embers) {
      e.life++;
      e.x += e.vx;
      e.y += e.vy;
      const t = e.life / e.max;
      const a = Math.sin(t * Math.PI) * 0.9;
      const speed = Math.hypot(e.vx, e.vy);
      const tx = e.x - (e.vx / speed) * e.len;
      const ty = e.y - (e.vy / speed) * e.len;
      const grad = ctx.createLinearGradient(e.x, e.y, tx, ty);
      grad.addColorStop(0, `rgba(255, 210, 140, ${a})`);
      grad.addColorStop(1, "rgba(255, 110, 30, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }

  function loop() {
    if (!running) return;
    draw();
    frame = requestAnimationFrame(loop);
  }

  function update() {
    const shouldRun = visible && !document.hidden && !reducedMotion;
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(loop);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  resize();
  if (reducedMotion) draw();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reducedMotion) draw(); }, 150);
  });
  document.addEventListener("visibilitychange", update);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(hero);
  update();
}

function setupTopbar() {
  const bar = document.getElementById("topbar");
  const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((el) => io.observe(el));
}

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderWish(wish) {
  const li = document.createElement("li");
  li.className = "wish";
  const head = document.createElement("p");
  head.className = "wish__name";
  const name = document.createElement("span");
  name.textContent = wish.name;
  const time = document.createElement("span");
  time.className = "wish__time";
  const date = new Date(wish.time);
  time.textContent = isNaN(date) ? "" : formatTime(date);
  head.append(name, time);
  const msg = document.createElement("p");
  msg.className = "wish__msg";
  msg.textContent = wish.message;
  li.append(head, msg);
  return li;
}

function showWishes(wishes, highlightFirst) {
  const list = document.getElementById("wish-list");
  list.replaceChildren();
  if (!wishes.length) {
    const empty = document.createElement("li");
    empty.className = "wish-empty";
    empty.textContent = "Chưa có lời chúc nào — bạn hãy là người đầu tiên nhé.";
    list.append(empty);
    return;
  }
  const items = wishes.map(renderWish);
  if (highlightFirst) items[0].classList.add("is-new");
  list.append(...items);
  list.scrollTop = 0;
}

async function loadWishes(highlightFirst = false) {
  if (!CONFIG.guestbookUrl) return;
  try {
    const res = await fetch(CONFIG.guestbookUrl, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) showWishes(data.wishes, highlightFirst);
  } catch (err) {
    console.error("Could not load wishes", err);
  }
}

function setupForm() {
  const form = document.getElementById("wish-form");
  const status = document.getElementById("form-status");
  const button = form.querySelector('button[type="submit"]');

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  }

  if (!CONFIG.guestbookUrl) {
    setStatus("Sổ lưu bút chưa được kết nối.", "error");
    button.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const field = (key) => form.elements.namedItem(key).value;
    const payload = {
      name: field("name").trim(),
      message: field("message").trim(),
      website: field("website"),
    };
    if (!payload.name || !payload.message) {
      setStatus("Bạn điền giúp mình tên và lời chúc nhé.", "error");
      return;
    }
    button.disabled = true;
    setStatus("Đang gửi…");
    try {
      const res = await fetch(CONFIG.guestbookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "unknown");
      form.reset();
      setStatus("Cảm ơn bạn đã gửi lời chúc!", "ok");
      await loadWishes(true);
    } catch (err) {
      console.error("Could not send wish", err);
      setStatus("Gửi chưa được, bạn thử lại sau chút nhé.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

startCountdown();
buildReel();
startDust();
setupTopbar();
setupReveal();
setupForm();
loadWishes();
