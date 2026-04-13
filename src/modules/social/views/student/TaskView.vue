<template>
  <StudentLayout>
    <div class="task-view">
      <div v-if="isArchived" class="archived-warning-banner">
        ⚠️ Задание просрочено. Вы не можете его выполнить или отправить.
      </div>

      <div v-if="examTimerEnabled && !isArchived" class="timer-container">
        <CustomTimer
          ref="timerRef"
          :initialSeconds="examTimerSeconds"
          label="До окончания экзамена:"
          :storageKey="`exam_timer_${taskId}_${currentUser?.uid}`"
          @expired="onTimerExpired"
          @tick="onTimerTick"
        />
        <div class="timer-note">При выходе или обновлении страницы время продолжит идти</div>
      </div>

      <div v-if="timerExpired" class="timer-expired-banner">
        ⏰ Время экзамена истекло! Задание будет отправлено автоматически.
      </div>

      <div class="task-header">
        <button @click="goBack" class="btn-back">← Назад</button>
        <h1>{{ task?.title || 'Загрузка...' }}</h1>
        <div class="task-progress">
          {{ answeredCount }} / {{ totalQuestions }} отвечено
        </div>
      </div>

      <div class="task-content" v-if="task">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="pagination-controls" v-if="totalQuestions > 10">
          <button @click="currentPage--" :disabled="currentPage === 1" class="page-nav-btn">← Предыдущие</button>
          <span class="page-info">Страница {{ currentPage }} из {{ totalPages }}</span>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-nav-btn">Следующие →</button>
        </div>

        <div class="question-nav">
          <button 
            v-for="(q, idx) in paginatedQuestions" 
            :key="getQuestionId(q, idx)"
            class="nav-btn"
            :class="{ 
              active: currentIndex === getGlobalIndex(idx),
              answered: isQuestionAnswered(q),
              hasFile: hasFileAttached(getQuestionId(q, idx))
            }"
            @click="currentIndex = getGlobalIndex(idx)"
          >
            {{ getGlobalIndex(idx) + 1 }}
            <span v-if="hasFileAttached(getQuestionId(q, idx))" class="file-indicator">📎</span>
          </button>
        </div>

        <div class="question-container" v-if="currentQuestion">
          <QuestionRenderer
            :key="getQuestionId(currentQuestion, currentIndex)"
            :question="currentQuestion"
            :modelValue="getAnswerForQuestion(currentQuestion)"
            @update:modelValue="(val) => updateAnswer(currentQuestion, val)"
            :allowAttachments="isPart2(currentQuestion)"
            @fileAttached="handleFileAttached"
          />
        </div>

        <div class="navigation-buttons">
          <button v-if="currentIndex > 0" @click="currentIndex--" class="btn-secondary">← Назад</button>
          <button v-if="currentIndex < totalQuestions - 1" @click="currentIndex++" class="btn-secondary">Далее →</button>
          <button 
            v-if="currentIndex === totalQuestions - 1" 
            @click="submitTask" 
            class="btn-primary" 
            :disabled="submitting || isArchived || timerExpired"
          >
            {{ submitting ? 'Отправка...' : (timerExpired ? 'Отправка автоматическая...' : 'Отправить на проверку') }}
          </button>
        </div>

        <div v-if="uploading" class="upload-progress-container">
          <div class="wave-progress">
            <div class="wave"></div>
            <span class="upload-percent">{{ uploadProgress }}%</span>
          </div>
          <p class="upload-text">Загрузка изображений...</p>
        </div>
      </div>

      <div v-else-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Загрузка задания...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3>{{ error }}</h3>
        <button @click="goBack" class="btn-primary">Вернуться к списку</button>
      </div>

      <!-- Модалки -->
      <div v-if="showConfirmModal" class="modal" @click.self="closeConfirmModal">
        <div class="modal-content confirm-modal">
          <div class="modal-icon">📤</div>
          <h2>Подтверждение отправки</h2>
          <p>Вы уверены, что хотите отправить задание на проверку?</p>
          <p class="warning">После отправки изменить ответы будет невозможно.</p>
          <div class="modal-actions">
            <button @click="confirmSubmit" class="btn-primary">Отправить</button>
            <button @click="closeConfirmModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <div v-if="showLeaveModal" class="modal" @click.self="closeLeaveModal">
        <div class="modal-content confirm-modal">
          <div class="modal-icon">⚠️</div>
          <h2>Выход из задания</h2>
          <p>Вы действительно хотите выйти?</p>
          <p class="warning">Ваш прогресс будет сохранён. Вы сможете продолжить позже.</p>
          <div class="modal-actions">
            <button @click="confirmLeave" class="btn-primary">Выйти</button>
            <button @click="closeLeaveModal" class="btn-secondary">Остаться</button>
          </div>
        </div>
      </div>

      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toast.visible = false">×</button>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { db, auth } from '@core/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import QuestionRenderer from '@/modules/social/components/QuestionRenderer.vue';
import CustomTimer from '@shared/components/CustomTimer.vue';
import { getCachedData, setCachedData } from '@core/services/storage';

const router = useRouter();
const route = useRoute();
const taskId = route.params.id;
const currentUser = auth.currentUser;

const task = ref(null);
const answersStore = ref({});
const pendingFiles = ref(new Map());
const uploadedFileUrls = ref({});
const currentIndex = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;
const submitting = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const showConfirmModal = ref(false);
const showLeaveModal = ref(false);
let pendingLeaveCallback = null;
const isArchived = ref(false);
const examTimerEnabled = ref(false);
const examTimerSeconds = ref(0);
const timerExpired = ref(false);
const timerRef = ref(null);
const loading = ref(true);
const error = ref(null);
const toast = ref({ visible: false, type: 'success', message: '' });

// Функция для получения ID вопроса
const getQuestionId = (question, fallbackIndex = null) => {
  if (!question) return null;
  if (question.id) return question.id;
  if (question._id) return question._id;
  
  const egeNum = question.ege_num || question.egeNum || 'unknown';
  const type = question.type || 'unknown';
  const generatedId = `${type}_${egeNum}_${fallbackIndex !== null ? fallbackIndex : Date.now()}`;
  
  if (fallbackIndex !== null) {
    question.id = generatedId;
  }
  
  return generatedId;
};

const log = (action, questionId, data) => {
  console.log(`[TaskView] ${action}`, {
    questionId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

const showToast = (type, message) => {
  toast.value = { visible: true, type, message };
  setTimeout(() => toast.value.visible = false, 3000);
};

const currentQuestion = computed(() => task.value?.questions?.[currentIndex.value]);
const totalQuestions = computed(() => task.value?.questions?.length || 0);
const totalPages = computed(() => Math.ceil(totalQuestions.value / itemsPerPage));

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return task.value?.questions?.slice(start, end) || [];
});

const getGlobalIndex = (localIndex) => {
  return (currentPage.value - 1) * itemsPerPage + localIndex;
};

const getAnswerForQuestion = (question) => {
  if (!question) return null;
  const qId = getQuestionId(question);
  return answersStore.value[qId];
};

const updateAnswer = (question, value) => {
  if (!question) return;
  
  const qId = getQuestionId(question);
  
  const isEmpty = value === undefined || value === null || 
    (typeof value === 'string' && value.trim() === '') || 
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0);
  
  if (isEmpty) {
    delete answersStore.value[qId];
  } else {
    answersStore.value[qId] = value;
  }
  
  saveToLocalStorage();
};

const isQuestionAnswered = (question) => {
  if (!question) return false;
  
  const qId = getQuestionId(question);
  const answer = answersStore.value[qId];
  
  if (answer === undefined || answer === null) return false;
  
  // Для задания 22 (task)
  if (question.type === 'task') {
    if (typeof answer === 'object' && answer !== null) {
      return Object.values(answer).some(val => 
        val !== undefined && val !== null && val !== '' && 
        (typeof val !== 'string' || val.trim().length > 0)
      );
    }
    return false;
  }
  
  // Для заданий 23, 24, 25 (law_task, plan, essay)
  if (question.type === 'law_task' || question.type === 'plan' || question.type === 'essay') {
    if (typeof answer === 'string') {
      return answer.trim().length > 0;
    }
    if (typeof answer === 'object' && answer !== null) {
      const hasText = answer.text && answer.text.trim().length > 0;
      const hasFile = answer.fileUrl || answer.file;
      return hasText || hasFile;
    }
    return false;
  }
  
  // Для text_analysis (17-20)
  if (question.type === 'text_analysis') {
    if (typeof answer === 'string') {
      return answer.trim().length > 0;
    }
    if (typeof answer === 'object' && answer !== null) {
      if (answer.text && typeof answer.text === 'string') {
        return answer.text.trim().length > 0;
      }
    }
    return false;
  }
  
  if (Array.isArray(answer)) return answer.length > 0;
  
  if (typeof answer === 'object') {
    if (answer.text?.length > 0) return true;
    if (Object.keys(answer).length > 0 && !answer.text) return true;
  }
  
  if (typeof answer === 'string') return answer.trim().length > 0;
  
  if (typeof answer === 'number') return true;
  
  return false;
};

const answeredCount = computed(() => {
  let count = 0;
  for (const question of (task.value?.questions || [])) {
    if (isQuestionAnswered(question)) count++;
  }
  return count;
});

const progressPercent = computed(() => {
  if (totalQuestions.value === 0) return 0;
  return (answeredCount.value / totalQuestions.value) * 100;
});

const isPart2 = (question) => question && !['choice', 'match', 'short'].includes(question?.type);

const hasFileAttached = (questionId) => {
  const answer = answersStore.value[questionId];
  if (!answer) return false;
  if (typeof answer === 'object') {
    if (answer.fileUrl) return true;
    if (answer.file) return true;
  }
  return !!uploadedFileUrls.value[questionId] || pendingFiles.value.has(questionId);
};

const handleFileAttached = ({ file, questionId }) => {
  if (file) {
    pendingFiles.value.set(questionId, file);
    const currentAnswer = answersStore.value[questionId];
    if (typeof currentAnswer !== 'object' || currentAnswer === null) {
      answersStore.value[questionId] = { text: currentAnswer || '', file };
    } else {
      currentAnswer.file = file;
      answersStore.value[questionId] = currentAnswer;
    }
  } else {
    pendingFiles.value.delete(questionId);
    delete uploadedFileUrls.value[questionId];
    const currentAnswer = answersStore.value[questionId];
    if (currentAnswer && typeof currentAnswer === 'object') {
      const { text } = currentAnswer;
      delete currentAnswer.file;
      delete currentAnswer.fileUrl;
      if (text && Object.keys(currentAnswer).length === 1) {
        answersStore.value[questionId] = text;
      } else if (!text && Object.keys(currentAnswer).length === 0) {
        delete answersStore.value[questionId];
      }
    }
  }
  saveToLocalStorage();
};

const normalizeAnswer = (question, answer) => {
  if (answer === undefined || answer === null) return null;
  
  if (question.type === 'choice') {
    if (question.isMultiple) {
      if (Array.isArray(answer)) return answer;
      if (typeof answer === 'number') return [answer];
      return [];
    } else {
      if (typeof answer === 'number') return answer;
      return null;
    }
  }
  
  if (question.type === 'match') {
    if (typeof answer === 'object' && answer !== null) return answer;
    if (typeof answer === 'string') {
      try {
        const parsed = JSON.parse(answer);
        if (typeof parsed === 'object') return parsed;
      } catch(e) {}
    }
    if (Array.isArray(answer)) {
      const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
      const obj = {};
      for (let i = 0; i < Math.min(answer.length, question.leftItems?.length || 5); i++) {
        if (answer[i] && answer[i] !== '') obj[letters[i]] = answer[i].toString();
      }
      return obj;
    }
    return {};
  }
  
  if (question.type === 'short') return String(answer || '');
  if (question.type === 'task') {
    if (typeof answer === 'object' && answer !== null) return answer;
    return {};
  }
  if (question.type === 'law_task' || question.type === 'plan') {
    return String(answer || '');
  }
  if (question.type === 'essay') {
    if (typeof answer === 'object' && answer !== null) return answer;
    return String(answer || '');
  }
  if (question.type === 'graph_analysis') {
    if (typeof answer === 'object' && answer !== null) return answer;
    return {};
  }
  if (question.type === 'text_analysis') {
    return String(answer || '');
  }
  
  return answer;
};

const loadTaskFromLocal = () => {
  loading.value = true;
  error.value = null;
  
  const savedExam = localStorage.getItem(`exam_data_${taskId}`);
  
  if (savedExam) {
    try {
      const parsed = JSON.parse(savedExam);
      initTask(parsed);
      loading.value = false;
      return;
    } catch(e) {
      log('loadTaskFromLocal error', null, { error: e });
    }
  }
  
  error.value = 'Данные задания не найдены. Вернитесь к списку заданий.';
  loading.value = false;
};

const initTask = (data) => {
  log('initTask START', null, { taskId, questionsCount: data.questions?.length });
  
  if (data.questions) {
    data.questions.forEach((q, idx) => {
      if (!q.id) {
        const egeNum = q.ege_num || q.egeNum || idx;
        const type = q.type || 'unknown';
        if (type === 'task') {
          q.id = `task_${egeNum}_${idx}`;
        } else if (type === 'law_task') {
          q.id = `lawtask_${egeNum}_${idx}`;
        } else if (type === 'plan') {
          q.id = `plan_${egeNum}_${idx}`;
        } else if (type === 'essay') {
          q.id = `essay_${egeNum}_${idx}`;
        } else if (type === 'text_analysis') {
          q.id = `text_${egeNum}_${idx}`;
        } else if (type === 'graph_analysis') {
          q.id = `graph_${egeNum}_${idx}`;
        } else {
          q.id = `${type}_${egeNum}_${idx}`;
        }
      }
    });
  }
  
  task.value = data;
  
  if (data.deadline) {
    const deadlineDate = new Date(data.deadline.replace(' ', 'T') + ':00');
    isArchived.value = deadlineDate < new Date();
  }
  
  examTimerEnabled.value = data.enableTimer === true;
  if (examTimerEnabled.value) {
    examTimerSeconds.value = (data.timerMinutes || 210) * 60;
    const savedTimer = localStorage.getItem(`exam_timer_${taskId}_${currentUser?.uid}`);
    if (savedTimer) {
      try {
        const { expiresAt, remaining } = JSON.parse(savedTimer);
        if (expiresAt <= Date.now() && remaining === 0) {
          timerExpired.value = true;
        }
      } catch(e) {}
    }
  }
  
  const savedAnswers = localStorage.getItem(`task_${taskId}`);
  if (savedAnswers) {
    try {
      const parsedAnswers = JSON.parse(savedAnswers);
      answersStore.value = {};
      for (const [qId, answer] of Object.entries(parsedAnswers)) {
        const question = data.questions?.find(q => getQuestionId(q) === qId);
        if (question) {
          const normalized = normalizeAnswer(question, answer);
          if (normalized !== null && normalized !== undefined) {
            answersStore.value[qId] = normalized;
          }
        }
      }
    } catch(e) {}
  }
  
  for (const [qId, answer] of Object.entries(answersStore.value)) {
    if (answer && typeof answer === 'object' && answer.fileUrl) {
      uploadedFileUrls.value[qId] = answer.fileUrl;
    }
  }
  
  setCachedData(`task_${taskId}_meta`, {
    task: task.value,
    isArchived: isArchived.value,
    timerEnabled: examTimerEnabled.value,
    timerSeconds: examTimerSeconds.value,
    timestamp: Date.now()
  });
  
  if (Object.keys(answersStore.value).length > 0) {
    localStorage.setItem(`task_started_${taskId}`, 'true');
  }
  
  log('initTask FINISH', null, { answersCount: Object.keys(answersStore.value).length });
};

const saveToLocalStorage = () => {
  try {
    localStorage.setItem(`task_${taskId}`, JSON.stringify(answersStore.value));
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
};

const uploadFiles = async () => {
  const storage = getStorage();
  uploading.value = true;
  const total = pendingFiles.value.size;
  let completed = 0;
  const fileUrls = { ...uploadedFileUrls.value };
  
  for (const [questionId, file] of pendingFiles.value.entries()) {
    const path = `submissions/${currentUser.uid}/${taskId}/${questionId}_${Date.now()}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    fileUrls[questionId] = url;
    completed++;
    uploadProgress.value = Math.round((completed / total) * 100);
  }
  uploading.value = false;
  return fileUrls;
};

const confirmSubmitWithTimer = async (elapsedSeconds = null) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    let userClassId = null;
    let userClassName = null;
    let userLogin = currentUser.email?.split('@')[0] || 'Ученик';
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userClassId = userData.classId || null;
        userClassName = userData.className || null;
        userLogin = userData.login || userLogin;
      }
    } catch (e) {
      console.warn('Не удалось получить данные пользователя:', e);
    }

    let fileUrls = {};
    if (pendingFiles.value.size > 0) fileUrls = await uploadFiles();
    
    const submissionRef = doc(db, 'submissions', `${currentUser.uid}_${taskId}`);
    const autoGradedAnswers = {};
    const part1Answers = {};
    const part2Answers = {};
    
    if (task.value?.questions) {
      task.value.questions.forEach(q => {
        const qId = getQuestionId(q);
        let answer = answersStore.value[qId];
        const hasAnswer = answer !== undefined && answer !== null && 
                          (typeof answer !== 'object' || Object.keys(answer).length > 0 || answer.text);
        
        if (q.type === 'choice' || q.type === 'match' || q.type === 'short') {
          if (hasAnswer) {
            let isCorrect = false;
            if (q.type === 'choice') {
              if (q.isMultiple) {
                const userAnswer = Array.isArray(answer) ? [...answer].sort() : [];
                const correctAnswer = Array.isArray(q.correct) ? [...q.correct].sort() : [];
                isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
              } else isCorrect = answer === q.correct;
              autoGradedAnswers[qId] = isCorrect;
              part1Answers[qId] = answer;
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
              
              isCorrect = userAnswersStr === correctAnswersStr;
              autoGradedAnswers[qId] = isCorrect;
              part1Answers[qId] = userAnswersStr;
            } else if (q.type === 'short') {
              isCorrect = answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
              autoGradedAnswers[qId] = isCorrect;
              part1Answers[qId] = answer;
            }
          }
        } else {
          if (hasAnswer) {
            const fileUrl = fileUrls[qId] || uploadedFileUrls.value[qId];
            if (fileUrl) {
              if (typeof answer === 'object') answer.fileUrl = fileUrl;
              else answer = { text: answer || '', fileUrl };
            }
            part2Answers[qId] = answer;
          }
        }
      });
    }
    
    const submissionData = {
      examId: taskId,
      studentId: currentUser.uid,
      studentLogin: userLogin,
      studentEmail: currentUser.email,
      className: userClassName,
      classId: userClassId,
      answers: answersStore.value,
      part1Answers,
      part2Answers,
      autoGraded: autoGradedAnswers,
      status: 'pending',
      submittedAt: new Date(),
      updatedAt: new Date(),
      timeSpentSeconds: elapsedSeconds !== null ? elapsedSeconds : (timerRef.value?.getElapsed() || 0),
      timerEnabled: examTimerEnabled.value,
      submittedByTimer: timerExpired.value
    };

    await setDoc(submissionRef, submissionData);
    localStorage.removeItem(`task_${taskId}`);
    localStorage.removeItem(`task_started_${taskId}`);
    localStorage.removeItem(`exam_data_${taskId}`);
    localStorage.removeItem(`exam_timer_${taskId}_${currentUser.uid}`);
    showToast('success', timerExpired.value ? 'Задание отправлено автоматически' : 'Задание отправлено на проверку');
    router.push('/student/homework');
  } catch (error) {
    console.error('Ошибка отправки:', error);
    showToast('error', 'Не удалось отправить задание');
  } finally {
    submitting.value = false;
  }
};

const submitTask = () => {
  if (timerExpired.value) { confirmSubmitWithTimer(); return; }
  if (isArchived.value) { showToast('error', 'Задание просрочено'); return; }
  showConfirmModal.value = true;
};

const closeConfirmModal = () => { showConfirmModal.value = false; };
const confirmSubmit = () => { closeConfirmModal(); confirmSubmitWithTimer(); };

const onTimerExpired = () => {
  timerExpired.value = true;
  showToast('warning', 'Время вышло, задание отправляется');
  confirmSubmitWithTimer();
};
const onTimerTick = (remaining) => { if (remaining <= 0) timerExpired.value = true; };

const goBack = () => {
  if ((examTimerEnabled.value && !timerExpired.value && !submitting.value) || (!isArchived.value && !submitting.value)) {
    showLeaveModal.value = true;
    pendingLeaveCallback = () => {
      saveToLocalStorage();
      router.push('/student/homework');
    };
  } else {
    saveToLocalStorage();
    router.push('/student/homework');
  }
};

const closeLeaveModal = () => {
  showLeaveModal.value = false;
  pendingLeaveCallback = null;
};

const confirmLeave = () => {
  if (pendingLeaveCallback) pendingLeaveCallback();
  closeLeaveModal();
};

const beforeUnloadHandler = (e) => {
  if (examTimerEnabled.value && !timerExpired.value && !submitting.value && !isArchived.value) {
    e.preventDefault();
    e.returnValue = 'Ваш прогресс будет сохранён. Вы сможете продолжить позже.';
    return e.returnValue;
  }
};

onMounted(() => {
  document.body.classList.add('hide-student-layout');
  const savedIndex = localStorage.getItem(`task_index_${taskId}`);
  if (savedIndex) {
    currentIndex.value = parseInt(savedIndex);
    currentPage.value = Math.floor(currentIndex.value / itemsPerPage) + 1;
  }
  
  const cachedMeta = getCachedData(`task_${taskId}_meta`);
  if (cachedMeta && Date.now() - cachedMeta.timestamp < 12 * 60 * 60 * 1000) {
    const cachedTask = cachedMeta.task;
    
    if (cachedTask?.questions) {
      cachedTask.questions.forEach((q, idx) => {
        if (!q.id) {
          const egeNum = q.ege_num || q.egeNum || idx;
          const type = q.type || 'unknown';
          if (type === 'task') {
            q.id = `task_${egeNum}_${idx}`;
          } else if (type === 'law_task') {
            q.id = `lawtask_${egeNum}_${idx}`;
          } else if (type === 'plan') {
            q.id = `plan_${egeNum}_${idx}`;
          } else if (type === 'essay') {
            q.id = `essay_${egeNum}_${idx}`;
          } else if (type === 'text_analysis') {
            q.id = `text_${egeNum}_${idx}`;
          } else if (type === 'graph_analysis') {
            q.id = `graph_${egeNum}_${idx}`;
          } else {
            q.id = `${type}_${egeNum}_${idx}`;
          }
        }
      });
    }
    
    task.value = cachedTask;
    isArchived.value = cachedMeta.isArchived;
    examTimerEnabled.value = cachedMeta.timerEnabled;
    examTimerSeconds.value = cachedMeta.timerSeconds;
    const localAnswers = localStorage.getItem(`task_${taskId}`);
    if (localAnswers) { 
      try { 
        answersStore.value = JSON.parse(localAnswers);
      } catch(e) {} 
    }
    loading.value = false;
  } else {
    loadTaskFromLocal();
  }
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

onUnmounted(() => {
  document.body.classList.remove('hide-student-layout');
  localStorage.setItem(`task_index_${taskId}`, currentIndex.value);
  saveToLocalStorage();
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped>
.task-view {
  max-width: 900px;
  margin: 0 auto;
}

.archived-warning-banner,
.timer-expired-banner {
  background: rgba(239,68,68,0.1);
  border-left: 4px solid var(--danger);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  color: var(--danger);
  font-weight: 500;
  text-align: center;
}

.timer-container {
  background: var(--gray-100);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.timer-note {
  font-size: 0.7rem;
  color: var(--gray-500);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.btn-back {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem;
}
.task-header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.5rem;
  color: var(--secondary);
}
.task-progress {
  font-size: 0.85rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
}

.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}
.page-nav-btn {
  padding: 0.3rem 0.8rem;
  background: var(--gray-200);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.page-nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}
.page-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.85rem;
  color: var(--gray-600);
}

.question-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200);
}
.nav-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--gray-200);
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}
.nav-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.nav-btn.answered {
  background: rgba(16,185,129,0.2);
  border-color: var(--success);
  color: var(--success);
}
.nav-btn.hasFile {
  background: rgba(245,158,11,0.2);
  border-color: var(--warning);
}
.file-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-container {
  margin-bottom: 2rem;
  min-height: 300px;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
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
.btn-secondary {
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
}
.btn-secondary:hover {
  background: var(--gray-200);
}

.upload-progress-container {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}
.wave-progress {
  position: relative;
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}
.wave {
  position: absolute;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 50%, var(--primary) 100%);
  animation: waveMove 1.5s ease-in-out infinite;
  transform: translateX(-100%);
}
@keyframes waveMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.upload-percent {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
}
.upload-text {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--gray-500);
  text-align: center;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.error-state h3 {
  margin-bottom: 1rem;
  color: var(--danger);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.confirm-modal .modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.modal-content h2 {
  margin: 0 0 0.5rem;
  color: var(--secondary);
}
.modal-content p {
  margin-bottom: 0.5rem;
  color: var(--gray-600);
}
.warning {
  color: var(--danger);
  font-size: 0.85rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;
}
.modal-actions .btn-primary,
.modal-actions .btn-secondary {
  padding: 0.5rem 1.2rem;
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

body.dark-theme .question-nav .nav-btn {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .modal-content {
  background: var(--gray-800);
}
body.dark-theme .modal-content h2 {
  color: #ffffff;
}
body.dark-theme .modal-content p {
  color: var(--gray-400);
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
body.dark-theme .timer-container {
  background: var(--gray-700);
}
body.dark-theme .upload-progress-container {
  background: var(--gray-700);
}
body.dark-theme .loading-state,
body.dark-theme .error-state {
  color: var(--gray-300);
}
</style>