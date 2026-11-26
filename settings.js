const settingsEl = document.getElementById("settings");
const form = settingsEl.querySelector("form");
const importFile = document.getElementById("import-file");

// [{date, title}] -> "2026-12-25 | exam"
function toLines(items, a, b) {
  return items.map((item) => `${item[a]} | ${item[b]}`).join("\n");
}

// "2026-12-25 | exam" -> [{date, title}], skips empty and broken lines
function fromLines(text, a, b) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((s) => s.trim()))
    .filter(([x, y]) => x && y)
    .map(([x, ...rest]) => ({ [a]: x, [b]: rest.join(" | ") }));
}

function openSettings() {
  const f = form.elements;
  f.username.value = data.demo ? "" : data.name;
  f.city.value = data.city.name;
  f.deadlines.value = toLines(data.deadlines, "date", "title");
  f.links.value = toLines(data.links, "title", "url");
  f.linkStyle.value = data.linkStyle;
  f.prefixes.value = toLines(data.prefixes, "key", "url");
  f.github.value = data.demo ? "" : data.github;
  settingsEl.showModal();
}

function saveSettings() {
  const f = form.elements;
  const cityName = f.city.value.trim() || DEFAULTS.city.name;
  saveData(sanitizeData({
    name: f.username.value,
    // keep coordinates only if the city didn't change
    city: cityName === data.city.name ? data.city : { name: cityName },
    deadlines: fromLines(f.deadlines.value, "date", "title"),
    links: fromLines(f.links.value, "title", "url"),
    linkStyle: f.linkStyle.value,
    prefixes: fromLines(f.prefixes.value, "key", "url"),
    github: f.github.value,
  }));
  location.reload();
}

function exportData() {
  const { demo, ...clean } = data;
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `motd-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// backups can come from anywhere, so everything goes through sanitizeData
async function importData() {
  const file = importFile.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    saveData(sanitizeData(parsed));
    location.reload();
  } catch {
    alert("this doesn't look like a motd backup");
  }
}

function resetData() {
  if (!confirm("delete all your data and go back to demo?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

document.getElementById("settings-btn").addEventListener("click", openSettings);
document.getElementById("save-btn").addEventListener("click", saveSettings);
document.getElementById("export-btn").addEventListener("click", exportData);
document.getElementById("import-btn").addEventListener("click", () => importFile.click());
document.getElementById("reset-btn").addEventListener("click", resetData);
importFile.addEventListener("change", importData);