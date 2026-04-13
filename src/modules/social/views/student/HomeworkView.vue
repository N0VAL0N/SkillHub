<template>
  <StudentLayout>
    <div class="homework-view">
      <div class="page-header">
        <h1>Мои задания</h1>
        <p class="subtitle">Экзамены и домашние работы, назначенные вам</p>
      </div>

      <div class="tasks-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">Все ({{ allTasks.length }})</button>
        <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">Не начато ({{ pendingTasks.length }})</button>
        <button class="tab-btn" :class="{ active: activeTab === 'in_progress' }" @click="activeTab = 'in_progress'">В процессе ({{ inProgressTasks.length }})</button>
        <button class="tab-btn" :class="{ active: activeTab === 'submitted' }" @click="activeTab = 'submitted'">На проверке ({{ submittedTasks.length }})</button>
        <button class="tab-btn" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">Проверено ({{ completedTasks.length }})</button>
        <button class="tab-btn" :class="{ active: activeTab === 'archived' }" @click="activeTab = 'archived'">Просрочено ({{ archivedTasks.length }})</button>
      </div>

      <div v-if="filteredTasks.length > 0" class="tasks-list">
        <div v-for="task in filteredTasks" :key="task.id" class="task-card" :class="{ archived: task.status === 'archived' }">
          <div class="task-header">
            <div>
              <h3>{{ task.title }}</h3>
              <span class="task-type" :class="task.type">{{ task.type === 'exam' ? 'Экзамен' : 'Домашнее задание' }}</span>
              <span v-if="task.status === 'archived'" class="archived-badge">📦 Просрочено</span>
            </div>
            <span class="task-status" :class="task.status">
              {{ getStatusText(task.status) }}
            </span>
          </div>

          <div class="task-meta">
            <span>📋 {{ task.questions?.length || 0 }} вопросов</span>
            <span v-if="task.deadline" class="deadline" :class="{ expired: isExpired(task) }">
              ⏰ до {{ formatDateTime(task.deadline) }}
            </span>
            <span v-if="task.timerMinutes" class="timer-info">
              ⏱️ {{ task.timerMinutes }} минут на выполнение
            </span>
            <span v-if="task.status === 'completed' && task.grade" class="grade">
              🎓 Оценка: {{ task.grade }}/100
            </span>
          </div>

          <div class="task-actions">
            <button 
              v-if="task.status === 'pending'" 
              @click="continueTask(task)" 
              class="btn-primary"
              :disabled="isExpired(task)"
            >
              Начать
            </button>
            <button 
              v-if="task.status === 'in_progress'" 
              @click="continueTask(task)" 
              class="btn-primary"
              :disabled="isExpired(task)"
            >
              Продолжить
            </button>
            <button 
              v-if="task.status === 'submitted'" 
              class="btn-disabled"
              disabled
            >
              ⏳ Отправлено на проверку
            </button>
            <button 
              v-if="task.status === 'completed'" 
              @click="viewResults(task)" 
              class="btn-outline-primary"
            >
              Посмотреть результаты
            </button>
            <span v-if="isExpired(task) && task.status !== 'completed' && task.status !== 'submitted'" class="expired-warning">
              ⚠️ Срок сдачи истёк
            </span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Нет заданий</h3>
        <p>Здесь будут отображаться задания, назначенные вашим учителем</p>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '@core/services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { getCachedData, setCachedData } from '@core/services/storage';
import { formatDateTime } from '@core/utils/dateHelpers';

const router = useRouter();
const activeTab = ref('all');
const tasks = ref([]);
const currentUser = auth.currentUser;
let isMounted = true;

const isExpired = (task) => {
  if (!task.deadline) return false;
  const deadlineDate = new Date(task.deadline.replace(' ', 'T') + ':00');
  return deadlineDate < new Date();
};

const allTasks = computed(() => tasks.value);
const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending' && !isExpired(t)));
const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress' && !isExpired(t)));
const submittedTasks = computed(() => tasks.value.filter(t => t.status === 'submitted'));
const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed'));
const archivedTasks = computed(() => tasks.value.filter(t => isExpired(t) && t.status !== 'completed' && t.status !== 'submitted'));

const getStatusText = (status) => {
  const texts = { 
    pending: 'Не начато', 
    in_progress: 'В процессе', 
    submitted: 'На проверке', 
    completed: 'Проверено', 
    archived: 'Просрочено' 
  };
  return texts[status] || status;
};

const filteredTasks = computed(() => {
  if (activeTab.value === 'all') return allTasks.value;
  if (activeTab.value === 'pending') return pendingTasks.value;
  if (activeTab.value === 'in_progress') return inProgressTasks.value;
  if (activeTab.value === 'submitted') return submittedTasks.value;
  if (activeTab.value === 'completed') return completedTasks.value;
  if (activeTab.value === 'archived') return archivedTasks.value;
  return allTasks.value;
});

const loadTasks = async () => {
  if (!currentUser || !isMounted) return;

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists() || !isMounted) return;
    
    const userData = userDoc.data();
    const studentClass = userData.className;
    const studentId = currentUser.uid;

    // Загружаем ВСЕ экзамены, затем фильтруем на клиенте
    let examsSnap = { docs: [] };
    try {
      const examsRef = collection(db, 'exams');
      examsSnap = await getDocs(examsRef);
    } catch (error) {
      console.error('Ошибка загрузки экзаменов:', error);
      if (isMounted) {
        tasks.value = [];
      }
      return;
    }
    
    if (!isMounted) return;

    // Загружаем отправленные работы ученика
    let submissionsSnap;
    try {
      submissionsSnap = await getDocs(
        query(collection(db, 'submissions'), where('studentId', '==', studentId))
      );
    } catch (e) {
      console.warn('Не удалось загрузить отправленные работы:', e.message);
      submissionsSnap = { docs: [] };
    }
    
    if (!isMounted) return;

    const submissionsMap = new Map();
    submissionsSnap.docs.forEach(doc => {
      const data = doc.data();
      submissionsMap.set(data.examId, { id: doc.id, ...data });
    });

    const loadedTasks = [];
    
    for (const examDoc of examsSnap.docs) {
      const exam = examDoc.data();
      const examId = examDoc.id;
      
      // Пропускаем черновики
      if (!exam.published) continue;
      
      const submission = submissionsMap.get(examId);
      
      // Фильтруем на клиенте: только те, которые опубликованы для ученика
      let canSee = false;
      
      if (exam.publishedForType === 'all') {
        canSee = true;
      } else if (exam.publishedForType === 'class') {
        canSee = exam.publishedForClassName === studentClass;
      } else if (exam.publishedForType === 'student') {
        canSee = exam.publishedForStudentId === studentId;
      }
      
      if (!canSee) continue;
      
      const isLocallyStarted = localStorage.getItem(`task_started_${examId}`) === 'true';
      
      let status = 'pending';
      let grade = null;
      
      if (submission) {
        if (submission.status === 'graded') {
          status = 'completed';
          grade = submission.teacherGrade;
        } else if (submission.submittedAt) {
          status = 'submitted';
        } else {
          status = 'in_progress';
        }
      } else if (isLocallyStarted && !isExpired({ deadline: exam.deadline })) {
        status = 'in_progress';
      }
      
      if (isExpired({ deadline: exam.deadline }) && status !== 'completed' && status !== 'submitted') {
        status = 'archived';
      }
      
      loadedTasks.push({
        id: examId,
        title: exam.title,
        type: exam.type,
        deadline: exam.deadline,
        timerMinutes: exam.timerMinutes || null,
        questions: exam.questions,
        status,
        grade,
        submissionId: submission?.id,
        answers: submission?.answers
      });
    }
    
    if (isMounted) {
      tasks.value = loadedTasks;
      try {
        setCachedData(`student_tasks_${currentUser.uid}`, tasks.value);
      } catch (e) {}
    }
  } catch (error) {
    console.error('Ошибка загрузки заданий:', error);
    if (isMounted) {
      tasks.value = [];
    }
  }
};

const continueTask = (task) => {
  if (isExpired(task)) return;
  
  localStorage.setItem(`exam_data_${task.id}`, JSON.stringify(task));
  router.push(`/student/task/${task.id}`);
};

const viewResults = (task) => {
  router.push(`/student/results/${task.id}`);
};

onMounted(() => {
  isMounted = true;
  const cached = getCachedData(`student_tasks_${currentUser?.uid}`);
  if (cached) {
    tasks.value = cached;
  }
  loadTasks();
});

onUnmounted(() => {
  isMounted = false;
});
</script>

<style scoped>
.btn-disabled {
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  background: var(--gray-200);
  color: var(--gray-500);
  cursor: not-allowed;
  border: none;
  font-size: 0.85rem;
}

.homework-view {
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

.tasks-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  border-radius: 2rem;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.tab-btn.active {
  background: var(--primary);
  color: white;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.task-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}
.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.task-card.archived {
  opacity: 0.7;
  background: var(--gray-100);
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}
.task-header h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: var(--secondary);
}
.task-type {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.task-type.exam {
  background: #e67e22;
  color: white;
}
.task-type.homework {
  background: #10b981;
  color: white;
}
.archived-badge {
  background: var(--gray-500);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
}
.task-status {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.task-status.pending {
  background: var(--gray-200);
  color: var(--gray-600);
}
.task-status.in_progress {
  background: var(--warning);
  color: white;
}
.task-status.completed {
  background: var(--success);
  color: white;
}
.task-status.archived {
  background: var(--gray-500);
  color: white;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: 1rem;
}
.deadline {
  color: var(--warning);
}
.deadline.expired {
  color: var(--danger);
  font-weight: bold;
}
.timer-info {
  color: var(--info);
}
.grade {
  color: var(--success);
}

.task-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}
.btn-primary,
.btn-outline-primary {
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline-primary {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
}
.btn-outline-primary:hover {
  background: var(--primary-light);
}
.expired-warning {
  color: var(--danger);
  font-size: 0.8rem;
  font-weight: 500;
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

body.dark-theme .task-card,
body.dark-theme .empty-state {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .task-card.archived {
  background: var(--gray-700);
}
body.dark-theme .task-header h3 {
  color: #ffffff;
}
</style>