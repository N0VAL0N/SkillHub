// src/modules/english/stores/englishSm2Store.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { enqueueOperation } from '@core/services/syncQueue';

const CACHE_KEY_SM2 = 'english_sm2_cache';
const CACHE_TTL = 12 * 60 * 60 * 1000;

export const useEnglishSm2Store = defineStore('englishSm2', () => {
  const sm2Data = ref({}); // { wordId: { lastReview, easinessFactor, interval, repetitions, nextReview } }
  const loaded = ref(false);

  const getUserId = () => auth.currentUser?.uid;
  const getUserSm2Path = (uid) => `english/${uid}/sm2`;

  // Загрузка из кэша
  function saveToCache(uid, data) {
    try {
      const cacheData = { uid, data, timestamp: Date.now() };
      localStorage.setItem(`${CACHE_KEY_SM2}_${uid}`, JSON.stringify(cacheData));
    } catch (err) {}
  }

  function loadFromCache(uid) {
    const cached = localStorage.getItem(`${CACHE_KEY_SM2}_${uid}`);
    if (!cached) return null;
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) return data.data;
    } catch (e) {}
    return null;
  }

  // Загрузка из Firestore
  async function loadSm2Data(forceRefresh = false) {
    const uid = getUserId();
    if (!uid) {
      sm2Data.value = {};
      loaded.value = false;
      return;
    }

    if (!forceRefresh) {
      const cached = loadFromCache(uid);
      if (cached) {
        sm2Data.value = cached;
        loaded.value = true;
        return;
      }
    }

    try {
      const docRef = doc(db, getUserSm2Path(uid), 'data');
      const docSnap = await getDoc(docRef);
      let data = {};
      if (docSnap.exists()) {
        data = docSnap.data();
      }
      sm2Data.value = data;
      saveToCache(uid, data);
      loaded.value = true;
    } catch (err) {
      console.error('Ошибка загрузки SM2 данных:', err);
      sm2Data.value = {};
      loaded.value = false;
    }
  }

  async function refresh() {
    await loadSm2Data(true);
  }

  // Обновление данных одного слова
  async function updateWordSm2(wordId, newData) {
    const uid = getUserId();
    if (!uid) return;
    
    // Обновляем локально
    sm2Data.value[wordId] = { ...sm2Data.value[wordId], ...newData };
    saveToCache(uid, sm2Data.value);
    
    // Отправляем в очередь
    await enqueueOperation('englishSm2', uid, {
      [`sm2.${wordId}`]: sm2Data.value[wordId]
    }, 'update');
  }

  // Получить список слов для повторения (у которых nextReview <= now() или нет записи)
  function getDueWords(wordIdsList) {
    const now = Date.now();
    const due = [];
    for (const wordId of wordIdsList) {
      const record = sm2Data.value[wordId];
      if (!record) {
        due.push(wordId);
      } else if (record.nextReview && record.nextReview <= now) {
        due.push(wordId);
      }
    }
    return due;
  }

  // SM2 алгоритм
  function calculateSm2(quality, card) {
    // quality: 0-5 (0-2 неправильно, 3-5 правильно)
    let { easinessFactor, interval, repetitions } = card;
    
    if (quality >= 3) {
      // Правильно
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easinessFactor);
      }
      repetitions++;
      easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easinessFactor < 1.3) easinessFactor = 1.3;
    } else {
      // Неправильно
      repetitions = 0;
      interval = 1;
      easinessFactor = Math.max(1.3, easinessFactor - 0.2);
    }
    
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
    
    return {
      easinessFactor,
      interval,
      repetitions,
      lastReview: Date.now(),
      nextReview
    };
  }

  async function recordAnswer(wordId, quality) {
    const current = sm2Data.value[wordId] || {
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lastReview: 0,
      nextReview: 0
    };
    const updated = calculateSm2(quality, current);
    await updateWordSm2(wordId, updated);
  }

  return {
    sm2Data,
    loaded,
    loadSm2Data,
    refresh,
    updateWordSm2,
    getDueWords,
    recordAnswer
  };
});