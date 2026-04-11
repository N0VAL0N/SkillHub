import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loadPracticeStats, savePracticeStats } from '../services/practiceStorage';
import { auth } from '@core/services/firebase';

export const useEnglishProgressStore = defineStore('englishProgress', () => {
  const learnedWords = ref([]);
  const completedLessons = ref([]);
  const lessonProgress = ref({});
  const practiceStats = ref({ total: 0, correct: 0 });
  const completedReadings = ref([]);

  function getUserId() {
    const user = auth.currentUser;
    return user ? user.uid : 'anonymous';
  }

  async function loadProgress() {
    const userId = getUserId();
    // Загрузка из localStorage (быстрая)
    const saved = localStorage.getItem(`english_progress_${userId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        learnedWords.value = data.learnedWords || [];
        completedLessons.value = data.completedLessons || [];
        lessonProgress.value = data.lessonProgress || {};
        completedReadings.value = data.completedReadings || [];
      } catch (e) {}
    }
    // Загрузка практики из IndexedDB
    const practice = await loadPracticeStats(userId);
    practiceStats.value = practice;
  }

  function saveProgress() {
    const userId = getUserId();
    localStorage.setItem(`english_progress_${userId}`, JSON.stringify({
      learnedWords: learnedWords.value,
      completedLessons: completedLessons.value,
      lessonProgress: lessonProgress.value,
      completedReadings: completedReadings.value
    }));
  }

  async function addPracticeResult(correct) {
    practiceStats.value.total++;
    if (correct) practiceStats.value.correct++;
    const userId = getUserId();
    await savePracticeStats(userId, practiceStats.value);
  }

  function addLearnedWord(wordId) {
    if (!learnedWords.value.includes(wordId)) {
      learnedWords.value.push(wordId);
      saveProgress();
    }
  }

  function completeLesson(lessonId) {
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value.push(lessonId);
      saveProgress();
    }
  }

  function updateLessonProgress(lessonId, data) {
    lessonProgress.value[lessonId] = { ...lessonProgress.value[lessonId], ...data };
    saveProgress();
  }

  function addCompletedReading(readingId) {
    if (!completedReadings.value.includes(readingId)) {
      completedReadings.value.push(readingId);
      saveProgress();
    }
  }

  return {
    learnedWords,
    completedLessons,
    lessonProgress,
    practiceStats,
    completedReadings,
    loadProgress,
    addLearnedWord,
    completeLesson,
    updateLessonProgress,
    addPracticeResult,
    addCompletedReading
  };
});