<template>
  <StudentLayout>
    <div class="lesson-screen">
      <div class="lesson-header">
        <button class="back-btn" @click="goBack">← Назад</button>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="page-counter">{{ currentPage }} / {{ totalPages }}</div>
      </div>

      <div class="lives-indicator" v-if="!isCompleted && totalPages > 0 && currentPageData?.type !== 'completion'">
        <span v-for="i in maxLives" :key="i" class="heart" :class="{ lost: i > lives }">❤️</span>
      </div>

      <div class="lesson-content" v-if="lesson && currentPageData">
        <!-- Титульная страница -->
        <div v-if="currentPageData.type === 'title'" class="title-page centered">
          <h2>{{ currentPageData.title }}</h2>
          <p>{{ currentPageData.description }}</p>
          <div v-if="isCompleted" class="completed-actions">
            <button class="btn-primary" @click="restartLesson">Пройти заново</button>
            <button class="btn-outline" @click="showResultsModal = true">Результаты</button>
          </div>
        </div>

        <!-- Страница слова -->
        <div v-else-if="currentPageData.type === 'word'" class="word-page centered">
          <div class="card-flip" @click="flipCard" :class="{ flipped: isFlipped }">
            <div class="card-front">
              <span class="hanzi">{{ currentPageData.word.simplified }}</span>
              <span class="pinyin">{{ currentPageData.word.pinyin }}</span>
            </div>
            <div class="card-back">
              <span class="translation">{{ currentPageData.word.translations?.ru || currentPageData.word.translations }}</span>
            </div>
          </div>
          <p class="flip-hint">👆 нажми на карточку, чтобы увидеть перевод</p>
          <div class="word-actions">
            <button class="btn-primary audio-btn" @click="playAudio(currentPageData.word.simplified)">
              🔊 Прослушать
            </button>
            <button class="btn-outline" @click="openStrokeOrder(currentPageData.word)">
              ✍️ Порядок черт
            </button>
            <button class="btn-outline" @click="skipWord">⏭️ Пропустить</button>
          </div>
        </div>

        <!-- Страница грамматики -->
        <div v-else-if="currentPageData.type === 'grammar'" class="grammar-page centered">
          <h3>Грамматика</h3>
          <div class="grammar-item">
            <p class="pattern">{{ currentPageData.grammarPoint.pattern }}</p>
            <p class="explanation">{{ currentPageData.grammarPoint.explanation }}</p>
            <ul class="examples">
              <li v-for="(ex, idx) in currentPageData.grammarPoint.examples" :key="idx">
                <template v-if="typeof ex === 'string'">
                  <span class="example-chinese">{{ ex }}</span>
                  <button class="audio-btn-small" @click="playAudio(ex)">🔊</button>
                </template>
                <template v-else>
                  <span class="example-chinese">{{ ex.chinese }}</span>
                  <button class="audio-btn-small" @click="playAudio(ex.chinese)">🔊</button>
                  <span class="example-pinyin" v-if="ex.pinyin"> ({{ ex.pinyin }})</span>
                  <span class="example-translation" v-if="ex.translation"> – {{ ex.translation }}</span>
                </template>
              </li>
            </ul>
          </div>
        </div>

        <!-- Страница диалога -->
        <div v-else-if="currentPageData.type === 'dialogue'" class="dialogue-page centered">
          <h3>Диалог</h3>
          <div v-for="(line, idx) in currentPageData.dialogue.lines" :key="idx" class="dialogue-line">
            <div class="speaker">{{ line.speaker }}</div>
            <div class="dialogue-content">
              <div class="chinese-row">
                <span class="chinese">{{ line.chinese }}</span>
                <div class="dialogue-actions">
                  <button class="audio-btn-small" @click="playAudio(line.chinese)">🔊</button>
                  <button class="btn-icon" @click="toggleTranslation(idx)">👁️</button>
                </div>
              </div>
              <div class="pinyin">{{ line.pinyin }}</div>
              <div v-if="showTranslations[idx]" class="translation">{{ line.russian }}</div>
            </div>
          </div>
        </div>

        <!-- Страница true/false -->
        <div v-else-if="currentPageData.type === 'dialogue-truefalse'" class="truefalse-page">
          <h3>Проверьте понимание диалога</h3>
          <p class="instruction">Выберите 对 (верно) или 错 (неверно) для каждого утверждения.</p>
          <div v-for="(statement, idx) in currentPageData.statements" :key="idx" class="statement-item">
            <p class="statement-text">{{ statement.text }}</p>
            <p class="statement-pinyin">{{ statement.pinyin }}</p>
            <div class="options">
              <button
                @click="answerTrueFalse(idx, true)"
                :disabled="userAnswers[idx] !== null"
                :class="['option-btn', { selected: userAnswers[idx] === true }]"
              >
                对 (верно)
              </button>
              <button
                @click="answerTrueFalse(idx, false)"
                :disabled="userAnswers[idx] !== null"
                :class="['option-btn', { selected: userAnswers[idx] === false }]"
              >
                错 (неверно)
              </button>
            </div>
          </div>
        </div>

        <!-- Страница с упражнением -->
        <div v-else-if="currentPageData.type === 'exercise'" class="exercise-page">
          <ExerciseCard
            :key="currentPageData.exercise.id"
            :exercise="currentPageData.exercise"
            :isActive="true"
            :initialState="exerciseStates[currentPage - 1]"
            :disabled="lives <= 0"
            @answered="handleExerciseAnswer"
            @update-state="updateExerciseState"
            @next="nextPage"
            @mistake="handleMistake"
          />
        </div>

        <!-- Страница завершения -->
        <div v-else-if="currentPageData.type === 'completion'" class="completion-page centered">
          <div class="check-circle">🎉</div>
          <h2>Урок завершён!</h2>
          <p>Вы готовы к практике</p>
          <button class="btn-primary" @click="finishLesson">Завершить</button>
        </div>

        <div v-else class="unknown-page">
          <p>Неизвестный тип страницы: {{ currentPageData.type }}</p>
        </div>
      </div>
      <div v-else class="loading">Загрузка урока...</div>

      <!-- Нижняя навигация -->
      <div class="lesson-footer" v-if="currentPageData && currentPageData.type !== 'completion' && !isCompleted">
        <button class="nav-btn prev" :disabled="currentPage === 1" @click="prevPage">
          ← Назад
        </button>
        <button class="nav-btn next" :class="{ primary: currentPage === totalPages }" @click="nextPage" :disabled="!canGoNext">
          Далее →
        </button>
      </div>

      <!-- Модалка результатов -->
      <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
        <div class="modal results-modal">
          <h2>Результаты урока</h2>
          <div class="score-circle">
            <div class="score-percent">{{ successPercentage }}%</div>
          </div>
          <div class="stats">
            <p>Ошибок: {{ totalMistakes }} из {{ exercisesCount }}</p>
            <p>Осталось жизней: {{ lives }}</p>
            <p class="grade">{{ grade }}</p>
          </div>
          <div class="result-actions">
            <button class="btn-primary" @click="finishLesson">На главную</button>
          </div>
        </div>
      </div>

      <!-- Модалка смерти -->
      <div v-if="showDeathModal" class="modal-overlay" @click.self="showDeathModal = false">
        <div class="modal death-modal">
          <h2>💔 Жизни кончились</h2>
          <p>Попробуйте начать урок заново.</p>
          <div class="modal-actions">
            <button class="btn-outline" @click="restartLesson">Начать заново</button>
            <button class="btn-primary" @click="finishLesson">На главную</button>
          </div>
        </div>
      </div>

      <!-- Модалка порядка черт -->
      <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
        <div class="modal stroke-modal">
          <div class="modal-header">
            <h3>{{ strokeCharacter }}</h3>
            <button class="close-btn" @click="showStrokeModal = false">✕</button>
          </div>
          <StrokeOrder :character="strokeCharacter" :size="200" />
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StudentLayout from '@/layouts/StudentLayout.vue'
import { useChineseLessonStore } from '@/stores/chineseLessonStore'
import { useChineseVocabularyStore } from '@/stores/chineseVocabularyStore'
import { useChineseGrammarStore } from '@/stores/chineseGrammarStore'
import { useChineseProgressStore } from '@/stores/chineseProgressStore'
import { useAppStore } from '@/stores/appStore'
import { speak } from '@/services/tts'
import ExerciseCard from '@/components/chinese/ExerciseCard.vue'
import StrokeOrder from '@/components/chinese/StrokeOrder.vue'

const router = useRouter()
const route = useRoute()
const lessonId = route.params.id

const lessonStore = useChineseLessonStore()
const vocabStore = useChineseVocabularyStore()
const grammarStore = useChineseGrammarStore()
const progressStore = useChineseProgressStore()
const appStore = useAppStore()

const lesson = ref(null)
const pages = ref([])
const currentPage = ref(1)
const isFlipped = ref(false)
const showTranslations = ref([])

const maxLives = 5
const lives = ref(5)
const totalMistakes = ref(0)
const showResults = ref(false)
const showDeathModal = ref(false)
const showResultsModal = ref(false)
const startTime = ref(Date.now())
const endTime = ref(0)

const exerciseStates = ref({})
const userAnswers = ref([])
const showStrokeModal = ref(false)
const strokeCharacter = ref('')

const totalPages = computed(() => pages.value.length)
const currentPageData = computed(() => pages.value[currentPage.value - 1])
const progressPercent = computed(() => (currentPage.value / totalPages.value) * 100)

const exercisesCount = computed(() => pages.value.filter(p => p.type === 'exercise').length)
const successPercentage = computed(() => {
  if (exercisesCount.value === 0) return 0
  return Math.round(((exercisesCount.value - totalMistakes.value) / exercisesCount.value) * 100)
})

const grade = computed(() => {
  if (totalMistakes.value === 0) return '🏆 Идеально!'
  if (totalMistakes.value <= 2) return '✨ Отлично'
  if (totalMistakes.value <= 4) return '👍 Хорошо'
  return '😊 Можно лучше'
})

const canGoNext = computed(() => {
  if (lives.value <= 0) return false
  if (!currentPageData.value) return false
  if (currentPageData.value.type === 'dialogue-truefalse') {
    return userAnswers.value.length === currentPageData.value.statements?.length && 
           userAnswers.value.every(a => a !== null)
  }
  if (currentPageData.value.type === 'exercise') {
    const state = exerciseStates.value[currentPage.value - 1]
    return state?.answered === true
  }
  return currentPage.value < totalPages.value
})

const isCompleted = computed(() => progressStore.completedLessons.includes(lessonId))

onMounted(async () => {
  await Promise.all([
    vocabStore.loadVocabulary(),
    grammarStore.loadGrammar()
  ])
  
  await loadLesson()
  
  const savedPage = progressStore.lessonProgress[lessonId]?.page
  if (savedPage && savedPage <= pages.value.length) {
    currentPage.value = savedPage
  }
  
  const savedStates = localStorage.getItem(`chinese-lesson-${lessonId}-states`)
  if (savedStates) {
    try {
      exerciseStates.value = JSON.parse(savedStates)
    } catch(e) {}
  }
  
  const savedTf = localStorage.getItem(`chinese-lesson-${lessonId}-truefalse`)
  if (savedTf) {
    try {
      userAnswers.value = JSON.parse(savedTf)
    } catch(e) {}
  } else {
    userAnswers.value = []
  }
  
  startTime.value = Date.now()
})

async function loadLesson() {
  lesson.value = await lessonStore.getLessonById(lessonId)
  if (lesson.value) {
    pages.value = await buildPages(lesson.value)
  }
}

async function buildPages(lessonData) {
  const newPages = []
  newPages.push({ type: 'title', title: lessonData.title, description: `Урок ${lessonData.lessonNumber}` })

  if (lessonData.newWords && lessonData.newWords.length > 0) {
    for (const wordId of lessonData.newWords) {
      const word = vocabStore.words.find(w => w.id === wordId)
      if (word) newPages.push({ type: 'word', word })
    }
  }

  if (lessonData.grammarPoints && lessonData.grammarPoints.length > 0) {
    for (const grammarId of lessonData.grammarPoints) {
      const grammar = grammarStore.grammarPoints.find(g => g.id === grammarId)
      if (grammar) newPages.push({ type: 'grammar', grammarPoint: grammar })
    }
  }

  if (lessonData.dialogues?.length) {
    for (const dialogue of lessonData.dialogues) {
      newPages.push({ type: 'dialogue', dialogue })
      if (lessonData.trueFalseStatements && lessonData.trueFalseStatements.length > 0) {
        newPages.push({ type: 'dialogue-truefalse', statements: lessonData.trueFalseStatements })
      }
    }
  }

  if (lessonData.exercises?.length) {
    for (const exercise of lessonData.exercises) {
      newPages.push({ type: 'exercise', exercise })
    }
  }

  newPages.push({ type: 'completion' })
  return newPages
}

function handleExerciseAnswer(isCorrect) {
  // handled by ExerciseCard
}

function updateExerciseState(pageIndex, state) {
  exerciseStates.value[pageIndex] = state
  localStorage.setItem(`chinese-lesson-${lessonId}-states`, JSON.stringify(exerciseStates.value))
}

function handleMistake() {
  if (lives.value <= 0) return
  lives.value--
  totalMistakes.value++
  appStore.showToast(`Ошибка! Осталось жизней: ${lives.value}`, 'warning')
  if (lives.value <= 0) {
    showDeathModal.value = true
  }
}

function answerTrueFalse(index, value) {
  if (userAnswers.value[index] !== null) return
  const statement = currentPageData.value.statements[index]
  const isCorrect = (value === statement.correct)
  userAnswers.value[index] = value
  localStorage.setItem(`chinese-lesson-${lessonId}-truefalse`, JSON.stringify(userAnswers.value))
  
  if (isCorrect) {
    appStore.showToast('Верно!', 'success')
  } else {
    appStore.showToast('Ошибка!', 'error')
    handleMistake()
  }
}

function nextPage() {
  if (lives.value <= 0) {
    showDeathModal.value = true
    return
  }
  if (currentPage.value < totalPages.value && canGoNext.value) {
    currentPage.value++
    progressStore.updateLessonProgress(lessonId, { page: currentPage.value, status: 'in_progress' })
  } else if (currentPage.value === totalPages.value) {
    endTime.value = Date.now()
    showResults.value = true
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    progressStore.updateLessonProgress(lessonId, { page: currentPage.value })
  }
}

function skipWord() {
  const targetIndex = pages.value.findIndex(p => p.type === 'dialogue' || p.type === 'exercise')
  if (targetIndex !== -1 && targetIndex + 1 > currentPage.value) {
    currentPage.value = targetIndex + 1
  } else {
    currentPage.value = totalPages.value
  }
  progressStore.updateLessonProgress(lessonId, { page: currentPage.value })
}

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function toggleTranslation(index) {
  showTranslations.value[index] = true
}

function openStrokeOrder(word) {
  strokeCharacter.value = word.simplified
  showStrokeModal.value = true
}

async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error')
  }
}

function restartLesson() {
  lives.value = maxLives
  totalMistakes.value = 0
  currentPage.value = 1
  exerciseStates.value = {}
  userAnswers.value = []
  showDeathModal.value = false
  showResults.value = false
  localStorage.removeItem(`chinese-lesson-${lessonId}-states`)
  localStorage.removeItem(`chinese-lesson-${lessonId}-truefalse`)
  progressStore.updateLessonProgress(lessonId, { page: 1, status: 'in_progress' })
}

function finishLesson() {
  const result = {
    correct: exercisesCount.value - totalMistakes.value,
    total: exercisesCount.value,
    mistakes: totalMistakes.value,
    percentage: successPercentage.value,
    grade: grade.value,
    date: Date.now()
  }
  progressStore.completeLesson(lessonId)
  progressStore.updateLessonProgress(lessonId, { status: 'completed' })
  localStorage.removeItem(`chinese-lesson-${lessonId}-states`)
  localStorage.removeItem(`chinese-lesson-${lessonId}-truefalse`)
  router.push('/chinese/lessons')
}

function goBack() {
  progressStore.updateLessonProgress(lessonId, { page: currentPage.value })
  router.push('/chinese/lessons')
}

watch(currentPageData, (newPage) => {
  if (newPage?.type === 'dialogue' && newPage.dialogue?.lines) {
    showTranslations.value = new Array(newPage.dialogue.lines.length).fill(false)
  }
  if (newPage?.type === 'dialogue-truefalse' && newPage.statements) {
    if (userAnswers.value.length !== newPage.statements.length) {
      userAnswers.value = new Array(newPage.statements.length).fill(null)
    }
  }
  isFlipped.value = false
})

onBeforeUnmount(() => {
  progressStore.updateLessonProgress(lessonId, { page: currentPage.value })
})
</script>

<style scoped>
/* стили остаются как в предыдущей версии */
.lesson-screen {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.lesson-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem;
}
.progress-bar-container {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}
.page-counter {
  font-size: 0.85rem;
  color: var(--gray-500);
}
.lives-indicator {
  text-align: center;
  margin-bottom: 1rem;
}
.heart {
  font-size: 1.2rem;
  margin: 0 0.1rem;
}
.heart.lost {
  opacity: 0.3;
}
.lesson-content {
  min-height: 60vh;
}
.centered {
  text-align: center;
}
.card-flip {
  position: relative;
  width: 100%;
  min-height: 250px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}
.card-flip.flipped {
  transform: rotateY(180deg);
}
.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: var(--shadow);
}
.card-front {
  transform: rotateY(0deg);
}
.card-back {
  transform: rotateY(180deg);
}
.hanzi {
  font-size: 3rem;
  font-weight: bold;
  color: var(--secondary);
}
.pinyin {
  font-size: 1rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
}
.translation {
  font-size: 1.2rem;
  color: var(--primary);
}
.flip-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--gray-400);
}
.word-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}
.grammar-item {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1rem;
  text-align: left;
}
.pattern {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.5rem;
}
.examples {
  margin-top: 1rem;
  padding-left: 1rem;
}
.examples li {
  margin: 0.5rem 0;
}
.dialogue-line {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}
.speaker {
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.25rem;
}
.chinese-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chinese {
  font-size: 1.1rem;
}
.dialogue-actions {
  display: flex;
  gap: 0.5rem;
}
.statement-item {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}
.options {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.option-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 2rem;
  cursor: pointer;
}
.option-btn.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.lesson-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
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
.audio-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
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
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  float: right;
}
.loading {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
body.dark-theme .card-front,
body.dark-theme .card-back,
body.dark-theme .modal {
  background: var(--gray-800);
}
body.dark-theme .grammar-item,
body.dark-theme .dialogue-line,
body.dark-theme .statement-item {
  background: var(--gray-700);
}
</style>