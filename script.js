const CONFIG = {
  guestbookUrl: "https://script.google.com/macros/s/AKfycbwwtcx0T4JUFJE8LQNkjgKgnZhSKkQpiz5xF4JCKIblPmO0Iz0ludQQwQG4UMDMlrzNwg/exec",
  eventStart: "2026-11-27T09:30:00+07:00",
};

const REEL_FRAMES = [
  "images/frames/01.jpg?v=2",
  "images/frames/02.jpg?v=2",
  "images/frames/15.jpg",
  "images/frames/03.jpg?v=3",
  "images/frames/16.jpg",
  "images/frames/04.jpg?v=2",
  "images/frames/05.jpg?v=2",
  "images/frames/17.jpg",
  "images/frames/06.jpg?v=2",
  "images/frames/07.jpg?v=2",
  "images/frames/18.jpg",
  "images/frames/08.jpg?v=2",
  "images/frames/21.jpg",
  "images/frames/09.jpg?v=2",
  "images/frames/19.jpg",
  "images/frames/10.jpg?v=2",
  "images/frames/11.jpg?v=2",
  "images/frames/20.jpg",
  "images/frames/12.jpg?v=2",
  "images/frames/13.jpg?v=2",
  "images/frames/14.jpg?v=2",
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
    const pad = (n) => String(n).padStart(2, "0");
    units.days.textContent = pad(Math.floor(s / 86400));
    units.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    units.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    units.seconds.textContent = pad(s % 60);
    return true;
  }

  if (tick()) {
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
  }
}

function buildReel() {
  const track = document.getElementById("reel-track");
  const frames = [];
  for (let i = 0; i < 2; i++) frames.push(...REEL_FRAMES);
  const html = frames.map((src) => `<div class="reel__frame"><img src="${src}" alt="" loading="lazy"></div>`).join("");
  track.innerHTML = html + html;
}

function startSparkles() {
  const canvas = document.getElementById("sparkles");
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const tone = (name) => css.getPropertyValue(name).trim();
  const dustWarm = tone("--dust-warm");
  const dustCool = tone("--dust-cool");
  const dustHalo = tone("--dust-halo");
  const emberHead = tone("--ember-head");
  const emberTail = tone("--ember-tail");
  const flakeTones = ["243, 207, 143", "255, 241, 208", "231, 160, 76", "240, 180, 138"];
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const rand = (min, max) => min + Math.random() * (max - min);
  const glow = document.createElement("canvas");
  glow.width = glow.height = 64;
  const glowCtx = glow.getContext("2d");
  const glowGrad = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glowGrad.addColorStop(0, `rgba(${dustHalo}, 1)`);
  glowGrad.addColorStop(0.2, `rgba(${dustHalo}, 0.4)`);
  glowGrad.addColorStop(1, `rgba(${dustHalo}, 0)`);
  glowCtx.fillStyle = glowGrad;
  glowCtx.fillRect(0, 0, 64, 64);

  function drawGlow(x, y, radius, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(glow, x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalAlpha = 1;
  }
  let width = 0;
  let height = 0;
  let motes = [];
  let flakes = [];
  let glints = [];
  let embers = [];
  let lastScroll = window.scrollY;
  let running = false;
  let frame = 0;
  let shields = [];
  const textSelector = ".title, .hero__when, .countdown, .countdown-done, .hero__actions, .letter__body, .section__head, .campus__side h3, .contact__lines, .credits__title, .wish, .wish-empty, .footer__line, .footer__meta";
  const range = document.createRange();

  function measureShields() {
    shields = [...document.querySelectorAll(".hero__photo, .reel, .snap, .campus__map, .map, .contact__qr, .wish-form, .venue__info, .notes, .ticket")].map((el) => {
      const t = getComputedStyle(el).transform;
      const m = t && t !== "none" ? new DOMMatrixReadOnly(t) : null;
      return { el, angle: m ? Math.atan2(m.b, m.a) : 0, w: el.offsetWidth, h: el.offsetHeight };
    });
  }

  function cutShields() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    for (const s of shields) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > height || r.right < 0 || r.left > width) continue;
      if (Math.abs(s.angle) < 0.001) {
        ctx.fillRect(r.left, r.top, r.width, r.height);
        continue;
      }
      ctx.save();
      ctx.translate(r.left + r.width / 2, r.top + r.height / 2);
      ctx.rotate(s.angle);
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }
    const list = document.getElementById("wish-list").getBoundingClientRect();
    for (const el of document.querySelectorAll(textSelector)) {
      const r = el.getBoundingClientRect();
      if (el.hidden || r.bottom < 0 || r.top > height) continue;
      const inList = el.classList.contains("wish");
      range.selectNodeContents(el);
      for (const line of range.getClientRects()) {
        if (!line.width) continue;
        const top = inList ? Math.max(line.top - 4, list.top) : line.top - 4;
        const bottom = inList ? Math.min(line.bottom + 4, list.bottom) : line.bottom + 4;
        if (bottom > top) ctx.fillRect(line.left - 6, top, line.width + 12, bottom - top);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function makeMote(anywhere) {
    return {
      x: rand(0, width),
      y: anywhere ? rand(0, height) : height + 10,
      r: rand(0.3, 1.6),
      vy: -rand(0.05, 0.3),
      depth: rand(0.15, 0.5),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.004, 0.014),
      twinkle: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.01, 0.05),
      warm: Math.random() < 0.6,
    };
  }

  function makeFlake(anywhere) {
    return {
      x: rand(0, width),
      y: anywhere ? rand(0, height) : -10,
      size: rand(3, 6.2),
      vy: rand(0.25, 0.75),
      depth: rand(0.3, 0.9),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.008, 0.02),
      swayAmp: rand(0.3, 0.9),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.03, 0.03),
      flip: rand(0, Math.PI * 2),
      flipSpeed: rand(0.04, 0.11),
      tone: flakeTones[Math.floor(Math.random() * flakeTones.length)],
    };
  }

  function makeGlint() {
    return { x: rand(0, width), y: rand(0, height), size: rand(5, 13), life: 0, max: rand(50, 110), rot: rand(0, Math.PI / 4) };
  }

  function makeEmber() {
    const fromLeft = Math.random() < 0.5;
    return {
      x: fromLeft ? rand(0, width * 0.4) : rand(width * 0.6, width),
      y: rand(height * 0.55, height),
      vx: (fromLeft ? 1 : -1) * rand(0.3, 0.9),
      vy: -rand(0.6, 1.7),
      life: 0,
      max: rand(120, 260),
      len: rand(10, 24),
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = width * height;
    motes = Array.from({ length: Math.min(24, Math.round(area / 52000)) }, () => makeMote(true));
    flakes = Array.from({ length: Math.min(12, Math.round(area / 84000)) }, () => makeFlake(true));
    glints = [];
    embers = [];
  }

  function wrap(p, margin) {
    if (p.y < -margin) p.y += height + margin * 2;
    else if (p.y > height + margin) p.y -= height + margin * 2;
    if (p.x < -margin) p.x += width + margin * 2;
    else if (p.x > width + margin) p.x -= width + margin * 2;
  }

  function drawMotes(scrollDelta) {
    for (const m of motes) {
      m.y += m.vy - scrollDelta * m.depth;
      m.sway += m.swaySpeed;
      m.twinkle += m.twinkleSpeed;
      m.x += Math.sin(m.sway) * 0.2;
      wrap(m, 10);
      const a = 0.25 + 0.75 * Math.abs(Math.sin(m.twinkle));
      ctx.fillStyle = `rgba(${m.warm ? dustWarm : dustCool}, ${a})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      if (m.r > 1.1) drawGlow(m.x, m.y, m.r * 6, a * 0.35);
    }
  }

  function drawFlakes(scrollDelta) {
    for (const f of flakes) {
      f.sway += f.swaySpeed;
      f.y += f.vy - scrollDelta * f.depth;
      f.x += Math.sin(f.sway) * f.swayAmp;
      f.angle += f.spin;
      f.flip += f.flipSpeed;
      wrap(f, 12);
      const face = Math.cos(f.flip);
      const shine = Math.abs(Math.sin(f.flip * 0.5 + f.angle));
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.scale(1, Math.max(0.08, Math.abs(face)));
      ctx.fillStyle = `rgba(${f.tone}, ${0.35 + 0.6 * shine})`;
      ctx.fillRect(-f.size / 2, -f.size * 0.32, f.size, f.size * 0.64);
      ctx.restore();
      if (shine > 0.93 && Math.abs(face) > 0.6) drawGlow(f.x, f.y, f.size * 3, (shine - 0.93) * 12);
    }
  }

  function drawGlints(scrollDelta) {
    if (glints.length < 2 && Math.random() < 0.011) glints.push(makeGlint());
    glints = glints.filter((g) => g.life < g.max);
    for (const g of glints) {
      g.life++;
      g.y -= scrollDelta * 0.6;
      const t = g.life / g.max;
      const a = Math.sin(t * Math.PI);
      const r = g.size * (0.6 + 0.4 * a);
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot + t * 0.6);
      ctx.fillStyle = `rgba(255, 240, 205, ${a * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fill();
      ctx.restore();
      drawGlow(g.x, g.y, r * 1.6, a * 0.7);
    }
  }

  function drawEmbers() {
    if (embers.length < 2 && Math.random() < 0.004) embers.push(makeEmber());
    embers = embers.filter((e) => e.life < e.max);
    for (const e of embers) {
      e.life++;
      e.x += e.vx;
      e.y += e.vy;
      const a = Math.sin((e.life / e.max) * Math.PI) * 0.85;
      const speed = Math.hypot(e.vx, e.vy);
      const tx = e.x - (e.vx / speed) * e.len;
      const ty = e.y - (e.vy / speed) * e.len;
      const grad = ctx.createLinearGradient(e.x, e.y, tx, ty);
      grad.addColorStop(0, `rgba(${emberHead}, ${a})`);
      grad.addColorStop(1, `rgba(${emberTail}, 0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }

  function draw() {
    const scrollDelta = Math.max(-60, Math.min(60, window.scrollY - lastScroll));
    lastScroll = window.scrollY;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    drawMotes(scrollDelta);
    drawEmbers();
    drawGlints(scrollDelta);
    ctx.globalCompositeOperation = "source-over";
    drawFlakes(scrollDelta);
    cutShields();
  }

  function loop() {
    if (!running) return;
    draw();
    frame = requestAnimationFrame(loop);
  }

  function update() {
    const shouldRun = !document.hidden && !reducedMotion;
    if (shouldRun && !running) {
      running = true;
      lastScroll = window.scrollY;
      frame = requestAnimationFrame(loop);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  resize();
  measureShields();
  if (reducedMotion) {
    draw();
    let pending = false;
    window.addEventListener("scroll", () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; draw(); });
    }, { passive: true });
  }
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); measureShields(); if (reducedMotion) draw(); }, 150);
  });
  document.addEventListener("visibilitychange", update);
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

function setupSnaps() {
  const snaps = document.querySelectorAll(".scatter .snap");
  snaps.forEach((snap) => snap.addEventListener("click", () => {
    const open = !snap.classList.contains("is-active");
    snaps.forEach((other) => other.classList.remove("is-active"));
    snap.classList.toggle("is-active", open);
  }));
}

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderWish(wish) {
  const li = document.createElement("li");
  li.className = "wish";
  const msg = document.createElement("p");
  msg.className = "wish__msg";
  msg.textContent = wish.message;
  const time = document.createElement("p");
  time.className = "wish__time";
  const date = new Date(String(wish.time).replace(/\s*\(.*\)\s*$/, ""));
  time.textContent = isNaN(date) ? "" : formatTime(date);
  li.append(msg, time);
  return li;
}

function showWishes(wishes, highlightFirst) {
  const list = document.getElementById("wish-list");
  list.replaceChildren();
  document.querySelector(".credits__title").hidden = !wishes.length;
  if (!wishes.length) {
    const empty = document.createElement("li");
    empty.className = "wish-empty";
    empty.textContent = "Chưa có lời chúc nào, bạn mở hàng giúp mình nhé.";
    list.append(empty);
    return;
  }
  const items = wishes.map(renderWish);
  if (highlightFirst) items[0].classList.add("is-new");
  list.append(...items);
  list.scrollTop = 0;
  list.classList.toggle("is-overflowing", list.scrollHeight > list.clientHeight);
}

async function loadWishes(highlightFirst = false) {
  if (!CONFIG.guestbookUrl) return;
  try {
    const res = await fetch(CONFIG.guestbookUrl, { cache: "no-store" });
    const data = await res.json();
    if (!data.ok) return;
    showWishes(data.wishes, highlightFirst);
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
      slot: field("slot"),
      message: field("message").trim(),
      website: field("website"),
    };
    if (!payload.name || !payload.message) {
      setStatus("Bạn điền giúp mình tên và lời chúc nhé.", "error");
      return;
    }
    if (!payload.slot) {
      setStatus("Bạn chọn giúp mình lúc nào ghé nhé.", "error");
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
      setStatus("Mình nhận được rồi, cảm ơn bạn nhiều!", "ok");
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
startSparkles();
setupTopbar();
setupReveal();
setupSnaps();
setupForm();
loadWishes();
