<template>
  <StudentLayout>
    <div class="stats-view">
      <div class="page-header">
        <div>
          <h1>Моя статистика</h1>
          <p class="subtitle">Прогресс в изучении английского</p>
        </div>
        <button class="refresh-btn" @click="refreshAllData" :disabled="refreshing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4V10H17M1 20V14H7"/>
            <path d="M3.51 9C4.85 5.18 8.5 2.5 13 2.5C18.5 2.5 22.5 6.5 22.5 12"/>
            <path d="M20.49 15C19.15 18.82 15.5 21.5 11 21.5C5.5 21.5 1.5 17.5 1.5 12"/>
          </svg>
          Обновить
        </button>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <h3>{{ learnedWordsCount }}</h3>
            <p>Слов выучено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ completedLessonsCount }}</h3>
            <p>Уроков пройдено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ practiceStats.total }}</h3>
            <p>Упражнений</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <h3>{{ practiceAccuracy }}%</h3>
            <p>Точность</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h2>Прогресс по уровням</h2>
        <div class="level-progress">
          <div v-for="level in levels" :key="level" class="level-progress-item">
            <span class="level-name">{{ level }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getLevelProgress(level) + '%' }"></div>
            </div>
            <span class="level-percent">{{ getLevelProgress(level) }}%</span>
            <span class="level-status" :class="{ locked: !isLevelUnlocked(level), completed: isLevelCompleted(level) }">
              {{ isLevelCompleted(level) ? '✅ Открыт' : (isLevelUnlocked(level) ? '🔓 Доступен' : '🔒 Закрыт') }}
            </span>
          </div>
        </div>
      </div>

      <div class="reading-stats" v-if="completedReadingsCount > 0">
        <h2>📖 Прочитанные тексты</h2>
        <p>Вы прочитали <strong>{{ completedReadingsCount }}</strong> из <strong>{{ totalReadingsCount }}</strong> текстов</p>
        <div class="progress-bar big">
          <div class="progress-fill" :style="{ width: readingProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useAppStore } from '@core/stores/appStore';
import vocabularyData from '../data/vocabulary.json';
import lessonsData from '../data/lessons.json';
import readingsData from '../data/readings.json';

const progressFirestore = useEnglishProgressFirestore();
const packStore = useEnglishPackStore();
const appStore = useAppStore();

const refreshing = ref(false);
const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const wordsByLevel = ref({});
const lessonsByLevel = ref({});
const totalReadingsCount = computed(() => readingsData.length);
const completedReadingsCount = computed(() => {
  const saved = localStorage.getItem('english_completed_readings');
  return saved ? JSON.parse(saved).length : 0;
});
const readingProgress = computed(() => {
  if (totalReadingsCount.value === 0) return 0;
  return Math.round((completedReadingsCount.value / totalReadingsCount.value) * 100);
});

async function refreshAllData() {
  refreshing.value = true;
  appStore.showToast('Обновление данных...', 'info');
  try {
    const { flushQueue } = await import('@/modules/english/services/syncService');
    await flushQueue();
    await progressFirestore.refresh();
    await packStore.refreshPacks();
    appStore.showToast('Данные обновлены', 'success');
  } catch (err) {
    console.error('Ошибка обновления:', err);
    appStore.showToast('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
}

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  
  for (const level of levels) {
    wordsByLevel.value[level] = vocabularyData.filter(w => w.level === level).length;
    lessonsByLevel.value[level] = lessonsData.lessons.filter(l => l.level === level).length;
  }
});

const learnedWordsCount = computed(() => progressFirestore.learnedWords?.length || 0);
const completedLessonsCount = computed(() => progressFirestore.completedLessons?.length || 0);
const practiceStats = computed(() => ({ total: 0, correct: 0 }));
const practiceAccuracy = computed(() => 0);

function getLevelProgress(level) {
  const totalWords = wordsByLevel.value[level] || 1;
  const learnedInLevel = progressFirestore.learnedWords?.filter(wordId => {
    const word = vocabularyData.find(w => w.id === wordId);
    return word && word.level === level;
  }).length || 0;
  return Math.round((learnedInLevel / totalWords) * 100);
}

function getCompletedLessonsCount(level) {
  const lessonIds = lessonsData.lessons.filter(l => l.level === level).map(l => `lesson_${l.lesson_id}`);
  return lessonIds.filter(id => progressFirestore.completedLessons.includes(id)).length;
}

function isLevelCompleted(level) {
  const totalLessons = lessonsByLevel.value[level] || 0;
  if (totalLessons === 0) return false;
  return getCompletedLessonsCount(level) === totalLessons;
}

function isLevelUnlocked(level) {
  if (level === 'A0') return true;
  const prevLevel = levels[levels.indexOf(level) - 1];
  return isLevelCompleted(prevLevel);
}
</script>

<style scoped>
.stats-view {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-header h1 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--secondary);
}
.subtitle {
  margin: 0.25rem 0 0;
  color: var(--gray-500);
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn svg {
  transition: transform 0.3s;
}
.refresh-btn:hover svg {
  transform: rotate(180deg);
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--gray-200);
}
.stat-icon {
  font-size: 2rem;
}
.stat-info h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary);
}
.stat-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}
.chart-section {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.chart-section h2 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}
.level-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.level-progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.level-name {
  width: 60px;
  font-weight: 500;
}
.progress-bar {
  flex: 2;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}
.level-percent {
  width: 45px;
  font-size: 0.85rem;
}
.level-status {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
}
.level-status.completed {
  background: rgba(16,185,129,0.2);
  color: var(--success);
}
.level-status.locked {
  background: rgba(239,68,68,0.1);
  color: var(--danger);
}
.reading-stats {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
}
.reading-stats h2 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}
.progress-bar.big {
  height: 12px;
  margin-top: 0.5rem;
}
body.dark-theme .stat-card,
body.dark-theme .chart-section,
body.dark-theme .reading-stats {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
</style>