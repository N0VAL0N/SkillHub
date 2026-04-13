<template>
  <div class="exam-page">
    <!-- ФИКСИРОВАННАЯ ШАПКА -->
    <div class="exam-sticky-header">
      <div class="exam-header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Назад
        </button>
        <div class="exam-info">
          <h1>{{ examTitle }}</h1>
          <p class="exam-level">Уровень {{ examLevel }}</p>
          <div class="exam-meta">
            <span class="meta-item">📝 {{ totalQuestions }} вопросов</span>
            <span class="meta-item">⏱️ {{ examDuration }} минут</span>
            <span class="meta-item">🎯 Проходной балл: {{ passingScore }}%</span>
          </div>
        </div>
      </div>

      <div class="exam-timer" :class="{ warning: timeLeft <= 300 }">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span class="timer-label">Осталось:</span>
        <span class="timer-value">{{ formattedTimeLeft }}</span>
      </div>

      <div class="exam-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ confirmedCount }} / {{ totalQuestions }} подтверждено</span>
      </div>
    </div>

    <!-- ВОПРОСЫ -->
    <div class="exam-questions-container">
      <div
        v-for="(question, qIdx) in questions"
        :key="qIdx"
        :id="`question-${qIdx}`"
        class="exam-question-card"
        :class="{ 
          answered: isQuestionConfirmed(qIdx), 
          current: currentQuestionIndex === qIdx,
          'has-unsaved': hasUnsavedAnswer(qIdx)
        }"
        @click="setCurrentQuestion(qIdx)"
      >
        <div class="question-header">
          <span class="question-number">Вопрос {{ qIdx + 1 }}</span>
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span v-if="isQuestionConfirmed(qIdx)" class="answered-badge">✓ Подтверждено</span>
          <span v-else-if="hasUnsavedAnswer(qIdx)" class="unsaved-badge">✎ Не подтверждён</span>
        </div>

        <div class="question-text">{{ question.text }}</div>

        <!-- Fill Gap с вариантами -->
        <div v-if="question.type === 'fill_gap' && question.options" class="question-options">
          <button
            v-for="opt in question.options"
            :key="opt"
            class="option-btn"
            :class="{ selected: tempAnswers[qIdx] === opt }"
            @click.stop="tempAnswers[qIdx] = opt"
          >
            {{ opt }}
          </button>
        </div>

        <!-- Fill Gap без вариантов (один текстовый ввод) -->
        <div v-else-if="question.type === 'fill_gap' && !question.options" class="question-input">
          <input
            v-model="tempAnswers[qIdx]"
            type="text"
            class="answer-input"
            placeholder="Введите ответ..."
            @click.stop
          />
        </div>

        <!-- Fill Gap Multiple (несколько полей) -->
        <div v-else-if="question.type === 'fill_gap_multiple'" class="question-multiple-input">
          <div v-for="(part, partIdx) in question.parts" :key="partIdx" class="multiple-input-row">
            <span class="sentence-part">{{ part.before }}</span>
            <input
              v-model="tempAnswersMultiple[qIdx][partIdx]"
              type="text"
              class="answer-input small"
              :placeholder="`Ответ ${partIdx + 1}`"
              @click.stop
            />
            <span class="sentence-part">{{ part.after }}</span>
          </div>
        </div>

        <!-- Translation -->
        <div v-else-if="question.type === 'translation'" class="question-input">
          <input
            v-model="tempAnswers[qIdx]"
            type="text"
            class="answer-input"
            placeholder="Введите перевод..."
            @click.stop
          />
        </div>

        <!-- MATCH WORDS -->
        <div v-else-if="question.type === 'match_words'" class="question-matching" @click.stop>
          <div class="matching-available">
            <div class="matching-column">
              <h4>🇬🇧 Английский</h4>
              <div
                v-for="item in question.leftItems"
                :key="item.en"
                class="match-card"
                :class="{ selected: matchData[qIdx]?.selectedLeft === item.en }"
                @click="selectMatchLeft(qIdx, item.en, item.ru)"
              >
                {{ item.en }}
              </div>
            </div>
            <div class="matching-column">
              <h4>🇷🇺 Русский</h4>
              <div
                v-for="item in question.rightItems"
                :key="item.ru"
                class="match-card"
                :class="{ selected: matchData[qIdx]?.selectedRight === item.ru }"
                @click="selectMatchRight(qIdx, item.en, item.ru)"
              >
                {{ item.ru }}
              </div>
            </div>
          </div>
          <div v-if="getMatchedPairs(qIdx).length > 0" class="matching-matched">
            <h4>✓ Сопоставленные пары</h4>
            <div class="matched-pairs">
              <div v-for="pair in getMatchedPairs(qIdx)" :key="pair.en" class="matched-pair">
                <span>{{ pair.en }}</span>
                <span class="pair-arrow">→</span>
                <span>{{ pair.ru }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="question-actions">
          <template v-if="!isQuestionConfirmed(qIdx)">
            <button 
              class="btn-confirm" 
              @click.stop="confirmAnswer(qIdx)"
              :disabled="!canConfirmAnswer(qIdx)"
            >
              Подтвердить ответ
            </button>
          </template>
          <template v-else>
            <button class="btn-edit" @click.stop="editAnswer(qIdx)">
              ✏️ Редактировать
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ПАГИНАЦИЯ (sticky снизу) -->
    <div class="questions-pagination">
      <button
        v-for="(_, idx) in questions"
        :key="idx"
        class="page-btn"
        :class="{ 
          active: currentQuestionIndex === idx, 
          confirmed: isQuestionConfirmed(idx),
          'has-unsaved': hasUnsavedAnswer(idx) && !isQuestionConfirmed(idx)
        }"
        @click="scrollToQuestion(idx)"
      >
        {{ idx + 1 }}
      </button>
    </div>

    <div class="exam-footer">
      <button class="btn-finish-exam" @click="showFinishConfirm = true">Завершить экзамен</button>
    </div>

    <!-- МОДАЛКА ПОДТВЕРЖДЕНИЯ ЗАВЕРШЕНИЯ -->
    <div v-if="showFinishConfirm" class="modal-overlay" @click.self="showFinishConfirm = false">
      <div class="modal finish-modal">
        <h3>Завершить экзамен?</h3>
        <p v-if="unconfirmedCount > 0">
          У вас осталось {{ unconfirmedCount }} неподтверждённых вопросов. 
          Неподтверждённые ответы не будут засчитаны.
        </p>
        <p v-else>Вы уверены, что хотите завершить экзамен?</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="showFinishConfirm = false">Вернуться</button>
          <button class="btn-primary" @click="submitExam">Завершить</button>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА ПОДТВЕРЖДЕНИЯ ВЫХОДА -->
    <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
      <div class="modal exit-modal">
        <h3>Выйти из экзамена?</h3>
        <p>Весь неподтверждённый прогресс будет потерян.</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="showExitConfirm = false">Остаться</button>
          <button class="btn-danger" @click="confirmExit">Выйти</button>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА РЕЗУЛЬТАТОВ с детальными ошибками -->
    <div v-if="showResultsModal" class="modal-overlay" @click.self="showResultsModal = false">
      <div class="modal results-modal">
        <div class="result-icon" :class="{ passed: examResult.passed }">
          {{ examResult.passed ? '🎉' : '😢' }}
        </div>
        <h2>{{ examResult.passed ? 'Поздравляем!' : 'К сожалению...' }}</h2>
        <div class="result-score">
          <span class="score-value">{{ examResult.score }}%</span>
          <span class="score-label">Правильных ответов</span>
        </div>
        <div class="result-stats">
          <p>✅ Верно: {{ examResult.correct }} из {{ examResult.total }}</p>
          <p>📊 Проходной балл: {{ passingScore }}%</p>
          <p v-if="!examResult.passed" class="result-message">
            Для прохождения уровня нужно набрать {{ passingScore }}%. Попробуйте ещё раз.
          </p>
          <p v-else class="result-message success">
            Уровень {{ examLevel }} успешно пройден!
          </p>

          <!-- Блок ошибок (раскрывающийся) -->
          <div v-if="examResult.errors && examResult.errors.length > 0" class="errors-section">
            <button class="toggle-errors-btn" @click="showErrors = !showErrors">
              <span>❌ Ошибки ({{ examResult.errors.length }})</span>
              <span class="toggle-icon">{{ showErrors ? '▲' : '▼' }}</span>
            </button>
            <div v-if="showErrors" class="errors-list">
              <div v-for="(err, idx) in examResult.errors" :key="idx" class="error-item">
                <div class="error-question">Вопрос {{ err.questionIndex + 1 }}: {{ err.questionText }}</div>
                <div class="error-details">
                  <span class="your-answer">Ваш ответ: {{ err.userAnswerDisplay }}</span>
                  <span class="correct-answer-detail">Правильный ответ: {{ err.correctAnswerDisplay }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button v-if="!examResult.passed" class="btn-primary" @click="retryExam">
            Попробовать снова
          </button>
          <button class="btn-outline" @click="finishExam">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useAppStore } from '@core/stores/appStore';
import { normalizeAnswer } from '../utils/normalizeAnswer';
import examA0 from '../data/exams/exam_a0.json';
import examA1 from '../data/exams/exam_a1.json';
import examA2 from '../data/exams/exam_a2.json';
import examB1 from '../data/exams/exam_b1.json';
import examB2 from '../data/exams/exam_b2.json';

const router = useRouter();
const route = useRoute();
const progressFirestore = useEnglishProgressFirestore();
const appStore = useAppStore();

const examLevel = computed(() => route.params.level?.toUpperCase() || 'A0');
const exams = { 'A0': examA0, 'A1': examA1, 'A2': examA2, 'B1': examB1, 'B2': examB2 };
const currentExam = computed(() => exams[examLevel.value]);
const examTitle = computed(() => currentExam.value?.title || 'Экзамен');
const passingScore = computed(() => currentExam.value?.passing_score || 70);
const examDuration = computed(() => currentExam.value?.duration || 45);

const questions = ref([]);
const confirmedAnswers = ref({});       // для обычных вопросов (строка или объект для match_words)
const confirmedMultipleAnswers = ref({}); // для fill_gap_multiple (массив строк)
const tempAnswers = ref({});             // для обычных
const tempAnswersMultiple = ref({});     // для fill_gap_multiple (массив строк)
const matchData = ref({});
const currentQuestionIndex = ref(0);
const timeLeft = ref(examDuration.value * 60);
const showResultsModal = ref(false);
const showExitConfirm = ref(false);
const showFinishConfirm = ref(false);
const showErrors = ref(false);
const examResult = ref({ passed: false, score: 0, correct: 0, total: 0, errors: [] });
let timerInterval = null;

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Нормализация с учётом альтернатив
function isAnswerCorrect(userAnswer, correctAnswer, alternatives = []) {
  const normUser = normalizeAnswer(String(userAnswer));
  const normCorrect = normalizeAnswer(String(correctAnswer));
  if (normUser === normCorrect) return true;
  if (alternatives && alternatives.length) {
    return alternatives.some(alt => normalizeAnswer(alt) === normUser);
  }
  return false;
}

// ========== ГЕНЕРАЦИЯ ВОПРОСОВ ИЗ JSON ==========
function generateQuestions() {
  const exam = currentExam.value;
  if (!exam) return;
  const newQuestions = [];
  
  for (const exercise of exam.exercises) {
    if (exercise.type === 'fill_gap') {
      for (const item of exercise.items) {
        newQuestions.push({
          type: 'fill_gap',
          text: item.sentence,
          correct: item.correct,
          options: item.options || null,
          alternatives: item.alternatives || []
        });
      }
    } 
    else if (exercise.type === 'fill_gap_multiple') {
      for (const item of exercise.items) {
        // Разбиваем предложение на части (до первого пропуска, между, после)
        const parts = [];
        const rawSentence = item.sentence;
        // Простой парсер: ищем ___ и разбиваем
        const regex = /___/g;
        let lastIndex = 0;
        let match;
        let partIndex = 0;
        const correctAnswers = item.correct_answers || [];
        while ((match = regex.exec(rawSentence)) !== null) {
          const before = rawSentence.substring(lastIndex, match.index);
          const after = ''; // заполним позже
          parts.push({
            before: before,
            after: '',
            correct: correctAnswers[partIndex] || '',
            alternatives: item.alternatives && item.alternatives[partIndex] ? item.alternatives[partIndex] : []
          });
          lastIndex = match.index + 3;
          partIndex++;
        }
        // Добавляем хвост после последнего пропуска
        if (lastIndex < rawSentence.length) {
          const afterText = rawSentence.substring(lastIndex);
          if (parts.length > 0) {
            parts[parts.length-1].after = afterText;
          } else {
            // нет пропусков? не должно быть
          }
        }
        // Для наглядности можно объединить before и after в отображении
        newQuestions.push({
          type: 'fill_gap_multiple',
          text: rawSentence,
          parts: parts,
          correctAnswers: correctAnswers,
          alternativesList: item.alternatives || []
        });
      }
    }
    else if (exercise.type === 'translation') {
      for (const item of exercise.items) {
        newQuestions.push({
          type: 'translation',
          text: item.source,
          correct: item.target,
          alternatives: item.alternatives || []
        });
      }
    }
    else if (exercise.type === 'match_words') {
      const leftItems = exercise.items.map(item => ({ en: item.en, ru: item.ru }));
      const rightItems = shuffleArray([...leftItems]);
      newQuestions.push({
        type: 'match_words',
        items: exercise.items,
        leftItems: leftItems,
        rightItems: rightItems,
        correctPairs: exercise.items.reduce((acc, item) => { acc[item.en] = item.ru; return acc; }, {})
      });
    }
  }
  
  // Перемешиваем вопросы
  for (let i = newQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newQuestions[i], newQuestions[j]] = [newQuestions[j], newQuestions[i]];
  }
  
  questions.value = newQuestions;
  
  // Инициализация временных хранилищ
  for (let i = 0; i < questions.value.length; i++) {
    tempAnswers.value[i] = null;
    tempAnswersMultiple.value[i] = [];
    matchData.value[i] = { matchedPairs: [], selectedLeft: null, selectedRight: null };
    confirmedAnswers.value[i] = null;
    confirmedMultipleAnswers.value[i] = null;
  }
}

// ========== MATCHING ==========
function getAvailableLeft(question, qIdx) {
  const matchedEn = matchData.value[qIdx]?.matchedPairs.map(p => p.en) || [];
  return question.leftItems.filter(item => !matchedEn.includes(item.en));
}
function getAvailableRight(question, qIdx) {
  const matchedRu = matchData.value[qIdx]?.matchedPairs.map(p => p.ru) || [];
  return question.rightItems.filter(item => !matchedRu.includes(item.ru));
}
function getMatchedPairs(qIdx) {
  return matchData.value[qIdx]?.matchedPairs || [];
}
function selectMatchLeft(qIdx, enValue, ruValue) {
  const state = matchData.value[qIdx];
  if (!state) return;
  if (state.selectedRight) {
    const rightValue = state.selectedRight;
    state.matchedPairs.push({ en: enValue, ru: rightValue });
    state.selectedLeft = null;
    state.selectedRight = null;
  } else {
    state.selectedLeft = enValue;
  }
}
function selectMatchRight(qIdx, enValue, ruValue) {
  const state = matchData.value[qIdx];
  if (!state) return;
  if (state.selectedLeft) {
    const leftValue = state.selectedLeft;
    state.matchedPairs.push({ en: leftValue, ru: ruValue });
    state.selectedLeft = null;
    state.selectedRight = null;
  } else {
    state.selectedRight = ruValue;
  }
}

// ========== ЛОГИКА ОТВЕТОВ ==========
function canConfirmAnswer(qIdx) {
  const q = questions.value[qIdx];
  if (!q) return false;
  if (q.type === 'match_words') {
    return matchData.value[qIdx]?.matchedPairs.length === q.items.length;
  }
  if (q.type === 'fill_gap_multiple') {
    const answers = tempAnswersMultiple.value[qIdx];
    if (!answers) return false;
    return answers.length === q.parts.length && answers.every(a => a && a.trim() !== '');
  }
  const ans = tempAnswers.value[qIdx];
  return ans !== null && ans !== undefined && ans !== '';
}

function confirmAnswer(qIdx) {
  const q = questions.value[qIdx];
  if (!q) return;
  if (q.type === 'match_words') {
    const pairs = matchData.value[qIdx].matchedPairs;
    const answerObj = {};
    for (const pair of pairs) answerObj[pair.en] = pair.ru;
    confirmedAnswers.value[qIdx] = answerObj;
  } 
  else if (q.type === 'fill_gap_multiple') {
    // сохраняем массив ответов
    confirmedMultipleAnswers.value[qIdx] = [...tempAnswersMultiple.value[qIdx]];
  }
  else {
    confirmedAnswers.value[qIdx] = tempAnswers.value[qIdx];
  }
  appStore.showToast('Ответ подтверждён', 'success');
}

function editAnswer(qIdx) {
  confirmedAnswers.value[qIdx] = null;
  confirmedMultipleAnswers.value[qIdx] = null;
  const q = questions.value[qIdx];
  if (q.type === 'match_words') {
    matchData.value[qIdx] = { matchedPairs: [], selectedLeft: null, selectedRight: null };
  } else if (q.type === 'fill_gap_multiple') {
    tempAnswersMultiple.value[qIdx] = [];
  } else {
    tempAnswers.value[qIdx] = null;
  }
  appStore.showToast('Редактирование включено', 'info');
}

function isQuestionConfirmed(qIdx) {
  const q = questions.value[qIdx];
  if (q.type === 'fill_gap_multiple') {
    return confirmedMultipleAnswers.value[qIdx] !== null && confirmedMultipleAnswers.value[qIdx] !== undefined;
  }
  return confirmedAnswers.value[qIdx] !== null && confirmedAnswers.value[qIdx] !== undefined;
}

function hasUnsavedAnswer(qIdx) {
  if (isQuestionConfirmed(qIdx)) return false;
  const q = questions.value[qIdx];
  if (!q) return false;
  if (q.type === 'match_words') {
    return (matchData.value[qIdx]?.matchedPairs.length || 0) > 0;
  }
  if (q.type === 'fill_gap_multiple') {
    const ans = tempAnswersMultiple.value[qIdx];
    return ans && ans.length > 0 && ans.some(a => a && a.trim() !== '');
  }
  const ans = tempAnswers.value[qIdx];
  return ans !== null && ans !== undefined && ans !== '';
}

const confirmedCount = computed(() => {
  let c = 0;
  for (let i = 0; i < questions.value.length; i++) if (isQuestionConfirmed(i)) c++;
  return c;
});
const unconfirmedCount = computed(() => totalQuestions.value - confirmedCount.value);
const totalQuestions = computed(() => questions.value.length);
const progressPercent = computed(() => (confirmedCount.value / totalQuestions.value) * 100);

function setCurrentQuestion(index) {
  currentQuestionIndex.value = index;
}
function scrollToQuestion(index) {
  const element = document.getElementById(`question-${index}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    currentQuestionIndex.value = index;
  }
}

// ========== ТАЙМЕР ==========
const formattedTimeLeft = computed(() => {
  const m = Math.floor(timeLeft.value / 60);
  const s = timeLeft.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      if (timeLeft.value === 0) submitExam();
    }
  }, 1000);
}
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }

// ========== ПОДСЧЁТ РЕЗУЛЬТАТОВ С ОШИБКАМИ ==========
function calculateScore() {
  let correct = 0;
  const errors = [];
  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i];
    let isCorrect = false;
    let userAnswerDisplay = '';
    let correctAnswerDisplay = '';
    
    if (q.type === 'fill_gap') {
      const answer = confirmedAnswers.value[i];
      if (!answer) continue;
      userAnswerDisplay = answer;
      correctAnswerDisplay = q.correct;
      isCorrect = isAnswerCorrect(answer, q.correct, q.alternatives || []);
    } 
    else if (q.type === 'fill_gap_multiple') {
      const answers = confirmedMultipleAnswers.value[i];
      if (!answers) continue;
      userAnswerDisplay = answers.join(', ');
      correctAnswerDisplay = q.correctAnswers.join(', ');
      // проверяем каждый ответ отдельно, все должны быть правильными
      isCorrect = answers.length === q.parts.length && 
                  answers.every((ans, idx) => isAnswerCorrect(ans, q.correctAnswers[idx], (q.alternativesList[idx] || [])));
    }
    else if (q.type === 'translation') {
      const answer = confirmedAnswers.value[i];
      if (!answer) continue;
      userAnswerDisplay = answer;
      correctAnswerDisplay = q.correct;
      isCorrect = isAnswerCorrect(answer, q.correct, q.alternatives || []);
    }
    else if (q.type === 'match_words') {
      const answer = confirmedAnswers.value[i];
      if (!answer) continue;
      userAnswerDisplay = Object.entries(answer).map(([en, ru]) => `${en} → ${ru}`).join('; ');
      correctAnswerDisplay = Object.entries(q.correctPairs).map(([en, ru]) => `${en} → ${ru}`).join('; ');
      let allMatch = true;
      for (const [en, ru] of Object.entries(answer)) {
        if (q.correctPairs[en] !== ru) { allMatch = false; break; }
      }
      if (allMatch && Object.keys(answer).length === Object.keys(q.correctPairs).length) isCorrect = true;
    }
    
    if (isCorrect) {
      correct++;
    } else if (confirmedAnswers.value[i] !== undefined || confirmedMultipleAnswers.value[i] !== undefined) {
      errors.push({
        questionIndex: i,
        questionText: q.text || (q.type === 'match_words' ? 'Сопоставьте слова' : q.text),
        userAnswerDisplay,
        correctAnswerDisplay
      });
    }
  }
  const score = Math.round((correct / totalQuestions.value) * 100);
  return { correct, score, errors };
}

async function submitExam() {
  stopTimer();
  const { correct, score, errors } = calculateScore();
  const passed = score >= passingScore.value;
  examResult.value = { passed, score, correct, total: totalQuestions.value, errors };
  if (passed) {
    await progressFirestore.addPassedExam(examLevel.value);
    appStore.showToast(`Уровень ${examLevel.value} пройден!`, 'success');
  }
  showFinishConfirm.value = false;
  showResultsModal.value = true;
}

function retryExam() {
  showResultsModal.value = false;
  resetExam();
  startTimer();
}

function resetExam() {
  confirmedAnswers.value = {};
  confirmedMultipleAnswers.value = {};
  tempAnswers.value = {};
  tempAnswersMultiple.value = {};
  matchData.value = {};
  currentQuestionIndex.value = 0;
  timeLeft.value = examDuration.value * 60;
  generateQuestions();
}

function finishExam() {
  showResultsModal.value = false;
  router.push('/english');
}

function goBack() {
  if (confirmedCount.value > 0 || unconfirmedCount.value > 0) {
    showExitConfirm.value = true;
  } else {
    confirmExit();
  }
}

function confirmExit() {
  stopTimer();
  router.push('/english');
}

function getQuestionTypeLabel(type) {
  const labels = { 
    'fill_gap': 'Заполните пропуск', 
    'fill_gap_multiple': 'Заполните пропуски',
    'translation': 'Перевод', 
    'match_words': 'Сопоставление' 
  };
  return labels[type] || type;
}

onMounted(() => { generateQuestions(); startTimer(); });
onUnmounted(() => { stopTimer(); });
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.exam-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem 1rem;
  min-height: 100vh;
  background: var(--gray-50);
}

/* ========== ФИКСИРОВАННАЯ ШАПКА ========== */
.exam-sticky-header {
  position: sticky;
  top: 0;
  background: var(--gray-50);
  z-index: 100;
  padding: 1rem 0 0.5rem;
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: 1rem;
}
.exam-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 2rem;
  transition: all 0.2s;
}
.back-btn:hover {
  background: var(--gray-100);
}
.exam-info h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--secondary);
}
.exam-level {
  margin: 0.25rem 0;
  color: var(--primary);
  font-weight: 500;
}
.exam-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 0.8rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.exam-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-100);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  margin: 0.5rem 0;
  width: fit-content;
}
.exam-timer.warning {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.timer-label {
  font-size: 0.85rem;
  color: var(--gray-600);
}
.timer-value {
  font-size: 1.2rem;
  font-weight: 700;
  font-family: monospace;
}
.exam-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
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
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  transition: width 0.3s;
}
.progress-text {
  font-size: 0.8rem;
  color: var(--gray-500);
}

/* ========== КАРТОЧКИ ВОПРОСОВ ========== */
.exam-questions-container {
  margin-bottom: 5rem;
}
.exam-question-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
  margin-bottom: 1rem;
  transition: all 0.2s;
  cursor: pointer;
  scroll-margin-top: 200px;
}
.exam-question-card.current {
  border-left: 4px solid var(--primary);
  box-shadow: var(--shadow-md);
}
.exam-question-card.answered {
  background: var(--gray-50);
}
.exam-question-card.has-unsaved {
  border-left: 4px solid var(--warning);
}
.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.question-number {
  font-weight: 600;
  color: var(--secondary);
}
.question-type {
  font-size: 0.7rem;
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  color: var(--gray-600);
}
.answered-badge {
  font-size: 0.7rem;
  color: var(--success);
  background: rgba(16, 185, 129, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.unsaved-badge {
  font-size: 0.7rem;
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.question-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  color: var(--secondary);
}

/* ========== ВАРИАНТЫ ОТВЕТОВ ========== */
.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.option-btn {
  padding: 0.5rem 1rem;
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
.question-input {
  margin-bottom: 1rem;
}
.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
}
.answer-input.small {
  width: auto;
  flex: 1;
  min-width: 120px;
}
.question-multiple-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.multiple-input-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.sentence-part {
  font-size: 0.95rem;
  color: var(--gray-700);
}
.answer-input:focus {
  outline: none;
  border-color: var(--primary);
}

/* ========== MATCHING ========== */
.matching-available {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}
.matching-column {
  flex: 1;
}
.matching-column h4 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}
.match-card {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.match-card:hover {
  border-color: var(--primary);
}
.match-card.selected {
  background: var(--primary);
  color: white;
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

/* ========== КНОПКИ ДЕЙСТВИЙ ========== */
.question-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}
.btn-confirm {
  padding: 0.5rem 1.2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-confirm:hover:not(:disabled) {
  background: var(--primary-dark);
}
.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-edit {
  padding: 0.5rem 1.2rem;
  background: var(--gray-200);
  color: var(--gray-700);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-edit:hover {
  background: var(--gray-300);
}

/* ========== ПАГИНАЦИЯ ========== */
.questions-pagination {
  position: sticky;
  bottom: 0;
  background: var(--gray-50);
  padding: 0.5rem 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.page-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.page-btn.confirmed {
  background: var(--success);
  color: white;
  border-color: var(--success);
}
.page-btn.has-unsaved {
  border: 2px solid var(--warning);
}

/* ========== КНОПКА ЗАВЕРШЕНИЯ ========== */
.exam-footer {
  text-align: center;
  margin: 1rem 0 2rem;
}
.btn-finish-exam {
  padding: 0.75rem 2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-finish-exam:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* ========== МОДАЛКИ ========== */
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
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  text-align: center;
}
.results-modal {
  text-align: left;
}
.result-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 0.5rem;
}
.result-score {
  text-align: center;
  margin: 1rem 0;
}
.score-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary);
}
.score-label {
  display: block;
  font-size: 0.8rem;
  color: var(--gray-500);
}
.result-stats {
  margin: 1rem 0;
}
.result-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.result-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.errors-section {
  margin-top: 1rem;
  border-top: 1px solid var(--gray-200);
  padding-top: 0.75rem;
}
.toggle-errors-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--gray-100);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--gray-700);
}
.toggle-errors-btn:hover {
  background: var(--gray-200);
}
.errors-list {
  margin-top: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}
.error-item {
  background: rgba(239, 68, 68, 0.05);
  border-left: 3px solid var(--danger);
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}
.error-question {
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 0.25rem;
}
.error-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.your-answer {
  color: var(--danger);
}
.correct-answer-detail {
  color: var(--success);
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;
}
.btn-primary, .btn-outline, .btn-danger {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}
.btn-danger {
  background: var(--danger);
  color: white;
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .exam-page,
body.dark-theme .exam-sticky-header,
body.dark-theme .questions-pagination {
  background: var(--gray-900);
}
body.dark-theme .exam-question-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .exam-question-card.answered {
  background: var(--gray-700);
}
body.dark-theme .question-text {
  color: white;
}
body.dark-theme .modal {
  background: var(--gray-800);
}
body.dark-theme .matched-pair {
  background: rgba(16, 185, 129, 0.25);
}
body.dark-theme .error-item {
  background: rgba(239, 68, 68, 0.15);
}
</style>