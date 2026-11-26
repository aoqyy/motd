const STORAGE_KEY = "start:data";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEMO_DATA, ...JSON.parse(saved), demo: false };
  } catch (e) {
    console.warn("не удалось прочитать сохранённые данные", e);
  }
  return { ...DEMO_DATA, demo: true };
}

function saveData(data) {
  const { demo, ...clean } = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}