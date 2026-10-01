// =========================================
// Shared data layer — used by index.html (main.js) and gestion.html (gestion.js)
// 1. If there is a saved copy in localStorage, use it (changes made in gestion.html)
// 2. If not, load the original data/info.json
// =========================================

const STORAGE_KEY = "portfolio-info";
const INFO_URL = "data/info.json";

async function getInfo() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      // Corrupted data: discard it and fall back to info.json
      console.warn("Invalid data in localStorage, loading info.json", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const response = await fetch(INFO_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function saveInfo(info) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

// Deletes the local changes: the site goes back to data/info.json
function resetInfo() {
  localStorage.removeItem(STORAGE_KEY);
}
