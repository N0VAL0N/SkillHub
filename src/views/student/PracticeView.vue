<template>
  <StudentLayout>
    <div class="practice-view">
      <div class="page-header">
        <h1>Тренировка</h1>
        <p class="subtitle">Выберите тему и решайте задания в формате ЕГЭ</p>
      </div>

      <div class="topic-selector">
        <div class="filter-group">
          <label>Блок:</label>
          <CustomSelect
            v-model="selectedBlock"
            :options="blockOptions"
            placeholder="Выберите блок"
          />
        </div>
        <div class="filter-group">
          <label>Тема:</label>
          <CustomSelect
            v-model="selectedTopicId"
            :options="topicOptions"
            placeholder="Выберите тему"
            :disabled="!selectedBlock"
          />
        </div>
        <button @click="generateQuestions" :disabled="!selectedTopicId || loading" class="btn-generate">
          {{ loading ? 'Генерация...' : 'Начать тренировку' }}
        </button>
      </div>

      <div v-if="questions.length" class="questions-area">
        <div class="questions-header">
          <h2>Задания по теме "{{ currentTopicName }}"</h2>
          <div class="progress-info">Всего вопросов: {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <div v-for="(q, idx) in questions" :key="q.id" class="question-block">
            <div class="question-header">
              <span class="q-num">{{ idx + 1 }}</span>
              <span class="q-type">{{ getTypeLabel(q.type) }}</span>
              <span v-if="showResults && isQuestionCorrect(q)" class="result-badge correct">✓ Верно</span>
              <span v-if="showResults && !isQuestionCorrect(q)" class="result-badge incorrect">✗ Неверно</span>
            </div>
            <QuestionRenderer
              :question="q"
              v-model="answers[q.id]"
              :allowAttachments="false"
            />
          </div>
        </div>

        <div class="actions">
          <button v-if="!showResults" @click="checkAnswers" class="btn-check">Проверить ответы</button>
          <button v-else @click="continuePractice" class="btn-regenerate">Продолжить тренировку</button>
          <button @click="clearAnswers" class="btn-clear">Очистить всё</button>
          <button @click="generateQuestions" class="btn-regenerate">Новые вопросы</button>
        </div>

        <div v-if="showResults" class="result-card">
          <div class="result-header">
            <span class="result-icon">{{ correctCount === questions.length ? '🎉' : '📊' }}</span>
            <h3>Результат тренировки</h3>
          </div>
          <div class="result-score">
            <span class="score-value">{{ correctCount }}</span>
            <span class="score-total">/{{ questions.length }}</span>
            <span class="score-percent">({{ Math.round(correctCount / questions.length * 100) }}%)</span>
          </div>
          <div class="result-message" v-if="correctCount === questions.length">
            Отлично! Вы отлично усвоили тему!
          </div>
          <div class="result-message" v-else-if="correctCount >= questions.length / 2">
            Хороший результат! Но есть над чем поработать.
          </div>
          <div class="result-message" v-else>
            Нужно повторить материал. Обратите внимание на ошибки.
          </div>
          <button v-if="correctCount !== questions.length" @click="reviewMistakes" class="btn-review">
            Разобрать ошибки
          </button>
        </div>

        <div v-if="showMistakes" class="mistakes-section">
          <h3>Разбор ошибок</h3>
          <div v-for="(q, idx) in questions" :key="q.id" v-if="!isQuestionCorrect(q)" class="mistake-card">
            <div class="mistake-question">
              <strong>Вопрос {{ idx + 1 }}:</strong> {{ q.text || q.prompt || q.title }}
            </div>
            <div class="mistake-answer">
              <div class="your-answer">
                <strong>Ваш ответ:</strong>
                <pre>{{ formatAnswer(q, answers[q.id]) }}</pre>
              </div>
              <div class="correct-answer">
                <strong>Правильный ответ:</strong>
                <pre>{{ getCorrectAnswer(q) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Выберите тему для тренировки</h3>
        <p>Выберите блок и тему из списка, затем нажмите "Начать тренировку"</p>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuestionGenerator } from '@/stores/questionGenerator';
import StudentLayout from '@/layouts/StudentLayout.vue';
import QuestionRenderer from '@/components/student/QuestionRenderer.vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';

const questionGenerator = useQuestionGenerator();
const topicsMap = ref(null);
const topicsList = ref([]);
const selectedBlock = ref(1);
const selectedTopicId = ref('');
const currentTopicName = ref('');
const questions = ref([]);
const answers = ref({});
const showResults = ref(false);
const showMistakes = ref(false);
const correctCount = ref(0);
const loading = ref(false);

const blockOptions = [
  { value: 1, label: 'Блок 1. Человек и общество' },
  { value: 2, label: 'Блок 2. Экономика' },
  { value: 3, label: 'Блок 3. Социальные отношения' },
  { value: 4, label: 'Блок 4. Политика' },
  { value: 5, label: 'Блок 5. Право' }
];

const topicOptions = computed(() => {
  if (!selectedBlock.value) return [];
  return topicsList.value
    .filter(t => t.id.startsWith(`${selectedBlock.value}.`))
    .map(t => ({ value: t.id, label: t.name }));
});

const getTypeLabel = (type) => {
  const labels = {
    choice: 'Выбор ответа',
    match: 'Соответствие',
    short: 'Короткий ответ',
    essay: 'Эссе',
    plan: 'План',
    text_analysis: 'Работа с текстом'
  };
  return labels[type] || type;
};

const generateQuestions = () => {
  if (!selectedTopicId.value) return;
  loading.value = true;

  setTimeout(() => {
    const topic = topicsList.value.find(t => t.id === selectedTopicId.value);
    currentTopicName.value = topic?.name || '';

    const newQuestions = [];
    for (let i = 0; i < 5; i++) {
      const type = Math.floor(Math.random() * 3);
      let q = null;
      if (type === 0) q = questionGenerator.generateTask2(selectedTopicId.value);
      else if (type === 1) q = questionGenerator.generateMatch(3, selectedTopicId.value);
      else q = questionGenerator.generateShort(selectedTopicId.value);
      if (q) newQuestions.push(q);
    }
    questions.value = newQuestions;
    answers.value = {};
    showResults.value = false;
    showMistakes.value = false;
    correctCount.value = 0;
    loading.value = false;
  }, 300);
};

const checkAnswers = () => {
  let correct = 0;
  questions.value.forEach(q => {
    const answer = answers.value[q.id];
    if (!answer && answer !== 0) return;

    if (q.type === 'choice') {
      if (q.isMultiple) {
        const userAnswer = Array.isArray(answer) ? [...answer].sort() : [];
        const correctAnswer = Array.isArray(q.correct) ? [...q.correct].sort() : [];
        if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) correct++;
      } else {
        if (answer === q.correct) correct++;
      }
    } else if (q.type === 'match') {
      const correctMap = {};
      q.correctMapping?.forEach(m => { correctMap[m.right] = m.left; });
      let matchCorrect = 0;
      let total = Object.keys(answer || {}).length;
      Object.entries(answer || {}).forEach(([right, left]) => {
        if (correctMap[right] === left) matchCorrect++;
      });
      if (matchCorrect === total && total === (q.correctMapping?.length || 0)) correct++;
    } else if (q.type === 'short') {
      if (answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim()) correct++;
    }
  });
  correctCount.value = correct;
  showResults.value = true;
  showMistakes.value = false;
};

const continuePractice = () => {
  showResults.value = false;
  showMistakes.value = false;
};

const isQuestionCorrect = (q) => {
  if (!showResults.value) return false;
  const answer = answers.value[q.id];
  if (!answer && answer !== 0) return false;

  if (q.type === 'choice') {
    if (q.isMultiple) {
      const userAnswer = Array.isArray(answer) ? [...answer].sort() : [];
      const correctAnswer = Array.isArray(q.correct) ? [...q.correct].sort() : [];
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    } else {
      return answer === q.correct;
    }
  } else if (q.type === 'match') {
    const correctMap = {};
    q.correctMapping?.forEach(m => { correctMap[m.right] = m.left; });
    let matchCorrect = 0;
    let total = Object.keys(answer || {}).length;
    Object.entries(answer || {}).forEach(([right, left]) => {
      if (correctMap[right] === left) matchCorrect++;
    });
    return matchCorrect === total && total === (q.correctMapping?.length || 0);
  } else if (q.type === 'short') {
    return answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
  }
  return false;
};

const formatAnswer = (q, answer) => {
  if (!answer && answer !== 0) return 'Нет ответа';
  if (q.type === 'choice') {
    if (q.isMultiple) {
      return Array.isArray(answer) ? answer.map(i => q.options[i]).join(', ') : (typeof answer === 'number' ? q.options[answer] : '');
    }
    return q.options[answer];
  }
  if (q.type === 'match') {
    if (typeof answer === 'object') {
      return Object.entries(answer).map(([right, left]) => `${left} → ${right}`).join('\n');
    }
    return answer;
  }
  return answer;
};

const getCorrectAnswer = (q) => {
  if (q.type === 'choice') {
    if (q.isMultiple) {
      return q.correct.map(i => q.options[i]).join(', ');
    }
    return q.options[q.correct];
  }
  if (q.type === 'match') {
    return q.correctMapping.map(m => `${m.left} → ${m.right}`).join('\n');
  }
  if (q.type === 'short') {
    return q.correctAnswer;
  }
  return '—';
};

const clearAnswers = () => {
  answers.value = {};
  showResults.value = false;
  showMistakes.value = false;
};

const reviewMistakes = () => {
  showMistakes.value = true;
};

onMounted(() => {
  questionGenerator.initialize();
  if (questionGenerator.topicsMap) {
    topicsMap.value = questionGenerator.topicsMap;
    topicsList.value = Array.from(questionGenerator.topicsMap.values()).map(t => ({
      id: t.topic_id,
      name: t.name
    }));
  }
});
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.practice-view {
  max-width: 1000px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
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

/* ========== СЕЛЕКТОР ТЕМЫ ========== */
.topic-selector {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}

.filter-group {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
  font-size: 0.85rem;
}

.btn-generate {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  height: 42px;
  align-self: center;
  margin-bottom: 0; /* убираем лишний отступ */
}
.btn-generate:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== ОБЛАСТЬ ВОПРОСОВ ========== */
.questions-area {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  color: var(--primary);
}
.questions-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--secondary);
}
.progress-info {
  font-size: 0.85rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
}

/* ========== СПИСОК ВОПРОСОВ ========== */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.question-block {
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
  flex-wrap: wrap;
}
.q-num {
  width: 28px;
  height: 28px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
}
.q-type {
  font-size: 0.7rem;
  background: var(--gray-200);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  color: var(--gray-600);
}
.result-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.result-badge.correct {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.result-badge.incorrect {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

/* ========== КНОПКИ ДЕЙСТВИЙ ========== */
.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1.5rem 0;
}
.btn-check,
.btn-clear,
.btn-regenerate,
.btn-review {
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-check {
  background: var(--success);
  color: white;
  border: none;
}
.btn-check:hover {
  background: #0e9f6e;
  transform: translateY(-1px);
}
.btn-clear {
  background: none;
  border: 1px solid var(--gray-300);
  color: var(--gray-600);
}
.btn-clear:hover {
  background: var(--gray-100);
}
.btn-regenerate {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-regenerate:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* ========== РЕЗУЛЬТАТ ========== */
.result-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--primary-light);
  border-radius: 1rem;
  text-align: center;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.result-icon {
  font-size: 2rem;
}
.result-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--secondary);
}
.result-score {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.score-value {
  color: var(--primary);
}
.score-total {
  color: var(--gray-400);
  font-size: 1.5rem;
}
.score-percent {
  font-size: 1rem;
  color: var(--gray-500);
}
.result-message {
  margin-bottom: 1rem;
  color: var(--gray-600);
}
.btn-review {
  background: var(--secondary);
  color: white;
  border: none;
}
.btn-review:hover {
  background: var(--secondary-dark);
}

/* ========== РАЗБОР ОШИБОК ========== */
.mistakes-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
}
.mistakes-section h3 {
  margin-bottom: 1rem;
  color: var(--secondary);
}
.mistake-card {
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--gray-200);
}
.mistake-question {
  margin-bottom: 0.75rem;
  font-weight: 500;
}
.mistake-answer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.your-answer,
.correct-answer {
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.your-answer {
  background: rgba(239, 68, 68, 0.1);
}
.correct-answer {
  background: rgba(16, 185, 129, 0.1);
}
.your-answer pre,
.correct-answer pre {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
  font-family: inherit;
}

/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid var(--gray-200);
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.empty-state h3 {
  margin: 0 0 0.5rem;
  color: var(--secondary);
}
.empty-state p {
  color: var(--gray-500);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .topic-selector,
body.dark-theme .questions-area,
body.dark-theme .empty-state {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .question-block {
  background: var(--gray-700);
}
body.dark-theme .result-card {
  background: rgba(230, 126, 34, 0.2);
}
body.dark-theme .mistake-card {
  background: var(--gray-700);
  border-color: var(--gray-600);
}
body.dark-theme .your-answer {
  background: rgba(239, 68, 68, 0.2);
}
body.dark-theme .correct-answer {
  background: rgba(16, 185, 129, 0.2);
}
/* ========== ТЁМНАЯ ТЕМА (только для этого компонента) ========== */
body.dark-theme .practice-view .question-container .question-text,
body.dark-theme .practice-view .question-container .option-text,
body.dark-theme .practice-view .question-container .match-left-item,
body.dark-theme .practice-view .question-container .match-right-item span,
body.dark-theme .practice-view .question-container .short-input,
body.dark-theme .practice-view .question-container .essay-textarea,
body.dark-theme .practice-view .question-container .custom-checkbox .option-text,
body.dark-theme .practice-view .question-container .custom-radio .option-text {
  color: #ffffff !important;
}

body.dark-theme .practice-view .question-container .short-input,
body.dark-theme .practice-view .question-container .essay-textarea {
  background: var(--gray-700);
  border-color: var(--gray-600);
}

body.dark-theme .practice-view .question-container .custom-checkbox .custom-checkbox,
body.dark-theme .practice-view .question-container .custom-radio .custom-radio {
  background: var(--gray-700);
  border-color: var(--gray-500);
}
/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .practice-view .topic-selector {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .practice-view .filter-group label {
  color: var(--gray-400);
}

/* Текст темы */
body.dark-theme .practice-view .questions-header h2 {
  color: var(--primary) !important;
}

/* Кнопки действий */
body.dark-theme .practice-view .btn-check,
body.dark-theme .practice-view .btn-regenerate {
  background: var(--primary);
  color: white;
}

body.dark-theme .practice-view .btn-clear {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}

body.dark-theme .practice-view .btn-clear:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Текст вопросов и ответов */
body.dark-theme .practice-view .question-block .question-text,
body.dark-theme .practice-view .question-block .option-text,
body.dark-theme .practice-view .question-block .match-left-item,
body.dark-theme .practice-view .question-block .match-right-item span,
body.dark-theme .practice-view .question-block .short-input,
body.dark-theme .practice-view .question-block .essay-textarea,
body.dark-theme .practice-view .question-block .custom-checkbox .option-text,
body.dark-theme .practice-view .question-block .custom-radio .option-text {
  color: #ffffff !important;
}

body.dark-theme .practice-view .question-block .short-input,
body.dark-theme .practice-view .question-block .essay-textarea {
  background: var(--gray-700);
  border-color: var(--gray-600);
}

body.dark-theme .practice-view .question-block .custom-checkbox .custom-checkbox,
body.dark-theme .practice-view .question-block .custom-radio .custom-radio {
  background: var(--gray-700);
  border-color: var(--gray-500);
}
.q-type {
  font-size: 0.7rem;
  background: var(--gray-200);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  color: var(--primary);
}
</style>