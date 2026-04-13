<template>
  <TeacherLayout>
    <div class="check-view">
      <div class="page-header">
        <h1>На проверку</h1>
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          {{ loading ? 'Обновление...' : 'Обновить' }}
        </button>
      </div>

      <div class="check-stats">
        <div class="stat-badge">
          <span class="stat-value">{{ pendingSubmissions.length }}</span>
          <span class="stat-label">Ожидают проверки</span>
        </div>
        <div class="stat-badge">
          <span class="stat-value">{{ gradedSubmissions.length }}</span>
          <span class="stat-label">Проверено</span>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'; loadData()">
          📝 На проверку ({{ pendingSubmissions.length }})
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'graded' }" @click="activeTab = 'graded'; loadData()">
          ✅ Проверенные ({{ gradedSubmissions.length }})
        </button>
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label>Фильтр по ученику:</label>
          <CustomSelect v-model="selectedStudent" :options="studentFilterOptions" placeholder="Все ученики" />
        </div>
        <div class="filter-item">
          <label>Фильтр по классу:</label>
          <CustomSelect v-model="selectedClass" :options="classFilterOptions" placeholder="Все классы" />
        </div>
      </div>

      <div class="submissions-list" v-if="currentSubmissions.length">
        <div v-for="sub in currentSubmissions" :key="sub.id" class="submission-card">
          <div class="submission-header">
            <div class="student-info">
              <div class="student-avatar">{{ (getStudentNameFromData(sub) || '?').charAt(0).toUpperCase() }}</div>
              <div>
                <h3>{{ getStudentNameFromData(sub) }}</h3>
                <p>{{ sub.className || 'Без класса' }} • {{ getExamTitle(sub.examId) }}</p>
              </div>
            </div>
            <div class="submission-actions">
              <button @click="openPreviewModal(sub)" class="btn-preview" title="Показать задание">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button @click="openGradeModal(sub)" class="btn-grade">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                {{ activeTab === 'pending' ? 'Оценить' : 'Пересмотреть' }}
              </button>
            </div>
            <span class="date-badge">{{ formatRelativeTime(sub.submittedAt?.toDate?.()) }}</span>
          </div>
          <div v-if="activeTab === 'graded'" class="graded-info">
            <span class="grade-badge">🎓 Балл: {{ sub.teacherGrade }}% ({{ getGradeFromPercentage(sub.teacherGrade) }})</span>
            <span v-if="sub.generalFeedback" class="feedback-preview">💬 {{ sub.generalFeedback.slice(0, 50) }}...</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>Нет заданий</h3>
      </div>

      <!-- Модалка оценки -->
      <div v-if="showGradeModal" class="modal" @click.self="closeGradeModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Оценка работы</h2>
            <button class="modal-close" @click="closeGradeModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="student-info-modal">
              <strong>{{ getStudentNameFromData(currentSubmission) }}</strong>
              <span>{{ currentSubmission?.className || 'Без класса' }}</span>
            </div>

            <!-- Часть 1: автопроверка -->
            <div class="part1-section">
              <h3>📋 Часть 1 (автоматическая проверка)</h3>
              <div v-for="item in gradeItems.filter(i => i.part === 1)" :key="item.questionId" class="grade-item">
                <div class="grade-question">
                  <span>Задание {{ item.questionNum }}</span>
                  <span class="auto-result" :class="{ correct: item.isCorrect, wrong: !item.isCorrect }">
                    {{ item.isCorrect ? '✓ Верно (1 балл)' : '✗ Неверно (0 баллов)' }}
                  </span>
                  <button @click="toggleQuestionText(item.questionId)" class="toggle-text-btn" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12H20M12 4V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    {{ showQuestionText[item.questionId] ? 'Скрыть задание' : 'Показать задание' }}
                  </button>
                </div>
                <div v-if="showQuestionText[item.questionId]" class="question-text-content">
                  <div class="text-content">{{ item.questionText }}</div>
                  <div v-if="item.type === 'choice' && item.questionOptions" class="preview-options">
                    <div v-for="(opt, optIdx) in item.questionOptions" :key="optIdx" class="preview-option">
                      <span class="opt-num">{{ optIdx + 1 }}.</span>
                      <span class="opt-text">{{ opt }}</span>
                    </div>
                  </div>
                </div>
                <div class="grade-controls">
                  <div class="score-field">
                    <label>Изменить баллы:</label>
                    <CustomSelect v-model="part1Overrides[item.questionId]" :options="scoreOptions(1)" placeholder="0" />
                  </div>
                  <div v-if="item.userAnswer" class="user-answer">
                    <strong>Ответ ученика:</strong>
                    <pre>{{ formatAnswer(item.userAnswer, item.type) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Часть 2: проверка учителем -->
            <div class="part2-section">
              <h3>✍️ Часть 2 (проверка учителем)</h3>
              <div v-for="item in gradeItems.filter(i => i.part === 2)" :key="item.questionId" class="grade-item">
                <!-- Для text_analysis показываем 4 отдельных подвопроса -->
                <div v-if="item.type === 'text_analysis'" class="text-analysis-grade">
                  <div class="grade-question">
                    <strong>Задания 17-20 (работа с текстом)</strong>
                    <span class="max-score">(макс. {{ item.maxScore }} баллов)</span>
                    <button class="toggle-text-btn" @click="toggleText(item.questionId)">
                      {{ showText[item.questionId] ? 'Скрыть текст' : 'Показать текст' }}
                    </button>
                  </div>
                  <div v-if="showText[item.questionId]" class="question-text-content">
                    <div class="text-content">{{ item.questionText }}</div>
                  </div>
                  
                  <!-- Задание 17 -->
                  <div class="sub-question">
                    <div class="sub-question-header">
                      <span class="sub-q-num">17</span>
                      <span class="sub-q-text">{{ item.subQuestions?.[17]?.text || 'Задание 17' }}</span>
                      <span class="sub-q-max">(макс. {{ item.subMaxScores?.[17] || 2 }} баллов)</span>
                    </div>
                    <div class="user-answer">
                      <strong>Ответ ученика:</strong>
                      <pre>{{ formatAnswer(item.userAnswer?.[17], 'short') || 'Нет ответа' }}</pre>
                    </div>
                    <div class="grade-controls">
                      <div class="score-field">
                        <label>Баллы:</label>
                        <CustomSelect
                          v-model="part2Scores[`${item.questionId}_17`]"
                          :options="scoreOptions(item.subMaxScores?.[17] || 2)"
                          placeholder="0"
                        />
                      </div>
                      <div class="feedback-field">
                        <label>Комментарий:</label>
                        <textarea v-model="part2Feedback[`${item.questionId}_17`]" rows="2" placeholder="Комментарий..."></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Задание 18 -->
                  <div class="sub-question">
                    <div class="sub-question-header">
                      <span class="sub-q-num">18</span>
                      <span class="sub-q-text">{{ item.subQuestions?.[18]?.text || 'Задание 18' }}</span>
                      <span class="sub-q-max">(макс. {{ item.subMaxScores?.[18] || 2 }} баллов)</span>
                    </div>
                    <div class="user-answer">
                      <strong>Ответ ученика:</strong>
                      <pre>{{ formatAnswer(item.userAnswer?.[18], 'short') || 'Нет ответа' }}</pre>
                    </div>
                    <div class="grade-controls">
                      <div class="score-field">
                        <label>Баллы:</label>
                        <CustomSelect
                          v-model="part2Scores[`${item.questionId}_18`]"
                          :options="scoreOptions(item.subMaxScores?.[18] || 2)"
                          placeholder="0"
                        />
                      </div>
                      <div class="feedback-field">
                        <label>Комментарий:</label>
                        <textarea v-model="part2Feedback[`${item.questionId}_18`]" rows="2" placeholder="Комментарий..."></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Задание 19 -->
                  <div class="sub-question">
                    <div class="sub-question-header">
                      <span class="sub-q-num">19</span>
                      <span class="sub-q-text">{{ item.subQuestions?.[19]?.text || 'Задание 19' }}</span>
                      <span class="sub-q-max">(макс. {{ item.subMaxScores?.[19] || 3 }} баллов)</span>
                    </div>
                    <div class="user-answer">
                      <strong>Ответ ученика:</strong>
                      <pre>{{ formatAnswer(item.userAnswer?.[19], 'short') || 'Нет ответа' }}</pre>
                    </div>
                    <div class="grade-controls">
                      <div class="score-field">
                        <label>Баллы:</label>
                        <CustomSelect
                          v-model="part2Scores[`${item.questionId}_19`]"
                          :options="scoreOptions(item.subMaxScores?.[19] || 3)"
                          placeholder="0"
                        />
                      </div>
                      <div class="feedback-field">
                        <label>Комментарий:</label>
                        <textarea v-model="part2Feedback[`${item.questionId}_19`]" rows="2" placeholder="Комментарий..."></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Задание 20 -->
                  <div class="sub-question">
                    <div class="sub-question-header">
                      <span class="sub-q-num">20</span>
                      <span class="sub-q-text">{{ item.subQuestions?.[20]?.text || 'Задание 20' }}</span>
                      <span class="sub-q-max">(макс. {{ item.subMaxScores?.[20] || 3 }} баллов)</span>
                    </div>
                    <div class="user-answer">
                      <strong>Ответ ученика:</strong>
                      <pre>{{ formatAnswer(item.userAnswer?.[20], 'short') || 'Нет ответа' }}</pre>
                    </div>
                    <div class="grade-controls">
                      <div class="score-field">
                        <label>Баллы:</label>
                        <CustomSelect
                          v-model="part2Scores[`${item.questionId}_20`]"
                          :options="scoreOptions(item.subMaxScores?.[20] || 3)"
                          placeholder="0"
                        />
                      </div>
                      <div class="feedback-field">
                        <label>Комментарий:</label>
                        <textarea v-model="part2Feedback[`${item.questionId}_20`]" rows="2" placeholder="Комментарий..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Обычные задания (21-25) -->
                <div v-else>
                  <div class="grade-question">
                    <strong>Задание {{ item.ege_num }}</strong>
                    <span class="max-score">(макс. {{ item.maxScore }} баллов)</span>
                    <button class="toggle-text-btn" @click="toggleText(item.questionId)">
                      {{ showText[item.questionId] ? 'Скрыть текст' : 'Показать текст' }}
                    </button>
                  </div>
                  <div v-if="showText[item.questionId]" class="question-text-content">
                    <div class="text-content">{{ item.questionText }}</div>
                  </div>
                  <div class="user-answer">
                    <strong>Ответ ученика:</strong>
                    <pre>{{ formatAnswer(item.userAnswer, item.type) }}</pre>
                  </div>
                  <div class="grade-controls">
                    <div class="score-field">
                      <label>Баллы:</label>
                      <CustomSelect v-model="part2Scores[item.questionId]" :options="scoreOptions(item.maxScore)" placeholder="0" />
                      <span class="score-preview" v-if="part2Scores[item.questionId] !== undefined">
                        Выбрано: {{ part2Scores[item.questionId] }} / {{ item.maxScore }}
                      </span>
                    </div>
                    <div class="feedback-field">
                      <label>Комментарий:</label>
                      <textarea v-model="part2Feedback[item.questionId]" rows="2" placeholder="Комментарий..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Общий комментарий -->
            <div class="general-feedback-section">
              <h3>💬 Общий комментарий</h3>
              <textarea v-model="generalFeedback" rows="3" placeholder="Общее впечатление о работе, рекомендации..."></textarea>
            </div>

            <!-- Итоговая оценка -->
            <div class="final-grade-section" v-if="totalMaxScore > 0">
              <h3>📊 Итог</h3>
              <div class="final-grade-info">
                <span class="score-summary">Набрано: {{ totalScore }} / {{ totalMaxScore }} баллов</span>
                <span class="percentage-badge">{{ Math.round((totalScore / totalMaxScore) * 100) }}%</span>
                <span class="grade-badge-final">{{ getGradeFromPercentage(Math.round((totalScore / totalMaxScore) * 100)) }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="submitGrade" class="btn-primary">Сохранить оценку</button>
            <button @click="closeGradeModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка предпросмотра задания -->
      <div v-if="showPreviewModal" class="modal" @click.self="closePreviewModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Просмотр задания</h2>
            <button class="modal-close" @click="closePreviewModal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="preview-student-info">
              <strong>{{ getStudentNameFromData(previewSubmission) }}</strong>
              <span>{{ previewSubmission?.className || 'Без класса' }}</span>
            </div>
            <div class="preview-questions">
              <div v-for="(q, idx) in previewQuestions" :key="q.id" class="preview-question-card">
                <div class="preview-question-header">
                  <span class="q-num">{{ idx + 1 }}</span>
                  <span class="q-type">{{ getTypeLabel(q.type) }}</span>
                </div>
                <div class="preview-question-text">{{ getQuestionText(q) }}</div>
                <div v-if="q.type === 'choice' && q.options" class="preview-options">
                  <div v-for="(opt, optIdx) in q.options" :key="optIdx" class="preview-option">
                    <span class="opt-num">{{ optIdx + 1 }}.</span>
                    <span class="opt-text">{{ opt }}</span>
                  </div>
                </div>
                <div v-if="q.type === 'match' && q.leftItems" class="preview-match">
                  <div class="preview-match-left">
                    <div class="preview-match-header">Позиции</div>
                    <div v-for="(left, lIdx) in q.leftItems" :key="lIdx" class="preview-match-item">
                      {{ String.fromCharCode(65 + lIdx) }}. {{ left }}
                    </div>
                  </div>
                  <div class="preview-match-right">
                    <div class="preview-match-header">Варианты</div>
                    <div v-for="(opt, oIdx) in q.optionsList" :key="oIdx" class="preview-match-item">
                      {{ oIdx + 1 }}. {{ opt }}
                    </div>
                  </div>
                </div>
                <div class="preview-answer">
                  <strong>Ответ ученика:</strong>
                  <pre>{{ formatPreviewAnswer(q, previewSubmission?.answers?.[q.id]) }}</pre>
                </div>
                <div v-if="getCorrectAnswerText(q)" class="preview-correct-answer">
                  <strong>Правильный ответ:</strong>
                  <pre>{{ getCorrectAnswerText(q) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closePreviewModal" class="btn-secondary">Закрыть</button>
          </div>
        </div>
      </div>

      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toast.visible = false">×</button>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@core/services/firebase';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, orderBy } from 'firebase/firestore';
import TeacherLayout from '@core/layouts/TeacherLayout.vue';
import CustomSelect from '@shared/components/CustomSelect.vue';
import { useLocalStudentName } from '@core/composables/useLocalStudentName';
import { formatRelativeTime } from '@core/utils/dateHelpers';

const loading = ref(false);
const activeTab = ref('pending');
const pendingSubmissions = ref([]);
const gradedSubmissions = ref([]);
const examsMap = ref(new Map());
const classes = ref([]);
const currentSubmission = ref(null);
const showGradeModal = ref(false);
const showPreviewModal = ref(false);
const previewSubmission = ref(null);
const previewQuestions = ref([]);
const gradeItems = ref([]);
const part1Overrides = ref({});
const part2Scores = ref({});
const part2Feedback = ref({});
const generalFeedback = ref('');
const showText = ref({});
const showQuestionText = ref({});
const selectedStudent = ref('all');
const selectedClass = ref('all');
const toast = ref({ visible: false, type: 'success', message: '' });

const totalScore = computed(() => {
  let score = 0;
  gradeItems.value.forEach(item => {
    if (item.part === 1) {
      const override = part1Overrides.value[item.questionId];
      if (override !== undefined && override !== null) {
        score += override;
      } else {
        score += item.isCorrect ? 1 : 0;
      }
    } else if (item.part === 2) {
      if (item.type === 'text_analysis') {
        for (let i = 17; i <= 20; i++) {
          score += part2Scores.value[`${item.questionId}_${i}`] || 0;
        }
      } else {
        score += part2Scores.value[item.questionId] || 0;
      }
    }
  });
  return score;
});

const totalMaxScore = computed(() => {
  let max = 0;
  gradeItems.value.forEach(item => {
    if (item.part === 1) {
      max += 1;
    } else if (item.part === 2) {
      if (item.type === 'text_analysis') {
        for (let i = 17; i <= 20; i++) {
          max += item.subMaxScores?.[i] || 2;
        }
      } else {
        max += item.maxScore;
      }
    }
  });
  return max;
});

const { getStudentName } = useLocalStudentName();
const teacherUid = auth.currentUser?.uid;

const getGradeFromPercentage = (percentage) => {
  if (percentage === null || percentage === undefined) return '—';
  if (percentage < 42) return '2';
  if (percentage < 58) return '3';
  if (percentage < 72) return '4';
  return '5';
};

const showToast = (type, message) => {
  toast.value = { visible: true, type, message };
  setTimeout(() => toast.value.visible = false, 3000);
};

const getStudentNameFromData = (sub) => {
  if (teacherUid) {
    const localName = getStudentName(teacherUid, sub.studentId);
    if (localName) return localName;
  }
  return sub.studentLogin || sub.displayName || sub.studentId || 'Неизвестно';
};

const getExamTitle = (examId) => {
  return examsMap.value.get(examId)?.title || 'Задание';
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

const getQuestionText = (q) => {
  return q.text || q.prompt || q.title || q.question || 'Задание';
};

const getCorrectAnswerText = (q) => {
  if (q.type === 'choice') {
    if (q.isMultiple) {
      return q.correct.map(i => i + 1).join(', ');
    }
    return String(q.correct + 1);
  }
  if (q.type === 'match') {
    if (q.correctAnswers) {
      const nums = q.correctAnswers.split('');
      return nums.join(', ');
    }
  }
  if (q.type === 'short') {
    return q.correctAnswer;
  }
  return null;
};

const scoreOptions = (maxScore) => {
  const options = [];
  for (let i = 0; i <= maxScore; i++) {
    options.push({ value: i, label: `${i} из ${maxScore}` });
  }
  return options;
};

const currentSubmissions = computed(() => {
  return activeTab.value === 'pending' ? pendingSubmissions.value : gradedSubmissions.value;
});

const studentFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все ученики' }];
  const namesSet = new Set();
  currentSubmissions.value.forEach(sub => {
    const name = getStudentNameFromData(sub);
    namesSet.add(name);
  });
  Array.from(namesSet).sort().forEach(name => {
    options.push({ value: name, label: name });
  });
  return options;
});

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }];
  const classesSet = new Set();
  currentSubmissions.value.forEach(sub => {
    if (sub.className) classesSet.add(sub.className);
  });
  Array.from(classesSet).sort().forEach(className => {
    options.push({ value: className, label: className });
  });
  return options;
});

const filteredSubmissions = computed(() => {
  let result = [...currentSubmissions.value];
  if (selectedStudent.value !== 'all') {
    result = result.filter(sub => getStudentNameFromData(sub) === selectedStudent.value);
  }
  if (selectedClass.value !== 'all') {
    result = result.filter(sub => sub.className === selectedClass.value);
  }
  return result;
});

const formatAnswer = (answer, type) => {
  if (!answer) return 'Нет ответа';
  
  if (type === 'choice') {
    if (Array.isArray(answer)) {
      return answer.map(i => i + 1).join(', ');
    }
    if (typeof answer === 'number') {
      return String(answer + 1);
    }
    return String(answer);
  }
  
  if (type === 'match') {
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object') return Object.values(answer).join(', ');
    return String(answer);
  }
  
  if (type === 'short') {
    return String(answer);
  }
  
  if (typeof answer === 'object') {
    if (answer.text) return answer.text;
    if (answer.fileUrl) return `[Прикреплён файл] ${answer.fileUrl}`;
    return JSON.stringify(answer);
  }
  return String(answer);
};

const formatPreviewAnswer = (q, answer) => {
  if (!answer) return 'Нет ответа';
  return formatAnswer(answer, q.type);
};

const loadData = async () => {
  if (!teacherUid) return;
  loading.value = true;
  try {
    const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', teacherUid)));
    classes.value = classesSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    const teacherClassIds = classes.value.map(c => c.id);
    if (teacherClassIds.length === 0) {
      pendingSubmissions.value = [];
      gradedSubmissions.value = [];
      loading.value = false;
      return;
    }

    const submissionsSnap = await getDocs(query(
      collection(db, 'submissions'),
      where('classId', 'in', teacherClassIds),
      orderBy('submittedAt', 'desc')
    ));

    const allSubs = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    pendingSubmissions.value = allSubs.filter(sub => sub.status === 'pending');
    gradedSubmissions.value = allSubs.filter(sub => sub.status === 'graded');

    const allExamIds = [...new Set(allSubs.map(s => s.examId))];
    if (allExamIds.length) {
      const examsSnap = await getDocs(query(collection(db, 'exams'), where('__name__', 'in', allExamIds)));
      examsMap.value.clear();
      examsSnap.docs.forEach(doc => examsMap.value.set(doc.id, doc.data()));
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    showToast('error', 'Не удалось загрузить задания');
  } finally {
    loading.value = false;
  }
};

const openPreviewModal = async (submission) => {
  previewSubmission.value = submission;
  const exam = examsMap.value.get(submission.examId);
  if (exam) {
    previewQuestions.value = exam.questions || [];
  }
  showPreviewModal.value = true;
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
  previewSubmission.value = null;
  previewQuestions.value = [];
};

const openGradeModal = async (submission) => {
  currentSubmission.value = submission;
  const exam = examsMap.value.get(submission.examId);
  if (!exam) return;

  const items = [];
  exam.questions.forEach((q, idx) => {
    const userAnswer = submission.answers?.[q.id];
    const questionText = q.text || q.prompt || q.title || q.question || '';
    const questionOptions = q.options || null;
    
    if (q.type === 'choice' || q.type === 'match' || q.type === 'short') {
      let isCorrect = false;
      if (q.type === 'choice') {
        if (q.isMultiple) {
          const user = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
          const correct = Array.isArray(q.correct) ? [...q.correct].sort() : [];
          isCorrect = JSON.stringify(user) === JSON.stringify(correct);
        } else {
          isCorrect = userAnswer === q.correct;
        }
      } else if (q.type === 'match') {
        const correctAnswersStr = q.correctAnswers;
        let userAnswersStr = '';
        const leftItems = q.leftItems || [];
        
        if (Array.isArray(userAnswer) && userAnswer.length === leftItems.length) {
          userAnswersStr = userAnswer.join('');
        } else if (typeof userAnswer === 'object' && userAnswer !== null) {
          const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
          const result = [];
          for (let i = 0; i < leftItems.length; i++) {
            result.push(userAnswer[letters[i]] || '');
          }
          userAnswersStr = result.join('');
        }
        isCorrect = userAnswersStr === correctAnswersStr;
      } else if (q.type === 'short') {
        isCorrect = userAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
      }

      items.push({
        questionId: q.id,
        questionNum: idx + 1,
        part: 1,
        isCorrect,
        userAnswer,
        type: q.type,
        questionText,
        questionOptions
      });
    } else {
      let maxScore = 1;
      const egeNum = q.ege_num;
      if ([1,3,9,12].includes(egeNum)) maxScore = 1;
      else if ([2,4,5,6,7,8,10,11,13,14,15,16,17,18].includes(egeNum)) maxScore = 2;
      else if ([19,20,21,23].includes(egeNum)) maxScore = 3;
      else if ([22,24].includes(egeNum)) maxScore = 4;
      else if (egeNum === 25) maxScore = 6;
      else {
        if (q.type === 'essay') maxScore = 6;
        else if (q.type === 'plan') maxScore = 3;
        else if (q.type === 'task') maxScore = 2;
        else if (q.type === 'law_task') maxScore = 3;
        else if (q.type === 'text_analysis') maxScore = 2;
        else if (q.type === 'graph_analysis') maxScore = 2;
      }

      if (q.type === 'text_analysis' && q.subQuestions) {
        items.push({
          questionId: q.id,
          part: 2,
          ege_num: 17,
          type: 'text_analysis',
          questionText: q.content || '',
          subQuestions: q.subQuestions || {},
          subMaxScores: q.subMaxScores || { 17: 2, 18: 2, 19: 3, 20: 3 },
          userAnswer: userAnswer || {},
          maxScore: 2 + 2 + 3 + 3
        });
      } else {
        items.push({
          questionId: q.id,
          part: 2,
          ege_num: egeNum,
          questionText: questionText,
          userAnswer: userAnswer,
          maxScore: maxScore,
          type: q.type
        });
      }
    }
  });

  gradeItems.value = items;
  part1Overrides.value = {};
  part2Scores.value = {};
  part2Feedback.value = {};
  generalFeedback.value = '';
  showText.value = {};
  showQuestionText.value = {};

  items.forEach(item => {
    if (item.part === 2) {
      if (item.type === 'text_analysis') {
        for (let i = 17; i <= 20; i++) {
          part2Scores.value[`${item.questionId}_${i}`] = 0;
          part2Feedback.value[`${item.questionId}_${i}`] = '';
        }
      } else {
        part2Scores.value[item.questionId] = 0;
        part2Feedback.value[item.questionId] = '';
      }
    }
  });

  showGradeModal.value = true;
};

const closeGradeModal = () => {
  showGradeModal.value = false;
  currentSubmission.value = null;
  gradeItems.value = [];
  showText.value = {};
  showQuestionText.value = {};
  generalFeedback.value = '';
};

const toggleText = (questionId) => {
  showText.value = { ...showText.value, [questionId]: !showText.value[questionId] };
};

const toggleQuestionText = (questionId) => {
  showQuestionText.value = { ...showQuestionText.value, [questionId]: !showQuestionText.value[questionId] };
};

const submitGrade = async () => {
  if (!currentSubmission.value) return;

  let finalTotalScore = 0;
  let finalMaxScore = 0;

  gradeItems.value.forEach(item => {
    if (item.part === 1) {
      finalMaxScore += 1;
      const override = part1Overrides.value[item.questionId];
      if (override !== undefined && override !== null) {
        finalTotalScore += override;
      } else {
        finalTotalScore += item.isCorrect ? 1 : 0;
      }
    } else if (item.part === 2) {
      if (item.type === 'text_analysis') {
        let subTotal = 0;
        let subMax = 0;
        for (let i = 17; i <= 20; i++) {
          subTotal += part2Scores.value[`${item.questionId}_${i}`] || 0;
          subMax += item.subMaxScores?.[i] || 2;
        }
        finalTotalScore += subTotal;
        finalMaxScore += subMax;
      } else {
        finalMaxScore += item.maxScore;
        finalTotalScore += part2Scores.value[item.questionId] || 0;
      }
    }
  });

  const percentage = Math.round((finalTotalScore / finalMaxScore) * 100);

  const textAnalysisScores = {};
  const textAnalysisFeedback = {};
  gradeItems.value.forEach(item => {
    if (item.type === 'text_analysis') {
      for (let i = 17; i <= 20; i++) {
        textAnalysisScores[i] = part2Scores.value[`${item.questionId}_${i}`] || 0;
        textAnalysisFeedback[i] = part2Feedback.value[`${item.questionId}_${i}`] || '';
      }
    }
  });

  const gradedData = {
    examId: currentSubmission.value.examId,
    studentId: currentSubmission.value.studentId,
    studentLogin: currentSubmission.value.studentLogin,
    className: currentSubmission.value.className,
    classId: currentSubmission.value.classId,
    examTitle: examsMap.value.get(currentSubmission.value.examId)?.title,
    originalSubmissionId: currentSubmission.value.id,
    answers: currentSubmission.value.answers,
    part1Overrides: part1Overrides.value,
    part2Scores: part2Scores.value,
    part2Feedback: part2Feedback.value,
    textAnalysisScores: textAnalysisScores,
    textAnalysisFeedback: textAnalysisFeedback,
    generalFeedback: generalFeedback.value,
    teacherGrade: percentage,
    teacherScore: finalTotalScore,
    maxScore: finalMaxScore,
    teacherId: teacherUid,
    gradedAt: new Date(),
    submittedAt: currentSubmission.value.submittedAt,
    autoGraded: currentSubmission.value.autoGraded
  };

  const updateData = {
    status: 'graded',
    gradedAt: new Date(),
    teacherGrade: percentage
  };

  try {
    await setDoc(doc(db, 'gradedSubmissions', `${currentSubmission.value.studentId}_${currentSubmission.value.examId}`), gradedData);
    await updateDoc(doc(db, 'submissions', currentSubmission.value.id), updateData);
    showToast('success', `Оценка ${percentage}% (${getGradeFromPercentage(percentage)}) сохранена`);
    closeGradeModal();
    await loadData();
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showToast('error', 'Не удалось сохранить оценку');
  }
};

const refreshData = () => loadData();

onMounted(() => {
  loadData();
});

onUnmounted(() => {});
</script>

<style scoped>
.check-view {
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--secondary);
}
.btn-refresh {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-refresh:disabled {
  opacity: 0.5;
}
.check-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-badge {
  background: white;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  display: inline-block;
  box-shadow: var(--shadow);
}
.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  margin-right: 0.5rem;
}
.stat-label {
  font-size: 0.9rem;
  color: var(--gray-500);
}
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--gray-200);
}
.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.filters-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-sm);
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}
.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
}
.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.submission-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}
.submission-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.student-avatar {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}
.student-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--secondary);
}
.student-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}
.submission-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-preview, .btn-grade {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-preview {
  background: var(--gray-200);
  color: var(--gray-700);
  border: none;
}
.btn-preview:hover {
  background: var(--gray-300);
}
.btn-grade {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-grade:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.date-badge {
  font-size: 0.7rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.graded-info {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}
.grade-badge {
  background: var(--success);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-weight: 500;
}
.feedback-preview {
  color: var(--gray-500);
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
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
}
.modal-large {
  max-width: 900px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--secondary);
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.3rem;
  color: var(--gray-500);
  display: flex;
  align-items: center;
}
.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}
.modal-body {
  margin-bottom: 1rem;
}
.student-info-modal, .preview-student-info {
  background: var(--gray-100);
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.student-info-modal strong, .preview-student-info strong {
  color: var(--primary);
}
.part1-section, .part2-section, .general-feedback-section, .final-grade-section {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}
.part1-section h3, .part2-section h3, .general-feedback-section h3, .final-grade-section h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--secondary);
}
.grade-item {
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--gray-200);
}
.grade-question {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.auto-result {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
}
.auto-result.correct {
  background: rgba(16,185,129,0.2);
  color: var(--success);
}
.auto-result.wrong {
  background: rgba(239,68,68,0.2);
  color: var(--danger);
}
.max-score {
  font-size: 0.7rem;
  color: var(--gray-500);
}
.toggle-text-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: 1px solid var(--gray-300);
  border-radius: 1rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  cursor: pointer;
}
.toggle-text-btn:hover {
  background: var(--gray-200);
}
.question-text-content {
  margin: 0.5rem 0;
}
.text-content {
  background: var(--gray-100);
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.4;
  white-space: pre-wrap;
}
.user-answer {
  margin: 0.5rem 0;
}
.user-answer pre {
  background: var(--gray-100);
  padding: 0.5rem;
  border-radius: 0.25rem;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
}
.grade-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.score-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.score-field label {
  font-weight: 500;
  min-width: 80px;
}
.score-preview {
  font-size: 0.75rem;
  color: var(--success);
}
.feedback-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.feedback-field textarea,
.general-feedback-section textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-family: inherit;
  resize: none;
}
.feedback-field textarea {
  height: 60px;
}
.general-feedback-section textarea {
  height: 80px;
}
.sub-question {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--gray-300);
}
.sub-question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.sub-q-num {
  width: 28px;
  height: 28px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}
.sub-q-text {
  font-weight: 500;
  color: var(--secondary);
}
.final-grade-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.score-summary {
  font-weight: 500;
  color: var(--secondary);
}
.percentage-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-weight: 500;
}
.grade-badge-final {
  background: var(--primary);
  color: white;
  padding: 0.2rem 0.8rem;
  border-radius: 1rem;
  font-weight: bold;
  font-size: 1.1rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover {
  background: var(--primary-dark);
}
.btn-secondary {
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
}
.btn-secondary:hover {
  background: var(--gray-200);
}
.custom-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
.custom-toast.success {
  border-left: 4px solid var(--success);
}
.custom-toast.error {
  border-left: 4px solid var(--danger);
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 0.5rem;
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Предпросмотр задания */
.preview-questions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.preview-question-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
}
.preview-question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
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
  font-weight: bold;
}
.q-type {
  font-size: 0.7rem;
  background: var(--gray-200);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  color: var(--gray-600);
}
.preview-question-text {
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--secondary);
}
.preview-options {
  margin: 0.5rem 0;
  padding-left: 1rem;
}
.preview-option {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}
.opt-num {
  color: var(--primary);
  font-weight: 500;
}
.preview-match {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  flex-wrap: wrap;
}
.preview-match-left, .preview-match-right {
  flex: 1;
  min-width: 200px;
}
.preview-match-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}
.preview-match-item {
  font-size: 0.8rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--gray-200);
}
.preview-answer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
}
.preview-answer pre {
  background: var(--gray-100);
  padding: 0.5rem;
  border-radius: 0.25rem;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  max-height: 150px;
  overflow-y: auto;
}
.preview-correct-answer {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(16,185,129,0.1);
  border-radius: 0.5rem;
}
.preview-correct-answer pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.85rem;
}

/* Тёмная тема */
body.dark-theme .stat-badge,
body.dark-theme .filters-row,
body.dark-theme .submission-card,
body.dark-theme .empty-state,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .student-info h3,
body.dark-theme .modal-header h2,
body.dark-theme .part1-section h3,
body.dark-theme .part2-section h3,
body.dark-theme .general-feedback-section h3,
body.dark-theme .final-grade-section h3 {
  color: #ffffff;
}
body.dark-theme .student-info p,
body.dark-theme .date-badge,
body.dark-theme .max-score {
  color: var(--gray-400);
}
body.dark-theme .grade-item {
  background: var(--gray-700);
}
body.dark-theme .text-content,
body.dark-theme .user-answer pre,
body.dark-theme .preview-question-card {
  background: var(--gray-800);
}
body.dark-theme .feedback-field textarea,
body.dark-theme .general-feedback-section textarea {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
body.dark-theme .preview-answer pre {
  background: var(--gray-700);
}
body.dark-theme .preview-correct-answer {
  background: rgba(16,185,129,0.2);
}
body.dark-theme .score-summary {
  color: var(--gray-300);
}
body.dark-theme .sub-q-text {
  color: var(--gray-300);
}
</style>