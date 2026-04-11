// src/modules/english/services/practiceStorage.js
const DB_NAME = 'EnglishPracticeDB';
const STORE_NAME = 'practiceStats';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

export async function savePracticeStats(userId, stats) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.put({ userId, total: stats.total, correct: stats.correct, updatedAt: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPracticeStats(userId) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(userId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      if (request.result) {
        resolve({ total: request.result.total || 0, correct: request.result.correct || 0 });
      } else {
        resolve({ total: 0, correct: 0 });
      }
    };
    request.onerror = () => reject(request.error);
  });
}