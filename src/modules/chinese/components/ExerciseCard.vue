<template>
  <div class="exercise-card" :class="{ active: isActive, disabled: disabled }">
    <!-- Инструкция -->
    <p v-if="exercise.type === 'match-translation'" class="instruction">Соедините иероглифы с переводом</p>
    <p v-else-if="exercise.type === 'listening'" class="instruction">Прослушайте слово и выберите перевод</p>
    <p v-else-if="exercise.type === 'fill-blank'" class="instruction">Выберите правильный вариант</p>
    <p v-else-if="exercise.type === 'multiple-choice'" class="instruction">Выберите правильный вариант</p>
    <p v-else-if="exercise.type === 'match-pinyin'" class="instruction">Выберите пиньинь для каждого иероглифа</p>
    <p v-else-if="exercise.type === 'translate'" class="instruction">Введите перевод</p>
    <p v-else-if="exercise.type === 'sentence-order'" class="instruction">Расположите слова в правильном порядке</p>

    <!-- fill-blank -->
    <div v-if="exercise.type === 'fill-blank'">
      <p class="sentence">{{ exercise.sentence }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.correctAnswer,
              wrong: !answered && selectedIdx === optIndex && optIndex !== exercise.correctAnswer,
              selected: !answered && selectedIdx === optIndex,
              'pulse-correct': showCorrectPulse && optIndex === exercise.correctAnswer
            }
          ]"
        >
          {{ opt || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- multiple-choice -->
    <div v-else-if="exercise.type === 'multiple-choice'">
      <p class="question">{{ exercise.question }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.correctAnswer,
              wrong: !answered && selectedIdx === optIndex && optIndex !== exercise.correctAnswer,
              selected: !answered && selectedIdx === optIndex,
              'pulse-correct': showCorrectPulse && optIndex === exercise.correctAnswer
            }
          ]"
        >
          {{ opt || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- listening -->
    <div v-else-if="exercise.type === 'listening'" class="listening-mode">
      <button class="btn btn-primary audio-btn" @click="playAudio(exercise.word.simplified)" :disabled="disabled">
        🔊 Прослушать
      </button>
      <div class="options-grid two-columns" v-if="exercise.options?.length">
        <button
          v-for="(option, idx) in exercise.options"
          :key="idx"
          @click="selectOptionByValue(option, exercise.correctAnswer)"
          :disabled="disabled || (answered && isCorrect)"
          :class="[
            'option-btn',
            {
              selected: selectedOption === option,
              correct: answered && isCorrect && option === exercise.correctAnswer,
              wrong: !answered && selectedOption === option && option !== exercise.correctAnswer,
              'pulse-correct': showCorrectPulse && option === exercise.correctAnswer
            }
          ]"
        >
          {{ option || 'нет перевода' }}
        </button>
      </div>
    </div>

    <!-- match-pinyin -->
    <div v-else-if="exercise.type === 'match-pinyin'" class="match-pinyin">
      <div v-for="(pair, pairIndex) in exercise.pairs" :key="pairIndex" class="match-row">
        <span class="chinese-char">{{ pair.chinese }}</span>
        <div class="pinyin-options">
          <button
            v-for="p in pinyinOptions"
            :key="p"
            @click="handlePinyinClick(pairIndex, p)"
            :disabled="disabled || rowStatus[pairIndex] === 'correct'"
            :class="[
              'pinyin-btn',
              { 
                active: userMatches[pairIndex] === p,
                correct: rowStatus[pairIndex] === 'correct' && p === pair.pinyin,
                wrong: !answered && userMatches[pairIndex] === p && p !== pair.pinyin
              }
            ]"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- match-translation -->
    <div v-else-if="exercise.type === 'match-translation'" class="match-translation">
      <div class="match-grid">
        <div class="chinese-col">
          <div
            v-for="(pair, idx) in exercise.pairs"
            :key="idx"
            class="match-item chinese-item"
            :class="{ selected: selectedChineseIndex === idx, matched: matchedIndices.includes(idx) }"
            @click="!disabled && handleChineseClick(idx)"
          >
            {{ pair.chinese }}
          </div>
        </div>
        <div class="translation-col">
          <div
            v-for="(pair, idx) in exercise.pairs"
            :key="idx"
            class="match-item translation-item"
            :class="{ selected: selectedTranslationIndex === idx, matched: matchedIndices.includes(idx) }"
            @click="!disabled && handleTranslationClick(idx)"
          >
            {{ pair.translation || 'нет перевода' }}
          </div>
        </div>
      </div>
    </div>

    <!-- sentence-order -->
    <div v-else-if="exercise.type === 'sentence-order'">
      <div class="words-pool">
        <div
          v-for="(word, idx) in shuffledWords"
          :key="idx"
          class="word-btn"
          :draggable="!disabled && !(answered && isCorrect)"
          @dragstart="handleDragStart(idx, $event)"
          @dragend="handleDragEnd"
          @click="addWord(idx)"
        >
          {{ word }}
        </div>
      </div>

      <div class="sentence-builder">
        <span 
          v-for="(idx, i) in userOrder" 
          :key="i" 
          class="selected-word"
          :draggable="!disabled && !(answered && isCorrect)"
          @dragstart="handleBuilderDragStart(i, $event)"
          @dragend="handleDragEnd"
        >
          {{ shuffledWords[idx] }}
          <button v-if="!disabled && !(answered && isCorrect)" @click="removeWord(i)" class="remove-word">✖</button>
        </span>
      </div>

      <div class="order-actions">
        <button class="btn btn-outline" @click="resetOrder" :disabled="disabled || (answered && isCorrect)">Сбросить</button>
        <button class="btn btn-primary" @click="checkOrder" :disabled="disabled || (answered && isCorrect)">Проверить</button>
      </div>

      <div v-if="showOrderError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- translate -->
    <div v-else-if="exercise.type === 'translate'">
      <p class="question">{{ exercise.question }}</p>
      <input v-model="userAnswer" class="input" placeholder="Введите перевод" :disabled="disabled || (answered && isCorrect)" />
      <button class="btn btn-primary" @click="checkTranslate" :disabled="disabled || (answered && isCorrect)">Проверить</button>
      <div v-if="showTranslateError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- Неизвестный тип -->
    <div v-else class="error-placeholder">
      <p>⚠️ Неизвестный тип упражнения: {{ exercise.type }}</p>
    </div>

    <!-- Feedback для правильного ответа -->
    <div v-if="answered && isCorrect" class="feedback correct">
      <span>✅ Верно!</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@core/stores/appStore'
import { speak } from '@core/services/tts'

const props = defineProps({
  exercise: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
  reviewId: { type: String, default: null },
  initialState: { type: Object, default: null },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['answered', 'next', 'mistake', 'update-state'])

const appStore = useAppStore()

const answered = ref(props.initialState?.answered || false)
const isCorrect = ref(props.initialState?.isCorrect || false)
const selectedIdx = ref(props.initialState?.selectedIdx || null)
const selectedOption = ref(props.initialState?.selectedOption || null)
const userAnswer = ref(props.initialState?.userAnswer || '')
const userMatches = ref(props.initialState?.userMatches || [])
const showOrderError = ref(false)
const showTranslateError = ref(false)
const showCorrectPulse = ref(false)

// Для drag-and-drop
const draggedItem = ref(null)
const shuffledWords = ref(props.initialState?.shuffledWords || [])
const originalIndices = ref(props.initialState?.originalIndices || [])
const userOrder = ref(props.initialState?.userOrder || [])

// Для match-pinyin
const pinyinOptions = computed(() => {
  if (props.exercise.type !== 'match-pinyin') return []
  return props.exercise.pairs?.map(p => p.pinyin) || []
})
const rowStatus = ref(props.initialState?.rowStatus || [])

// Для match-translation
const selectedChineseIndex = ref(props.initialState?.selectedChineseIndex || null)
const selectedTranslationIndex = ref(props.initialState?.selectedTranslationIndex || null)
const matchedIndices = ref(props.initialState?.matchedIndices || [])

let autoAdvanceTimer = null

onMounted(() => {
  if (!props.initialState) resetForNewExercise()
})

onUnmounted(() => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
})

watch(() => props.exercise, () => {
  if (props.initialState) {
    answered.value = props.initialState.answered || false
    isCorrect.value = props.initialState.isCorrect || false
    selectedIdx.value = props.initialState.selectedIdx ?? null
    selectedOption.value = props.initialState.selectedOption || null
    userAnswer.value = props.initialState.userAnswer || ''
    userMatches.value = props.initialState.userMatches || []
    userOrder.value = props.initialState.userOrder || []
    shuffledWords.value = props.initialState.shuffledWords || []
    originalIndices.value = props.initialState.originalIndices || []
    rowStatus.value = props.initialState.rowStatus || []
    selectedChineseIndex.value = props.initialState.selectedChineseIndex ?? null
    selectedTranslationIndex.value = props.initialState.selectedTranslationIndex ?? null
    matchedIndices.value = props.initialState.matchedIndices || []
  } else {
    resetForNewExercise()
  }
}, { deep: true })

function resetForNewExercise() {
  answered.value = false
  isCorrect.value = false
  selectedIdx.value = null
  selectedOption.value = null
  userAnswer.value = ''
  userMatches.value = []
  userOrder.value = []
  showOrderError.value = false
  showTranslateError.value = false
  rowStatus.value = []
  selectedChineseIndex.value = null
  selectedTranslationIndex.value = null
  matchedIndices.value = []

  if (props.exercise.type === 'sentence-order' && props.exercise.words) {
    const words = props.exercise.words
    const indices = Array.from({ length: words.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    originalIndices.value = indices
    shuffledWords.value = indices.map(i => words[i])
  }
  if (props.exercise.type === 'match-pinyin' && props.exercise.pairs) {
    userMatches.value = new Array(props.exercise.pairs.length).fill('')
    rowStatus.value = new Array(props.exercise.pairs.length).fill('')
  }
  emitState()
}

function emitState() {
  const state = {
    answered: answered.value,
    isCorrect: isCorrect.value,
    selectedIdx: selectedIdx.value,
    selectedOption: selectedOption.value,
    userAnswer: userAnswer.value,
    userMatches: userMatches.value,
    userOrder: userOrder.value,
    shuffledWords: shuffledWords.value,
    originalIndices: originalIndices.value,
    rowStatus: rowStatus.value,
    selectedChineseIndex: selectedChineseIndex.value,
    selectedTranslationIndex: selectedTranslationIndex.value,
    matchedIndices: matchedIndices.value
  }
  emit('update-state', state)
}

function selectOption(optIndex) {
  if (props.disabled) return
  selectedIdx.value = optIndex
  const correct = optIndex === props.exercise.correctAnswer
  if (correct) {
    showCorrectPulse.value = true
    setTimeout(() => { showCorrectPulse.value = false }, 500)
    answered.value = true
    isCorrect.value = true
    emit('answered', true, 5)
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => emit('next'), 800)
  } else {
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast('Неверно, попробуйте ещё раз', 'error')
    selectedIdx.value = null
  }
  emitState()
}

function selectOptionByValue(answer, correct) {
  if (props.disabled) return
  selectedOption.value = answer
  if (answer === correct) {
    showCorrectPulse.value = true
    setTimeout(() => { showCorrectPulse.value = false }, 500)
    answered.value = true
    isCorrect.value = true
    emit('answered', true, 5)
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => emit('next'), 800)
  } else {
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast('Неверно, попробуйте ещё раз', 'error')
    selectedOption.value = null
  }
  emitState()
}

// Drag-and-drop для sentence-order
function handleDragStart(index, event) {
  draggedItem.value = { type: 'pool', index }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleBuilderDragStart(index, event) {
  draggedItem.value = { type: 'builder', index }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragEnd() {
  draggedItem.value = null
}

function addWord(index) {
  if (props.disabled || (answered.value && isCorrect.value)) return
  if (userOrder.value.includes(index)) return
  userOrder.value.push(index)
  emitState()
}

function removeWord(orderIndex) {
  if (props.disabled || (answered.value && isCorrect.value)) return
  userOrder.value.splice(orderIndex, 1)
  emitState()
}

function resetOrder() {
  if (props.disabled || (answered.value && isCorrect.value)) return
  userOrder.value = []
  emitState()
}

function checkOrder() {
  if (props.disabled || (answered.value && isCorrect.value)) return
  const correct = props.exercise.correctOrder
  const userOriginalOrder = userOrder.value.map(idx => originalIndices.value[idx])
  const correctOrder = userOriginalOrder.length === correct.length && userOriginalOrder.every((val, idx) => val === correct[idx])
  if (correctOrder) {
    answered.value = true
    isCorrect.value = true
    emit('answered', true, 5)
    showOrderError.value = false
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => emit('next'), 800)
  } else {
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast('Неверный порядок, попробуйте снова', 'error')
    userOrder.value = []
    showOrderError.value = true
    setTimeout(() => { showOrderError.value = false }, 2000)
  }
  emitState()
}

function normalizeTranslation(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[。？！.]$/, '').trim()
}

function checkTranslate() {
  if (props.disabled || (answered.value && isCorrect.value)) return
  const user = normalizeTranslation(userAnswer.value)
  const correct = normalizeTranslation(props.exercise.correctAnswer)
  if (user === correct) {
    answered.value = true
    isCorrect.value = true
    emit('answered', true, 5)
    showTranslateError.value = false
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => emit('next'), 800)
  } else {
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast('Неверный перевод, попробуйте снова', 'error')
    showTranslateError.value = true
    setTimeout(() => { showTranslateError.value = false }, 2000)
  }
  emitState()
}

function handlePinyinClick(pairIndex, pinyin) {
  if (props.disabled || rowStatus.value[pairIndex] === 'correct') return
  const correct = props.exercise.pairs?.[pairIndex].pinyin
  if (pinyin === correct) {
    userMatches.value[pairIndex] = pinyin
    rowStatus.value[pairIndex] = 'correct'
    if (rowStatus.value.every(status => status === 'correct')) {
      answered.value = true
      isCorrect.value = true
      emit('answered', true, 5)
      emitState()
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = setTimeout(() => emit('next'), 800)
    }
  } else {
    userMatches.value[pairIndex] = pinyin
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast(`Неверно, правильный: ${correct}`, 'error')
  }
  emitState()
}

function handleChineseClick(index) {
  if (props.disabled || matchedIndices.value.includes(index)) return
  selectedChineseIndex.value = index
  if (selectedTranslationIndex.value !== null) {
    checkMatch(index, selectedTranslationIndex.value)
  }
  emitState()
}

function handleTranslationClick(index) {
  if (props.disabled || matchedIndices.value.includes(index)) return
  selectedTranslationIndex.value = index
  if (selectedChineseIndex.value !== null) {
    checkMatch(selectedChineseIndex.value, index)
  }
  emitState()
}

function checkMatch(chineseIdx, translationIdx) {
  const pair = props.exercise.pairs[chineseIdx]
  const translationPair = props.exercise.pairs[translationIdx]
  if (pair.translation === translationPair.translation) {
    matchedIndices.value.push(chineseIdx, translationIdx)
    const allMatched = matchedIndices.value.length === props.exercise.pairs.length * 2
    if (allMatched) {
      answered.value = true
      isCorrect.value = true
      emit('answered', true, 5)
      emitState()
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = setTimeout(() => emit('next'), 800)
    }
  } else {
    emit('mistake')
    emit('answered', false, 0)
    appStore.showToast('Неверно, попробуйте снова', 'error')
  }
  selectedChineseIndex.value = null
  selectedTranslationIndex.value = null
  emitState()
}

async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error')
  }
}
</script>

<style scoped>
.exercise-card.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.exercise-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}
.exercise-card.active {
  transform: scale(1);
}
.sentence, .question, .instruction {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--secondary);
}
.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.option-btn {
  padding: 0.75rem;
  border: 2px solid var(--gray-200);
  background: white;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray-700);
}
.option-btn.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}
.option-btn.correct {
  border-color: var(--success);
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.option-btn.wrong {
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.option-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.pulse-correct {
  animation: correctPulse 0.5s ease;
}
@keyframes correctPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); background: rgba(16, 185, 129, 0.2); }
  100% { transform: scale(1); }
}

/* Sentence order */
.words-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  min-height: 60px;
}
.word-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.word-btn:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}
.sentence-builder {
  min-height: 60px;
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.selected-word {
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.remove-word {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}
.order-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

/* Match pinyin */
.match-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.chinese-char {
  font-size: 1.5rem;
  min-width: 60px;
  font-weight: 600;
  color: var(--secondary);
}
.pinyin-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.pinyin-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.pinyin-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.pinyin-btn.correct {
  background: var(--success);
  color: white;
  border-color: var(--success);
}
.pinyin-btn.wrong {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

/* Match translation */
.match-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.match-item {
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.match-item.selected {
  background: var(--primary-light);
  border: 1px solid var(--primary);
}
.match-item.matched {
  opacity: 0.5;
  background: var(--success);
  color: white;
  cursor: default;
}

/* Listening */
.listening-mode .audio-btn {
  margin-bottom: 1rem;
  width: 100%;
}
.options-grid {
  display: grid;
  gap: 0.75rem;
}
.two-columns {
  grid-template-columns: 1fr 1fr;
}

/* Translate */
.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: var(--gray-100);
}

.feedback {
  margin-top: 1rem;
  text-align: center;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.feedback.correct {
  color: var(--success);
  background: rgba(16, 185, 129, 0.1);
}
.feedback.wrong {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}
.error-placeholder {
  text-align: center;
  padding: 1rem;
  color: var(--danger);
}

/* Тёмная тема */
body.dark-theme .exercise-card {
  background: var(--gray-800);
}
body.dark-theme .option-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-200);
}
body.dark-theme .word-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
}
body.dark-theme .words-pool,
body.dark-theme .sentence-builder {
  background: var(--gray-700);
}
body.dark-theme .match-item {
  background: var(--gray-700);
}
body.dark-theme .input {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
}
</style>