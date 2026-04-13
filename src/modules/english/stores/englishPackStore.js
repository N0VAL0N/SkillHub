// src/modules/english/stores/englishPackStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { useEnglishProgressFirestore } from './englishProgressFirestore';
import vocabularyData from '../data/vocabulary.json';
import lessonsData from '../data/lessons.json';

const CACHE_KEY_PACKS = 'english_packs_cache';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const LAST_PACK_CHECK_KEY = 'last_pack_check';

export const useEnglishPackStore = defineStore('englishPack', () => {
  const packs = ref([]);
  const loaded = ref(false);
  const progressFirestore = useEnglishProgressFirestore();

  const getUserId = () => auth.currentUser?.uid;
  const getPacksCollectionPath = (uid) => `english/${uid}/packs`;

  function getWordIdByFront(front) {
    const word = vocabularyData.find(w => w.word === front);
    return word?.id || null;
  }

  function savePacksToCache(uid, packsData) {
    try {
      const safeData = JSON.parse(JSON.stringify(packsData));
      const cacheData = { uid, packs: safeData, timestamp: Date.now() };
      localStorage.setItem(`${CACHE_KEY_PACKS}_${uid}`, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Ошибка сохранения кэша паков:', err);
    }
  }

  function loadPacksFromCache(uid) {
    const cached = localStorage.getItem(`${CACHE_KEY_PACKS}_${uid}`);
    if (!cached) return null;
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) return data.packs;
    } catch (e) {}
    return null;
  }

  // ========== BATCH-МИГРАЦИЯ (один запрос для всех паков) ==========
  async function migrateAllPacksIfNeeded() {
    const uid = getUserId();
    if (!uid) return;
    
    const migrationFlag = localStorage.getItem(`packs_migrated_${uid}`);
    if (migrationFlag === 'true') return;
    
    console.log('[Migration] Проверка паков на наличие старых ID...');
    
    const packsToUpdate = [];
    for (const pack of packs.value) {
      let updated = false;
      const newCards = pack.cards.map(card => {
        const word = vocabularyData.find(w => w.word === card.front);
        if (word && (!card.wordId || card.id !== word.id)) {
          updated = true;
          return {
            ...card,
            id: word.id,
            wordId: word.id
          };
        }
        return card;
      });
      if (updated) {
        packsToUpdate.push({ id: pack.id, cards: newCards, name: pack.name, level: pack.level });
      }
    }
    
    if (packsToUpdate.length === 0) {
      localStorage.setItem(`packs_migrated_${uid}`, 'true');
      return;
    }
    
    const batch = writeBatch(db);
    for (const p of packsToUpdate) {
      const packRef = doc(db, getPacksCollectionPath(uid), p.id);
      batch.update(packRef, { cards: p.cards, updatedAt: new Date() });
    }
    await batch.commit();
    
    // Обновляем локальные данные
    for (const updatedPack of packsToUpdate) {
      const index = packs.value.findIndex(p => p.id === updatedPack.id);
      if (index !== -1) {
        packs.value[index].cards = updatedPack.cards;
        packs.value[index].updatedAt = new Date();
      }
    }
    savePacksToCache(uid, packs.value);
    
    console.log(`[Migration] Обновлено ${packsToUpdate.length} паков`);
    localStorage.setItem(`packs_migrated_${uid}`, 'true');
  }

  // ========== Автосоздание паков для пройденных уроков ==========
  async function ensurePacksForCompletedLessons(force = false) {
    const uid = getUserId();
    if (!uid) return;
    
    const lastCheckKey = `${LAST_PACK_CHECK_KEY}_${uid}`;
    const lastCheck = localStorage.getItem(lastCheckKey);
    const now = Date.now();
    
    if (!force && lastCheck && (now - parseInt(lastCheck) < CACHE_TTL)) {
      return;
    }
    
    const completedLessons = progressFirestore.completedLessons;
    if (!completedLessons.length) return;
    
    console.log('[PackStore] Проверка паков для пройденных уроков...');
    let createdCount = 0;
    const newPacks = [];
    
    for (const lessonId of completedLessons) {
      const lessonNum = parseInt(lessonId.replace('lesson_', ''));
      const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
      if (!lesson) continue;
      
      const packName = `${lesson.title} (урок ${lesson.lesson_id})`;
      const existingPack = packs.value.find(p => p.name === packName);
      if (!existingPack) {
        const words = [];
        for (const wid of lesson.new_vocabulary_ids || []) {
          const word = vocabularyData.find(w => w.id === wid);
          if (word) {
            words.push({
              front: word.word,
              back: word.translation,
              level: lesson.level,
              example: word.example || ''
            });
          }
        }
        if (words.length) {
          const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newPack = {
            id: packId,
            name: packName,
            level: lesson.level,
            cards: words,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          newPacks.push(newPack);
          createdCount++;
        }
      }
    }
    
    if (createdCount > 0) {
      // Создаём все паки одним batch-запросом
      const batch = writeBatch(db);
      for (const newPack of newPacks) {
        const packRef = doc(db, getPacksCollectionPath(uid), newPack.id);
        batch.set(packRef, {
          name: newPack.name,
          level: newPack.level,
          cards: newPack.cards,
          createdAt: newPack.createdAt,
          updatedAt: newPack.updatedAt
        });
      }
      await batch.commit();
      
      // Добавляем в локальный массив
      packs.value.push(...newPacks);
      savePacksToCache(uid, packs.value);
      
      // Создаём прогресс для новых паков
      for (const newPack of newPacks) {
        await progressFirestore.updatePackProgress(newPack.id, []);
      }
      
      console.log(`[PackStore] Создано ${createdCount} новых паков для пройденных уроков`);
    }
    
    localStorage.setItem(lastCheckKey, now.toString());
  }

  async function loadPacks(forceRefresh = false) {
    const uid = getUserId();
    if (!uid) {
      packs.value = [];
      loaded.value = false;
      return;
    }
    try {
      if (!forceRefresh) {
        const cached = loadPacksFromCache(uid);
        if (cached) {
          packs.value = cached;
          loaded.value = true;
          await migrateAllPacksIfNeeded();
          await ensurePacksForCompletedLessons(false);
          return;
        }
      }
      const packsCol = collection(db, getPacksCollectionPath(uid));
      const packsSnap = await getDocs(packsCol);
      const packsData = packsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      packs.value = packsData;
      savePacksToCache(uid, packsData);
      loaded.value = true;
      await migrateAllPacksIfNeeded();
      await ensurePacksForCompletedLessons(false);
    } catch (err) {
      console.error('Ошибка загрузки паков:', err);
      packs.value = [];
      loaded.value = false;
    }
  }

  async function refreshPacks() {
    await loadPacks(true);
    await ensurePacksForCompletedLessons(true);
  }

  async function createPack(packData) {
    const uid = getUserId();
    if (!uid) return null;

    const packId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cards = (packData.cards || []).map(card => {
      const wordId = getWordIdByFront(card.front);
      return {
        id: wordId || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        front: card.front,
        back: card.back,
        wordId: wordId,
        example: card.example || '',
        level: card.level || packData.level || 'A0'
      };
    });

    const newPack = {
      name: packData.name,
      level: packData.level || 'A0',
      cards: cards,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const packRef = doc(db, getPacksCollectionPath(uid), packId);
      await setDoc(packRef, newPack);
      const packWithId = { id: packId, ...newPack };
      packs.value.push(packWithId);
      savePacksToCache(uid, packs.value);
      await progressFirestore.updatePackProgress(packId, []);
      return packWithId;
    } catch (err) {
      console.error('Ошибка создания пака:', err);
      return null;
    }
  }

  async function updatePack(packId, updates) {
    const uid = getUserId();
    if (!uid) return;

    try {
      const packRef = doc(db, getPacksCollectionPath(uid), packId);
      const updateData = { ...updates, updatedAt: new Date() };
      await setDoc(packRef, updateData, { merge: true });
      
      const index = packs.value.findIndex(p => p.id === packId);
      if (index !== -1) {
        packs.value[index] = { ...packs.value[index], ...updates, updatedAt: new Date() };
        savePacksToCache(uid, packs.value);
      }
    } catch (err) {
      console.error('Ошибка обновления пака:', err);
    }
  }

  async function deletePack(packId) {
    const uid = getUserId();
    if (!uid) return;

    try {
      const packToDelete = packs.value.find(p => p.id === packId);
      const packRef = doc(db, getPacksCollectionPath(uid), packId);
      await deleteDoc(packRef);
      
      packs.value = packs.value.filter(p => p.id !== packId);
      savePacksToCache(uid, packs.value);
      
      const progress = progressFirestore.getPackProgress(packId);
      if (progress.learnedCardIds?.length && packToDelete) {
        for (const cardId of progress.learnedCardIds) {
          const card = packToDelete.cards.find(c => c.id === cardId);
          if (card && card.wordId) {
            await progressFirestore.removeLearnedWord(card.wordId);
          }
        }
      }
      await progressFirestore.updatePackProgress(packId, []);
    } catch (err) {
      console.error('Ошибка удаления пака:', err);
    }
  }

  async function addCard(packId, card) {
    const uid = getUserId();
    if (!uid) return;
    
    const pack = packs.value.find(p => p.id === packId);
    if (!pack) return;

    const wordId = getWordIdByFront(card.front);
    const newCard = {
      id: wordId || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      front: card.front,
      back: card.back,
      wordId: wordId,
      example: card.example || '',
      level: card.level || pack.level
    };

    const updatedCards = [...pack.cards, newCard];
    await updatePack(packId, { cards: updatedCards });
  }

  async function removeCard(packId, cardId) {
    const uid = getUserId();
    if (!uid) return;
    
    const pack = packs.value.find(p => p.id === packId);
    if (!pack) return;

    const card = pack.cards.find(c => c.id === cardId);
    const updatedCards = pack.cards.filter(c => c.id !== cardId);
    await updatePack(packId, { cards: updatedCards });

    const progress = progressFirestore.getPackProgress(packId);
    if (progress.learnedCardIds?.includes(cardId) && card && card.wordId) {
      await progressFirestore.removeLearnedWord(card.wordId);
      const newLearned = progress.learnedCardIds.filter(id => id !== cardId);
      await progressFirestore.updatePackProgress(packId, newLearned);
    }
  }

  function getDueCards(packId, limit = 20) {
    const pack = packs.value.find(p => p.id === packId);
    if (!pack) return [];
    const progress = progressFirestore.getPackProgress(packId);
    const learnedIds = new Set(progress.learnedCardIds || []);
    return pack.cards.filter(card => !learnedIds.has(card.id)).slice(0, limit);
  }

  async function answerCard(packId, cardId, quality) {
    const progress = progressFirestore.getPackProgress(packId);
    const learnedIds = progress.learnedCardIds || [];
    
    if (quality >= 3 && !learnedIds.includes(cardId)) {
      learnedIds.push(cardId);
      await progressFirestore.updatePackProgress(packId, learnedIds);
      
      const pack = packs.value.find(p => p.id === packId);
      const card = pack?.cards.find(c => c.id === cardId);
      if (card && card.wordId) {
        await progressFirestore.addLearnedWord(card.wordId);
      }
    }
  }

  return {
    packs,
    loaded,
    loadPacks,
    refreshPacks,
    createPack,
    updatePack,
    deletePack,
    addCard,
    removeCard,
    getDueCards,
    answerCard
  };
});