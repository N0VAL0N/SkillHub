<template>
  <TeacherLayout>
    <div class="check-view">
      <div class="page-header">
        <h1>На проверку</h1>
      </div>

      <div class="check-stats">
        <div class="stat-badge">
          <span class="stat-value">{{ assignments.length }}</span>
          <span class="stat-label">Ожидают проверки</span>
        </div>
        <div class="stat-badge">
          <span class="stat-value">{{ gradedToday }}</span>
          <span class="stat-label">Проверено сегодня</span>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label>Фильтр по ученику:</label>
          <CustomSelect
            v-model="selectedStudent"
            :options="studentFilterOptions"
            placeholder="Все ученики"
          />
        </div>
        <div class="filter-item">
          <label>Фильтр по классу:</label>
          <CustomSelect
            v-model="selectedClass"
            :options="classFilterOptions"
            placeholder="Все классы"
          />
        </div>
        <div class="filter-item sort-order">
          <label>Сортировка:</label>
          <button @click="toggleSortOrder" class="sort-order-btn">
            {{ sortOrder === 'asc' ? '↑ Старые сначала' : '↓ Новые сначала' }}
          </button>
        </div>
      </div>

      <div class="assignments-list" v-if="filteredAssignments.length > 0">
        <div v-for="assignment in filteredAssignments" :key="assignment.id" class="assignment-card">
          <div class="assignment-header">
            <div class="student-info">
              <div class="student-avatar">{{ getStudentDisplayName(assignment.studentId, assignment.studentLogin).charAt(0).toUpperCase() || '?' }}</div>
              <div>
                <h3>{{ getStudentDisplayName(assignment.studentId, assignment.studentLogin) }}</h3>
                <p>{{ assignment.className || 'Без класса' }} • {{ assignment.topicTitle || 'Без темы' }}</p>
              </div>
            </div>
            <span class="date-badge">{{ formatDate(assignment.createdAt) }}</span>
          </div>
          <div class="assignment-content">
            <p class="question">{{ assignment.question || 'Вопрос не указан' }}</p>
            <div class="answer-box">
              <strong>Ответ ученика:</strong>
              <p>{{ assignment.answer || 'Нет ответа' }}</p>
              <div v-if="assignment.timeSpentSeconds" class="time-spent-info">
                ⏱️ Время выполнения: {{ formatTime(assignment.timeSpentSeconds) }}
              </div>
            </div>
          </div>
          <div class="assignment-actions">
            <button @click="openGradeModal(assignment)" class="btn-grade">Оценить</button>
            <button @click="rejectAssignment(assignment)" class="btn-reject">Отклонить</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>Нет заданий на проверку</h3>
        <p>Когда ученики отправят эссе или развёрнутые ответы, они появятся здесь</p>
      </div>

      <!-- Модалка оценки -->
      <div v-if="showGradeModal" class="modal" @click.self="closeGradeModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Оценка работы</h2>
            <button class="modal-close" @click="closeGradeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="student-info-modal">
              <strong>{{ getStudentDisplayName(currentAssignment?.studentId, currentAssignment?.studentLogin) }}</strong>
              <span class="class-name">{{ currentAssignment?.className }}</span>
            </div>

            <!-- Часть 1: автопроверка -->
            <div class="part1-summary" v-if="gradeItems.filter(i => i.part === 1).length > 0">
              <h3>Часть 1 (автоматическая проверка)</h3>
              <div v-for="item in gradeItems.filter(i => i.part === 1)" :key="item.questionId" class="part1-item">
                <span class="part1-status" :class="{ correct: item.isCorrect, wrong: !item.isCorrect }">
                  {{ item.isCorrect ? '✅' : '❌' }}
                </span>
                <span>Задание {{ item.questionId }}</span>
              </div>
            </div>

            <!-- Часть 2: проверка учителем -->
            <div class="part2-list" v-if="gradeItems.filter(i => i.part === 2).length > 0">
              <h3>Часть 2 (проверка учителем)</h3>
              <div v-for="item in gradeItems.filter(i => i.part === 2)" :key="item.questionId" class="grade-item">
                <div class="grade-question">
                  <strong>Задание {{ item.ege_num || '?' }}</strong>
                  <span class="max-score">(макс. {{ item.maxScore }} баллов)</span>
                  <button 
                    v-if="item.textContent" 
                    class="toggle-text-btn" 
                    @click="toggleText(item.questionId)"
                  >
                    {{ showText[item.questionId] ? '📄 Скрыть текст' : '📄 Показать текст' }}
                  </button>
                </div>
                <div v-if="showText[item.questionId]" class="question-text-content">
                  <div class="text-content" v-html="item.textContent"></div>
                </div>
                <div class="grade-answer">
                  <strong>Ответ ученика:</strong>
                  <div class="answer-box">{{ formatAnswerItem(item) }}</div>
                </div>
                <div class="grade-controls">
                  <div class="score-field">
                    <label>Баллы:</label>
                    <CustomSelect
                      v-model="part2Scores[item.questionId]"
                      :options="scoreOptions(item.maxScore)"
                      placeholder="Выберите баллы"
                    />
                  </div>
                  <div class="feedback-field">
                    <label>Комментарий:</label>
                    <textarea 
                      v-model="part2Feedback[item.questionId]" 
                      rows="2" 
                      placeholder="Напишите замечания или пояснения..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="submitGrade" class="btn-primary">Сохранить оценку</button>
            <button @click="closeGradeModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Тост -->
      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.type === 'success' ? 'Успешно' : 'Ошибка' }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="toast.visible = false">✖</button>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@core/services/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import TeacherLayout from '@core/layouts/TeacherLayout.vue';
import CustomSelect from '@shared/components/CustomSelect.vue';
import { useLocalStudentName } from '@core/composables/useLocalStudentName';
import { formatRelativeTime } from '@core/utils/dateHelpers';

const assignments = ref([]);
const gradedToday = ref(0);
const selectedStudent = ref('all');
const selectedClass = ref('all');
const sortOrder = ref('desc');
const showGradeModal = ref(false);
const currentAssignment = ref(null);
const exam = ref(null);
const gradeItems = ref([]);
const part2Scores = ref({});
const part2Feedback = ref({});
const showText = ref({});
const toast = ref({ visible: false, type: 'success', message: '' });
const teacherUid = auth.currentUser?.uid;

let unsubscribe = null;

const { getStudentName, getAllNames } = useLocalStudentName();

const scoreOptions = (maxScore) => {
  const options = [];
  for (let i = 0; i <= maxScore; i++) {
    options.push({ value: i, label: i.toString() });
  }
  return options;
};

const getStudentDisplayName = (studentId, fallbackLogin) => {
  if (teacherUid) {
    const localName = getStudentName(teacherUid, studentId);
    if (localName) return localName;
  }
  return fallbackLogin || 'Неизвестно';
};

const formatTime = (seconds) => {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Неизвестно';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'Вчера';
  return `${days} дн назад`;
};

const formatAnswerItem = (item) => {
  const answer = item.userAnswer;
  if (!answer) return 'Нет ответа';
  if (typeof answer === 'object') {
    if (answer.text) return answer.text;
    if (answer.fileUrl) return `[Прикреплён файл] ${answer.fileUrl}`;
    return JSON.stringify(answer);
  }
  return String(answer);
};

const studentFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все ученики' }];
  const studentsSet = new Set();
  assignments.value.forEach(a => {
    const displayName = getStudentDisplayName(a.studentId, a.studentLogin);
    studentsSet.add(displayName);
  });
  Array.from(studentsSet).sort().forEach(s => {
    options.push({ value: s, label: s });
  });
  return options;
});

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }];
  const classesSet = new Set();
  assignments.value.forEach(a => {
    if (a.className) classesSet.add(a.className);
  });
  Array.from(classesSet).sort().forEach(c => {
    options.push({ value: c, label: c });
  });
  return options;
});

const filteredAssignments = computed(() => {
  let result = [...assignments.value];

  if (selectedStudent.value !== 'all') {
    result = result.filter(a => {
      const displayName = getStudentDisplayName(a.studentId, a.studentLogin);
      return displayName === selectedStudent.value;
    });
  }

  if (selectedClass.value !== 'all') {
    result = result.filter(a => a.className === selectedClass.value);
  }

  result.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return result;
});

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const loadExamForAssignment = async (assignment) => {
  try {
    const examDoc = await getDoc(doc(db, 'exams', assignment.examId));
    if (examDoc.exists()) {
      exam.value = examDoc.data();
      const items = [];
      exam.value.questions.forEach((q) => {
        if (q.type === 'choice' || q.type === 'match' || q.type === 'short') {
          items.push({
            questionId: q.id,
            type: q.type,
            part: 1,
            isCorrect: assignment.autoGraded?.[q.id] || false
          });
        } else {
          const answer = assignment.answers?.[q.id];
          let maxScore = 1;
          if (q.ege_num) {
            if ([17, 18, 19, 20].includes(q.ege_num)) maxScore = 2;
            else if (q.ege_num === 21) maxScore = 2;
            else if (q.ege_num === 22) maxScore = 2;
            else if (q.ege_num === 23) maxScore = 3;
            else if (q.ege_num === 24) maxScore = 3;
            else if (q.ege_num === 25) maxScore = 6;
          } else {
            if (q.type === 'essay') maxScore = 6;
            else if (q.type === 'plan') maxScore = 3;
            else if (q.type === 'task') maxScore = 2;
            else if (q.type === 'law_task') maxScore = 3;
            else if (q.type === 'text_analysis') maxScore = 2;
            else if (q.type === 'graph_analysis') maxScore = 2;
          }
          items.push({
            questionId: q.id,
            type: q.type,
            part: 2,
            questionText: q.text || q.prompt || q.title,
            userAnswer: answer,
            maxScore,
            ege_num: q.ege_num,
            textContent: q.content || q.text || null
          });
        }
      });
      gradeItems.value = items;
      part2Scores.value = {};
      part2Feedback.value = {};
      items.forEach(item => {
        if (item.part === 2) {
          part2Scores.value[item.questionId] = 0;
          part2Feedback.value[item.questionId] = '';
        }
      });
    }
  } catch (error) {
    console.error('Ошибка загрузки экзамена:', error);
    toast.value = { visible: true, type: 'error', message: 'Не удалось загрузить задание' };
    setTimeout(() => toast.value.visible = false, 3000);
  }
};

const openGradeModal = async (assignment) => {
  currentAssignment.value = assignment;
  await loadExamForAssignment(assignment);
  showGradeModal.value = true;
};

const closeGradeModal = () => {
  showGradeModal.value = false;
  currentAssignment.value = null;
  exam.value = null;
  gradeItems.value = [];
  showText.value = {};
};

const toggleText = (questionId) => {
  showText.value = { ...showText.value, [questionId]: !showText.value[questionId] };
};

const submitGrade = async () => {
  if (!currentAssignment.value) return;

  let totalScore = 0;
  gradeItems.value.forEach(item => {
    if (item.part === 1 && item.isCorrect) {
      totalScore += 1;
    } else if (item.part === 2) {
      totalScore += part2Scores.value[item.questionId] || 0;
    }
  });

  const maxPossibleScore = gradeItems.value.reduce((sum, item) => {
    if (item.part === 1) return sum + 1;
    return sum + (item.maxScore || 1);
  }, 0);

  const percentage = Math.round((totalScore / maxPossibleScore) * 100);

  try {
    const updateData = {
      status: 'graded',
      teacherGrade: percentage,
      gradedAt: new Date(),
      part2Scores: part2Scores.value,
      part2Feedback: part2Feedback.value
    };

    await updateDoc(doc(db, 'submissions', currentAssignment.value.id), updateData);
    gradedToday.value++;
    closeGradeModal();
    toast.value = { visible: true, type: 'success', message: `Оценка ${percentage}% сохранена` };
    setTimeout(() => toast.value.visible = false, 3000);
  } catch (error) {
    console.error('Ошибка оценивания:', error);
    toast.value = { visible: true, type: 'error', message: 'Ошибка при сохранении оценки' };
    setTimeout(() => toast.value.visible = false, 3000);
  }
};

const rejectAssignment = async (assignment) => {
  if (confirm(`Отклонить задание от ${getStudentDisplayName(assignment.studentId, assignment.studentLogin)}?`)) {
    try {
      await updateDoc(doc(db, 'submissions', assignment.id), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      toast.value = { visible: true, type: 'success', message: 'Задание отклонено' };
      setTimeout(() => toast.value.visible = false, 3000);
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      toast.value = { visible: true, type: 'error', message: 'Ошибка при отклонении задания' };
      setTimeout(() => toast.value.visible = false, 3000);
    }
  }
};

onMounted(() => {
  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('status', '==', 'pending'));

  unsubscribe = onSnapshot(q, (snapshot) => {
    assignments.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, (error) => {
    console.error('Ошибка загрузки заданий:', error);
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.check-view {
  max-width: 1200px;
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

.check-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-badge {
  background: white;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  text-align: center;
  min-width: 150px;
  box-shadow: var(--shadow);
}
.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  display: block;
}
.stat-label {
  font-size: 0.85rem;
  color: var(--gray-500);
}

.filters-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-sm);
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
}
.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sort-order-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-700);
  transition: all 0.2s;
}
.sort-order-btn:hover {
  background: var(--gray-200);
  border-color: var(--primary);
  color: var(--primary);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.assignment-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.assignment-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--primary-light);
}
.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.student-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.student-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}
.student-info h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--secondary);
}
.student-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}
.date-badge {
  font-size: 0.7rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.assignment-content {
  margin-bottom: 1rem;
}
.question {
  font-weight: 500;
  margin: 0 0 0.5rem;
  color: var(--secondary);
}
.answer-box {
  background: var(--gray-50);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 0.5rem;
}
.answer-box strong {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.answer-box p {
  margin: 0.25rem 0 0;
  color: var(--gray-700);
}
.time-spent-info {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}
.assignment-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
.btn-grade,
.btn-reject {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-grade {
  background: var(--primary);
  color: white;
}
.btn-grade:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-reject {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}
.btn-reject:hover {
  background: rgba(239, 68, 68, 0.1);
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
  max-width: 800px;
  max-height: 80vh;
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
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--gray-500);
}
.modal-body {
  margin-bottom: 1rem;
}
.student-info-modal {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--gray-100);
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.student-info-modal strong {
  color: var(--primary);
}
.class-name {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.part1-summary {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}
.part1-summary h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--secondary);
}
.part1-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}
.part1-status.correct {
  color: var(--success);
}
.part1-status.wrong {
  color: var(--danger);
}
.part2-list {
  margin: 1rem 0;
}
.part2-list h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--secondary);
}
.grade-item {
  background: var(--gray-50);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.grade-question {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.max-score {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.toggle-text-btn {
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
  margin-bottom: 0.5rem;
}
.text-content {
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.4;
  white-space: pre-wrap;
}
.grade-answer {
  margin-bottom: 0.5rem;
}
.grade-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.score-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.score-field label {
  font-weight: 500;
  min-width: 50px;
}
.score-field .custom-select {
  width: 100px;
}
.feedback-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.feedback-field label {
  font-weight: 500;
}
.feedback-field textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-family: inherit;
  resize: none;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
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
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
}
.btn-secondary:hover {
  background: var(--gray-200);
}

.custom-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 380px;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
.custom-toast.success {
  border-left: 4px solid var(--success);
}
.custom-toast.success .toast-icon {
  color: var(--success);
}
.custom-toast.error {
  border-left: 4px solid var(--danger);
}
.custom-toast.error .toast-icon {
  color: var(--danger);
}
.toast-icon {
  flex-shrink: 0;
  padding-top: 2px;
}
.toast-content {
  flex: 1;
}
.toast-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
.toast-message {
  font-size: 0.8125rem;
  color: var(--gray-600);
  line-height: 1.4;
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--gray-400);
  transition: color 0.2s;
}
.toast-close:hover {
  color: var(--gray-600);
}
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Тёмная тема */
body.dark-theme .stat-badge,
body.dark-theme .filters-row,
body.dark-theme .assignment-card,
body.dark-theme .empty-state,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .student-info h3,
body.dark-theme .question,
body.dark-theme .modal-header h2,
body.dark-theme .part1-summary h3,
body.dark-theme .part2-list h3 {
  color: #ffffff;
}
body.dark-theme .student-info p,
body.dark-theme .answer-box p,
body.dark-theme .time-spent-info,
body.dark-theme .class-name {
  color: var(--gray-400);
}
body.dark-theme .answer-box {
  background: var(--gray-700);
}
body.dark-theme .student-info-modal {
  background: var(--gray-700);
}
body.dark-theme .grade-item {
  background: var(--gray-700);
}
body.dark-theme .text-content {
  background: var(--gray-800);
}
body.dark-theme .feedback-field textarea {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
body.dark-theme .toast-message {
  color: var(--gray-400);
}
body.dark-theme .toggle-text-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .toggle-text-btn:hover {
  background: var(--gray-600);
}
</style>