const BAR_WIDTH = 20;

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

// [label, start, end] for each period that contains "now"
function periods(now) {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const week = startOfWeek(now);
  return [
    ["day",   new Date(y, m, d),   new Date(y, m, d + 1)],
    ["week",  week,                new Date(week.getFullYear(), week.getMonth(), week.getDate() + 7)],
    ["month", new Date(y, m, 1),   new Date(y, m + 1, 1)],
    ["year",  new Date(y, 0, 1),   new Date(y + 1, 0, 1)],
  ];
}

function bar(fraction) {
  const filled = Math.round(fraction * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

function initProgress(el) {
  el.innerHTML = `<h2>progress</h2><pre class="progress"></pre>`;
}

function renderProgress(el, data, now) {
  el.querySelector(".progress").textContent = periods(now)
    .map(([label, start, end]) => {
      const f = (now - start) / (end - start);
      const pct = String(Math.floor(f * 100)).padStart(3);
      return `${label.padEnd(6)} ${bar(f)} ${pct}%`;
    })
    .join("\n");
}