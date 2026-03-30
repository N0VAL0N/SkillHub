<template>
  <StudentLayout>
    <div class="results-view">
      <div class="page-header">
        <h1>Результаты задания</h1>
        <button @click="goBack" class="btn-back">← Назад</button>
      </div>

      <div v-if="submission" class="results-content">
        <div class="summary-card">
          <h2>{{ exam?.title }}</h2>
          <div class="grade-large">
            <span class="grade-value">{{ submission.teacherGrade || submission.autoGrade || 0 }}</span>
            <span class="grade-max">/100</span>
          </div>
          <p class="feedback" v-if="submission.feedback">
            💬 {{ submission.feedback }}
          </p>
        </div>

        <div class="questions-review">
          <h3>Разбор заданий</h3>
          <div v-for="(q, idx) in exam?.questions" :key="q.id" class="review-card">
            <div class="review-header">
              <span class="question-number">{{ idx + 1 }}</span>
              <span class="question-type">{{ getTypeLabel(q.type) }}</span>
              <span class="status" :class="{ correct: isCorrect(q), incorrect: !isCorrect(q) }">
                {{ isCorrect(q) ? '✓ Верно' : '✗ Неверно' }}
              </span>
            </div>
            <div class="question-text">{{ q.text || q.prompt || q.title }}</div>
            <div class="answer-section">
              <div class="your-answer">
                <strong>Ваш ответ:</strong>
                <pre>{{ formatAnswer(q, submission.answers[q.id]) }}</pre>
              </div>
              <div v-if="!isCorrect(q)" class="correct-answer">
                <strong>Правильный ответ:</strong>
                <pre>{{ getCorrectAnswer(q) }}</pre>
              </div>
            </div>
          </div>
        </div>
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

const submission = ref(null);
const exam = ref(null);

const getTypeLabel = (type) => {
  const labels = {
    choice: 'Выбор ответа',
    match: 'Соответствие',
    short: 'Короткий ответ',
    essay: 'Эссе',
    text_analysis: 'Работа с текстом',
    plan: 'План',
    task: 'Задача',
    law_task: 'Правовая задача'
  };
  return labels[type] || type;
};

const isCorrect = (q) => {
  if (!submission.value) return false;
  return submission.value.autoGraded?.[q.id] === true;
};

const formatAnswer = (q, answer) => {
  if (!answer) return 'Нет ответа';
  if (q.type === 'choice') {
    if (Array.isArray(answer)) {
      return answer.map(i => q.options[i]).join(', ');
    }
    return q.options[answer];
  }
  if (q.type === 'match') {
    if (typeof answer === 'object') {
      return Object.entries(answer).map(([right, left]) => `${left} → ${right}`).join('\n');
    }
    return answer;
  }
  if (q.type === 'short') return answer;
  if (typeof answer === 'object') {
    let result = answer.text || '';
    if (answer.fileUrl) result += `\n[Прикреплено изображение]`;
    return result;
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
  return 'Ответ проверяется учителем';
};

const loadResults = async () => {
  try {
    const subDoc = await getDoc(doc(db, 'submissions', `${auth.currentUser.uid}_${examId}`));
    if (subDoc.exists()) {
      submission.value = subDoc.data();
    }
    
    const examDoc = await getDoc(doc(db, 'exams', examId));
    if (examDoc.exists()) {
      exam.value = examDoc.data();
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
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.results-view {
  max-width: 900px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--secondary);
}
.btn-back {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem;
  transition: color 0.2s;
}
.btn-back:hover {
  color: var(--primary-dark);
}

/* ========== КАРТОЧКА РЕЗУЛЬТАТА ========== */
.summary-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow);
}
.grade-large {
  margin: 1rem 0;
}
.grade-value {
  font-size: 4rem;
  font-weight: bold;
  color: var(--primary);
}
.grade-max {
  font-size: 1.5rem;
  color: var(--gray-400);
}
.feedback {
  background: var(--gray-100);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  color: var(--gray-700);
}

/* ========== РАЗБОР ЗАДАНИЙ ========== */
.questions-review h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.review-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}
.review-card:hover {
  box-shadow: var(--shadow-sm);
}
.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.question-number {
  width: 28px;
  height: 28px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}
.question-type {
  font-size: 0.7rem;
  background: var(--gray-200);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  color: var(--gray-600);
}
.status {
  margin-left: auto;
  font-size: 0.8rem;
  font-weight: 500;
}
.status.correct {
  color: var(--success);
}
.status.incorrect {
  color: var(--danger);
}
.question-text {
  margin-bottom: 1rem;
  font-weight: 500;
  color: var(--secondary);
}
.answer-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.85rem;
}
.your-answer,
.correct-answer {
  padding: 0.75rem;
  border-radius: 0.5rem;
}
.your-answer {
  background: rgba(239, 68, 68, 0.1);
}
.correct-answer {
  background: rgba(16, 185, 129, 0.1);
}
.your-answer strong,
.correct-answer strong {
  display: block;
  margin-bottom: 0.25rem;
}
.your-answer pre,
.correct-answer pre {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
  font-family: inherit;
  color: inherit;
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .summary-card,
body.dark-theme .review-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .grade-value {
  color: var(--primary);
}
body.dark-theme .question-text {
  color: #ffffff;
}
body.dark-theme .feedback {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .your-answer {
  background: rgba(239, 68, 68, 0.2);
}
body.dark-theme .correct-answer {
  background: rgba(16, 185, 129, 0.2);
}
</style>