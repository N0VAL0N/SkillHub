<template>
  <StudentLayout>
    <div class="chinese-dashboard">
      <div class="page-header">
        <h1>Добро пожаловать в раздел китайского языка, {{ studentLogin }}!</h1>
        <p class="subtitle">Продолжай изучение HSK</p>
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

      <div class="level-progress-section">
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

      <div class="quick-actions">
        <h2>Быстрый старт</h2>
        <div class="actions-grid">
          <router-link to="/chinese/lessons" class="action-card">
            <span class="action-icon">📚</span>
            <h3>Уроки</h3>
            <p>Изучай новые темы</p>
          </router-link>
          <router-link to="/chinese/practice" class="action-card">
            <span class="action-icon">✍️</span>
            <h3>Практика</h3>
            <p>Тренируй навыки</p>
          </router-link>
          <router-link to="/chinese/library" class="action-card">
            <span class="action-icon">📖</span>
            <h3>Библиотека</h3>
            <p>Словарь и грамматика</p>
          </router-link>
          <router-link to="/chinese/packs" class="action-card">
            <span class="action-icon">🃏</span>
            <h3>Паки</h3>
            <p>Карточки для запоминания</p>
          </router-link>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChineseProgressStore } from '@modules/chinese/stores/chineseProgressStore'
import hskAll from '@modules/chinese/data/hsk_all.json'

const progressStore = useChineseProgressStore()

const studentLogin = ref('')
const levels = ['1', '2', '3', '4', '5']
const wordsByLevel = ref({})

onMounted(async () => {
  // Получаем логин пользователя из localStorage или auth
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  studentLogin.value = user.login || 'Ученик'
  
  await progressStore.loadProgress()
  
  // Подсчитываем количество слов на каждом уровне
  for (const level of levels) {
    wordsByLevel.value[level] = hskAll.filter(w => String(w.level) === level).length
  }
})

const learnedWordsCount = computed(() => progressStore.learnedWords?.length || 0)
const completedLessonsCount = computed(() => progressStore.completedLessons?.length || 0)
const practiceStats = computed(() => progressStore.practiceStats || { total: 0, correct: 0 })
const practiceAccuracy = computed(() => {
  if (practiceStats.value.total === 0) return 0
  return Math.round((practiceStats.value.correct / practiceStats.value.total) * 100)
})

function getLevelProgress(level) {
  const totalWords = wordsByLevel.value[level] || 1
  // Считаем количество выученных слов на этом уровне
  const learnedInLevel = progressStore.learnedWords?.filter(id => {
    const word = hskAll.find(w => w.id === id)
    return word && String(word.level) === level
  }).length || 0
  return Math.round((learnedInLevel / totalWords) * 100)
}
</script>

<style scoped>
.chinese-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--secondary);
}

.subtitle {
  margin: 0.5rem 0 0;
  color: var(--gray-500);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--gray-200);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  margin: 0;
  font-size: 2rem;
  color: var(--primary);
}

.stat-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-500);
}

.level-progress-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}

.level-progress-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
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

.quick-actions {
  margin: 2rem 0;
}

.quick-actions h2 {
  margin-bottom: 1rem;
  font-size: 1.4rem;
  color: var(--secondary);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.action-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.action-card h3 {
  margin: 0 0 0.5rem;
  color: var(--secondary);
}

.action-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gray-500);
}

body.dark-theme .stat-card,
body.dark-theme .level-progress-section,
body.dark-theme .action-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .page-header h1,
body.dark-theme .level-progress-section h2,
body.dark-theme .quick-actions h2,
body.dark-theme .action-card h3 {
  color: #ffffff;
}

body.dark-theme .stat-info p,
body.dark-theme .level-percent,
body.dark-theme .action-card p {
  color: var(--gray-400);
}
</style>