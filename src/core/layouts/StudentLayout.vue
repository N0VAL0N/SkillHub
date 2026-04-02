<template>
  <div class="student-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>ЕГЭ‑ПРО</h2>
        <span class="role-badge">Ученик</span>
      </div>

      <div class="subject-selector">
        <label class="subject-label">Мои предметы</label>
        <CustomSelect
          v-model="currentSubject"
          :options="userSubjectOptions"
          placeholder="Выберите предмет"
          @update:modelValue="switchSubject"
        />
      </div>

      <nav class="sidebar-nav">
        <template v-if="currentSubject === 'social'">
          <router-link to="/student" class="nav-item" :class="{ active: $route.path === '/student' || ($route.path.startsWith('/student/') && !$route.path.includes('/theory') && !$route.path.includes('/practice') && !$route.path.includes('/cards') && !$route.path.includes('/homework') && !$route.path.includes('/stats')) }">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Главная</span>
          </router-link>
          <router-link to="/student/theory" class="nav-item" :class="{ active: $route.path.startsWith('/student/theory') }">
            <span class="nav-icon">📖</span>
            <span class="nav-text">Теория</span>
          </router-link>
          <router-link to="/student/practice" class="nav-item" :class="{ active: $route.path.startsWith('/student/practice') }">
            <span class="nav-icon">✍️</span>
            <span class="nav-text">Задания</span>
          </router-link>
          <router-link to="/student/cards" class="nav-item" :class="{ active: $route.path.startsWith('/student/cards') }">
            <span class="nav-icon">🃏</span>
            <span class="nav-text">Карточки</span>
          </router-link>
          <router-link to="/student/homework" class="nav-item" :class="{ active: $route.path.startsWith('/student/homework') || $route.path.startsWith('/student/task') || $route.path.startsWith('/student/results') }">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">ДЗ</span>
            <span v-if="homeworkCount" class="badge">{{ homeworkCount }}</span>
          </router-link>
          <router-link to="/student/stats" class="nav-item" :class="{ active: $route.path.startsWith('/student/stats') }">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Статистика</span>
          </router-link>
        </template>

        <template v-else-if="currentSubject === 'chinese_hsk'">
          <router-link to="/chinese" class="nav-item" :class="{ active: $route.path === '/chinese' }">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Главная</span>
          </router-link>
          <router-link to="/chinese/lessons" class="nav-item" :class="{ active: $route.path.startsWith('/chinese/lessons') }">
            <span class="nav-icon">📚</span>
            <span class="nav-text">Уроки</span>
          </router-link>
          <router-link to="/chinese/library" class="nav-item" :class="{ active: $route.path.startsWith('/chinese/library') }">
            <span class="nav-icon">📖</span>
            <span class="nav-text">Библиотека</span>
          </router-link>
          <router-link to="/chinese/packs" class="nav-item" :class="{ active: $route.path.startsWith('/chinese/packs') }">
            <span class="nav-icon">🃏</span>
            <span class="nav-text">Паки</span>
          </router-link>
          <router-link to="/chinese/practice" class="nav-item" :class="{ active: $route.path.startsWith('/chinese/practice') }">
            <span class="nav-icon">✍️</span>
            <span class="nav-text">Практика</span>
          </router-link>
          <router-link to="/chinese/stats" class="nav-item" :class="{ active: $route.path.startsWith('/chinese/stats') }">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Статистика</span>
          </router-link>
        </template>

        <button @click="openSettings" class="nav-item settings-nav">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">Настройки</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-info" @click="goToProfile">
          <div class="profile-text">
            <span class="profile-name">{{ studentDisplayName }}</span>
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
          <p>© 2026 ЕГЭ‑ПРО | Подготовка к ЕГЭ</p>
          <div class="footer-links">
            <a href="#">О проекте</a>
            <a href="#">Помощь</a>
            <a href="#">Контакты</a>
          </div>
        </div>
      </footer>
    </main>

    <!-- Модалка настроек -->
    <div v-if="showSettingsModal" class="modal" @click.self="showSettingsModal = false">
      <div class="modal-content">
        <h2>Настройки</h2>
        
        <div class="settings-option">
          <label>Мои предметы</label>
          <div class="subjects-select">
            <div v-for="subject in allSubjects" :key="subject.id" class="subject-check">
              <label class="checkbox-label">
                <input type="checkbox" :value="subject.id" v-model="userSubjects" />
                <span class="subject-icon">{{ subject.icon }}</span>
                <span class="subject-name">{{ subject.name }}</span>
              </label>
            </div>
          </div>
          <button @click="saveUserSubjects" class="btn-save-subjects" :disabled="savingSubjects">
            {{ savingSubjects ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useSubjectStore } from '@core/stores/subjectStore';
import { useAppStore } from '@core/stores/appStore';
import { useTheme } from '@core/composables/useTheme';
import CustomSelect from '@shared/components/CustomSelect.vue';
import { SUBJECTS_LIST } from '@core/constants/subjects';

const router = useRouter();
const route = useRoute();
const subjectStore = useSubjectStore();
const appStore = useAppStore();

const studentDisplayName = ref('');
const studentEmail = ref('');
const homeworkCount = ref(0);
const currentSubject = computed({
  get: () => subjectStore.currentSubject,
  set: (val) => subjectStore.setSubject(val)
});
const userSubjects = ref([]);
const allSubjects = SUBJECTS_LIST;

const showSettingsModal = ref(false);
const fontSize = ref(parseInt(localStorage.getItem('studentFontSize') || '16'));
const savingSubjects = ref(false);
const { currentTheme, setTheme } = useTheme();

let unsubscribeUser = null;
let homeworkInterval = null;
let isMounted = true;

const userSubjectOptions = computed(() => {
  return userSubjects.value
    .map(id => allSubjects.find(s => s.id === id))
    .filter(s => s)
    .map(s => ({ value: s.id, label: s.name, icon: s.icon }));
});

const applySettings = () => {
  document.documentElement.style.fontSize = fontSize.value + 'px';
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

const openSettings = () => {
  showSettingsModal.value = true;
};

const saveUserSubjects = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  savingSubjects.value = true;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      subjects: userSubjects.value,
      updatedAt: new Date()
    });
    subjectStore.setUserSubjects(userSubjects.value);
    appStore.showToast('Предметы сохранены', 'success');
    
    if (!userSubjects.value.includes(currentSubject.value) && userSubjects.value.length > 0) {
      subjectStore.setSubject(userSubjects.value[0]);
    }
  } catch (err) {
    console.error('Error saving subjects:', err);
    appStore.showToast('Ошибка сохранения', 'error');
  } finally {
    savingSubjects.value = false;
  }
};

const loadHomeworkCount = async () => {
  const user = auth.currentUser;
  if (!user || !isMounted) return;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || !isMounted) return;
    
    const userData = userDoc.data();
    const studentClass = userData.className;
    const studentSubjects = userData.subjects || [];
    const studentId = user.uid;
    
    const examsSnap = await getDocs(query(collection(db, 'exams'), where('published', '==', true)));
    if (!isMounted) return;
    
    const submissionsSnap = await getDocs(
      query(collection(db, 'submissions'), where('studentId', '==', user.uid))
    );
    if (!isMounted) return;
    
    const submittedExamIds = new Set(submissionsSnap.docs.map(doc => doc.data().examId));
    
    let count = 0;
    for (const examDoc of examsSnap.docs) {
      const exam = examDoc.data();
      const examId = examDoc.id;
      
      let canSee = false;
      if (exam.publishedForType === 'all') {
        canSee = true;
      } else if (exam.publishedForType === 'class') {
        canSee = exam.publishedForClassName === studentClass;
      } else if (exam.publishedForType === 'student') {
        canSee = exam.publishedForStudentId === studentId;
      }
      
      if (!canSee) continue;
      if (exam.subject && !studentSubjects.includes(exam.subject)) continue;
      if (!submittedExamIds.has(examId)) {
        count++;
      }
    }
    
    if (isMounted) {
      homeworkCount.value = count;
    }
  } catch (error) {
    console.error('Ошибка загрузки домашек:', error);
    if (isMounted) {
      homeworkCount.value = 0;
    }
  }
};

const switchSubject = (subject) => {
  if (subject === currentSubject.value) return;
  subjectStore.setSubject(subject);
  if (subject === 'chinese_hsk') {
    router.push('/chinese');
  } else {
    router.push('/student');
  }
};

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/chinese')) {
    if (currentSubject.value !== 'chinese_hsk' && userSubjects.value.includes('chinese_hsk')) {
      subjectStore.setSubject('chinese_hsk');
    }
  } else if (newPath.startsWith('/student')) {
    if (currentSubject.value !== 'social' && userSubjects.value.includes('social')) {
      subjectStore.setSubject('social');
    }
  }
}, { immediate: true });

watch(currentSubject, (newSubject) => {
  if (!newSubject) return;
  const currentPath = route.path;
  if (newSubject === 'chinese_hsk' && !currentPath.startsWith('/chinese')) {
    router.push('/chinese');
  } else if (newSubject === 'social' && !currentPath.startsWith('/student')) {
    router.push('/student');
  }
});

onMounted(() => {
  isMounted = true;
  const user = auth.currentUser;
  
  if (user) {
    studentEmail.value = user.email;
    
    const userRef = doc(db, 'users', user.uid);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        studentDisplayName.value = data.displayName || data.login || user.email;
        userSubjects.value = data.subjects || [];
        subjectStore.setUserSubjects(userSubjects.value);
        
        if (!userSubjects.value.includes(currentSubject.value) && userSubjects.value.length > 0) {
          subjectStore.setSubject(userSubjects.value[0]);
        }
      }
    });
    
    getDoc(userRef).then(userDoc => {
      if (!isMounted) return;
      if (userDoc.exists()) {
        const data = userDoc.data();
        studentDisplayName.value = data.displayName || data.login || user.email;
        userSubjects.value = data.subjects || [];
        subjectStore.setUserSubjects(userSubjects.value);
      } else {
        studentDisplayName.value = user.email;
      }
    }).catch(error => {
      console.error('Ошибка загрузки пользователя:', error);
    });
  }
  
  applySettings();
  loadHomeworkCount().catch(console.error);
  
  homeworkInterval = setInterval(() => {
    loadHomeworkCount().catch(console.error);
  }, 60000);
});

onUnmounted(() => {
  isMounted = false;
  if (unsubscribeUser) unsubscribeUser();
  if (homeworkInterval) clearInterval(homeworkInterval);
});

const goToProfile = () => {
  router.push('/profile');
};

const logout = async () => {
  isMounted = false;
  if (unsubscribeUser) unsubscribeUser();
  if (homeworkInterval) clearInterval(homeworkInterval);
  await signOut(auth);
  router.push('/');
};
</script>

<style scoped>
/* ... стили из предыдущей версии StudentLayout ... */
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
  padding: 1rem;
  border-bottom: 1px solid var(--gray-200);
}
.subject-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sidebar-nav {
  flex: 1;
  padding: 0.5rem 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
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
  font-size: 1.2rem;
  width: 28px;
  flex-shrink: 0;
}
.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  background: var(--primary);
  color: white;
  font-size: 0.7rem;
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
  flex: 1;
  overflow: hidden;
}
.profile-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.logout-btn-sidebar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem;
  font-size: 0.9rem;
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
  padding: 1rem 2rem;
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
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
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-content h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
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
  font-size: 0.85rem;
}
.subjects-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 0.75rem;
}
.subject-check {
  padding: 0.25rem 0;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.subject-icon {
  font-size: 1rem;
}
.subject-name {
  font-size: 0.85rem;
  color: var(--gray-700);
}
.btn-save-subjects {
  width: 100%;
  padding: 0.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-save-subjects:hover:not(:disabled) {
  background: var(--primary-dark);
}
.btn-save-subjects:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.font-size-controls,
.theme-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.font-size-controls button,
.theme-controls button {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
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
  min-width: 40px;
  text-align: center;
  color: var(--gray-700);
}
.btn-close {
  width: 100%;
  padding: 0.6rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
}
.btn-close:hover {
  background: var(--secondary-dark);
}
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  .sidebar-header h2,
  .sidebar-header .role-badge,
  .subject-label,
  .profile-text,
  .nav-text {
    display: none;
  }
  .subject-selector {
    padding: 0.5rem;
  }
  .nav-item {
    justify-content: center;
    padding: 0.75rem;
  }
  .nav-icon {
    margin: 0;
  }
  .main-content {
    margin-left: 70px;
  }
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}
body.dark-theme .sidebar,
body.dark-theme .footer,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
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
}
body.dark-theme .profile-name {
  color: #ffffff;
}
body.dark-theme .settings-option label {
  color: var(--gray-300);
}
body.dark-theme .subject-name {
  color: var(--gray-300);
}
body.dark-theme .font-size-controls button,
body.dark-theme .theme-controls button {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .font-size-controls button:hover:not(:disabled),
body.dark-theme .theme-controls button:hover {
  background: var(--gray-600);
}
body.dark-theme .font-size-value {
  color: var(--gray-300);
}
</style>