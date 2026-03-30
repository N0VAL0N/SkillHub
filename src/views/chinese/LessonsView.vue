<template>
  <StudentLayout>
    <div class="lessons-view">
      <div class="page-header">
        <h1>Уроки китайского</h1>
        <p class="subtitle">HSK {{ currentLevel }}</p>
      </div>

      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level, locked: !isLevelUnlocked(level) }"
          @click="selectLevel(level)"
          :disabled="!isLevelUnlocked(level)"
        >
          HSK {{ level }}
          <span v-if="!isLevelUnlocked(level)" class="lock-icon">🔒</span>
          <span v-else-if="isLevelCompleted(level)" class="check-icon">✓</span>
        </button>
      </div>

      <div v-if="loading" class="loading">Загрузка уроков...</div>
      <div v-else-if="lessons.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Нет уроков для уровня HSK {{ currentLevel }}</p>
      </div>
      <div v-else class="lessons-grid">
        <div
          v-for="lesson in lessons"
          :key="lesson.id"
          class="lesson-card"
          :class="{
            locked: lesson.locked,
            completed: lesson.completed,
            'in-progress': lesson.inProgress
          }"
          @click="goToLesson(lesson)"
        >
          <div class="lesson-number">{{ lesson.number }}</div>
          <div class="lesson-info">
            <h3>{{ lesson.title }}</h3>
            <p class="lesson-topics">{{ lesson.topics?.join(', ') || 'Общая тема' }}</p>
          </div>
          <div class="lesson-status">
            <span v-if="lesson.completed" class="status-badge completed">✓ Выучен</span>
            <span v-else-if="lesson.inProgress" class="status-badge in-progress">📖 В процессе</span>
            <span v-else-if="lesson.locked" class="status-badge locked">🔒 Закрыт</span>
            <span v-else class="status-badge not-started">⚪ Не начат</span>
          </div>
          <div v-if="lesson.progress > 0 && !lesson.completed" class="progress-bar">
            <div class="progress-fill" :style="{ width: lesson.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StudentLayout from '@/layouts/StudentLayout.vue'
import { useChineseProgressStore } from '@/stores/chineseProgressStore'
import lessonTopics from '@/data/chinese/lessonTopics.json'

const router = useRouter()
const progressStore = useChineseProgressStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const loading = ref(false)

const allLessonsMeta = ref([])

onMounted(async () => {
  loading.value = true
  await progressStore.loadProgress()
  allLessonsMeta.value = Object.entries(lessonTopics).map(([id, data]) => ({
    id,
    level: data.level,
    number: data.number,
    title: data.title,
    topics: data.topics || []
  }))
  loading.value = false
})

const getLessonIdsByLevel = (level) => {
  return allLessonsMeta.value.filter(l => l.level === level).map(l => l.id)
}

const isLevelCompleted = (level) => {
  const lessonIds = getLessonIdsByLevel(level)
  if (lessonIds.length === 0) return false
  return lessonIds.every(id => progressStore.completedLessons.includes(id))
}

const isLevelUnlocked = (level) => {
  if (level === '1') return true
  const prevLevel = (parseInt(level) - 1).toString()
  return isLevelCompleted(prevLevel)
}

const selectLevel = (level) => {
  if (!isLevelUnlocked(level)) return
  currentLevel.value = level
}

const lessons = computed(() => {
  const levelLessons = allLessonsMeta.value
    .filter(l => l.level === currentLevel.value)
    .sort((a, b) => a.number - b.number)

  const completedLessons = progressStore.completedLessons
  const lessonProgress = progressStore.lessonProgress
  const levelUnlocked = isLevelUnlocked(currentLevel.value)

  return levelLessons.map(lesson => {
    const completed = completedLessons.includes(lesson.id)
    const progressData = lessonProgress[lesson.id]
    const inProgress = !completed && progressData && progressData.status === 'in_progress'

    let locked = false
    if (!levelUnlocked) {
      locked = true
    } else if (lesson.number > 1) {
      const prevLessonId = levelLessons.find(l => l.number === lesson.number - 1)?.id
      if (prevLessonId && !completedLessons.includes(prevLessonId)) {
        locked = true
      }
    }

    let progress = 0
    if (progressData?.page) {
      const totalPages = 30
      progress = Math.min(Math.round((progressData.page / totalPages) * 100), 100)
    }

    return {
      ...lesson,
      completed,
      inProgress,
      locked,
      progress
    }
  })
})

function goToLesson(lesson) {
  if (lesson.locked) return
  router.push(`/chinese/lesson/${lesson.id}`)
}
</script>

<style scoped>
.lessons-view {
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
.level-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.level-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.level-btn.active {
  background: var(--primary);
  color: white;
}
.level-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-300);
}
.lock-icon, .check-icon {
  margin-left: 0.25rem;
  font-size: 0.7rem;
}
.check-icon {
  color: var(--success);
}
.lessons-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lesson-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.lesson-card:hover:not(.locked) {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.lesson-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}
.lesson-card.completed {
  border-left: 4px solid var(--success);
}
.lesson-card.in-progress {
  border-left: 4px solid var(--warning);
}
.lesson-number {
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}
.lesson-info {
  flex: 1;
}
.lesson-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: var(--secondary);
}
.lesson-topics {
  margin: 0;
  font-size: 0.7rem;
  color: var(--gray-500);
}
.lesson-status {
  min-width: 90px;
  text-align: right;
}
.status-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
}
.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.status-badge.in-progress {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}
.status-badge.locked {
  background: var(--gray-200);
  color: var(--gray-500);
}
.status-badge.not-started {
  background: var(--gray-100);
  color: var(--gray-500);
}
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gray-200);
  border-radius: 0 0 1rem 1rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}
.loading, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
body.dark-theme .lesson-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .lesson-info h3 {
  color: white;
}
</style>