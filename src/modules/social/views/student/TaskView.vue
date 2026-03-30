<template>
  <StudentLayout>
    <div class="task-view">
      <div v-if="isArchived" class="archived-warning-banner">
        ⚠️ Задание просрочено. Вы не можете его выполнить или отправить.
      </div>

      <div v-if="examTimerEnabled" class="timer-container">
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
        <h1>{{ task?.title }}</h1>
        <div class="task-progress">
          {{ answeredCount }} / {{ totalQuestions }} отвечено
        </div>
      </div>

      <div class="task-content">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="question-nav">
          <button 
            v-for="(q, idx) in task?.questions" 
            :key="q.id"
            class="nav-btn"
            :class="{ 
              active: currentIndex === idx,
              answered: isAnswered(idx),
              hasFile: hasFileAttached(q.id)
            }"
            @click="currentIndex = idx"
          >
            {{ idx + 1 }}
            <span v-if="hasFileAttached(q.id)" class="file-indicator">📎</span>
          </button>
        </div>

        <div class="question-container" v-if="currentQuestion">
          <QuestionRenderer
            :question="currentQuestion"
            v-model="answers[currentQuestion.id]"
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

        <!-- Анимация загрузки файлов -->
        <div v-if="uploading" class="upload-progress-container">
          <div class="wave-progress">
            <div class="wave"></div>
            <span class="upload-percent">{{ uploadProgress }}%</span>
          </div>
          <p class="upload-text">Загрузка изображений...</p>
        </div>
      </div>

      <div v-if="showConfirmModal" class="modal" @click.self="closeConfirmModal">
        <div class="modal-content">
          <h2>Подтверждение отправки</h2>
          <p>Вы уверены, что хотите отправить задание на проверку?</p>
          <p class="warning">После отправки изменить ответы будет невозможно.</p>
          <div class="modal-actions">
            <button @click="confirmSubmit" class="btn-primary">Отправить</button>
            <button @click="closeConfirmModal" class="btn-secondary">Отмена</button>
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
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { db, auth } from '@core/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
const answers = ref({});
const pendingFiles = ref(new Map());
const uploadedFileUrls = ref({});
const currentIndex = ref(0);
const submitting = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const showConfirmModal = ref(false);
const isArchived = ref(false);
const examTimerEnabled = ref(false);
const examTimerSeconds = ref(0);
const timerExpired = ref(false);
const timerRef = ref(null);
const toast = ref({ visible: false, type: 'success', message: '' });

const showToast = (type, message) => {
  toast.value = { visible: true, type, message };
  setTimeout(() => toast.value.visible = false, 3000);
};

const currentQuestion = computed(() => task.value?.questions?.[currentIndex.value]);
const totalQuestions = computed(() => task.value?.questions?.length || 0);

const answeredCount = computed(() => {
  return Object.keys(answers.value).filter(key => {
    const val = answers.value[key];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') {
      if (val.text?.length > 0) return true;
      if (Object.keys(val).length > 0 && !val.text) return true;
    }
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'number') return true;
    return false;
  }).length;
});

const progressPercent = computed(() => (answeredCount.value / totalQuestions.value) * 100);

const isPart2 = (question) => question && !['choice', 'match', 'short'].includes(question?.type);

const hasFileAttached = (questionId) => !!uploadedFileUrls.value[questionId] || pendingFiles.value.has(questionId);

const handleFileAttached = ({ file, questionId }) => {
  if (file) {
    pendingFiles.value.set(questionId, file);
    if (typeof answers.value[questionId] !== 'object') {
      const text = answers.value[questionId];
      answers.value[questionId] = { text: text || '' };
    }
    answers.value[questionId].file = file;
  } else {
    pendingFiles.value.delete(questionId);
    delete uploadedFileUrls.value[questionId];
    if (answers.value[questionId] && typeof answers.value[questionId] === 'object') {
      const { text } = answers.value[questionId];
      delete answers.value[questionId].file;
      delete answers.value[questionId].fileUrl;
      if (text && Object.keys(answers.value[questionId]).length === 1) {
        answers.value[questionId] = text;
      } else if (!text && Object.keys(answers.value[questionId]).length === 0) {
        delete answers.value[questionId];
      }
    }
  }
  saveToLocalStorage();
};

const isAnswered = (idx) => {
  const q = task.value?.questions[idx];
  if (!q) return false;
  const answer = answers.value[q.id];
  if (answer === undefined || answer === null) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'object') {
    if (answer.text?.length > 0) return true;
    if (Object.keys(answer).length > 0 && !answer.text) return true;
  }
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (typeof answer === 'number') return true;
  return false;
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
    return {};
  }
  if (question.type === 'short') return String(answer || '');
  return answer;
};

const loadTask = async () => {
  try {
    const taskDoc = await getDoc(doc(db, 'exams', taskId));
    if (!taskDoc.exists()) {
      showToast('error', 'Задание не найдено');
      router.push('/student/homework');
      return;
    }
    
    const data = taskDoc.data();
    
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
            autoSubmitIfNeeded();
          }
        } catch(e) {}
      }
    }
    
    const submissionsQuery = await getDoc(doc(db, 'submissions', `${currentUser.uid}_${taskId}`));
    const savedAnswers = submissionsQuery.exists() ? submissionsQuery.data().answers : {};
    const localKey = `task_${taskId}`;
    const localAnswers = localStorage.getItem(localKey);
    let loadedAnswers = {};
    if (localAnswers && !submissionsQuery.exists()) {
      try { loadedAnswers = JSON.parse(localAnswers); } catch(e) {}
    }
    
    const normalizedAnswers = {};
    const allQuestions = data.questions || [];
    allQuestions.forEach(q => {
      let answer = savedAnswers[q.id] !== undefined ? savedAnswers[q.id] : loadedAnswers[q.id];
      const normalized = normalizeAnswer(q, answer);
      if (normalized !== null && normalized !== undefined) normalizedAnswers[q.id] = normalized;
      else if (q.type === 'match') normalizedAnswers[q.id] = {};
    });
    
    Object.entries(normalizedAnswers).forEach(([qId, answer]) => {
      if (answer && typeof answer === 'object' && answer.fileUrl) uploadedFileUrls.value[qId] = answer.fileUrl;
    });
    
    task.value = { id: taskDoc.id, ...data };
    answers.value = normalizedAnswers;
    
    setCachedData(`task_${taskId}_meta`, {
      task: task.value,
      isArchived: isArchived.value,
      timerEnabled: examTimerEnabled.value,
      timerSeconds: examTimerSeconds.value,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Ошибка загрузки задания:', error);
    showToast('error', 'Не удалось загрузить задание');
  }
};

const saveToLocalStorage = () => {
  localStorage.setItem(`task_${taskId}`, JSON.stringify(answers.value));
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

const autoSubmitIfNeeded = () => {
  if (!timerExpired.value) return;
  setTimeout(async () => {
    const submissionRef = doc(db, 'submissions', `${currentUser.uid}_${taskId}`);
    const existing = await getDoc(submissionRef);
    if (existing.exists() && existing.data().status !== 'pending') return;
    const elapsedSeconds = timerRef.value?.getElapsed() || examTimerSeconds.value;
    await confirmSubmitWithTimer(elapsedSeconds);
  }, 2000);
};

const confirmSubmitWithTimer = async (elapsedSeconds = null) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    let fileUrls = {};
    if (pendingFiles.value.size > 0) fileUrls = await uploadFiles();
    
    const submissionRef = doc(db, 'submissions', `${currentUser.uid}_${taskId}`);
    const autoGradedAnswers = {};
    const part1Answers = {};
    const part2Answers = {};
    
    task.value.questions.forEach(q => {
      let answer = answers.value[q.id];
      
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
            autoGradedAnswers[q.id] = isCorrect;
            part1Answers[q.id] = answer;
          } else if (q.type === 'match') {
            const correctMap = {};
            q.correctMapping?.forEach(m => { correctMap[m.right] = m.left; });
            let correctCount = 0;
            let total = Object.keys(answer || {}).length;
            Object.entries(answer || {}).forEach(([right, left]) => {
              if (correctMap[right] === left) correctCount++;
            });
            isCorrect = correctCount === total && total === (q.correctMapping?.length || 0);
            autoGradedAnswers[q.id] = isCorrect;
            part1Answers[q.id] = answer;
          } else if (q.type === 'short') {
            isCorrect = answer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
            autoGradedAnswers[q.id] = isCorrect;
            part1Answers[q.id] = answer;
          }
        }
      } else {
        if (hasAnswer) {
          const fileUrl = fileUrls[q.id] || uploadedFileUrls.value[q.id];
          if (fileUrl) {
            if (typeof answer === 'object') answer.fileUrl = fileUrl;
            else answer = { text: answer || '', fileUrl };
          }
          part2Answers[q.id] = answer;
        }
      }
    });
    
    const submissionData = {
      examId: taskId,
      studentId: currentUser.uid,
      studentLogin: currentUser.email?.split('@')[0],
      answers: answers.value,
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

    console.log('Saving submission:', submissionData);
    await setDoc(submissionRef, submissionData);
    console.log('Submission saved successfully');
    
    localStorage.removeItem(`task_${taskId}`);
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
  if (timerExpired.value) { autoSubmitIfNeeded(); return; }
  if (isArchived.value) { showToast('error', 'Задание просрочено'); return; }
  showConfirmModal.value = true;
};

const closeConfirmModal = () => { showConfirmModal.value = false; };
const confirmSubmit = () => { closeConfirmModal(); confirmSubmitWithTimer(); };

const onTimerExpired = () => {
  timerExpired.value = true;
  showToast('warning', 'Время вышло, задание отправляется');
  autoSubmitIfNeeded();
};
const onTimerTick = (remaining) => { if (remaining <= 0) timerExpired.value = true; };

const goBack = () => {
  if (examTimerEnabled.value && !timerExpired.value && !submitting.value) {
    if (confirm('Внимание! Таймер продолжит идти. Вы уверены, что хотите выйти?')) {
      saveToLocalStorage();
      router.push('/student/homework');
    }
  } else {
    saveToLocalStorage();
    router.push('/student/homework');
  }
};

const beforeUnloadHandler = (e) => {
  if (examTimerEnabled.value && !timerExpired.value && !submitting.value) {
    e.preventDefault();
    e.returnValue = 'Внимание! Таймер продолжит идти. Вы уверены, что хотите покинуть страницу?';
    return e.returnValue;
  }
};

onBeforeRouteLeave((to, from, next) => {
  if (examTimerEnabled.value && !timerExpired.value && !submitting.value) {
    const confirm = window.confirm('Внимание! Таймер продолжит идти. Вы уверены, что хотите покинуть страницу?');
    if (confirm) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

onMounted(() => {
  const cachedMeta = getCachedData(`task_${taskId}_meta`);
  if (cachedMeta && Date.now() - cachedMeta.timestamp < 12 * 60 * 60 * 1000) {
    task.value = cachedMeta.task;
    isArchived.value = cachedMeta.isArchived;
    examTimerEnabled.value = cachedMeta.timerEnabled;
    examTimerSeconds.value = cachedMeta.timerSeconds;
    const localAnswers = localStorage.getItem(`task_${taskId}`);
    if (localAnswers) { try { answers.value = JSON.parse(localAnswers); } catch(e) {} }
  } else {
    loadTask();
  }
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

onUnmounted(() => {
  saveToLocalStorage();
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped>
/* ========== ОСНОВНЫЕ СТИЛИ ========== */
.task-view {
  max-width: 900px;
  margin: 0 auto;
}

/* ========== БАННЕРЫ ========== */
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

/* ========== ШАПКА ========== */
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

/* ========== ПРОГРЕСС-БАР ========== */
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

/* ========== НАВИГАЦИЯ ПО ВОПРОСАМ ========== */
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

/* ========== КОНТЕЙНЕР ВОПРОСА ========== */
.question-container {
  margin-bottom: 2rem;
  min-height: 300px;
}

/* ========== КНОПКИ НАВИГАЦИИ ========== */
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

/* ========== АНИМАЦИЯ ЗАГРУЗКИ ФАЙЛОВ ========== */
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
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary-dark) 50%,
    var(--primary) 100%
  );
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

/* ========== МОДАЛКА ПОДТВЕРЖДЕНИЯ ========== */
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
.warning {
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* ========== ТОСТ ========== */
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
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .task-view .question-container .question-text,
body.dark-theme .task-view .question-container .option-text,
body.dark-theme .task-view .question-container .match-left-item,
body.dark-theme .task-view .question-container .match-right-item span,
body.dark-theme .task-view .question-container .short-input,
body.dark-theme .task-view .question-container .essay-textarea,
body.dark-theme .task-view .question-container .custom-checkbox .option-text,
body.dark-theme .task-view .question-container .custom-radio .option-text {
  color: #ffffff !important;
}

body.dark-theme .task-view .question-container .short-input,
body.dark-theme .task-view .question-container .essay-textarea {
  background: var(--gray-700);
  border-color: var(--gray-600);
}

body.dark-theme .task-view .question-container .custom-checkbox .custom-checkbox,
body.dark-theme .task-view .question-container .custom-radio .custom-radio {
  background: var(--gray-700);
  border-color: var(--gray-500);
}

body.dark-theme .task-view .question-container .custom-checkbox-input:checked + .custom-checkbox {
  background: var(--primary);
  border-color: var(--primary);
}

body.dark-theme .task-view .question-container .custom-radio-input:checked + .custom-radio {
  border-color: var(--primary);
}

body.dark-theme .task-view .question-container .custom-radio-input:checked + .custom-radio::after {
  background: var(--primary);
}

body.dark-theme .task-view .nav-btn {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .task-view .nav-btn.answered {
  background: rgba(16,185,129,0.2);
}
body.dark-theme .task-view .modal-content {
  background: var(--gray-800);
}
body.dark-theme .task-view .custom-toast {
  background: var(--gray-800);
}
body.dark-theme .task-view .timer-container {
  background: var(--gray-700);
}
body.dark-theme .task-view .upload-progress-container {
  background: var(--gray-700);
}
</style>