const STORAGE_KEY = "motd:data";

// one-time move from the old project name, so saved data survives the rename
const LEGACY_KEYS = {
  "start:data": "motd:data",
  "start:weather": "motd:weather",
};

function migrateLegacyKeys() {
  for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
    const value = localStorage.getItem(oldKey);
    if (value === null) continue;
    if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
}

migrateLegacyKeys();

const str = (value, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const list = (value) => (Array.isArray(value) ? value : []);

function sanitizeCity(city) {
  const name = str(city?.name, 100);
  if (!name) return DEFAULTS.city;
  const { lat, lon } = city;
  return Number.isFinite(lat) && Number.isFinite(lon) ? { name, lat, lon } : { name };
}

// keeps only known fields with the right types; urls must be http(s).
// used for imports, settings and whatever is already in storage.
// safeUrl and cleanGithubUser come from the widgets, loaded before this is called
function sanitizeData(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    name: str(src.name, 20) || DEFAULTS.name,
    city: sanitizeCity(src.city),
    deadlines: list(src.deadlines)
      .map((d) => ({ date: str(d?.date, 10), title: str(d?.title) }))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.title),
    links: list(src.links)
      .map((l) => ({ title: str(l?.title, 50), url: safeUrl(str(l?.url, 2000)) }))
      .filter((l) => l.title && l.url),
    prefixes: list(src.prefixes)
      .map((p) => ({ key: str(p?.key, 20).toLowerCase(), url: safeUrl(str(p?.url, 2000)) }))
      .filter((p) => /^[a-z0-9-]+$/.test(p.key) && p.url && p.url.includes("%s")),
    github: cleanGithubUser(str(src.github, 100)),
    linkStyle: src.linkStyle === "{}" ? "{}" : "[]",
  };
}

// saved data, or the demo if nothing is saved yet
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...sanitizeData(JSON.parse(saved)), demo: false };
  } catch (e) {
    console.warn("failed to read saved data", e);
  }
  return { ...DEFAULTS, ...DEMO_DATA, demo: true };
}

function saveData(data) {
  const { demo, ...clean } = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}