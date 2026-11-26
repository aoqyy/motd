const MAX_DEADLINES = 6;

// whole days from today to "2026-12-25", NaN for broken dates
function daysLeft(dateStr, now) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function whenText(days) {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `${days} days`;
}

function initDeadlines(el) {
  el.innerHTML = `<h2>deadlines</h2><ul class="list"></ul>`;
}

function renderDeadlines(el, data, now) {
  const list = el.querySelector(".list");
  const items = data.deadlines
    .map((d) => ({ ...d, days: daysLeft(d.date, now) }))
    .filter((d) => !Number.isNaN(d.days) && d.days >= -1) // hide broken dates and old ones
    .sort((a, b) => a.days - b.days)
    .slice(0, MAX_DEADLINES);

  if (!items.length) {
    list.innerHTML = `<li class="muted">// empty, add some in [settings]</li>`;
    return;
  }

  list.replaceChildren(...items.map((d) => {
    const li = document.createElement("li");
    if (d.days < 0) li.className = "past";
    else if (d.days <= 3) li.className = "urgent";

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = d.title;

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = whenText(d.days);

    li.append(title, when);
    return li;
  }));
}