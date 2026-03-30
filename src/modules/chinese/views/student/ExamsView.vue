<template>
  <StudentLayout>
    <div class="exams-view">
      <div class="page-header">
        <h1>Экзамены HSK</h1>
        <p class="subtitle">Пробные экзамены для самопроверки</p>
      </div>

      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level; loadExams()"
        >
          HSK {{ level }}
        </button>
      </div>

      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'available' }]"
          @click="activeTab = 'available'"
        >
          Доступные
        </button>
        <button
          :class="['tab', { active: activeTab === 'completed' }]"
          @click="activeTab = 'completed'"
        >
          Завершённые
        </button>
      </div>

      <div v-if="loading" class="loading">Загрузка экзаменов...</div>
      
      <div v-else-if="activeTab === 'available'">
        <div v-if="availableExams.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p>Нет доступных экзаменов для уровня HSK {{ currentLevel }}</p>
          <button class="btn-primary" @click="generateNewExam">Сгенерировать новый экзамен</button>
        </div>
        <div v-else class="exams-list">
          <div
            v-for="exam in availableExams"
            :key="exam.id"
            class="exam-card"
          >
            <h3>{{ exam.title }}</h3>
            <p>Уровень HSK {{ exam.level }}</p>
            <p class="exam-time">⏱️ {{ exam.totalTime }} минут</p>
            <p class="exam-questions">📋 {{ totalQuestions(exam) }} вопросов</p>
            <button class="btn-primary" @click="startExam(exam)">Начать экзамен</button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'completed'">
        <div v-if="completedExamsList.length === 0" class="empty-state">
          <div class="empty-icon">🏆</div>
          <p>Вы ещё не завершили ни одного экзамена</p>
        </div>
        <div v-else class="exams-list">
          <div
            v-for="exam in completedExamsList"
            :key="exam.id"
            class="exam-card completed"
          >
            <h3>{{ exam.title }}</h3>
            <p>Уровень HSK {{ exam.level }}</p>
            <div class="exam-result">
              <span class="score" :class="{ passed: exam.score?.passed }">
                {{ exam.score?.percentage || 0 }}%
              </span>
              <span class="result-text">{{ exam.score?.passed ? 'Сдан' : 'Не сдан' }}</span>
            </div>
            <button class="btn-outline" @click="reviewExam(exam)">Посмотреть результат</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChineseExamStore } from '@modules/chinese/stores/chineseExamStore'
import { useChineseProgressStore } from '@modules/chinese/stores/chineseProgressStore'

const router = useRouter()
const examStore = useChineseExamStore()
const progressStore = useChineseProgressStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const activeTab = ref('available')
const loading = ref(false)
const exams = ref([])

onMounted(async () => {
  await loadExams()
  await progressStore.loadProgress()
})

async function loadExams() {
  loading.value = true
  await examStore.loadExams(currentLevel.value)
  exams.value = examStore.exams
  loading.value = false
}

function totalQuestions(exam) {
  return exam.sections?.reduce((acc, section) => acc + section.questions.length, 0) || 0
}

const completedExamsList = computed(() => {
  const completedIds = progressStore.examResults?.map(r => r.examId) || []
  return exams.value.filter(e => completedIds.includes(e.id))
})

const availableExams = computed(() => {
  const completedIds = progressStore.examResults?.map(r => r.examId) || []
  return exams.value.filter(e => !completedIds.includes(e.id))
})

async function generateNewExam() {
  loading.value = true
  const newExam = await examStore.generateNewExam(currentLevel.value)
  exams.value.push(newExam)
  loading.value = false
  startExam(newExam)
}

function startExam(exam) {
  router.push(`/chinese/exam/${exam.id}`)
}

function reviewExam(exam) {
  router.push(`/chinese/exam/${exam.id}?review=true`)
}
</script>

<style scoped>
.exams-view {
  max-width: 800px;
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
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.level-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.level-btn.active {
  background: var(--primary);
  color: white;
}
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.tab {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--gray-500);
}
.tab.active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}
.exams-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.exam-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}
.exam-card:hover {
  box-shadow: var(--shadow-md);
}
.exam-card.completed {
  border-left: 4px solid var(--success);
}
.exam-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}
.exam-card p {
  margin: 0.25rem 0;
  font-size: 0.85rem;
  color: var(--gray-500);
}
.exam-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.score {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--danger);
}
.score.passed {
  color: var(--success);
}
.result-text {
  font-size: 0.85rem;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  margin-top: 0.5rem;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  margin-top: 0.5rem;
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
body.dark-theme .exam-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .exam-card h3 {
  color: white;
}
</style>