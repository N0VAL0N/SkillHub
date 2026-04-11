// src/modules/english/stores/englishProgressFirestore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { enqueueOperation, getOperationsByCollection } from '@core/services/syncQueue';
import lessonsData from '../data/lessons.json';
import vocabularyData from '../data/vocabulary.json';

const CACHE_KEY = 'english_progress_cache';
const CACHE_TTL = 12 * 60 * 60 * 1000;

export const useEnglishProgressFirestore = defineStore('englishProgressFirestore', () => {
  const completedLessons = ref([]);
  const learnedWords = ref([]);
  const packsProgress = ref({});
  const loaded = ref(false);
  const lastUpdated = ref(null);
  let migrationDone = false;

  const getUserId = () => auth.currentUser?.uid;
  const getUserDocPath = (uid) => `english/${uid}`;
  const getPackPath = (uid, packId) => `english/${uid}/packs/${packId}`;

  // Сохранение кэша
  function saveToCache(uid, data) {
    try {
      const cacheData = {
        uid,
        completedLessons: data.completedLessons,
        learnedWords: data.learnedWords,
        packs: data.packs,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${uid}`, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Ошибка сохранения кэша:', err);
    }
  }

  // Загрузка из кэша
  function loadFromCache(uid) {
    const cached = localStorage.getItem(`${CACHE_KEY}_${uid}`);
    if (!cached) return null;
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) {
        return data;
      }
    } catch (e) {}
    return null;
  }

  // Принудительное обновление из Firestore
  async function refreshFromFirestore(uid) {
    const docRef = doc(db, getUserDocPath(uid));
    const docSnap = await getDoc(docRef);
    
    let progressData = {
      completedLessons: [],
      learnedWords: [],
      packs: {},
      updatedAt: new Date()
    };
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      progressData.completedLessons = data.completedLessons || [];
      progressData.learnedWords = data.learnedWords || [];
      progressData.packs = data.packs || {};
    }
    
    completedLessons.value = progressData.completedLessons;
    learnedWords.value = progressData.learnedWords;
    packsProgress.value = progressData.packs;
    lastUpdated.value = Date.now();
    
    saveToCache(uid, progressData);
    return progressData;
  }

  function getLessonWords(lessonId) {
    const lessonNum = parseInt(lessonId.replace('lesson_', ''));
    const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
    if (!lesson || !lesson.new_vocabulary_ids) return [];
    
    const words = [];
    for (const wid of lesson.new_vocabulary_ids) {
      const word = vocabularyData.find(w => w.id === wid);
      if (word) {
        words.push({
          id: word.id,           // <-- ID из vocabulary (v1, v2, v3...)
          front: word.word,
          back: word.translation,
          wordId: word.id,       // <-- дублируем для удобства
          level: lesson.level,
          example: word.example || ''
        });
      }
    }
    return words;
  }

  async function ensurePackFromLesson(uid, lessonId) {
    const lessonNum = parseInt(lessonId.replace('lesson_', ''));
    const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
    if (!lesson) return null;
    
    const packName = `${lesson.title} (урок ${lesson.lesson_id})`;
    const packsCol = collection(db, getPackPath(uid, '').replace(/\/[^/]+$/, ''));
    const packsSnap = await getDocs(packsCol);
    const existingPack = packsSnap.docs.find(doc => doc.data().name === packName);
    
    if (existingPack) return existingPack.id;
    
    const words = getLessonWords(lessonId);
    if (words.length === 0) return null;
    
    const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPack = {
      name: packName,
      level: lesson.level,
      cards: words,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const packRef = doc(db, getPackPath(uid, packId));
    await setDoc(packRef, newPack);
    return packId;
  }

  async function syncPacksWithLessons(uid) {
    const packsCol = collection(db, getPackPath(uid, '').replace(/\/[^/]+$/, ''));
    const packsSnap = await getDocs(packsCol);
    const existingPackNames = new Set(packsSnap.docs.map(doc => doc.data().name));
    
    for (const lessonId of completedLessons.value) {
      const lessonNum = parseInt(lessonId.replace('lesson_', ''));
      const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
      if (lesson) {
        const packName = `${lesson.title} (урок ${lesson.lesson_id})`;
        if (!existingPackNames.has(packName)) {
          await ensurePackFromLesson(uid, lessonId);
        }
      }
    }
  }

  // Миграция старых данных
  async function migrateIfNeeded(uid) {
    if (migrationDone) return false;
    
    try {
      const newDocRef = doc(db, getUserDocPath(uid));
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        migrationDone = true;
        return false;
      }
      
      const oldProgressRef = doc(db, 'englishProgress', uid);
      const oldProgressSnap = await getDoc(oldProgressRef);
      const oldPacksQuery = collection(db, 'englishPacks');
      const oldPacksSnap = await getDocs(oldPacksQuery);
      const userPacks = oldPacksSnap.docs.filter(doc => doc.data().userId === uid);
      
      let progressData = {
        completedLessons: [],
        learnedWords: [],
        packs: {},
        updatedAt: new Date()
      };
      
      if (oldProgressSnap.exists()) {
        const oldData = oldProgressSnap.data();
        progressData.completedLessons = oldData.completedLessons || [];
        progressData.learnedWords = oldData.learnedWords || [];
        progressData.packs = oldData.packs || {};
      }
      
      const batch = writeBatch(db);
      batch.set(newDocRef, progressData, { merge: true });
      
      for (const packDoc of userPacks) {
        const packData = packDoc.data();
        delete packData.userId;
        const newPackRef = doc(db, getPackPath(uid, packDoc.id));
        batch.set(newPackRef, packData);
      }
      
      await batch.commit();
      
      completedLessons.value = progressData.completedLessons;
      learnedWords.value = progressData.learnedWords;
      packsProgress.value = progressData.packs;
      
      await syncPacksWithLessons(uid);
      
      migrationDone = true;
      return true;
    } catch (err) {
      console.error('Migration error:', err);
      return false;
    }
  }

  async function loadProgress() {
    const uid = getUserId();
    if (!uid) {
      loaded.value = false;
      return;
    }

    try {
      const cached = loadFromCache(uid);
      if (cached) {
        completedLessons.value = cached.completedLessons || [];
        learnedWords.value = cached.learnedWords || [];
        packsProgress.value = cached.packs || {};
        loaded.value = true;
        lastUpdated.value = cached.timestamp;
      }
      
      await migrateIfNeeded(uid);
      
      const shouldRefresh = !cached || (Date.now() - cached.timestamp >= CACHE_TTL);
      if (shouldRefresh) {
        await refreshFromFirestore(uid);
      } else {
        const pendingOps = await getOperationsByCollection('englishProgress');
        if (pendingOps.length > 0) {
          for (const op of pendingOps) {
            if (op.operation === 'arrayUnion') {
              if (op.data.completedLessons) {
                for (const lessonId of op.data.completedLessons) {
                  if (!completedLessons.value.includes(lessonId)) {
                    completedLessons.value.push(lessonId);
                  }
                }
              }
              if (op.data.learnedWords) {
                for (const wordId of op.data.learnedWords) {
                  if (!learnedWords.value.includes(wordId)) {
                    learnedWords.value.push(wordId);
                  }
                }
              }
            }
            if (op.operation === 'update') {
              Object.assign(packsProgress.value, op.data);
            }
          }
        }
      }
      
      loaded.value = true;
    } catch (err) {
      console.error('Ошибка загрузки прогресса:', err);
      loaded.value = false;
    }
  }

  async function refresh() {
    const uid = getUserId();
    if (!uid) return;
    await refreshFromFirestore(uid);
    await syncPacksWithLessons(uid);
  }

  async function addCompletedLesson(lessonId) {
    if (completedLessons.value.includes(lessonId)) return;
    completedLessons.value.push(lessonId);
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        completedLessons: [lessonId]
      }, 'arrayUnion');
      await ensurePackFromLesson(uid, lessonId);
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value
      });
    }
  }

  async function addLearnedWord(wordId) {
    if (learnedWords.value.includes(wordId)) return;
    learnedWords.value.push(wordId);
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        learnedWords: [wordId]
      }, 'arrayUnion');
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value
      });
    }
  }

  async function removeLearnedWord(wordId) {
    learnedWords.value = learnedWords.value.filter(id => id !== wordId);
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        learnedWords: [wordId]
      }, 'arrayRemove');
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value
      });
    }
  }

  async function updatePackProgress(packId, learnedCardIds) {
    packsProgress.value[packId] = {
      learnedCardIds: learnedCardIds,
      lastStudied: new Date()
    };
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        [`packs.${packId}`]: packsProgress.value[packId]
      }, 'update');
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value
      });
    }
  }

  function getPackProgress(packId) {
    return packsProgress.value[packId] || { learnedCardIds: [], lastStudied: null };
  }

  function isWordLearned(wordId) {
    return learnedWords.value.includes(wordId);
  }

  async function forceSync() {
    const { flushQueue } = await import('../services/syncService');
    await flushQueue();
  }

  function reset() {
    completedLessons.value = [];
    learnedWords.value = [];
    packsProgress.value = {};
    loaded.value = false;
    migrationDone = false;
    lastUpdated.value = null;
    const uid = getUserId();
    if (uid) {
      localStorage.removeItem(`${CACHE_KEY}_${uid}`);
    }
  }

  return {
    completedLessons,
    learnedWords,
    packsProgress,
    loaded,
    lastUpdated,
    loadProgress,
    refresh,
    addCompletedLesson,
    addLearnedWord,
    removeLearnedWord,
    updatePackProgress,
    getPackProgress,
    isWordLearned,
    forceSync,
    reset
  };
});