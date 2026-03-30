<template>
  <StudentLayout>
    <div class="stats-view">
      <div class="page-header">
        <h1>Моя статистика</h1>
        <p class="subtitle">Прогресс в изучении китайского</p>
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
        <h2>Прогресс по уровням HSK</h2>
        <div class="level-progress">
          <div v-for="level in levels" :key="level" class="level-progress-item">
            <span class="level-name">HSK {{ level }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getLevelProgress(level) + '%' }"></div>
            </div>
            <span class="level-percent">{{ getLevelProgress(level) }}%</span>
          </div>
        </div>
      </div>

      <div class="exam-results-section" v-if="examResults.length > 0">
        <h2>Результаты экзаменов</h2>
        <div class="exam-list">
          <div v-for="exam in examResults" :key="exam.examId" class="exam-card">
            <div class="exam-info">
              <h3>{{ exam.title }}</h3>
              <p>HSK {{ exam.level }}</p>
            </div>
            <div class="exam-score" :class="{ passed: exam.passed }">
              {{ exam.percentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@/layouts/StudentLayout.vue'
import { useChineseVocabularyStore } from '@/stores/chineseVocabularyStore'
import { useChineseProgressStore } from '@/stores/chineseProgressStore'

const vocabStore = useChineseVocabularyStore()
const progressStore = useChineseProgressStore()

const levels = ['1', '2', '3', '4', '5']
const wordsByLevel = ref({})

onMounted(async () => {
  await Promise.all([
    vocabStore.loadVocabulary(),
    progressStore.loadProgress()
  ])
  
  for (const level of levels) {
    await vocabStore.loadVocabulary(level)
    wordsByLevel.value[level] = vocabStore.words.length
  }
})

const learnedWordsCount = computed(() => progressStore.learnedWords?.length || 0)
const completedLessonsCount = computed(() => progressStore.completedLessons?.length || 0)
const practiceStats = computed(() => progressStore.practiceStats || { total: 0, correct: 0 })
const practiceAccuracy = computed(() => {
  if (practiceStats.value.total === 0) return 0
  return Math.round((practiceStats.value.correct / practiceStats.value.total) * 100)
})
const examResults = computed(() => progressStore.examResults || [])

function getLevelProgress(level) {
  const totalWords = wordsByLevel.value[level] || 1
  const learnedInLevel = progressStore.learnedWords?.filter(id => {
    const word = vocabStore.words.find(w => w.id === id)
    return word?.level === level
  }).length || 0
  return Math.round((learnedInLevel / totalWords) * 100)
}
</script>

<style scoped>
.stats-view {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
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
  color: var(--secondary);
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
}
.level-name {
  width: 60px;
  font-weight: 500;
}
.progress-bar {
  flex: 1;
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
  color: var(--gray-500);
}
.exam-results-section {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.exam-results-section h2 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: var(--secondary);
}
.exam-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.exam-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}
.exam-info h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--secondary);
}
.exam-info p {
  margin: 0;
  font-size: 0.7rem;
  color: var(--gray-500);
}
.exam-score {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--danger);
}
.exam-score.passed {
  color: var(--success);
}
body.dark-theme .stat-card,
body.dark-theme .chart-section,
body.dark-theme .exam-results-section {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .exam-card {
  background: var(--gray-700);
}
body.dark-theme .stat-info h3 {
  color: var(--primary);
}
</style>