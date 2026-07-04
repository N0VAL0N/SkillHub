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
        <button @click="openExamCreator" class="btn-create-exam">
          ➕ Создать экзамен
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

      <!-- Модалка создания экзамена -->
      <div v-if="showExamModal" class="modal" @click.self="closeExamModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Создать экзамен</h2>
            <button class="modal-close" @click="closeExamModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Название (опционально)</label>
              <input v-model="newExam.title" type="text" placeholder="Например: Тренировочный экзамен" class="form-input" />
            </div>
            <div class="form-group">
              <label>Таймер (минуты)</label>
              <div class="custom-select-wrapper">
                <CustomSelect
                  v-model="newExam.timerMinutes"
                  :options="timerOptions"
                  placeholder="Без таймера"
                  :showScrollbar="false"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Часть 2 (выберите типы заданий)</label>
              <div class="part2-options">
                <label class="custom-checkbox" :class="{ checked: newExam.part2.text.enabled }">
                  <input type="checkbox" v-model="newExam.part2.text.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Работа с текстом (17-20)</span>
                </label>
                <label class="custom-checkbox" :class="{ checked: newExam.part2.graph.enabled }">
                  <input type="checkbox" v-model="newExam.part2.graph.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">График (21)</span>
                </label>
                <label class="custom-checkbox" :class="{ checked: newExam.part2.task.enabled }">
                  <input type="checkbox" v-model="newExam.part2.task.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Задача (22)</span>
                </label>
                <label class="custom-checkbox" :class="{ checked: newExam.part2.lawTask.enabled }">
                  <input type="checkbox" v-model="newExam.part2.lawTask.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Правовая задача (23)</span>
                </label>
                <label class="custom-checkbox" :class="{ checked: newExam.part2.plan.enabled }">
                  <input type="checkbox" v-model="newExam.part2.plan.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">План (24)</span>
                </label>
                <label class="custom-checkbox" :class="{ checked: newExam.part2.essay.enabled }">
                  <input type="checkbox" v-model="newExam.part2.essay.enabled" />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Эссе (25)</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="createExam" class="btn-primary" :disabled="creating">
              {{ creating ? 'Создание...' : 'Создать и начать' }}
            </button>
            <button @click="closeExamModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuestionGenerator } from '@/modules/social/stores/questionGenerator';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import QuestionRenderer from '@/modules/social/components/QuestionRenderer.vue';
import CustomSelect from '@shared/components/CustomSelect.vue';
import { useAppStore } from '@core/stores/appStore';

const router = useRouter();
const appStore = useAppStore();
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

// Модалка создания экзамена
const showExamModal = ref(false);
const creating = ref(false);
const newExam = ref({
  title: '',
  timerMinutes: null,
  part2: {
    text: { enabled: false, value: '' },
    graph: { enabled: false, value: '' },
    task: { enabled: false, value: '' },
    lawTask: { enabled: false, value: '' },
    plan: { enabled: false, value: '' },
    essay: { enabled: false, value: '' }
  }
});

const blockOptions = [
  { value: 1, label: 'Блок 1. Человек и общество' },
  { value: 2, label: 'Блок 2. Экономика' },
  { value: 3, label: 'Блок 3. Социальные отношения' },
  { value: 4, label: 'Блок 4. Политика' },
  { value: 5, label: 'Блок 5. Право' },
  { value: 'all', label: 'Реальный ЕГЭ (все блоки)' }
];

const timerOptions = [
  { value: null, label: 'Без таймера' },
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
  { value: 180, label: '3 часа' },
  { value: 210, label: '3.5 часа (ЕГЭ)' }
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
    text_analysis: 'Работа с текстом',
    graph_analysis: 'График',
    task: 'Задача',
    law_task: 'Правовая задача'
  };
  return labels[type] || type;
};

const generateQuestions = async () => {
  if (!selectedTopicId.value) return;
  loading.value = true;
  await nextTick();
  setTimeout(() => {
    const topic = topicsList.value.find(t => t.id === selectedTopicId.value);
    currentTopicName.value = topic?.name || '';

    const newQuestions = [];
    for (let i = 0; i < 5; i++) {
      const type = Math.floor(Math.random() * 3);
      let q = null;
      if (type === 0) q = questionGenerator.generateTask2(selectedTopicId.value);
      else if (type === 1) q = questionGenerator.generateMatch(3);
      else q = questionGenerator.generateShort(selectedTopicId.value);
      if (q) newQuestions.push(q);
    }
    questions.value = newQuestions;
    answers.value = {};
    showResults.value = false;
    showMistakes.value = false;
    correctCount.value = 0;
    loading.value = false;
  }, 50);
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
      const correctAnswersStr = q.correctAnswers;
      let userAnswersStr = '';
      const leftItems = q.leftItems || [];
      
      if (Array.isArray(answer) && answer.length === leftItems.length) {
        userAnswersStr = answer.join('');
      } else if (typeof answer === 'object' && answer !== null) {
        const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
        const result = [];
        for (let i = 0; i < leftItems.length; i++) {
          result.push(answer[letters[i]] || '');
        }
        userAnswersStr = result.join('');
      }
      
      if (userAnswersStr === correctAnswersStr) correct++;
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
    const correctAnswersStr = q.correctAnswers;
    let userAnswersStr = '';
    const leftItems = q.leftItems || [];
    
    if (Array.isArray(answer) && answer.length === leftItems.length) {
      userAnswersStr = answer.join('');
    } else if (typeof answer === 'object' && answer !== null) {
      const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
      const result = [];
      for (let i = 0; i < leftItems.length; i++) {
        result.push(answer[letters[i]] || '');
      }
      userAnswersStr = result.join('');
    }
    
    return userAnswersStr === correctAnswersStr;
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
    if (Array.isArray(answer)) {
      const leftItems = q.leftItems || [];
      return leftItems.map((left, idx) => `${left} → ${answer[idx] || '?'}`).join('\n');
    }
    if (typeof answer === 'object') {
      const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
      const leftItems = q.leftItems || [];
      return leftItems.map((left, idx) => {
        const digit = answer[letters[idx]];
        return `${left} → ${digit ? q.optionsList[parseInt(digit) - 1] || digit : '?'}`;
      }).join('\n');
    }
    return answer;
  }
  if (q.type === 'graph_analysis') {
    if (typeof answer === 'object') {
      return Object.values(answer).join(', ');
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
    if (q.correctAnswers && q.leftItems && q.optionsList) {
      const correctNums = q.correctAnswers.split('');
      return q.leftItems.map((left, idx) => {
        const num = correctNums[idx];
        return `${left} → ${q.optionsList[parseInt(num) - 1] || '?'}`;
      }).join('\n');
    }
    return q.correctAnswers || '—';
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

// Создание экзамена (без сохранения в БД)
const openExamCreator = () => {
  showExamModal.value = true;
};

const closeExamModal = () => {
  showExamModal.value = false;
  newExam.value = {
    title: '',
    timerMinutes: null,
    part2: {
      text: { enabled: false, value: '' },
      graph: { enabled: false, value: '' },
      task: { enabled: false, value: '' },
      lawTask: { enabled: false, value: '' },
      plan: { enabled: false, value: '' },
      essay: { enabled: false, value: '' }
    }
  };
};

const createExam = async () => {
  creating.value = true;
  try {
    // Генерируем экзамен через questionGenerator с выбранным блоком
    const generated = questionGenerator.generateFullExam(
      selectedBlock.value,   // используем выбранный блок (может быть 'all')
      newExam.value.title || null,
      null, // classId
      null, // deadline
      newExam.value.part2
    );
    if (!generated || !generated.questions || generated.questions.length === 0) {
      throw new Error('Не удалось сгенерировать экзамен');
    }

    const examData = {
      ...generated,
      title: generated.title || newExam.value.title || 'Тренировочный экзамен',
      type: 'exam',
      enableTimer: !!newExam.value.timerMinutes,
      timerMinutes: newExam.value.timerMinutes,
      questions: generated.questions
    };

    // Сохраняем в localStorage и переходим к выполнению
    const tempId = Date.now().toString();
    localStorage.setItem(`exam_data_${tempId}`, JSON.stringify(examData));
    localStorage.setItem(`task_started_${tempId}`, 'true');
    
    appStore.showToast('Экзамен создан', 'success');
    closeExamModal();
    router.push(`/student/task/${tempId}`);
  } catch (err) {
    console.error(err);
    appStore.showToast(err.message || 'Ошибка создания экзамена', 'error');
  } finally {
    creating.value = false;
  }
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
.practice-view {
  max-width: 1000px;
  margin: 0 auto;
}

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
  margin-bottom: 0;
}
.btn-generate:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-create-exam {
  padding: 0.6rem 1.2rem;
  background: var(--success);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  margin-left: 0.5rem;
  height: 42px;
  align-self: center;
}
.btn-create-exam:hover {
  background: #0e9f6e;
  transform: translateY(-1px);
}

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

/* ========== МОДАЛКА ========== */
.modal {
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
.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
}
.modal-large {
  max-width: 700px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--secondary);
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-500);
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
}
.form-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
}
.part2-options {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s, box-shadow 0.2s;
}
.custom-checkbox:hover {
  background: var(--gray-100);
}
.custom-checkbox.checked {
  background: rgba(230, 126, 34, 0.15);
  border-left: 3px solid var(--primary);
}
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid var(--gray-400);
  border-radius: 4px;
  transition: all 0.2s;
}
.custom-checkbox input:checked ~ .checkmark {
  background: var(--primary);
  border-color: var(--primary);
}
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}
.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.checkbox-label {
  color: var(--gray-700);
  font-size: 0.9rem;
}
.custom-select-wrapper {
  width: 100%;
}
/* Убираем полосу прокрутки у кастомного селектора, если она есть */
.custom-select-wrapper :deep(.select-dropdown) {
  overflow-y: hidden !important;
  max-height: none !important;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-secondary {
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
}

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
body.dark-theme .modal-content {
  background: var(--gray-800);
  border: 1px solid var(--gray-700);
}
body.dark-theme .form-group label,
body.dark-theme .checkbox-label {
  color: var(--gray-300);
}
body.dark-theme .form-input {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .custom-checkbox:hover {
  background: var(--gray-700);
}
body.dark-theme .checkmark {
  background: var(--gray-700);
  border-color: var(--gray-500);
}
body.dark-theme .custom-checkbox.checked {
  background: rgba(230, 126, 34, 0.2);
}
</style>