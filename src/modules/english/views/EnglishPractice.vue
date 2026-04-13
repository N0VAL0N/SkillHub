<template>
  <StudentLayout>
    <div class="practice-view">
      <div class="page-header">
        <h1>Тренировка</h1>
        <p class="subtitle">Выберите тип контента, уровни и режим</p>
      </div>

      <div class="content-type-selector">
        <span class="type-label">Тип контента:</span>
        <div class="type-buttons">
          <button
            v-for="type in contentTypes"
            :key="type.id"
            class="type-btn"
            :class="{ active: selectedContentTypes.includes(type.id) }"
            @click="toggleContentType(type.id)"
          >
            {{ type.icon }} {{ type.name }}
          </button>
        </div>
      </div>

      <div class="level-selector multi">
        <span class="level-label">Уровни:</span>
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: selectedLevels.includes(level) }"
          @click="toggleLevel(level)"
        >
          {{ level }}
        </button>
        <button class="level-btn all-btn" @click="selectAllLevels">Все</button>
        <button class="level-btn reset-btn" @click="resetLevels">Сбросить</button>
      </div>

      <div class="questions-count-selector">
        <span class="count-label">Количество заданий:</span>
        <div class="count-control">
          <button class="count-btn" @click="decreaseCount">−</button>
          <input type="number" v-model="questionsCount" class="count-input" min="5" max="50" step="5" />
          <button class="count-btn" @click="increaseCount">+</button>
        </div>
      </div>

      <div class="start-section" v-if="showModeSelect">
        <button class="btn-start" :disabled="selectedLevels.length === 0 || selectedContentTypes.length === 0 || loading" @click="startPractice">
          {{ loading ? 'Загрузка...' : 'Начать тренировку' }}
        </button>
      </div>

      <div v-if="exercises.length > 0 && !showModeSelect" class="exercise-container">
        <div class="progress-bar custom-progress">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="exercise-card">
          <div class="exercise-header">
            <span class="exercise-num">{{ currentIndex + 1 }} / {{ exercises.length }}</span>
            <span class="exercise-type">{{ getTypeLabel(currentExercise?.type) }}</span>
          </div>

          <!-- Multiple Choice (включая перевод) -->
          <div v-if="currentExercise?.type === 'multiple-choice' || currentExercise?.type === 'translation'" class="multiple-choice">
            <div class="question-word">{{ currentExercise.question }}</div>
            <div class="options">
              <button
                v-for="(opt, idx) in currentExercise.options"
                :key="idx"
                class="option-card"
                :class="{ selected: userAnswers[currentIndex] === idx, correct: showResult && idx === currentExercise.correctAnswer, wrong: showResult && userAnswers[currentIndex] === idx && idx !== currentExercise.correctAnswer }"
                @click="selectAnswer(idx)"
                :disabled="showResult"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <!-- Matching -->
          <div v-else-if="currentExercise?.type === 'matching'" class="matching">
            <div class="matching-container">
              <div class="matching-column">
                <h4>Английский</h4>
                <div
                  v-for="(item, idx) in shuffledLeft"
                  :key="idx"
                  class="matching-card"
                  :class="{ selected: selectedLeft === idx, matched: matchedLeftIndices.includes(idx) }"
                  @click="selectLeft(idx)"
                  :disabled="showResult || matchedLeftIndices.includes(idx)"
                >
                  {{ item.english }}
                </div>
              </div>
              <div class="matching-column">
                <h4>Русский</h4>
                <div
                  v-for="(item, idx) in shuffledRight"
                  :key="idx"
                  class="matching-card"
                  :class="{ selected: selectedRight === idx, matched: matchedRightIndices.includes(idx) }"
                  @click="selectRight(idx)"
                  :disabled="showResult || matchedRightIndices.includes(idx)"
                >
                  {{ item.russian }}
                </div>
              </div>
            </div>

            <!-- Блок сопоставленных пар -->
            <div v-if="matchedPairs.length > 0" class="matching-matched">
              <h4>✓ Сопоставленные пары</h4>
              <div class="matched-pairs">
                <div v-for="pair in matchedPairs" :key="pair.enId" class="matched-pair">
                  <span>{{ pair.en }}</span>
                  <span class="pair-arrow">→</span>
                  <span>{{ pair.ru }}</span>
                </div>
              </div>
            </div>

            <div v-if="showResult" class="result-area">
              <div class="result-message" :class="{ correct: isAnswerCorrect, wrong: !isAnswerCorrect }">
                {{ isAnswerCorrect ? '✅ Правильно!' : '❌ Неправильно!' }}
              </div>
              <div v-if="!isAnswerCorrect" class="correct-answer">
                Правильные пары показаны выше.
              </div>
              <button class="btn-next" @click="nextExercise">
                {{ isLast ? 'Завершить' : 'Следующее →' }}
              </button>
            </div>
          </div>

          <div v-if="showResult && currentExercise?.type !== 'matching'" class="result-area">
            <div class="result-message" :class="{ correct: isAnswerCorrect, wrong: !isAnswerCorrect }">
              {{ isAnswerCorrect ? '✅ Правильно!' : '❌ Неправильно!' }}
            </div>
            <div v-if="!isAnswerCorrect" class="correct-answer">
              Правильный ответ: {{ currentExercise.correctAnswerText }}
            </div>
            <button class="btn-next" @click="nextExercise">
              {{ isLast ? 'Завершить' : 'Следующее →' }}
            </button>
          </div>

          <div v-if="currentExercise?.type === 'matching' && showResult" class="nav-buttons">
            <button class="btn-next" @click="nextExercise">
              {{ isLast ? 'Завершить' : 'Следующее →' }}
            </button>
          </div>
        </div>

        <div class="stats-bar">
          <span>📊 Правильно: {{ stats.correct }} / {{ stats.total }}</span>
          <span>🎯 Точность: {{ accuracy }}%</span>
          <button class="btn-reset" @click="resetPractice">🔄 Новая тренировка</button>
        </div>
        <div class="finish-section">
          <button class="btn-finish" @click="finishPractice">🏁 Завершить тренировку</button>
        </div>
      </div>

      <div v-if="showResultsModal" class="modal-overlay" @click.self="showResultsModal = false">
        <div class="modal results-modal">
          <h2>Результаты тренировки</h2>
          <div class="score-circle">
            <div class="score-percent">{{ finalPercentage }}%</div>
          </div>
          <p>✅ Правильно: {{ finalCorrect }} из {{ finalTotal }}</p>
          <p>🎯 Точность: {{ finalPercentage }}%</p>
          <div class="modal-actions">
            <button class="btn-primary" @click="retryMistakes">Повторить ошибки</button>
            <button class="btn-primary" @click="resetPractice">Новая тренировка</button>
            <button class="btn-outline" @click="closeResults">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useAppStore } from '@core/stores/appStore';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';
import irregularVerbs from '../data/irregular_verbs.json';
import phrasalVerbs from '../data/phrasal_verbs.json';
import idiomsData from '../data/idioms.json';
import collocationsData from '../data/collocations.json';

const progressFirestore = useEnglishProgressFirestore();
const appStore = useAppStore();

const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const selectedLevels = ref(['A0', 'A1', 'A2', 'B1', 'B2']);
const selectedContentTypes = ref(['vocabulary']);
const loading = ref(false);
const showModeSelect = ref(true);
const exercises = ref([]);
const currentIndex = ref(0);
const userAnswers = ref({});
const showResult = ref(false);
const isAnswerCorrect = ref(false);
const stats = ref({ total: 0, correct: 0 });
const showResultsModal = ref(false);
const finalCorrect = ref(0);
const finalTotal = ref(0);
const finalPercentage = ref(0);
const questionsCount = ref(10);
const wrongItemsIds = ref([]);

// Matching state
const selectedLeft = ref(null);
const selectedRight = ref(null);
const matchedLeftIndices = ref([]);
const matchedRightIndices = ref([]);
const matchedPairs = ref([]);
const shuffledLeft = ref([]);
const shuffledRight = ref([]);

const contentTypes = [
  { id: 'vocabulary', name: 'Словарь', icon: '📖', data: vocabularyData, textKey: 'word', translationKey: 'translation' },
  { id: 'grammar', name: 'Грамматика', icon: '📐', data: grammarData, textKey: 'title', translationKey: 'theory' },
  { id: 'irregular', name: 'Неправ. глаголы', icon: '🔄', data: irregularVerbs, textKey: 'base', translationKey: 'translation' },
  { id: 'phrasal', name: 'Фраз. глаголы', icon: '🔗', data: phrasalVerbs, textKey: 'verb', translationKey: 'translation' },
  { id: 'idioms', name: 'Идиомы', icon: '💡', data: idiomsData, textKey: 'expression', translationKey: 'translation' },
  { id: 'collocations', name: 'Коллокации', icon: '🤝', data: collocationsData, textKey: 'collocation', translationKey: 'translation' }
];

function toggleContentType(typeId) {
  if (selectedContentTypes.value.includes(typeId)) {
    if (selectedContentTypes.value.length === 1) {
      appStore.showToast('Нельзя убрать последний тип', 'warning');
      return;
    }
    selectedContentTypes.value = selectedContentTypes.value.filter(t => t !== typeId);
  } else {
    selectedContentTypes.value.push(typeId);
  }
}

function toggleLevel(level) {
  if (selectedLevels.value.includes(level)) {
    selectedLevels.value = selectedLevels.value.filter(l => l !== level);
  } else {
    selectedLevels.value.push(level);
  }
}

function selectAllLevels() {
  selectedLevels.value = [...levels];
}

function resetLevels() {
  selectedLevels.value = [];
}

function increaseCount() {
  if (questionsCount.value < 50) questionsCount.value += 5;
}

function decreaseCount() {
  if (questionsCount.value > 5) questionsCount.value -= 5;
}

function getDataByTypes() {
  let combined = [];
  for (const typeId of selectedContentTypes.value) {
    const type = contentTypes.find(t => t.id === typeId);
    if (type) {
      const filtered = type.data.filter(item => selectedLevels.value.includes(item.level));
      combined.push(...filtered.map(item => ({ ...item, _sourceType: typeId })));
    }
  }
  return combined;
}

function getItemText(item) {
  const type = contentTypes.find(t => t.id === item._sourceType);
  if (!type) return '';
  return item[type.textKey];
}

function getItemTranslation(item) {
  const type = contentTypes.find(t => t.id === item._sourceType);
  if (!type) return '';
  if (type.id === 'grammar') return item[type.translationKey]?.slice(0, 100) || '';
  return item[type.translationKey];
}

function generateMultipleChoice(item) {
  const allData = getDataByTypes();
  const translation = getItemTranslation(item);
  const text = getItemText(item);
  const wrongItems = allData.filter(i => i.id !== item.id && getItemTranslation(i) !== translation).sort(() => 0.5 - Math.random()).slice(0, 3);
  const wrongTranslations = wrongItems.map(i => getItemTranslation(i));
  const options = [translation, ...wrongTranslations].sort(() => 0.5 - Math.random());
  return {
    id: `mc_${item.id}_${item._sourceType}`,
    type: 'multiple-choice',
    itemId: item.id,
    sourceType: item._sourceType,
    question: text,
    options,
    correctAnswer: options.indexOf(translation),
    correctAnswerText: translation
  };
}

// Перевод теперь тоже с вариантами (multiple-choice)
function generateTranslation(item) {
  const allData = getDataByTypes();
  const translation = getItemTranslation(item);
  const text = getItemText(item);
  const wrongItems = allData.filter(i => i.id !== item.id && getItemTranslation(i) !== translation).sort(() => 0.5 - Math.random()).slice(0, 3);
  const wrongTranslations = wrongItems.map(i => getItemTranslation(i));
  const options = [translation, ...wrongTranslations].sort(() => 0.5 - Math.random());
  return {
    id: `tr_${item.id}_${item._sourceType}`,
    type: 'translation',
    itemId: item.id,
    sourceType: item._sourceType,
    question: `Переведите "${text}" на русский:`,
    options,
    correctAnswer: options.indexOf(translation),
    correctAnswerText: translation
  };
}

function generateMatching(items) {
  const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 6);
  const leftItems = shuffled.map(item => ({ id: item.id, english: getItemText(item) }));
  const rightItems = [...shuffled.map(item => ({ id: item.id, russian: getItemTranslation(item) }))];
  for (let i = rightItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
  }
  return {
    id: `match_${Date.now()}`,
    type: 'matching',
    itemIds: shuffled.map(i => i.id),
    sourceTypes: [...new Set(shuffled.map(i => i._sourceType))],
    leftItems: leftItems,
    rightItems: rightItems,
    correctMap: Object.fromEntries(shuffled.map(item => [item.id, getItemTranslation(item)]))
  };
}

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateExercises() {
  const allItems = getDataByTypes();
  const shuffled = shuffleArray([...allItems]);
  const newExercises = [];
  for (const item of shuffled) {
    if (newExercises.length >= questionsCount.value) break;
    const rand = Math.random();
    let exercise = null;
    if (rand < 0.6) {
      exercise = generateMultipleChoice(item);
    } else if (rand < 0.8) {
      exercise = generateTranslation(item);
    } else if (newExercises.length + 4 <= questionsCount.value) {
      const matchingItems = shuffled.slice(0, Math.min(6, shuffled.length));
      if (matchingItems.length >= 2) {
        exercise = generateMatching(matchingItems);
      }
    }
    if (exercise) newExercises.push(exercise);
  }
  exercises.value = newExercises;
  currentIndex.value = 0;
  userAnswers.value = {};
  showResult.value = false;
  stats.value = { total: 0, correct: 0 };
  wrongItemsIds.value = [];
  resetMatchingState();
}

function resetMatchingState() {
  selectedLeft.value = null;
  selectedRight.value = null;
  matchedLeftIndices.value = [];
  matchedRightIndices.value = [];
  matchedPairs.value = [];
  if (currentExercise.value?.type === 'matching') {
    shuffledLeft.value = [...currentExercise.value.leftItems];
    shuffledRight.value = [...currentExercise.value.rightItems];
  }
}

async function selectAnswer(idx) {
  if (showResult.value) return;
  userAnswers.value[currentIndex.value] = idx;
  const isCorrect = idx === currentExercise.value.correctAnswer;
  isAnswerCorrect.value = isCorrect;
  showResult.value = true;
  
  await progressFirestore.updateStats(isCorrect);
  
  if (isCorrect) {
    stats.value.correct++;
  } else {
    if (currentExercise.value.itemId && !wrongItemsIds.value.includes(currentExercise.value.itemId)) {
      wrongItemsIds.value.push(currentExercise.value.itemId);
    }
    appStore.showToast('Неправильно!', 'error');
  }
  stats.value.total++;
  
  if (!isLast.value) {
    setTimeout(() => {
      nextExercise();
    }, 1000);
  }
}

// Matching функции (с async)
async function selectLeft(idx) {
  if (showResult.value) return;
  if (matchedLeftIndices.value.includes(idx)) return;
  if (selectedLeft.value !== null && selectedRight.value !== null) return;
  
  if (selectedLeft.value === idx) {
    selectedLeft.value = null;
  } else if (selectedRight.value !== null) {
    const leftItem = shuffledLeft.value[idx];
    const rightItem = shuffledRight.value[selectedRight.value];
    if (leftItem.id === rightItem.id) {
      matchedLeftIndices.value.push(idx);
      matchedRightIndices.value.push(selectedRight.value);
      matchedPairs.value.push({
        enId: leftItem.id,
        ruId: rightItem.id,
        en: leftItem.english,
        ru: rightItem.russian
      });
      if (matchedLeftIndices.value.length === shuffledLeft.value.length) {
        isAnswerCorrect.value = true;
        showResult.value = true;
        await progressFirestore.updateStats(true);
        stats.value.correct++;
        stats.value.total++;
      }
    } else {
      appStore.showToast('❌ Неверное сопоставление!', 'error');
    }
    selectedLeft.value = null;
    selectedRight.value = null;
  } else {
    selectedLeft.value = idx;
  }
}

async function selectRight(idx) {
  if (showResult.value) return;
  if (matchedRightIndices.value.includes(idx)) return;
  if (selectedLeft.value !== null && selectedRight.value !== null) return;
  
  if (selectedRight.value === idx) {
    selectedRight.value = null;
  } else if (selectedLeft.value !== null) {
    const leftItem = shuffledLeft.value[selectedLeft.value];
    const rightItem = shuffledRight.value[idx];
    if (leftItem.id === rightItem.id) {
      matchedLeftIndices.value.push(selectedLeft.value);
      matchedRightIndices.value.push(idx);
      matchedPairs.value.push({
        enId: leftItem.id,
        ruId: rightItem.id,
        en: leftItem.english,
        ru: rightItem.russian
      });
      if (matchedLeftIndices.value.length === shuffledLeft.value.length) {
        isAnswerCorrect.value = true;
        showResult.value = true;
        await progressFirestore.updateStats(true);
        stats.value.correct++;
        stats.value.total++;
      }
    } else {
      appStore.showToast('❌ Неверное сопоставление!', 'error');
    }
    selectedLeft.value = null;
    selectedRight.value = null;
  } else {
    selectedRight.value = idx;
  }
}

function nextExercise() {
  if (currentIndex.value + 1 < exercises.value.length) {
    currentIndex.value++;
    showResult.value = false;
    resetMatchingState();
  } else {
    finishPractice();
  }
}

async function startPractice() {
  if (selectedLevels.value.length === 0 || selectedContentTypes.value.length === 0) {
    appStore.showToast('Выберите уровни и типы контента', 'warning');
    return;
  }
  loading.value = true;
  stats.value = { total: 0, correct: 0 };
  wrongItemsIds.value = [];
  generateExercises();
  showModeSelect.value = false;
  loading.value = false;
}

function resetPractice() {
  showModeSelect.value = true;
  exercises.value = [];
  currentIndex.value = 0;
  userAnswers.value = {};
  showResult.value = false;
  stats.value = { total: 0, correct: 0 };
  wrongItemsIds.value = [];
  showResultsModal.value = false;
}

function finishPractice() {
  finalCorrect.value = stats.value.correct;
  finalTotal.value = stats.value.total;
  finalPercentage.value = stats.value.total === 0 ? 0 : Math.round((stats.value.correct / stats.value.total) * 100);
  showResultsModal.value = true;
}

function retryMistakes() {
  if (wrongItemsIds.value.length === 0) {
    appStore.showToast('Нет ошибок для повторения', 'info');
    return;
  }
  const allItems = getDataByTypes();
  const wrongItems = allItems.filter(item => wrongItemsIds.value.includes(item.id));
  const newExercises = [];
  for (const item of wrongItems) {
    if (newExercises.length >= 20) break;
    newExercises.push(generateMultipleChoice(item));
  }
  exercises.value = newExercises;
  currentIndex.value = 0;
  userAnswers.value = {};
  showResult.value = false;
  stats.value = { total: 0, correct: 0 };
  wrongItemsIds.value = [];
  showResultsModal.value = false;
  showModeSelect.value = false;
  resetMatchingState();
}

function closeResults() {
  showResultsModal.value = false;
  resetPractice();
}

const currentExercise = computed(() => exercises.value[currentIndex.value]);
const isLast = computed(() => currentIndex.value === exercises.value.length - 1);
const progressPercent = computed(() => ((currentIndex.value + 1) / exercises.value.length) * 100);
const accuracy = computed(() => {
  if (stats.value.total === 0) return 0;
  return Math.round((stats.value.correct / stats.value.total) * 100);
});

function getTypeLabel(type) {
  const labels = {
    'multiple-choice': 'Выберите перевод',
    'translation': 'Переведите',
    'matching': 'Сопоставьте'
  };
  return labels[type] || type;
}

onMounted(async () => {
  await progressFirestore.loadProgress();
});
</script>

<style scoped>
/* Все стили остаются как в исходном файле – они уже были даны ранее */
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
.content-type-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
}
.type-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.type-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.type-btn.active {
  background: var(--primary);
  color: white;
}
.level-selector.multi {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}
.level-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.level-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.level-btn.active {
  background: var(--primary);
  color: white;
}
.all-btn {
  background: var(--gray-200);
}
.all-btn:hover {
  background: var(--primary);
  color: white;
}
.reset-btn {
  background: var(--danger);
  color: white;
}
.questions-count-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--gray-200);
  border-bottom: 1px solid var(--gray-200);
}
.count-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.count-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.count-btn {
  width: 32px;
  height: 32px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}
.count-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.count-input {
  width: 60px;
  text-align: center;
  padding: 0.25rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.9rem;
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
  width: 100%;
}
.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.custom-progress {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}
.custom-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
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
.question-word {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--secondary);
  margin-bottom: 2rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.option-card {
  flex: 1;
  min-width: 180px;
  padding: 1rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  text-align: center;
}
.option-card.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.option-card.correct {
  background: var(--success);
  color: white;
  border-color: var(--success);
}
.option-card.wrong {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}
.matching-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.matching-column {
  flex: 1;
}
.matching-column h4 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}
.matching-card {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.matching-card.selected {
  background: var(--primary);
  color: white;
}
.matching-card.matched {
  background: var(--success);
  color: white;
  opacity: 0.7;
  cursor: default;
}
.matching-matched {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.matched-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.matched-pair {
  background: rgba(16, 185, 129, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.pair-arrow {
  color: var(--gray-500);
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
  margin-top: 0.5rem;
}
.nav-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
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
  margin-bottom: 1rem;
}
.btn-reset {
  padding: 0.3rem 0.8rem;
  background: var(--gray-200);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.75rem;
}
.finish-section {
  text-align: center;
}
.btn-finish {
  padding: 0.6rem 1.5rem;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 1.5rem;
  width: 80%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
  text-align: center;
}
.score-percent {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.btn-primary, .btn-outline {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}
body.dark-theme .exercise-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .stats-bar {
  background: var(--gray-700);
}
body.dark-theme .type-btn,
body.dark-theme .level-btn,
body.dark-theme .count-btn,
body.dark-theme .option-card,
body.dark-theme .matching-card {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .type-btn.active,
body.dark-theme .level-btn.active {
  background: var(--primary);
  color: white;
}
body.dark-theme .option-card.selected,
body.dark-theme .matching-card.selected {
  background: var(--primary);
  color: white;
}
body.dark-theme .question-word {
  color: white;
}
body.dark-theme .modal {
  background: var(--gray-800);
}
</style>