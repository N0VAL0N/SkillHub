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
  const passedExams = ref([]);
  const stats = ref({ totalExercises: 0, correctExercises: 0 });
  const loaded = ref(false);
  const lastUpdated = ref(null);
  let migrationDone = false;

  const getUserId = () => auth.currentUser?.uid;
  const getUserDocPath = (uid) => `english/${uid}`;
  const getPackPath = (uid, packId) => `english/${uid}/packs/${packId}`;

  // ========== КЭШИРОВАНИЕ ==========
  function saveToCache(uid, data) {
    try {
      const cacheData = {
        uid,
        completedLessons: data.completedLessons,
        learnedWords: data.learnedWords,
        packs: data.packs,
        passedExams: data.passedExams,
        stats: data.stats,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${uid}`, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Ошибка сохранения кэша:', err);
    }
  }

  function loadFromCache(uid) {
    const cached = localStorage.getItem(`${CACHE_KEY}_${uid}`);
    if (!cached) return null;
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) return data;
    } catch (e) {}
    return null;
  }

  async function refreshFromFirestore(uid) {
    const docRef = doc(db, getUserDocPath(uid));
    const docSnap = await getDoc(docRef);
    
    let progressData = {
      completedLessons: [],
      learnedWords: [],
      packs: {},
      passedExams: [],
      stats: { totalExercises: 0, correctExercises: 0 },
      updatedAt: new Date()
    };
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      progressData.completedLessons = data.completedLessons || [];
      progressData.learnedWords = data.learnedWords || [];
      progressData.packs = data.packs || {};
      progressData.passedExams = data.passedExams || [];
      progressData.stats = data.stats || { totalExercises: 0, correctExercises: 0 };
    }
    
    completedLessons.value = progressData.completedLessons;
    learnedWords.value = progressData.learnedWords;
    packsProgress.value = progressData.packs;
    passedExams.value = progressData.passedExams;
    stats.value = progressData.stats;
    lastUpdated.value = Date.now();
    
    saveToCache(uid, progressData);
    return progressData;
  }

  // ========== ПАКИ ИЗ УРОКОВ (ТОЛЬКО ДЛЯ ПРОЙДЕННЫХ) – УДАЛЕНО, ТЕПЕРЬ В PACK STORE ==========
  // Функция ensurePackForLessonIfCompleted была перенесена в englishPackStore
  // и вызывается оттуда с кэшированием.

  // ========== МИГРАЦИЯ СТАРЫХ ДАННЫХ ==========
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
        passedExams: [],
        stats: { totalExercises: 0, correctExercises: 0 },
        updatedAt: new Date()
      };
      
      if (oldProgressSnap.exists()) {
        const oldData = oldProgressSnap.data();
        progressData.completedLessons = oldData.completedLessons || [];
        progressData.learnedWords = oldData.learnedWords || [];
        progressData.packs = oldData.packs || {};
        progressData.passedExams = oldData.passedExams || [];
        progressData.stats = oldData.stats || { totalExercises: 0, correctExercises: 0 };
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
      passedExams.value = progressData.passedExams;
      stats.value = progressData.stats;
      
      migrationDone = true;
      return true;
    } catch (err) {
      console.error('Migration error:', err);
      return false;
    }
  }

  // ========== ОСНОВНАЯ ЗАГРУЗКА ==========
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
        passedExams.value = cached.passedExams || [];
        stats.value = cached.stats || { totalExercises: 0, correctExercises: 0 };
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
              if (op.data.passedExams) {
                for (const exam of op.data.passedExams) {
                  if (!passedExams.value.includes(exam)) {
                    passedExams.value.push(exam);
                  }
                }
              }
            }
            if (op.operation === 'update') {
              if (op.data.stats) {
                stats.value = op.data.stats;
              }
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
    // УДАЛЁН блок создания паков – теперь это делает englishPackStore
  }

  // ========== МЕТОДЫ ДЛЯ ИЗМЕНЕНИЯ ДАННЫХ ==========
  async function addCompletedLesson(lessonId) {
    if (completedLessons.value.includes(lessonId)) return;
    completedLessons.value.push(lessonId);
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        completedLessons: [lessonId]
      }, 'arrayUnion');
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
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
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
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
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
      });
    }
  }

  async function addPassedExam(level) {
    if (passedExams.value.includes(level)) return;
    passedExams.value.push(level);
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        passedExams: [level]
      }, 'arrayUnion');
      
      const levelLessons = lessonsData.lessons.filter(l => l.level === level);
      for (const lesson of levelLessons) {
        const lessonId = `lesson_${lesson.lesson_id}`;
        if (!completedLessons.value.includes(lessonId)) {
          completedLessons.value.push(lessonId);
          await enqueueOperation('englishProgress', uid, {
            completedLessons: [lessonId]
          }, 'arrayUnion');
        }
      }
      
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
      });
    }
  }

  async function updateStats(isCorrect) {
    stats.value.totalExercises++;
    if (isCorrect) stats.value.correctExercises++;
    const uid = getUserId();
    if (uid) {
      await enqueueOperation('englishProgress', uid, {
        stats: stats.value
      }, 'update');
      saveToCache(uid, {
        completedLessons: completedLessons.value,
        learnedWords: learnedWords.value,
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
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
        packs: packsProgress.value,
        passedExams: passedExams.value,
        stats: stats.value
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
    passedExams.value = [];
    stats.value = { totalExercises: 0, correctExercises: 0 };
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
    passedExams,
    stats,
    loaded,
    lastUpdated,
    getUserId,
    loadProgress,
    refresh,
    addCompletedLesson,
    addLearnedWord,
    removeLearnedWord,
    addPassedExam,
    updateStats,
    updatePackProgress,
    getPackProgress,
    isWordLearned,
    forceSync,
    reset
  };
});