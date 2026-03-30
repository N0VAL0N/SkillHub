<template>
  <StudentLayout>
    <div class="readings-view">
      <div class="page-header">
        <h1>Тексты для чтения</h1>
        <p class="subtitle">HSK {{ currentLevel }}</p>
      </div>

      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level; loadReadings()"
        >
          HSK {{ level }}
        </button>
      </div>

      <div v-if="loading" class="loading">Загрузка текстов...</div>
      <div v-else-if="readings.length === 0" class="empty-state">
        <div class="empty-icon">📰</div>
        <p>Нет текстов для выбранного уровня</p>
      </div>
      <div v-else class="readings-list">
        <div
          v-for="reading in readings"
          :key="reading.id"
          class="reading-card"
          :class="{ completed: isCompleted(reading.id) }"
          @click="openReading(reading)"
        >
          <h3>{{ reading.title_ru || reading.title }}</h3>
          <p class="preview">{{ reading.content.slice(0, 100) }}...</p>
          <div class="reading-meta">
            <span class="questions-count">{{ reading.questions?.length || 0 }} вопросов</span>
            <span v-if="isCompleted(reading.id)" class="completed-badge">✓ Прочитано</span>
          </div>
        </div>
      </div>

      <!-- Модалка чтения -->
      <div v-if="selectedReading" class="modal-overlay" @click.self="selectedReading = null">
        <div class="modal reading-modal">
          <div class="modal-header">
            <h2>{{ selectedReading.title_ru || selectedReading.title }}</h2>
            <button class="close-btn" @click="selectedReading = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="reading-content">
              <p>{{ selectedReading.content }}</p>
              <p v-if="selectedReading.pinyin" class="content-pinyin">{{ selectedReading.pinyin }}</p>
              <p v-if="selectedReading.translation" class="content-translation">{{ selectedReading.translation }}</p>
            </div>
            <div v-if="selectedReading.questions?.length" class="questions">
              <h4>Вопросы:</h4>
              <div v-for="(q, idx) in selectedReading.questions" :key="idx" class="question-item">
                <p class="question-text">{{ q.question.ru || q.question.chinese }}</p>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in q.options"
                    :key="optIdx"
                    @click="!selectedReading.readonly && checkAnswer(idx, optIdx)"
                    :disabled="selectedReading.readonly || userAnswers[idx] !== undefined"
                    :class="[
                      'option-btn',
                      {
                        correct: userAnswers[idx] === optIdx && optIdx === q.answer,
                        wrong: userAnswers[idx] === optIdx && optIdx !== q.answer,
                        selected: userAnswers[idx] === optIdx
                      }
                    ]"
                  >
                    {{ opt.ru || opt.chinese }}
                  </button>
                </div>
              </div>
              <div v-if="allCorrect && !selectedReading.readonly" class="completion-message">
                <p>✅ Поздравляем! Вы правильно ответили на все вопросы.</p>
                <button class="btn-primary" @click="markAsCompleted">Отметить прочитанным</button>
              </div>
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
import { useChineseReadingStore } from '@/stores/chineseReadingStore'
import { useChineseProgressStore } from '@/stores/chineseProgressStore'

const readingStore = useChineseReadingStore()
const progressStore = useChineseProgressStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const loading = ref(false)
const readings = ref([])
const selectedReading = ref(null)
const userAnswers = ref({})

onMounted(async () => {
  await loadReadings()
  await progressStore.loadProgress()
})

async function loadReadings() {
  loading.value = true
  await readingStore.loadReadings(currentLevel.value)
  readings.value = readingStore.readings
  loading.value = false
}

function isCompleted(readingId) {
  return progressStore.completedReadings?.includes(readingId)
}

function openReading(reading) {
  selectedReading.value = {
    ...reading,
    readonly: isCompleted(reading.id),
    questions: reading.questions?.map((q, idx) => ({
      ...q,
      userAnswer: null
    }))
  }
  userAnswers.value = {}
}

function checkAnswer(questionIndex, optionIndex) {
  if (userAnswers.value[questionIndex] !== undefined) return
  userAnswers.value[questionIndex] = optionIndex
}

const allCorrect = computed(() => {
  if (!selectedReading.value?.questions) return false
  return selectedReading.value.questions.every((q, idx) => 
    userAnswers.value[idx] === q.answer
  )
})

function markAsCompleted() {
  if (selectedReading.value) {
    progressStore.addCompletedReading(selectedReading.value.id)
    selectedReading.value.readonly = true
    selectedReading.value = null
  }
}
</script>

<style scoped>
.readings-view {
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
.readings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.reading-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}
.reading-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.reading-card.completed {
  border-left: 4px solid var(--success);
}
.reading-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}
.preview {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--gray-500);
}
.reading-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.questions-count {
  font-size: 0.7rem;
  color: var(--gray-400);
}
.completed-badge {
  font-size: 0.7rem;
  color: var(--success);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--secondary);
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.reading-content {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}
.content-pinyin {
  color: var(--gray-500);
  font-style: italic;
  margin-top: 0.5rem;
}
.content-translation {
  color: var(--gray-500);
  margin-top: 0.5rem;
  border-left: 3px solid var(--primary);
  padding-left: 0.75rem;
}
.questions h4 {
  margin-bottom: 1rem;
}
.question-item {
  margin-bottom: 1rem;
}
.question-text {
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.option-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.option-btn.selected {
  background: var(--primary-light);
  border-color: var(--primary);
}
.option-btn.correct {
  background: rgba(16, 185, 129, 0.2);
  border-color: var(--success);
  color: var(--success);
}
.option-btn.wrong {
  background: rgba(239, 68, 68, 0.2);
  border-color: var(--danger);
  color: var(--danger);
}
.completion-message {
  margin-top: 1rem;
  text-align: center;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.75rem;
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
.loading, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
body.dark-theme .reading-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .reading-content {
  background: var(--gray-700);
}
body.dark-theme .reading-card h3 {
  color: white;
}
</style>