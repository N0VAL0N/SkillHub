<template>
  <div class="student-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>ЕГЭ‑ПРО</h2>
        <span class="role-badge">Ученик</span>
      </div>

      <div class="subject-selector">
        <CustomSelect
          v-model="currentSubject"
          :options="subjectOptions"
          placeholder="Выберите предмет"
          @update:modelValue="switchSubject"
        />
      </div>

      <nav class="sidebar-nav">
        <!-- Обществознание -->
        <template v-if="currentSubject === 'social'">
          <router-link to="/student" class="nav-item" :class="{ active: $route.path === '/student' }">
            <span class="nav-icon">📊</span>
            <span>Главная</span>
          </router-link>
          <router-link to="/student/theory" class="nav-item" :class="{ active: $route.path === '/student/theory' }">
            <span class="nav-icon">📖</span>
            <span>Теория</span>
          </router-link>
          <router-link to="/student/practice" class="nav-item" :class="{ active: $route.path === '/student/practice' }">
            <span class="nav-icon">✍️</span>
            <span>Задания</span>
          </router-link>
          <router-link to="/student/cards" class="nav-item" :class="{ active: $route.path === '/student/cards' }">
            <span class="nav-icon">🃏</span>
            <span>Карточки</span>
          </router-link>
          <router-link to="/student/homework" class="nav-item" :class="{ active: $route.path === '/student/homework' }">
            <span class="nav-icon">🏠</span>
            <span>ДЗ</span>
            <span v-if="homeworkCount" class="badge">{{ homeworkCount }}</span>
          </router-link>
          <router-link to="/student/stats" class="nav-item" :class="{ active: $route.path === '/student/stats' }">
            <span class="nav-icon">📈</span>
            <span>Статистика</span>
          </router-link>
        </template>

        <!-- Китайский язык -->
        <template v-else>
          <router-link to="/chinese" class="nav-item" :class="{ active: $route.path === '/chinese' }">
            <span class="nav-icon">🏠</span>
            <span>Главная</span>
          </router-link>
          <router-link to="/chinese/lessons" class="nav-item" :class="{ active: $route.path === '/chinese/lessons' }">
            <span class="nav-icon">📚</span>
            <span>Уроки</span>
          </router-link>
          <router-link to="/chinese/library" class="nav-item" :class="{ active: $route.path === '/chinese/library' }">
            <span class="nav-icon">📖</span>
            <span>Библиотека</span>
          </router-link>
          <router-link to="/chinese/packs" class="nav-item" :class="{ active: $route.path === '/chinese/packs' }">
            <span class="nav-icon">🃏</span>
            <span>Паки</span>
          </router-link>
          <router-link to="/chinese/practice" class="nav-item" :class="{ active: $route.path === '/chinese/practice' }">
            <span class="nav-icon">✍️</span>
            <span>Практика</span>
          </router-link>
          <router-link to="/chinese/stats" class="nav-item" :class="{ active: $route.path === '/chinese/stats' }">
            <span class="nav-icon">📈</span>
            <span>Статистика</span>
          </router-link>
        </template>

        <button @click="openSettings" class="nav-item settings-nav">
          <span class="nav-icon">⚙️</span>
          <span>Настройки</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-info" @click="goToProfile">
          <div class="profile-text">
            <span class="profile-name">{{ studentLogin }}</span>
          </div>
        </div>
        <button @click="logout" class="logout-btn-sidebar">
          <span>Выйти</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-wrapper">
        <slot />
      </div>
      <footer class="footer">
        <div class="footer-content">
          <p>© 2026 ЕГЭ‑ПРО | Подготовка к ЕГЭ по обществознанию</p>
          <div class="footer-links">
            <a href="#">О проекте</a>
            <a href="#">Помощь</a>
            <a href="#">Контакты</a>
          </div>
        </div>
      </footer>
    </main>

    <!-- Настройки -->
    <div v-if="showSettingsModal" class="modal" @click.self="showSettingsModal = false">
      <div class="modal-content">
        <h2>Настройки</h2>
        <div class="settings-option">
          <label>Размер шрифта:</label>
          <div class="font-size-controls">
            <button @click="decreaseFontSize" :disabled="fontSize <= 12">A-</button>
            <span class="font-size-value">{{ fontSize }}px</span>
            <button @click="increaseFontSize" :disabled="fontSize >= 24">A+</button>
          </div>
        </div>
        <div class="settings-option">
          <label>Тема:</label>
          <div class="theme-controls">
            <button @click="setTheme('light')" :class="{ active: currentTheme === 'light' }">
              ☀️ Светлая
            </button>
            <button @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }">
              🌙 Тёмная
            </button>
          </div>
        </div>
        <button @click="showSettingsModal = false" class="btn-close">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useSubjectStore } from '@core/stores/subjectStore';
import CustomSelect from '@shared/components/CustomSelect.vue';

const router = useRouter();
const route = useRoute();
const subjectStore = useSubjectStore();

const studentLogin = ref('');
const studentEmail = ref('');
const homeworkCount = ref(0);
const currentSubject = ref(subjectStore.currentSubject);

const showSettingsModal = ref(false);
const fontSize = ref(parseInt(localStorage.getItem('studentFontSize') || '16'));
const currentTheme = ref(localStorage.getItem('theme') || 'light');

const subjectOptions = ref([
  { value: 'social', label: 'Обществознание', icon: '⚖️' },
  { value: 'chinese', label: 'Китайский', icon: '🐉' }
]);

const applySettings = () => {
  document.documentElement.style.fontSize = fontSize.value + 'px';
  if (currentTheme.value === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
};

const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value++;
    localStorage.setItem('studentFontSize', fontSize.value);
    applySettings();
  }
};

const decreaseFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value--;
    localStorage.setItem('studentFontSize', fontSize.value);
    applySettings();
  }
};

const setTheme = (theme) => {
  currentTheme.value = theme;
  localStorage.setItem('theme', theme);
  applySettings();
};

const openSettings = () => {
  showSettingsModal.value = true;
};

const loadHomeworkCount = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const examsSnap = await getDocs(query(collection(db, 'exams'), where('published', '==', true)));
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userClass = userDoc.data()?.className;
    const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', user.uid)));
    const submittedIds = new Set(submissionsSnap.docs.map(d => d.data().examId));
    let count = 0;
    examsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (submittedIds.has(doc.id)) return;
      if (data.publishedForType === 'class' && data.publishedForClassName === userClass) count++;
      else if (data.publishedForType === 'student' && data.publishedForStudentId === user.uid) count++;
    });
    homeworkCount.value = count;
  } catch (error) {
    console.error('Ошибка загрузки количества домашек:', error);
  }
};

const updateStreak = () => {
  const lastLogin = localStorage.getItem('lastLoginDate');
  const today = new Date().toDateString();
  let streak = parseInt(localStorage.getItem('streak') || '0');
  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastLogin === yesterday.toDateString()) {
      streak++;
    } else {
      streak = 1;
    }
    localStorage.setItem('streak', streak);
    localStorage.setItem('lastLoginDate', today);
  }
  return streak;
};

const switchSubject = (subject) => {
  if (subject === currentSubject.value) return;
  subjectStore.setSubject(subject);
  currentSubject.value = subject;
  if (subject === 'chinese') {
    router.push('/chinese');
  } else {
    router.push('/student');
  }
};

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/chinese')) {
    if (currentSubject.value !== 'chinese') {
      currentSubject.value = 'chinese';
      subjectStore.setSubject('chinese');
    }
  } else if (newPath.startsWith('/student')) {
    if (currentSubject.value !== 'social') {
      currentSubject.value = 'social';
      subjectStore.setSubject('social');
    }
  }
}, { immediate: true });

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    studentEmail.value = user.email;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      studentLogin.value = userDoc.data().login;
    } else {
      studentLogin.value = user.email;
    }
  }
  await loadHomeworkCount();
  applySettings();
  updateStreak();
});

const goToProfile = () => {
  router.push('/profile');
};

const logout = async () => {
  await signOut(auth);
  router.push('/');
};
</script>

<style scoped>
.student-layout {
  display: flex;
  min-height: 100vh;
  background: var(--gray-50);
}
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 10;
}
.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.sidebar-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--secondary);
}
.role-badge {
  display: inline-block;
  background: var(--primary);
  color: white;
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  margin-top: 0.5rem;
}
.subject-selector {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--gray-200);
}
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s;
}
.nav-item:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.nav-item.active {
  background: var(--primary-light);
  color: var(--primary);
  border-right: 3px solid var(--primary);
}
.nav-icon {
  font-size: 1.3rem;
  width: 28px;
}
.badge {
  background: var(--primary);
  color: white;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  margin-left: auto;
}
.settings-nav {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}
.settings-nav:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.sidebar-footer {
  border-top: 1px solid var(--gray-200);
  padding: 1rem;
}
.profile-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0.5rem;
}
.profile-info:hover {
  background: var(--gray-100);
}
.profile-text {
  display: flex;
  flex-direction: column;
}
.profile-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--secondary);
}
.logout-btn-sidebar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--danger);
  transition: all 0.2s;
}
.logout-btn-sidebar:hover {
  background: rgba(239, 68, 68, 0.1);
}
.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.content-wrapper {
  flex: 1;
  padding: 2rem;
}
.footer {
  background: white;
  border-top: 1px solid var(--gray-200);
  padding: 1.2rem 2rem;
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--gray-500);
}
.footer-links {
  display: flex;
  gap: 1.5rem;
}
.footer-links a {
  color: var(--gray-500);
  text-decoration: none;
}
.footer-links a:hover {
  color: var(--primary);
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
  border-radius: 1.5rem;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
}
.modal-content h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.settings-option {
  margin-bottom: 1.5rem;
}
.settings-option label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
}
.font-size-controls,
.theme-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.font-size-controls button,
.theme-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.font-size-controls button:hover:not(:disabled),
.theme-controls button:hover {
  background: var(--gray-100);
}
.font-size-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.theme-controls button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.font-size-value {
  color: var(--gray-700);
}
.btn-close {
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  width: 100%;
}
.btn-close:hover {
  background: var(--secondary-dark);
}
@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  .sidebar-header h2,
  .sidebar-header .role-badge,
  .profile-text,
  .nav-item span:last-child:not(.nav-icon) {
    display: none;
  }
  .subject-selector {
    padding: 0.5rem;
  }
  .nav-item {
    justify-content: center;
    padding: 0.9rem;
  }
  .nav-icon {
    margin: 0;
  }
  .main-content {
    margin-left: 80px;
  }
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}
body.dark-theme .sidebar {
  background: var(--gray-800);
  border-right-color: var(--gray-600);
}
body.dark-theme .sidebar-header h2 {
  color: #ffffff;
}
body.dark-theme .nav-item {
  color: var(--gray-400);
}
body.dark-theme .nav-item:hover {
  background: var(--gray-700);
  color: var(--primary);
}
body.dark-theme .nav-item.active {
  background: rgba(230, 126, 34, 0.2);
  color: var(--primary);
  border-right-color: var(--primary);
}
body.dark-theme .profile-name {
  color: #ffffff;
}
body.dark-theme .footer {
  background: var(--gray-800);
  border-top-color: var(--gray-700);
}
body.dark-theme .modal-content {
  background: var(--gray-800);
  border: 1px solid var(--gray-600);
}
body.dark-theme .modal-content h2 {
  color: #ffffff;
}
body.dark-theme .settings-option label {
  color: var(--primary);
}
body.dark-theme .font-size-controls button,
body.dark-theme .theme-controls button {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .font-size-controls button:hover:not(:disabled),
body.dark-theme .theme-controls button:hover {
  background: var(--gray-700);
}
body.dark-theme .font-size-value {
  color: var(--gray-300);
}
body.dark-theme .btn-close {
  background: var(--primary);
}
body.dark-theme .btn-close:hover {
  background: var(--primary-dark);
}
body.dark-theme .theme-controls button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
</style>