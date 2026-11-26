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

// saved data on top of defaults, or the demo if nothing is saved yet
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved), demo: false };
  } catch (e) {
    console.warn("failed to read saved data", e);
  }
  return { ...DEFAULTS, ...DEMO_DATA, demo: true };
}

function saveData(data) {
  const { demo, ...clean } = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}