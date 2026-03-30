<template>
  <StudentLayout>
    <div class="practice-view">
      <div class="page-header">
        <h1>Тренировка</h1>
        <p class="subtitle">Выберите режим и уровень</p>
      </div>

      <!-- Выбор уровня -->
      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level"
        >
          HSK {{ level }}
        </button>
      </div>

      <!-- Выбор режима -->
      <div class="mode-selector">
        <div class="mode-cards">
          <div
            v-for="mode in modes"
            :key="mode.id"
            class="mode-card"
            :class="{ active: selectedMode === mode.id }"
            @click="selectedMode = mode.id"
          >
            <div class="mode-icon">{{ mode.icon }}</div>
            <h3>{{ mode.name }}</h3>
            <p>{{ mode.description }}</p>
          </div>
        </div>
      </div>

      <!-- Кнопка старта -->
      <div class="start-section">
        <button
          class="btn-start"
          :disabled="!selectedMode || loading"
          @click="startPractice"
        >
          {{ loading ? 'Загрузка...' : 'Начать тренировку' }}
        </button>
      </div>

      <!-- Сама тренировка -->
      <div v-if="exercises.length > 0 && !showModeSelect" class="exercise-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        
        <div class="exercise-card">
          <div class="exercise-header">
            <span class="exercise-num">{{ currentIndex + 1 }} / {{ exercises.length }}</span>
            <span class="exercise-type">{{ getTypeLabel(currentExercise?.type) }}</span>
          </div>
          
          <div v-if="currentExercise?.type === 'multiple-choice'" class="multiple-choice">
            <p class="question">{{ currentExercise.question }}</p>
            <div class="options">
              <button
                v-for="(opt, idx) in currentExercise.options"
                :key="idx"
                class="option-btn"
                :class="{ selected: selectedOption === idx }"
                @click="selectedOption = idx"
                :disabled="showResult"
              >
                {{ opt }}
              </button>
            </div>
          </div>
          
          <div v-else-if="currentExercise?.type === 'fill-blank'" class="fill-blank">
            <p class="sentence">{{ currentExercise.sentence }}</p>
            <div class="options">
              <button
                v-for="(opt, idx) in currentExercise.options"
                :key="idx"
                class="option-btn"
                :class="{ selected: selectedOption === idx }"
                @click="selectedOption = idx"
                :disabled="showResult"
              >
                {{ opt }}
              </button>
            </div>
          </div>
          
          <div v-else-if="currentExercise?.type === 'translate'" class="translate">
            <p class="question">{{ currentExercise.question }}</p>
            <input
              v-model="userAnswer"
              type="text"
              class="answer-input"
              placeholder="Введите перевод..."
              :disabled="showResult"
            />
          </div>
          
          <div v-if="!showResult" class="action-buttons">
            <button class="btn-check" @click="checkAnswer" :disabled="!canCheck">
              Проверить
            </button>
          </div>
          
          <div v-else class="result-area">
            <div class="result-message" :class="{ correct: isCorrect, wrong: !isCorrect }">
              {{ isCorrect ? '✅ Правильно!' : '❌ Неправильно!' }}
            </div>
            <div v-if="!isCorrect && currentExercise?.type === 'translate'" class="correct-answer">
              Правильный ответ: {{ currentExercise.correctAnswer }}
            </div>
            <button class="btn-next" @click="nextExercise">
              {{ isLast ? 'Завершить' : 'Следующее →' }}
            </button>
          </div>
        </div>
        
        <div class="stats-bar">
          <span>📊 Правильно: {{ stats.correct }} / {{ stats.total }}</span>
          <span>🎯 Точность: {{ accuracy }}%</span>
          <button v-if="exercises.length > 0" class="btn-reset" @click="resetPractice">
            🔄 Новая тренировка
          </button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChineseProgressStore } from '@modules/chinese/stores/chineseProgressStore'
import { generateExercisesBase, ExerciseType } from '@modules/chinese/services/lessonGenerator'
import hskAll from '@modules/chinese/data/hsk_all.json'

const progressStore = useChineseProgressStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const selectedMode = ref(null)
const loading = ref(false)
const showModeSelect = ref(true)
const exercises = ref([])
const currentIndex = ref(0)
const userAnswer = ref('')
const selectedOption = ref(null)
const showResult = ref(false)
const isCorrect = ref(false)
const stats = ref({ total: 0, correct: 0 })

const modes = [
  {
    id: 'vocabulary',
    name: 'Словарный запас',
    icon: '📖',
    description: 'Проверка знания слов и перевода',
    types: [ExerciseType.MultipleChoice, ExerciseType.Translate]
  },
  {
    id: 'grammar',
    name: 'Грамматика',
    icon: '📐',
    description: 'Заполнение пропусков',
    types: [ExerciseType.FillBlank]
  },
  {
    id: 'mixed',
    name: 'Смешанный режим',
    icon: '🎲',
    description: 'Все типы упражнений',
    types: [ExerciseType.MultipleChoice, ExerciseType.FillBlank, ExerciseType.Translate]
  }
]

onMounted(async () => {
  await progressStore.loadProgress()
  stats.value = progressStore.practiceStats
})

async function startPractice() {
  if (!selectedMode.value) return
  loading.value = true
  generateNewSet()
  showModeSelect.value = false
  loading.value = false
}

function resetPractice() {
  showModeSelect.value = true
  exercises.value = []
  currentIndex.value = 0
  showResult.value = false
}

function generateNewSet() {
  const mode = modes.find(m => m.id === selectedMode.value)
  const words = hskAll.filter(w => String(w.level) === String(currentLevel.value)).slice(0, 30)
  
  const generated = generateExercisesBase({
    words,
    count: 10,
    lessonLevel: currentLevel.value,
    includeTypes: mode.types
  })
  
  exercises.value = generated.map((ex, idx) => ({ ...ex, id: `${Date.now()}-${idx}` }))
  currentIndex.value = 0
  showResult.value = false
  userAnswer.value = ''
  selectedOption.value = null
}

const currentExercise = computed(() => exercises.value[currentIndex.value])
const isLast = computed(() => currentIndex.value === exercises.value.length - 1)
const progressPercent = computed(() => ((currentIndex.value + 1) / exercises.value.length) * 100)
const accuracy = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.correct / stats.value.total) * 100)
})

const canCheck = computed(() => {
  if (!currentExercise.value) return false
  if (currentExercise.value.type === 'translate') {
    return userAnswer.value.trim().length > 0
  }
  return selectedOption.value !== null
})

function getTypeLabel(type) {
  const labels = {
    'multiple-choice': 'Выбор ответа',
    'fill-blank': 'Заполнить пропуск',
    'translate': 'Перевод'
  }
  return labels[type] || type
}

function checkAnswer() {
  let correct = false
  const ex = currentExercise.value
  
  if (ex.type === ExerciseType.MultipleChoice) {
    correct = selectedOption.value === ex.correctAnswer
  } else if (ex.type === ExerciseType.FillBlank) {
    correct = selectedOption.value === ex.correctAnswer
  } else if (ex.type === ExerciseType.Translate) {
    correct = userAnswer.value.trim().toLowerCase() === ex.correctAnswer.toLowerCase()
  }
  
  isCorrect.value = correct
  showResult.value = true
  
  if (correct) {
    stats.value.correct++
    progressStore.addPracticeResult(true)
  } else {
    progressStore.addPracticeResult(false)
  }
  stats.value.total++
}

function nextExercise() {
  if (currentIndex.value + 1 < exercises.value.length) {
    currentIndex.value++
    showResult.value = false
    userAnswer.value = ''
    selectedOption.value = null
  } else {
    showModeSelect.value = true
    exercises.value = []
  }
}

function selectLevel(level) {
  currentLevel.value = level
}
</script>

<style scoped>
.practice-view {
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

.mode-selector {
  margin-bottom: 2rem;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.mode-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  border: 2px solid var(--gray-200);
  transition: all 0.2s;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.mode-card.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.mode-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.mode-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}

.mode-card p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}

.start-section {
  text-align: center;
  margin-bottom: 2rem;
}

.btn-start {
  padding: 0.75rem 2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Остальные стили такие же, как в предыдущей версии */
.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}

.exercise-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
  margin-bottom: 1rem;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.exercise-num {
  font-size: 0.85rem;
  color: var(--gray-500);
}

.exercise-type {
  font-size: 0.7rem;
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  color: var(--gray-600);
}

.question, .sentence {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.option-btn {
  padding: 0.6rem 1.2rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.btn-check {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}

.btn-check:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-area {
  text-align: center;
  margin-top: 1rem;
}

.result-message {
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.result-message.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.result-message.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.correct-answer {
  font-size: 0.85rem;
  color: var(--success);
  margin-bottom: 0.75rem;
}

.btn-next {
  padding: 0.5rem 1.2rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  font-size: 0.85rem;
  color: var(--gray-600);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-reset {
  padding: 0.3rem 0.8rem;
  background: var(--gray-200);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--gray-300);
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

body.dark-theme .exercise-card,
body.dark-theme .mode-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .stats-bar {
  background: var(--gray-700);
}
</style>