function greeting(hour) {
  if (hour < 5) return "good night";
  if (hour < 12) return "good morning";
  if (hour < 18) return "good afternoon";
  if (hour < 23) return "good evening";
  return "good night";
}

function initClock(el) {
  el.innerHTML = `
    <div class="clock__time"></div>
    <div class="clock__date"></div>
    <div class="clock__hello"></div>`;
}

function renderClock(el, data, now) {
  // en-GB gives 24h time, en-US gives "Thursday, November 26"
  el.querySelector(".clock__time").textContent =
    now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  el.querySelector(".clock__date").textContent =
    now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  el.querySelector(".clock__hello").textContent =
    `${greeting(now.getHours())}, ${data.name}.`;
}