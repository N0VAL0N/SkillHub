<template>
  <StudentLayout>
    <div class="results-view">
      <div class="page-header">
        <h1>Результаты задания</h1>
        <button @click="goBack" class="btn-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Назад
        </button>
      </div>

      <div v-if="gradedData" class="results-content">
        <div class="summary-card">
          <h2>{{ gradedData.examTitle }}</h2>
          <div class="grade-large">
            <span class="grade-value">{{ gradedData.teacherGrade || 0 }}</span>
            <span class="grade-max">%</span>
            <span class="grade-5">({{ getGradeFromPercentage(gradedData.teacherGrade) }})</span>
          </div>
          <p class="feedback" v-if="gradedData.generalFeedback">
            💬 {{ gradedData.generalFeedback }}
          </p>
        </div>

        <div class="questions-review">
          <h3>Разбор заданий</h3>
          <div v-for="(q, idx) in examQuestions" :key="q.id" class="review-card">
            <div class="review-header" @click="toggleQuestion(idx)">
              <div class="review-header-left">
                <span class="question-number">{{ idx + 1 }}</span>
                <span class="question-type">{{ getTypeLabel(q.type) }}</span>
                <span class="status" :class="{ correct: isCorrect(q), incorrect: !isCorrect(q) }">
                  {{ isCorrect(q) ? '✓ Верно' : '✗ Неверно' }}
                </span>
              </div>
              <button class="toggle-details-btn">
                {{ expandedQuestions[idx] ? '▲ Скрыть' : '▼ Подробнее' }}
              </button>
            </div>
            
            <div v-if="expandedQuestions[idx]" class="question-details">
              <div class="question-text">{{ getQuestionText(q) }}</div>
              
              <!-- Для choice заданий показываем варианты ответов -->
              <div v-if="q.type === 'choice' && q.options" class="options-list">
                <div v-for="(opt, optIdx) in q.options" :key="optIdx" class="option-item">
                  <span class="option-number">{{ optIdx + 1 }}.</span>
                  <span class="option-text">{{ opt }}</span>
                </div>
              </div>
              
              <!-- Для match заданий -->
              <div v-if="q.type === 'match' && q.leftItems" class="match-preview">
                <div class="match-left">
                  <div class="match-left-header">Позиции</div>
                  <div v-for="(left, lIdx) in q.leftItems" :key="lIdx" class="match-left-item">
                    {{ String.fromCharCode(65 + lIdx) }}. {{ left }}
                  </div>
                </div>
                <div class="match-right">
                  <div class="match-right-header">Варианты ответов</div>
                  <div v-for="(opt, oIdx) in q.optionsList" :key="oIdx" class="match-right-item">
                    {{ oIdx + 1 }}. {{ opt }}
                  </div>
                </div>
              </div>
              
              <!-- Для text_analysis показываем текст ПОД СПОЙЛЕРОМ -->
              <div v-if="q.type === 'text_analysis' && q.content" class="text-analysis-block">
                <button @click="toggleTextContent(idx)" class="toggle-text-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12H20M12 4V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  {{ showTextContent[idx] ? 'Скрыть текст' : 'Показать текст' }}
                </button>
                <div v-if="showTextContent[idx]" class="text-content-preview">
                  <div class="text-content-header">📖 Текст для анализа</div>
                  <div class="text-content-body">{{ q.content }}</div>
                  <div v-if="q.question" class="actual-question">
                    <strong>Вопрос к тексту:</strong> {{ q.question }}
                  </div>
                </div>
              </div>
              
              <!-- Для graph_analysis -->
              <div v-if="q.type === 'graph_analysis' && q.data" class="graph-preview">
                <div class="graph-description">{{ q.title }}</div>
              </div>
              
              <div class="answer-section">
                <div class="your-answer">
                  <strong>Ваш ответ:</strong>
                  <pre>{{ formatAnswer(q, gradedData.answers?.[q.id]) }}</pre>
                </div>
                <div v-if="!isCorrect(q) && getCorrectAnswer(q)" class="correct-answer">
                  <strong>Правильный ответ:</strong>
                  <pre>{{ getCorrectAnswer(q) }}</pre>
                </div>
                <div v-if="gradedData.part2Feedback?.[q.id]" class="teacher-feedback">
                  <strong>💬 Комментарий учителя:</strong>
                  <p>{{ gradedData.part2Feedback[q.id] }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Результаты ещё не готовы</h3>
        <p>Дождитесь проверки учителя</p>
        <button @click="goBack" class="btn-primary">Вернуться к списку</button>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db, auth } from '@core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue';

const router = useRouter();
const route = useRoute();
const examId = route.params.id;

const gradedData = ref(null);
const examQuestions = ref([]);
const expandedQuestions = ref({});
const showTextContent = ref({});

const getGradeFromPercentage = (percentage) => {
  if (percentage === null || percentage === undefined) return '—';
  if (percentage < 42) return '2';
  if (percentage < 58) return '3';
  if (percentage < 72) return '4';
  return '5';
};

const getTypeLabel = (type) => {
  const labels = {
    choice: 'Выбор ответа',
    match: 'Соответствие',
    short: 'Короткий ответ',
    essay: 'Эссе',
    text_analysis: 'Работа с текстом',
    plan: 'План',
    task: 'Задача',
    law_task: 'Правовая задача',
    graph_analysis: 'График'
  };
  return labels[type] || type;
};

const toggleQuestion = (idx) => {
  expandedQuestions.value = {
    ...expandedQuestions.value,
    [idx]: !expandedQuestions.value[idx]
  };
};

const toggleTextContent = (idx) => {
  showTextContent.value = {
    ...showTextContent.value,
    [idx]: !showTextContent.value[idx]
  };
};

const getQuestionText = (q) => {
  // Для text_analysis не показываем текст в заголовке, он под спойлером
  if (q.type === 'text_analysis') {
    return q.question || 'Вопрос к тексту';
  }
  return q.text || q.prompt || q.title || q.question || 'Задание';
};

const isCorrect = (q) => {
  if (!gradedData.value) return false;
  const override = gradedData.value.part1Overrides?.[q.id];
  if (override !== undefined) return override === 1;
  return gradedData.value.autoGraded?.[q.id] === true;
};

const formatAnswer = (q, answer) => {
  if (!answer) return 'Нет ответа';
  
  if (q.type === 'choice') {
    if (Array.isArray(answer)) {
      return answer.map(i => (i + 1)).join(', ');
    }
    if (typeof answer === 'number') {
      return String(answer + 1);
    }
    return String(answer);
  }
  
  if (q.type === 'match') {
    if (Array.isArray(answer)) {
      const leftItems = q.leftItems || [];
      const optionsList = q.optionsList || [];
      return leftItems.map((left, idx) => {
        const digit = answer[idx];
        return `${String.fromCharCode(65 + idx)} → ${digit ? optionsList[parseInt(digit) - 1] || digit : '?'}`;
      }).join('\n');
    }
    if (typeof answer === 'object') {
      const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
      const leftItems = q.leftItems || [];
      const optionsList = q.optionsList || [];
      return leftItems.map((left, idx) => {
        const digit = answer[letters[idx]];
        return `${left} → ${digit ? optionsList[parseInt(digit) - 1] || digit : '?'}`;
      }).join('\n');
    }
    return answer;
  }
  
  if (typeof answer === 'object') {
    let result = answer.text || '';
    if (answer.fileUrl) result += `\n[Прикреплено изображение]`;
    return result;
  }
  
  return String(answer);
};

const getCorrectAnswer = (q) => {
  if (q.type === 'choice') {
    if (q.isMultiple) {
      const correctIndices = Array.isArray(q.correct) ? q.correct : [];
      return correctIndices.map(i => (i + 1)).join(', ');
    } else {
      const correctIndex = typeof q.correct === 'number' ? q.correct : parseInt(q.correct);
      return String(correctIndex + 1);
    }
  }
  
  if (q.type === 'match') {
    if (q.correctAnswers && q.leftItems && q.optionsList) {
      const correctNums = q.correctAnswers.split('');
      return q.leftItems.map((left, idx) => {
        const num = correctNums[idx];
        return `${String.fromCharCode(65 + idx)} → ${q.optionsList[parseInt(num) - 1] || num}`;
      }).join('\n');
    }
    return q.correctAnswers || '—';
  }
  
  if (q.type === 'short') {
    return q.correctAnswer;
  }
  
  return null;
};

const loadResults = async () => {
  try {
    // 1. Загружаем проверенные данные
    const gradedDoc = await getDoc(doc(db, 'gradedSubmissions', `${auth.currentUser.uid}_${examId}`));
    if (gradedDoc.exists()) {
      gradedData.value = gradedDoc.data();
      console.log('Graded data loaded');
    } else {
      console.warn('Работа ещё не проверена');
    }
    
    // 2. Загружаем вопросы экзамена
    // Сначала пробуем из localStorage (ключ exam_data_*)
    const savedExam = localStorage.getItem(`exam_data_${examId}`);
    if (savedExam) {
      try {
        const parsed = JSON.parse(savedExam);
        examQuestions.value = parsed.questions || [];
        console.log('Вопросы загружены из exam_data_, количество:', examQuestions.value.length);
      } catch(e) {}
    }
    
    // Если нет, пробуем из кэша task_*_meta
    if (examQuestions.value.length === 0) {
      const cachedMeta = localStorage.getItem(`task_${examId}_meta`);
      if (cachedMeta) {
        try {
          const parsed = JSON.parse(cachedMeta);
          examQuestions.value = parsed.task?.questions || [];
          console.log('Вопросы загружены из task_meta, количество:', examQuestions.value.length);
        } catch(e) {}
      }
    }
    
    // Если всё ещё нет, пробуем загрузить экзамен из Firebase
    if (examQuestions.value.length === 0 && gradedData.value?.examId) {
      try {
        const examDoc = await getDoc(doc(db, 'exams', gradedData.value.examId));
        if (examDoc.exists()) {
          examQuestions.value = examDoc.data().questions || [];
          console.log('Вопросы загружены из Firebase, количество:', examQuestions.value.length);
        }
      } catch(e) {
        console.warn('Не удалось загрузить экзамен из Firebase');
      }
    }
    
    // По умолчанию раскрываем все вопросы, но текст под спойлером
    for (let i = 0; i < examQuestions.value.length; i++) {
      expandedQuestions.value[i] = true;
      showTextContent.value[i] = false; // текст скрыт по умолчанию
    }
  } catch (error) {
    console.error('Ошибка загрузки результатов:', error);
  }
};

const goBack = () => {
  router.push('/student/homework');
};

onMounted(() => {
  loadResults();
});
</script>

<style scoped>
.results-view { max-width: 900px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-header h1 { margin: 0; font-size: 1.5rem; color: var(--secondary); }
.btn-back { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: var(--primary); cursor: pointer; font-size: 1rem; padding: 0.5rem; transition: color 0.2s; }
.btn-back:hover { color: var(--primary-dark); }
.summary-card { background: white; border-radius: 1rem; padding: 2rem; text-align: center; margin-bottom: 2rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow); }
.grade-large { margin: 1rem 0; }
.grade-value { font-size: 4rem; font-weight: bold; color: var(--primary); }
.grade-max { font-size: 1.5rem; color: var(--gray-400); }
.grade-5 { font-size: 1.5rem; font-weight: bold; color: var(--success); margin-left: 0.5rem; }
.feedback { background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; color: var(--gray-700); text-align: left; }
.questions-review h3 { margin-bottom: 1rem; font-size: 1.3rem; color: var(--secondary); }
.review-card { background: white; border-radius: 0.75rem; margin-bottom: 1rem; border: 1px solid var(--gray-200); }
.review-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; cursor: pointer; background: var(--gray-50); border-radius: 0.75rem 0.75rem 0 0; }
.review-header:hover { background: var(--gray-100); }
.review-header-left { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.question-number { width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold; }
.question-type { font-size: 0.7rem; background: var(--gray-200); padding: 0.2rem 0.6rem; border-radius: 1rem; color: var(--gray-600); }
.status { font-size: 0.8rem; font-weight: 500; padding: 0.2rem 0.6rem; border-radius: 1rem; }
.status.correct { background: rgba(16,185,129,0.2); color: var(--success); }
.status.incorrect { background: rgba(239,68,68,0.2); color: var(--danger); }
.toggle-details-btn { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.8rem; padding: 0.3rem 0.8rem; border-radius: 1rem; }
.toggle-details-btn:hover { background: var(--primary-light); }
.question-details { padding: 1rem; border-top: 1px solid var(--gray-200); }
.question-text { margin-bottom: 1rem; font-weight: 500; color: var(--secondary); line-height: 1.5; }
.options-list { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; background: var(--gray-50); padding: 1rem; border-radius: 0.5rem; }
.option-item { display: flex; gap: 0.75rem; }
.option-number { font-weight: 600; min-width: 28px; color: var(--primary); }
.option-text { flex: 1; color: var(--gray-700); }
.match-preview { display: flex; gap: 1.5rem; margin: 1rem 0; background: var(--gray-50); padding: 1rem; border-radius: 0.5rem; flex-wrap: wrap; }
.match-left, .match-right { flex: 1; min-width: 250px; }
.match-left-header, .match-right-header { font-weight: 700; padding: 0.5rem; background: var(--gray-200); border-radius: 0.5rem; margin-bottom: 0.75rem; text-align: center; }
.match-left-item, .match-right-item { padding: 0.5rem; border-bottom: 1px solid var(--gray-200); font-size: 0.85rem; }
.text-analysis-block { margin: 1rem 0; }
.toggle-text-btn { display: flex; align-items: center; gap: 0.3rem; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 0.5rem; padding: 0.3rem 0.8rem; font-size: 0.75rem; cursor: pointer; margin-bottom: 0.75rem; transition: all 0.2s; }
.toggle-text-btn:hover { background: var(--gray-200); }
.text-content-preview { background: var(--gray-50); border-radius: 0.5rem; overflow: hidden; margin-top: 0.5rem; }
.text-content-header { background: var(--gray-200); padding: 0.5rem 1rem; font-weight: 600; font-size: 0.85rem; }
.text-content-body { padding: 1rem; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
.actual-question { padding: 0.75rem 1rem; background: var(--primary-light); border-top: 1px solid var(--gray-200); font-size: 0.9rem; }
.actual-question strong { color: var(--primary); }
.graph-preview { margin: 1rem 0; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem; }
.graph-description { font-size: 0.85rem; color: var(--gray-600); }
.answer-section { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.your-answer, .correct-answer { padding: 0.75rem; border-radius: 0.5rem; }
.your-answer { background: rgba(239,68,68,0.1); }
.correct-answer { background: rgba(16,185,129,0.1); }
.your-answer strong, .correct-answer strong { display: block; margin-bottom: 0.5rem; }
.your-answer pre, .correct-answer pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; }
.teacher-feedback { background: rgba(59,130,246,0.1); padding: 0.75rem; border-radius: 0.5rem; }
.teacher-feedback strong { display: block; margin-bottom: 0.5rem; }
.teacher-feedback p { margin: 0; font-size: 0.85rem; }
.empty-state { text-align: center; padding: 3rem; background: white; border-radius: 1rem; border: 1px solid var(--gray-200); }
.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
.empty-state h3 { margin-bottom: 0.5rem; color: var(--secondary); }
.empty-state p { margin-bottom: 1rem; color: var(--gray-500); }
.btn-primary { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 0.5rem; cursor: pointer; }

/* Тёмная тема */
body.dark-theme .summary-card, body.dark-theme .review-card, body.dark-theme .empty-state { background: var(--gray-800); border-color: var(--gray-700); }
body.dark-theme .question-text { color: #ffffff; }
body.dark-theme .options-list, body.dark-theme .match-preview, body.dark-theme .text-content-preview { background: var(--gray-700); }
body.dark-theme .option-text { color: var(--gray-300); }
body.dark-theme .match-left-header, body.dark-theme .match-right-header, body.dark-theme .text-content-header { background: var(--gray-600); color: white; }
body.dark-theme .review-header { background: var(--gray-700); }
body.dark-theme .review-header:hover { background: var(--gray-600); }
body.dark-theme .your-answer { background: rgba(239,68,68,0.2); }
body.dark-theme .correct-answer { background: rgba(16,185,129,0.2); }
body.dark-theme .toggle-text-btn { background: var(--gray-700); border-color: var(--gray-600); color: var(--gray-300); }
body.dark-theme .toggle-text-btn:hover { background: var(--gray-600); }
body.dark-theme .actual-question { background: rgba(230,126,34,0.2); }
body.dark-theme .actual-question strong { color: var(--primary); }
body.dark-theme .grade-5 { color: var(--success); }
</style>