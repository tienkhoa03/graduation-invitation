const CONFIG = {
  guestbookUrl: "https://script.google.com/macros/s/AKfycbwwtcx0T4JUFJE8LQNkjgKgnZhSKkQpiz5xF4JCKIblPmO0Iz0ludQQwQG4UMDMlrzNwg/exec",
  eventStart: "2026-11-27T09:30:00+07:00",
};

function startCountdown() {
  const target = new Date(CONFIG.eventStart).getTime();
  const box = document.getElementById("countdown");
  const done = document.getElementById("countdown-done");
  const units = {
    days: box.querySelector('[data-unit="days"]'),
    hours: box.querySelector('[data-unit="hours"]'),
    minutes: box.querySelector('[data-unit="minutes"]'),
    seconds: box.querySelector('[data-unit="seconds"]'),
  };

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      box.hidden = true;
      done.hidden = false;
      return false;
    }
    const s = Math.floor(diff / 1000);
    units.days.textContent = Math.floor(s / 86400);
    units.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
    units.minutes.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    units.seconds.textContent = String(s % 60).padStart(2, "0");
    return true;
  }

  if (tick()) {
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
  }
}

const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

function renderWish(wish) {
  const li = document.createElement("li");
  li.className = "wish";
  const head = document.createElement("div");
  head.className = "wish__head";
  const name = document.createElement("span");
  name.className = "wish__name";
  name.textContent = wish.name;
  const time = document.createElement("span");
  time.className = "wish__time";
  const date = new Date(wish.time);
  time.textContent = isNaN(date) ? "" : timeFormat.format(date);
  head.append(name, time);
  const msg = document.createElement("p");
  msg.className = "wish__msg";
  msg.textContent = wish.message;
  li.append(head, msg);
  return li;
}

function showWishes(wishes) {
  const list = document.getElementById("wish-list");
  list.replaceChildren();
  if (!wishes.length) {
    const empty = document.createElement("li");
    empty.className = "wish-empty";
    empty.textContent = "Chưa có lời chúc nào — bạn hãy là người đầu tiên nhé!";
    list.append(empty);
    return;
  }
  list.append(...wishes.map(renderWish));
}

async function loadWishes() {
  if (!CONFIG.guestbookUrl) return;
  try {
    const res = await fetch(CONFIG.guestbookUrl, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) showWishes(data.wishes);
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
      setStatus("Cảm ơn bạn đã gửi lời chúc! 💛", "ok");
      await loadWishes();
    } catch (err) {
      console.error("Could not send wish", err);
      setStatus("Gửi chưa được, bạn thử lại sau chút nhé.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

startCountdown();
setupForm();
loadWishes();
