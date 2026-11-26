const STORAGE_KEY = "start:data";

// saved data on top of demo defaults; demo flag tells the UI which one is shown
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEMO_DATA, ... JSON.parse(saved), demo: false };
  } catch (e) {
    console.warn("failed to read saved data", e);
  }
  return { ...DEMO_DATA, demo: true };
}

function saveData(data) {
  const { demo, ...clean } = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}