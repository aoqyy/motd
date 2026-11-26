const ACTIVITY_CACHE_KEY = "motd:activity";
const ACTIVITY_TTL = 60 * 60 * 1000; // the API caches for an hour too

// "@aoqyy", "github.com/aoqyy" -> "aoqyy"; "" if it can't be a GitHub username
function cleanGithubUser(raw) {
  const name = (raw ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .split("/")[0];
  return /^[a-z\d][a-z\d-]{0,38}$/i.test(name) ? name : "";
}

// public contributions for the last year: { total, days: [{ date, count, level }] }
async function fetchActivity(user) {
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`);
  if (!res.ok) {
    const error = new Error(`activity failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  const json = await res.json();
  if (!Array.isArray(json.contributions)) throw Object.assign(new Error("bad response"), { status: 404 });
  return { total: json.total?.lastYear ?? 0, days: json.contributions };
}

function readActivityCache(user) {
  try {
    const cache = JSON.parse(localStorage.getItem(ACTIVITY_CACHE_KEY));
    return cache && cache.user === user ? cache : null;
  } catch {
    return null;
  }
}

function writeActivityCache(user, activity) {
  const cache = { user, time: Date.now(), activity };
  localStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(cache));
}

function initActivity(el) {
  el.innerHTML = `
    <div class="card__head">
      <h2>activity</h2>
      <span class="activity__total muted"></span>
    </div>
    <div class="activity__grid"></div>
    <p class="activity__msg muted">// loading…</p>`;
}

function cell(className, title) {
  const span = document.createElement("span");
  span.className = className;
  if (title) span.title = title;
  return span;
}

function showActivity(el, user, activity, note) {
  // empty cells push the first day into its weekday row (monday on top)
  const first = activity.days[0];
  const offset = first ? (new Date(`${first.date}T00:00:00`).getDay() + 6) % 7 : 0;

  const cells = [
    ...Array.from({ length: offset }, () => cell("activity__cell activity__cell--empty")),
    ...activity.days.map((day) =>
      cell(`activity__cell l${day.level}`, `${day.count} on ${day.date}`)),
  ];

  el.querySelector(".activity__grid").replaceChildren(...cells);
  el.querySelector(".activity__total").textContent =
    `${activity.total} contributions in the last year · @${user}${note ? ` · ${note}` : ""}`;
  el.querySelector(".activity__msg").hidden = true;
}

function showActivityMessage(el, text) {
  el.querySelector(".activity__grid").replaceChildren();
  el.querySelector(".activity__total").textContent = "";
  const msg = el.querySelector(".activity__msg");
  msg.hidden = false;
  msg.textContent = `// ${text}`;
}

async function updateActivity(el, data) {
  const user = cleanGithubUser(data.github);
  if (!user) {
    showActivityMessage(el, "set your github username: activity <name>");
    return;
  }

  const cache = readActivityCache(user);
  if (cache && Date.now() - cache.time < ACTIVITY_TTL) {
    showActivity(el, user, cache.activity);
    return;
  }

  try {
    const activity = await fetchActivity(user);
    writeActivityCache(user, activity);
    showActivity(el, user, activity);
  } catch (e) {
    if (cache) showActivity(el, user, cache.activity, "offline");
    else if (e.status === 404) showActivityMessage(el, `user not found: ${user}`);
    else showActivityMessage(el, "activity is unavailable right now");
  }
}