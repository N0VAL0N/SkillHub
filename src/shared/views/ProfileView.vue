<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Шапка с обложкой -->
      <div class="profile-cover">
        <div class="cover-overlay"></div>
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Назад
        </button>
      </div>

      <!-- Аватар и основная информация -->
      <div class="profile-main">
        <div class="avatar-wrapper">
          <div class="avatar-large" :style="{ background: avatarGradient }">
            {{ userLogin.charAt(0).toUpperCase() }}
          </div>
          <div class="role-badge" :class="userRole">
            {{ userRole === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик' }}
          </div>
        </div>

        <div class="user-info">
          <h1>{{ userLogin }}</h1>
          <p class="user-email">{{ userEmail }}</p>
          <p class="user-since">С нами с {{ formattedDate }}</p>
        </div>

        <!-- Статистика -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ userStats.totalTasks || 0 }}</div>
            <div class="stat-label">Выполнено заданий</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ userStats.correctAnswers || 0 }}%</div>
            <div class="stat-label">Успеваемость</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">{{ userStats.streak || 0 }}</div>
            <div class="stat-label">Дней подряд</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ formatTimeSpent(userStats.timeSpent || 0) }}</div>
            <div class="stat-label">Времени в приложении</div>
          </div>
        </div>
      </div>

      <!-- Настройки -->
      <div class="settings-section">
        <h2 class="section-title">
          <span class="title-icon">⚙️</span>
          Настройки профиля
        </h2>

        <div class="settings-grid">
          <!-- Карточка предметов -->
          <div class="settings-card">
            <div class="card-header">
              <span class="card-icon">📚</span>
              <h3>Мои предметы</h3>
            </div>
            <div class="card-content">
              <div class="subjects-list">
                <span v-for="subject in selectedSubjectsData" :key="subject.id" class="subject-tag" :style="{ background: subject.color + '20', color: subject.color }">
                  {{ subject.icon }} {{ subject.name }}
                </span>
                <span v-if="selectedSubjectsData.length === 0" class="empty-text">
                  Предметы не выбраны
                </span>
              </div>
              <button class="card-btn" @click="openSubjectSelector">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"/>
                </svg>
                Управлять предметами
              </button>
            </div>
          </div>

          <!-- Карточка темы -->
          <div class="settings-card">
            <div class="card-header">
              <span class="card-icon">🎨</span>
              <h3>Оформление</h3>
            </div>
            <div class="card-content">
              <div class="theme-selector">
                <button 
                  class="theme-btn" 
                  :class="{ active: currentTheme === 'light' }"
                  @click="setTheme('light')"
                >
                  ☀️ Светлая
                </button>
                <button 
                  class="theme-btn" 
                  :class="{ active: currentTheme === 'dark' }"
                  @click="setTheme('dark')"
                >
                  🌙 Тёмная
                </button>
              </div>
              <div class="font-control">
                <span>Размер шрифта</span>
                <div class="font-buttons">
                  <button @click="decreaseFontSize" :disabled="fontSize <= 12">A-</button>
                  <span class="font-value">{{ fontSize }}px</span>
                  <button @click="increaseFontSize" :disabled="fontSize >= 24">A+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Карточка уведомлений -->
          <div class="settings-card">
            <div class="card-header">
              <span class="card-icon">🔔</span>
              <h3>Уведомления</h3>
            </div>
            <div class="card-content">
              <label class="switch-label">
                <span>Новые задания</span>
                <label class="switch">
                  <input type="checkbox" v-model="notifications.newTasks">
                  <span class="slider"></span>
                </label>
              </label>
              <label class="switch-label">
                <span>Проверка работ</span>
                <label class="switch">
                  <input type="checkbox" v-model="notifications.graded">
                  <span class="slider"></span>
                </label>
              </label>
              <label class="switch-label">
                <span>Напоминания</span>
                <label class="switch">
                  <input type="checkbox" v-model="notifications.reminders">
                  <span class="slider"></span>
                </label>
              </label>
            </div>
          </div>

          <!-- Карточка безопасности -->
          <div class="settings-card">
            <div class="card-header">
              <span class="card-icon">🔒</span>
              <h3>Безопасность</h3>
            </div>
            <div class="card-content">
              <button class="card-btn" @click="changePassword">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12M12 16H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Сменить пароль
              </button>
            </div>
          </div>
        </div>

        <!-- Кнопка выхода -->
        <div class="logout-section">
          <button class="logout-btn" @click="logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка выбора предметов -->
    <Modal 
      :isOpen="showSubjectModal" 
      title="Выберите предметы" 
      size="lg"
      @close="showSubjectModal = false"
    >
      <SubjectSelector
        v-model="selectedSubjects"
        :showActions="true"
        @save="saveSubjects"
        @cancel="showSubjectModal = false"
      />
    </Modal>

    <!-- Модалка смены пароля -->
    <Modal 
      :isOpen="showPasswordModal" 
      title="Смена пароля" 
      size="sm"
      @close="showPasswordModal = false"
    >
      <div class="password-change">
        <input 
          type="password" 
          v-model="oldPassword" 
          placeholder="Текущий пароль"
        />
        <input 
          type="password" 
          v-model="newPassword" 
          placeholder="Новый пароль"
        />
        <input 
          type="password" 
          v-model="confirmPassword" 
          placeholder="Повторите пароль"
        />
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPasswordModal = false">Отмена</button>
          <button class="btn-primary" @click="updatePassword" :disabled="!canChangePassword">
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut, updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Modal from '@shared/components/Modal.vue';
import SubjectSelector from '@shared/components/SubjectSelector.vue';
import { SUBJECTS_LIST, getSubjectById } from '@core/constants/subjects';
import { useTheme } from '@core/composables/useTheme';
import { useToast } from '@core/composables/useToast';

const router = useRouter();
const { currentTheme, setTheme } = useTheme();
const { success, error: toastError } = useToast();

// Данные пользователя
const userLogin = ref('');
const userEmail = ref('');
const userRole = ref('');
const userStats = ref({
  totalTasks: 0,
  correctAnswers: 0,
  streak: 0,
  timeSpent: 0
});
const userCreatedAt = ref(null);

// Настройки
const fontSize = ref(parseInt(localStorage.getItem('fontSize') || '16'));
const notifications = ref({
  newTasks: true,
  graded: true,
  reminders: true
});
const selectedSubjects = ref([]);

// Модалки
const showSubjectModal = ref(false);
const showPasswordModal = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Вычисляемые свойства
const formattedDate = computed(() => {
  if (!userCreatedAt.value) return '';
  const date = userCreatedAt.value.toDate ? userCreatedAt.value.toDate() : new Date(userCreatedAt.value);
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
});

const avatarGradient = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #e67e22, #f39c12)',
    'linear-gradient(135deg, #3498db, #2980b9)',
    'linear-gradient(135deg, #2ecc71, #27ae60)',
    'linear-gradient(135deg, #9b59b6, #8e44ad)',
    'linear-gradient(135deg, #e74c3c, #c0392b)'
  ];
  const index = (userLogin.value?.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
});

const selectedSubjectsData = computed(() => {
  return selectedSubjects.value
    .map(id => getSubjectById(id))
    .filter(Boolean);
});

const canChangePassword = computed(() => {
  return newPassword.value.length >= 6 && newPassword.value === confirmPassword.value;
});

// Функции
const formatTimeSpent = (minutes) => {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
};

const applyFontSize = () => {
  document.documentElement.style.fontSize = fontSize.value + 'px';
  localStorage.setItem('fontSize', fontSize.value);
};

const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value++;
    applyFontSize();
  }
};

const decreaseFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value--;
    applyFontSize();
  }
};

const openSubjectSelector = () => {
  showSubjectModal.value = true;
};

const saveSubjects = async (subjects) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    await updateDoc(doc(db, 'users', user.uid), {
      subjects: subjects,
      updatedAt: new Date()
    });
    
    selectedSubjects.value = subjects;
    showSubjectModal.value = false;
    success('Предметы успешно обновлены');
  } catch (err) {
    console.error('Error saving subjects:', err);
    toastError('Ошибка сохранения предметов');
  }
};

const changePassword = () => {
  showPasswordModal.value = true;
};

const updatePassword = async () => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    
    // Переаутентификация
    const credential = EmailAuthProvider.credential(user.email, oldPassword.value);
    await reauthenticateWithCredential(user, credential);
    
    // Смена пароля
    await firebaseUpdatePassword(user, newPassword.value);
    
    showPasswordModal.value = false;
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
    success('Пароль успешно изменён');
  } catch (err) {
    console.error('Error changing password:', err);
    if (err.code === 'auth/wrong-password') {
      toastError('Неверный текущий пароль');
    } else {
      toastError('Ошибка смены пароля');
    }
  }
};

const goBack = () => {
  router.push(userRole.value === 'teacher' ? '/teacher' : '/student');
};

const logout = async () => {
  await signOut(auth);
  router.push('/');
};

// Загрузка данных
onMounted(async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  userEmail.value = user.email;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    userLogin.value = data.login || data.displayName;
    userRole.value = data.role;
    userCreatedAt.value = data.createdAt;
    selectedSubjects.value = data.subjects || [];
    userStats.value = {
      totalTasks: data.stats?.totalTasks || 0,
      correctAnswers: data.stats?.correctAnswers || 0,
      streak: data.stats?.streak || 0,
      timeSpent: data.stats?.timeSpent || 0
    };
    notifications.value = {
      newTasks: data.settings?.notifications?.newTasks ?? true,
      graded: data.settings?.notifications?.graded ?? true,
      reminders: data.settings?.notifications?.reminders ?? true
    };
  }
  
  applyFontSize();
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--gray-50);
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem;
}

/* Обложка */
.profile-cover {
  height: 200px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 0 0 2rem 2rem;
  position: relative;
  margin-bottom: 80px;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 2rem 2rem;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Аватар */
.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-top: -60px;
  margin-bottom: 1rem;
}

.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: white;
  border: 4px solid white;
  box-shadow: var(--shadow-lg);
}

.role-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: white;
  box-shadow: var(--shadow-sm);
}

.role-badge.teacher {
  color: var(--primary);
  border: 1px solid var(--primary);
}

.role-badge.student {
  color: var(--info);
  border: 1px solid var(--info);
}

/* Основная информация */
.profile-main {
  text-align: center;
  margin-bottom: 2rem;
}

.user-info h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: var(--gray-800);
}

.user-email {
  color: var(--gray-500);
  margin: 0 0 0.25rem;
}

.user-since {
  font-size: 0.875rem;
  color: var(--gray-400);
  margin: 0;
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

/* Настройки */
.settings-section {
  margin-top: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--gray-700);
}

.title-icon {
  font-size: 1.5rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.settings-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.card-icon {
  font-size: 1.25rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}

.card-content {
  padding: 1.25rem;
}

.subjects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.subject-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.empty-text {
  color: var(--gray-400);
  font-size: 0.875rem;
}

.card-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-600);
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.card-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.theme-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.font-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.font-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.font-buttons button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.font-buttons button:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.font-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-value {
  min-width: 40px;
  text-align: center;
}

.switch-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--gray-300);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.logout-section {
  margin-top: 2rem;
  text-align: center;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid var(--danger);
  border-radius: 2rem;
  cursor: pointer;
  color: var(--danger);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--danger);
  color: white;
}

/* Модалка смены пароля */
.password-change {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-change input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-600);
}

.btn-secondary:hover {
  background: var(--gray-100);
}

/* Адаптивность */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-container {
    padding: 0 1rem 1rem;
  }
  
  .avatar-large {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
  }
}

/* Тёмная тема */
body.dark-theme .profile-page {
  background: var(--gray-900);
}

body.dark-theme .stat-card,
body.dark-theme .settings-card {
  background: var(--gray-800);
}

body.dark-theme .user-info h1 {
  color: white;
}

body.dark-theme .card-header {
  background: var(--gray-700);
  border-bottom-color: var(--gray-600);
}

body.dark-theme .card-header h3 {
  color: var(--gray-200);
}

body.dark-theme .card-btn {
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .theme-btn {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .theme-btn.active {
  background: var(--primary);
  color: white;
}

body.dark-theme .font-buttons button {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .password-change input {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}

body.dark-theme .btn-secondary {
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .btn-secondary:hover {
  background: var(--gray-700);
}
</style>