<template>
  <StudentLayout>
  <div class="exam-session">
    <div class="exam-header">
      <button class="back-btn" @click="confirmExit">← Назад</button>
      <div class="timer" :class="{ warning: timeLeft && timeLeft < 60 }">
        ⏱️ {{ formatTime(timeLeft) }}
      </div>
      <div class="progress-text">
        {{ answeredCount }}/{{ totalQuestions }}
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <div v-if="currentSection" class="section-container">
      <h2 class="section-title">{{ currentSection.name }}</h2>
      
      <div v-if="currentQuestion" class="question-container">
        <!-- Аудирование -->
        <div v-if="currentQuestion.type === 'listening'" class="listening">
          <p class="question-text">{{ currentQuestion.text }}</p>
          <button class="btn-primary audio-btn" @click="playAudio(currentQuestion.word)">
            🔊 Прослушать
          </button>
          <div class="options">
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              @click="answerListening(opt)"
              :disabled="isAnswered"
              :class="['option-btn', { selected: tempListeningAnswer === opt }]"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Чтение -->
        <div v-else-if="currentQuestion.type === 'reading'" class="reading">
          <div class="reading-text">{{ currentQuestion.text }}</div>
          <div
            v-for="(item, itemIdx) in currentQuestion.items"
            :key="itemIdx"
            class="reading-item"
          >
            <p class="reading-question">{{ item.question }}</p>
            <div class="options">
              <button
                v-for="(opt, optIdx) in item.options"
                :key="optIdx"
                @click="answerReadingItem(itemIdx, optIdx)"
                :disabled="readingAnswers[itemIdx] !== undefined"
                :class="['option-btn', { selected: readingAnswers[itemIdx] === optIdx }]"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <!-- Fill-blank (грамматика) -->
        <div v-else-if="currentQuestion.type === 'fill-blank'" class="fill-blank">
          <p class="sentence">{{ currentQuestion.sentence }}</p>
          <div class="options">
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              @click="answerFillBlank(idx)"
              :disabled="isAnswered"
              :class="['option-btn', { selected: tempFillBlank === idx }]"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Перевод (письмо) -->
        <div v-else-if="currentQuestion.type === 'translate'" class="translate">
          <p class="question-text">{{ currentQuestion.question }}</p>
          <input
            v-model="tempTranslate"
            class="input"
            placeholder="Введите перевод..."
            :disabled="isAnswered"
          />
          <button class="btn-primary" @click="submitTranslate" :disabled="!tempTranslate.trim()">
            Ответить
          </button>
        </div>
      </div>
    </div>

    <div class="navigation">
      <button class="nav-btn" @click="prevQuestion" :disabled="currentSectionIndex === 0 && currentQuestionIndex === 0">
        ← Назад
      </button>
      <button
        class="nav-btn primary"
        @click="nextQuestion"
        :disabled="!canGoNext && !isReviewMode"
      >
        {{ isLastQuestion ? (isReviewMode ? 'Закрыть' : 'Завершить') : 'Далее →' }}
      </button>
    </div>

    <!-- Модалка подтверждения выхода -->
    <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
      <div class="modal">
        <h3>Завершить экзамен?</h3>
        <p>Прогресс не сохранится</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="showExitConfirm = false">Отмена</button>
          <button class="btn-danger" @click="exitExam">Выйти</button>
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
      <div class="modal results-modal">
        <h2>Результаты экзамена</h2>
        <div class="score-circle">
          <div class="score-percent">{{ scorePercentage }}%</div>
        </div>
        <div class="stats">
          <p>Правильно: {{ correctCount }} из {{ totalQuestions }}</p>
          <p class="grade" :class="{ passed: scorePassed, failed: !scorePassed }">
            {{ scorePassed ? 'Экзамен сдан' : 'Экзамен не сдан' }}
          </p>
        </div>
        <button class="btn-primary" @click="finishExam">На главную</button>
      </div>
    </div>
  </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChineseExamStore } from '@modules/chinese/stores/chineseExamStore'
import { useChineseProgressStore } from '@modules/chinese/stores/chineseProgressStore'
import { speak } from '@core/services/tts'

const router = useRouter()
const route = useRoute()
const examId = route.params.id
const isReviewMode = route.query.review === 'true'

const examStore = useChineseExamStore()
const progressStore = useChineseProgressStore()

const exam = ref(null)
const currentSectionIndex = ref(0)
const currentQuestionIndex = ref(0)
const answers = ref({})
const readingAnswers = ref({})
const tempListeningAnswer = ref(null)
const tempFillBlank = ref(null)
const tempTranslate = ref('')
const timeLeft = ref(0)
let timerInterval = null
const showExitConfirm = ref(false)
const showResults = ref(false)

onMounted(async () => {
  if (isReviewMode) {
    const completedExam = progressStore.examResults?.find(r => r.examId === examId)
    if (completedExam) {
      exam.value = completedExam
      answers.value = completedExam.savedAnswers || {}
    }
  } else {
    exam.value = await examStore.getExamById(examId)
    if (!exam.value) {
      router.push('/chinese/exams')
      return
    }
    timeLeft.value = exam.value.totalTime * 60
    startTimer()
    
    const savedAnswers = localStorage.getItem(`exam-${examId}-answers`)
    if (savedAnswers) {
      try {
        answers.value = JSON.parse(savedAnswers)
      } catch(e) {}
    }
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function startTimer() {
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      if (timeLeft.value === 0) {
        clearInterval(timerInterval)
        finishExam()
      }
    }
  }, 1000)
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const currentSection = computed(() => exam.value?.sections[currentSectionIndex.value])
const currentQuestion = computed(() => currentSection.value?.questions[currentQuestionIndex.value])
const totalQuestions = computed(() => {
  if (!exam.value) return 0
  return exam.value.sections.reduce((acc, s) => acc + s.questions.length, 0)
})
const answeredCount = computed(() => Object.keys(answers.value).length)
const progressPercent = computed(() => (answeredCount.value / totalQuestions.value) * 100)
const isLastQuestion = computed(() => {
  return currentSectionIndex.value === exam.value?.sections.length - 1 &&
         currentQuestionIndex.value === currentSection.value?.questions.length - 1
})
const canGoNext = computed(() => {
  const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
  return answers.value[key] !== undefined
})

function answerListening(answer) {
  tempListeningAnswer.value = answer
  const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
  answers.value[key] = answer
  saveAnswers()
  if (answer === currentQuestion.value.correctAnswer) {
    setTimeout(() => nextQuestion(), 500)
  }
}

function answerFillBlank(idx) {
  tempFillBlank.value = idx
  const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
  answers.value[key] = idx
  saveAnswers()
  if (idx === currentQuestion.value.correctAnswer) {
    setTimeout(() => nextQuestion(), 500)
  }
}

function answerReadingItem(itemIdx, optIdx) {
  readingAnswers.value[itemIdx] = optIdx
  const allAnswered = currentQuestion.value.items.every((_, idx) => readingAnswers.value[idx] !== undefined)
  if (allAnswered) {
    const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
    answers.value[key] = { ...readingAnswers.value }
    saveAnswers()
    setTimeout(() => nextQuestion(), 500)
  }
}

function submitTranslate() {
  if (!tempTranslate.value.trim()) return
  const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
  answers.value[key] = tempTranslate.value
  saveAnswers()
  setTimeout(() => nextQuestion(), 500)
}

function saveAnswers() {
  localStorage.setItem(`exam-${examId}-answers`, JSON.stringify(answers.value))
}

function nextQuestion() {
  if (!canGoNext.value && !isReviewMode) return
  
  if (currentQuestionIndex.value < currentSection.value.questions.length - 1) {
    currentQuestionIndex.value++
    resetTemp()
  } else if (currentSectionIndex.value < exam.value.sections.length - 1) {
    currentSectionIndex.value++
    currentQuestionIndex.value = 0
    resetTemp()
  } else if (isLastQuestion && !isReviewMode) {
    finishExam()
  } else if (isReviewMode && isLastQuestion) {
    router.push('/chinese/exams')
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    resetTemp()
  } else if (currentSectionIndex.value > 0) {
    currentSectionIndex.value--
    currentQuestionIndex.value = exam.value.sections[currentSectionIndex.value].questions.length - 1
    resetTemp()
  }
}

function resetTemp() {
  tempListeningAnswer.value = null
  tempFillBlank.value = null
  tempTranslate.value = ''
  readingAnswers.value = {}
  
  const key = `${currentSectionIndex.value}-${currentQuestionIndex.value}`
  const saved = answers.value[key]
  if (saved) {
    if (typeof saved === 'object' && !Array.isArray(saved)) {
      readingAnswers.value = saved
    }
  }
}

function confirmExit() {
  if (isReviewMode) {
    router.push('/chinese/exams')
  } else {
    showExitConfirm.value = true
  }
}

function exitExam() {
  localStorage.removeItem(`exam-${examId}-answers`)
  router.push('/chinese/exams')
}

const correctCount = computed(() => {
  if (!exam.value) return 0
  let correct = 0
  for (let s = 0; s < exam.value.sections.length; s++) {
    const section = exam.value.sections[s]
    for (let q = 0; q < section.questions.length; q++) {
      const question = section.questions[q]
      const answer = answers.value[`${s}-${q}`]
      if (!answer) continue
      
      if (question.type === 'listening') {
        if (answer === question.correctAnswer) correct++
      } else if (question.type === 'fill-blank') {
        if (answer === question.correctAnswer) correct++
      } else if (question.type === 'reading') {
        let allCorrect = true
        for (let i = 0; i < question.items.length; i++) {
          if (answer[i] !== question.items[i].answer) allCorrect = false
        }
        if (allCorrect) correct++
      } else if (question.type === 'translate') {
        if (answer.trim().toLowerCase() === question.correctAnswer.toLowerCase()) correct++
      }
    }
  }
  return correct
})

const scorePercentage = computed(() => Math.round((correctCount.value / totalQuestions.value) * 100))
const scorePassed = computed(() => scorePercentage.value >= 60)

function finishExam() {
  if (timerInterval) clearInterval(timerInterval)
  
  const result = {
    examId: exam.value.id,
    title: exam.value.title,
    level: exam.value.level,
    score: correctCount.value,
    total: totalQuestions.value,
    percentage: scorePercentage.value,
    passed: scorePassed.value,
    date: Date.now(),
    savedAnswers: answers.value
  }
  
  progressStore.addExamResult(result)
  localStorage.removeItem(`exam-${examId}-answers`)
  showResults.value = true
}

async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    console.error('Audio error:', error)
  }
}
</script>

<style scoped>
.exam-session {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
}
.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary);
}
.timer.warning {
  color: var(--danger);
}
.progress-text {
  font-size: 0.85rem;
  color: var(--gray-500);
}
.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}
.section-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: var(--secondary);
}
.question-container {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.question-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.reading-text {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}
.reading-item {
  margin-bottom: 1rem;
}
.reading-question {
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.option-btn {
  padding: 0.5rem 1rem;
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
.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.audio-btn {
  margin-bottom: 1rem;
}
.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}
.nav-btn {
  padding: 0.6rem 1.5rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
}
.nav-btn.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 350px;
  width: 90%;
  text-align: center;
}
.results-modal .score-circle {
  margin: 1rem auto;
}
.score-percent {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
}
.grade {
  font-size: 1.1rem;
  font-weight: bold;
}
.grade.passed {
  color: var(--success);
}
.grade.failed {
  color: var(--danger);
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
body.dark-theme .question-container,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .reading-text {
  background: var(--gray-700);
}
</style>