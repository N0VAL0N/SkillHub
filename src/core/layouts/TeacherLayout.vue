<template>
  <div class="teacher-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>ЕГЭ‑ПРО</h2>
        <span class="role-badge">Учитель</span>
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
        <template v-if="currentSubject === 'social'">
          <router-link to="/teacher" class="nav-item" :class="{ active: $route.path === '/teacher' }">
            <span class="nav-icon">📊</span>
            <span>Главная</span>
          </router-link>
          <router-link to="/teacher/students" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Ученики</span>
          </router-link>
          <router-link to="/teacher/classes" class="nav-item">
            <span class="nav-icon">🏫</span>
            <span>Классы</span>
          </router-link>
          <router-link to="/teacher/check" class="nav-item">
            <span class="nav-icon">📝</span>
            <span>На проверку</span>
            <span v-if="pendingCount" class="badge">{{ pendingCount }}</span>
          </router-link>
          <router-link to="/teacher/stats" class="nav-item">
            <span class="nav-icon">📈</span>
            <span>Статистика</span>
          </router-link>
          <router-link to="/teacher/library" class="nav-item">
            <span class="nav-icon">📚</span>
            <span>Библиотека</span>
          </router-link>
          <router-link to="/teacher/exams" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Материалы</span>
          </router-link>
        </template>

        <template v-else>
          <router-link to="/teacher/chinese" class="nav-item" :class="{ active: $route.path === '/teacher/chinese' }">
            <span class="nav-icon">🏠</span>
            <span>Главная</span>
          </router-link>
          <router-link to="/teacher/chinese/students" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Ученики</span>
          </router-link>
          <router-link to="/teacher/chinese/exams" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Экзамены</span>
          </router-link>
          <router-link to="/teacher/chinese/check" class="nav-item">
            <span class="nav-icon">📝</span>
            <span>На проверку</span>
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
            <span class="profile-name">{{ teacherLogin }}</span>
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
            <button @click="setTheme('light')" :class="{ active: currentTheme === 'light' }">☀️ Светлая</button>
            <button @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }">🌙 Тёмная</button>
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
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useSubjectStore } from '@core/stores/subjectStore';
import CustomSelect from '@shared/components/CustomSelect.vue';

const router = useRouter();
const route = useRoute();
const subjectStore = useSubjectStore();

const teacherLogin = ref('');
const teacherEmail = ref('');
const pendingCount = ref(0);
const currentSubject = ref(subjectStore.currentSubject);

const showSettingsModal = ref(false);
const fontSize = ref(parseInt(localStorage.getItem('teacherFontSize') || '16'));
const currentTheme = ref(localStorage.getItem('theme') || 'light');

const subjectOptions = ref([
  { value: 'social', label: 'Обществознание', icon: '⚖️' },
  { value: 'chinese', label: 'Китайский', icon: '🐉' }
]);

let unsubscribePending = null;

function applySettings() {
  document.documentElement.style.fontSize = fontSize.value + 'px';
  if (currentTheme.value === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

function increaseFontSize() {
  if (fontSize.value < 24) {
    fontSize.value++;
    localStorage.setItem('teacherFontSize', fontSize.value);
    applySettings();
  }
}

function decreaseFontSize() {
  if (fontSize.value > 12) {
    fontSize.value--;
    localStorage.setItem('teacherFontSize', fontSize.value);
    applySettings();
  }
}

function setTheme(theme) {
  currentTheme.value = theme;
  localStorage.setItem('theme', theme);
  applySettings();
}

function openSettings() {
  showSettingsModal.value = true;
}

function switchSubject(subject) {
  if (subject === currentSubject.value) return;
  subjectStore.setSubject(subject);
  currentSubject.value = subject;
  if (subject === 'chinese') {
    router.push('/teacher/chinese');
  } else {
    router.push('/teacher');
  }
}

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/teacher/chinese')) {
    if (currentSubject.value !== 'chinese') {
      currentSubject.value = 'chinese';
      subjectStore.setSubject('chinese');
    }
  } else if (newPath.startsWith('/teacher')) {
    if (currentSubject.value !== 'social') {
      currentSubject.value = 'social';
      subjectStore.setSubject('social');
    }
  }
}, { immediate: true });

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    teacherEmail.value = user.email;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    teacherLogin.value = userDoc.data().login || user.email;
  }
  applySettings();

  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('status', '==', 'pending'));
  unsubscribePending = onSnapshot(q, (snapshot) => {
    pendingCount.value = snapshot.size;
  });
});

function goToProfile() {
  router.push('/profile');
}

async function logout() {
  if (unsubscribePending) unsubscribePending();
  await signOut(auth);
  router.push('/');
}
</script>

<style scoped>
.teacher-layout {
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
  margin-bottom: 0.5rem;
}
.profile-info:hover {
  background: var(--gray-100);
}
.profile-name {
  font-weight: 600;
  color: var(--secondary);
}
.profile-email {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.logout-btn-sidebar {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--danger);
  text-align: left;
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
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.8rem;
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
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.modal-content h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.settings-option {
  margin-bottom: 1rem;
}
.font-size-controls, .theme-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.font-size-controls button, .theme-controls button {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
}
.font-size-value {
  color: var(--gray-700);
}
.theme-controls button.active {
  background: var(--primary);
  color: white;
}
.btn-close {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  width: 100%;
}
@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  .sidebar-header h2,
  .sidebar-header .role-badge,
  .profile-text,
  .nav-item span:last-child {
    display: none;
  }
  .nav-item {
    justify-content: center;
  }
  .main-content {
    margin-left: 80px;
  }
}
body.dark-theme .sidebar,
body.dark-theme .footer,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .nav-item {
  color: var(--gray-400);
}
body.dark-theme .nav-item.active {
  background: rgba(230, 126, 34, 0.2);
  color: var(--primary);
}
body.dark-theme .profile-name {
  color: white;
}
body.dark-theme .font-size-value {
  color: var(--gray-300);
}
</style>