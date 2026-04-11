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
        <template v-if="currentSubjectConfig && currentSubjectConfig.status === 'active'">
          <!-- Меню для обществознания -->
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

          <!-- Меню для китайского HSK -->
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

          <!-- Меню для английского IELTS -->
          <template v-else-if="currentSubject === 'english_ielts'">
            <router-link to="/english" class="nav-item" :class="{ active: $route.path === '/english' }">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">Главная</span>
            </router-link>
            <router-link to="/english/lessons" class="nav-item" :class="{ active: $route.path.startsWith('/english/lessons') }">
              <span class="nav-icon">📚</span>
              <span class="nav-text">Уроки</span>
            </router-link>
            <router-link to="/english/library" class="nav-item" :class="{ active: $route.path.startsWith('/english/library') }">
              <span class="nav-icon">📖</span>
              <span class="nav-text">Библиотека</span>
            </router-link>
            <router-link to="/english/packs" class="nav-item" :class="{ active: $route.path.startsWith('/english/packs') }">
              <span class="nav-icon">🃏</span>
              <span class="nav-text">Паки</span>
            </router-link>
            <router-link to="/english/practice" class="nav-item" :class="{ active: $route.path.startsWith('/english/practice') }">
              <span class="nav-icon">✍️</span>
              <span class="nav-text">Практика</span>
            </router-link>
            <router-link to="/english/stats" class="nav-item" :class="{ active: $route.path.startsWith('/english/stats') }">
              <span class="nav-icon">📈</span>
              <span class="nav-text">Статистика</span>
            </router-link>
          </template>
        </template>

        <!-- Для неактивных предметов (planned/placeholder) показываем заглушку -->
        <div v-else class="nav-placeholder">
          <div class="placeholder-icon">🔨</div>
          <p>Разделы для предмета «{{ currentSubjectConfig?.name }}» в разработке</p>
          <router-link to="/student" class="nav-item" v-if="currentSubject !== 'social'">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Вернуться на главную</span>
          </router-link>
        </div>

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
            <a href="#" @click.prevent="showSupportModal = true">Поддержка</a>
            <a href="#" @click.prevent="showContactsModal = true">Контакты</a>
            <a href="https://t.me/your_telegram" target="_blank" class="contact-link">📱 Telegram</a>
            <a href="mailto:your@email.ru" class="contact-link">📧 Почта</a>
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
            <button @click="setTheme('light')" :class="{ active: currentTheme === 'light' }">☀️ Светлая</button>
            <button @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }">🌙 Тёмная</button>
          </div>
        </div>
        <button @click="showSettingsModal = false" class="btn-close">Закрыть</button>
      </div>
    </div>

    <!-- Модалка контактов -->
    <div v-if="showContactsModal" class="modal-overlay" @click.self="showContactsModal = false">
      <div class="modal contacts-modal">
        <div class="modal-header">
          <h3>📱 Свяжитесь с нами</h3>
          <button class="close-btn" @click="showContactsModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Мы всегда рады помочь! Выберите удобный способ связи:</p>
          <div class="contacts-grid">
            <a href="https://t.me/egepro_support" target="_blank" class="contact-card telegram">
              <div class="contact-icon">💬</div>
              <div class="contact-info">
                <span class="contact-title">Telegram</span>
                <span class="contact-value">@egepro_support</span>
              </div>
              <div class="contact-arrow">→</div>
            </a>
            <a href="mailto:info@egepro.ru" class="contact-card email">
              <div class="contact-icon">📧</div>
              <div class="contact-info">
                <span class="contact-title">Email</span>
                <span class="contact-value">info@egepro.ru</span>
              </div>
              <div class="contact-arrow">→</div>
            </a>
            <a href="tel:+7XXXXXXXXXX" class="contact-card phone">
              <div class="contact-icon">📱</div>
              <div class="contact-info">
                <span class="contact-title">Телефон</span>
                <span class="contact-value">+7 (XXX) XXX-XX-XX</span>
              </div>
              <div class="contact-arrow">→</div>
            </a>
            <div class="contact-card vk">
              <div class="contact-icon">🌐</div>
              <div class="contact-info">
                <span class="contact-title">ВКонтакте</span>
                <span class="contact-value">vk.com/egepro</span>
              </div>
              <div class="contact-arrow">→</div>
            </div>
          </div>
          <div class="support-note">
            <span class="note-icon">⏰</span>
            <span>Время ответа: обычно в течение 15 минут в рабочее время</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showContactsModal = false">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Модалка поддержки -->
    <div v-if="showSupportModal" class="modal-overlay" @click.self="showSupportModal = false">
      <div class="modal support-modal">
        <div class="modal-header">
          <h3>🆘 Техническая поддержка</h3>
          <button class="close-btn" @click="showSupportModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Возникла проблема? Напишите нам, и мы поможем!</p>
          <div class="contacts-grid">
            <a href="mailto:support@egepro.ru" class="contact-card email">
              <div class="contact-icon">📧</div>
              <div class="contact-info">
                <span class="contact-title">Email поддержки</span>
                <span class="contact-value">support@egepro.ru</span>
              </div>
              <div class="contact-arrow">→</div>
            </a>
            <a href="https://t.me/egepro_support" target="_blank" class="contact-card telegram">
              <div class="contact-icon">💬</div>
              <div class="contact-info">
                <span class="contact-title">Telegram бот</span>
                <span class="contact-value">@egepro_support_bot</span>
              </div>
              <div class="contact-arrow">→</div>
            </a>
          </div>
          <div class="faq-section">
            <h4>❓ Частые вопросы</h4>
            <div class="faq-item">
              <button class="faq-question" @click="toggleFaq(0)">
                <span>Как сбросить пароль?</span>
                <span class="faq-icon">{{ openFaq === 0 ? '−' : '+' }}</span>
              </button>
              <div v-if="openFaq === 0" class="faq-answer">
                Нажмите на кнопку "Забыли пароль?" на странице входа. Вам придёт письмо со ссылкой для сброса.
              </div>
            </div>
            <div class="faq-item">
              <button class="faq-question" @click="toggleFaq(1)">
                <span>Не приходит письмо для подтверждения?</span>
                <span class="faq-icon">{{ openFaq === 1 ? '−' : '+' }}</span>
              </button>
              <div v-if="openFaq === 1" class="faq-answer">
                Проверьте папку "Спам". Если письма нет, напишите в поддержку.
              </div>
            </div>
            <div class="faq-item">
              <button class="faq-question" @click="toggleFaq(2)">
                <span>Как добавить предметы?</span>
                <span class="faq-icon">{{ openFaq === 2 ? '−' : '+' }}</span>
              </button>
              <div v-if="openFaq === 2" class="faq-answer">
                Зайдите в настройки профиля и выберите нужные предметы в разделе "Мои предметы".
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showSupportModal = false">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { useSubjectStore } from '@core/stores/subjectStore';
import { useAppStore } from '@core/stores/appStore';
import { useTheme } from '@core/composables/useTheme';
import CustomSelect from '@shared/components/CustomSelect.vue';
import { SUBJECTS_LIST, getSubjectById } from '@core/constants/subjects';
import { useEnglishProgressFirestore } from '@/modules/english/stores/englishProgressFirestore';
import { useEnglishPackStore } from '@/modules/english/stores/englishPackStore';

const router = useRouter();
const route = useRoute();
const subjectStore = useSubjectStore();
const appStore = useAppStore();
const englishProgress = useEnglishProgressFirestore();
const englishPackStore = useEnglishPackStore();

// Состояние модалок
const showSupportModal = ref(false);
const showContactsModal = ref(false);
const openFaq = ref(null);

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}

// Данные пользователя
const studentDisplayName = ref('');
const studentEmail = ref('');
const homeworkCount = ref(0);
const currentSubject = computed({
  get: () => subjectStore.currentSubject,
  set: (val) => subjectStore.setSubject(val)
});
const userSubjects = ref([]);
const allSubjects = SUBJECTS_LIST;

// Настройки
const showSettingsModal = ref(false);
const fontSize = ref(parseInt(localStorage.getItem('appFontSize') || '16'));
const savingSubjects = ref(false);
const { currentTheme, setTheme } = useTheme();

// Подписки
let unsubscribeUser = null;
let unsubscribeHomework = null;
let homeworkInterval = null;
let isMounted = true;

// Вычисляемые свойства
const userSubjectOptions = computed(() => {
  return userSubjects.value
    .map(id => getSubjectById(id))
    .filter(s => s)
    .map(s => ({ value: s.id, label: s.name, icon: s.icon }));
});

const currentSubjectConfig = computed(() => getSubjectById(currentSubject.value));

// Применение настроек
const applyFontSize = () => {
  document.documentElement.style.fontSize = fontSize.value + 'px';
  localStorage.setItem('appFontSize', fontSize.value);
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

const openSettings = () => {
  showSettingsModal.value = true;
};

// Сохранение предметов
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
    console.error(err);
    appStore.showToast('Ошибка сохранения', 'error');
  } finally {
    savingSubjects.value = false;
  }
};

// Загрузка количества ДЗ
const loadHomeworkCount = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const snapshot = await getCountFromServer(q);
    homeworkCount.value = snapshot.data().count;
  } catch (err) {
    console.error('Ошибка загрузки количества ДЗ:', err);
    homeworkCount.value = 0;
  }
};

// Переключение предмета с редиректом
// В StudentLayout.vue, внутри script setup

const switchSubject = (subjectId) => {
  // Определяем целевой путь
  let targetPath = '';
  if (subjectId === 'social') targetPath = '/student';
  else if (subjectId === 'chinese_hsk') targetPath = '/chinese';
  else if (subjectId === 'english_ielts') targetPath = '/english';
  else targetPath = `/student/${subjectId}`;
  
  // Меняем предмет в сторе
  subjectStore.setSubject(subjectId);
  
  // Редирект, если мы не на главной странице этого предмета
  if (route.path !== targetPath) {
    router.push(targetPath);
  }
};

// Навигация
const goToProfile = () => router.push('/profile');

const logout = async () => {
  isMounted = false;
  if (unsubscribeUser) unsubscribeUser();
  if (unsubscribeHomework) unsubscribeHomework();
  if (homeworkInterval) clearInterval(homeworkInterval);
  
  // Очищаем английский прогресс и паки
  englishProgress.reset();
  englishPackStore.packs = [];
  englishPackStore.loaded = false;
  
  await signOut(auth);
  router.push('/');
};

// Синхронизация предмета при изменении маршрута
watch(() => route.path, (newPath) => {
  let detectedSubject = null;
  if (newPath.startsWith('/chinese')) detectedSubject = 'chinese_hsk';
  else if (newPath.startsWith('/english')) detectedSubject = 'english_ielts';
  else if (newPath.startsWith('/student')) detectedSubject = 'social';
  
  if (detectedSubject && detectedSubject !== currentSubject.value) {
    subjectStore.setSubject(detectedSubject);
  }
}, { immediate: true });

// Жизненный цикл
onMounted(async () => {
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
    
    // Загружаем прогресс английского и паки
    await englishProgress.loadProgress();
    await englishPackStore.loadPacks();
    
    // Подписка на изменения ДЗ
    const homeworkQuery = query(
      collection(db, 'submissions'),
      where('studentId', '==', user.uid),
      where('status', '==', 'pending')
    );
    unsubscribeHomework = onSnapshot(homeworkQuery, () => loadHomeworkCount());
  }
  applyFontSize();
  loadHomeworkCount();
  homeworkInterval = setInterval(loadHomeworkCount, 60000);
});

onUnmounted(() => {
  isMounted = false;
  if (unsubscribeUser) unsubscribeUser();
  if (unsubscribeHomework) unsubscribeHomework();
  if (homeworkInterval) clearInterval(homeworkInterval);
});
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
.contacts-modal, .support-modal {
  background: white;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  background: linear-gradient(135deg, var(--primary-light) 0%, white 100%);
  border-radius: 1.5rem 1.5rem 0 0;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--secondary);
}
.close-btn {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--gray-600);
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: rotate(90deg);
}
.modal-body {
  padding: 1.5rem;
}
.modal-description {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  text-align: center;
}
.contacts-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
  background: white;
  cursor: pointer;
}
.contact-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}
.contact-card.telegram:hover {
  border-color: #0088cc;
  background: #0088cc08;
}
.contact-card.email:hover {
  border-color: #ea4335;
  background: #ea433508;
}
.contact-card.phone:hover {
  border-color: #34a853;
  background: #34a85308;
}
.contact-card.vk:hover {
  border-color: #4680c2;
  background: #4680c208;
}
.contact-icon {
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border-radius: 1rem;
}
.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.contact-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.contact-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--gray-800);
}
.contact-arrow {
  font-size: 1.2rem;
  color: var(--gray-400);
}
.support-note {
  background: var(--primary-light);
  padding: 0.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--primary-dark);
}
.note-icon {
  font-size: 1.1rem;
}
.faq-section {
  margin-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
  padding-top: 1rem;
}
.faq-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--gray-700);
}
.faq-item {
  margin-bottom: 0.5rem;
}
.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-700);
  transition: all 0.2s;
}
.faq-question:hover {
  background: var(--gray-100);
}
.faq-icon {
  font-size: 1.2rem;
  font-weight: 600;
}
.faq-answer {
  padding: 0.75rem;
  font-size: 0.8rem;
  color: var(--gray-600);
  background: var(--gray-50);
  border-radius: 0.75rem;
  margin-top: 0.25rem;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: center;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
body.dark-theme .modal-content,
body.dark-theme .contacts-modal,
body.dark-theme .support-modal {
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
body.dark-theme .modal-header {
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.15) 0%, var(--gray-800) 100%);
  border-bottom-color: var(--gray-700);
}
body.dark-theme .modal-header h3 {
  color: white;
}
body.dark-theme .modal-description {
  color: var(--gray-400);
}
body.dark-theme .contact-card {
  background: var(--gray-700);
  border-color: var(--gray-600);
}
body.dark-theme .contact-title {
  color: var(--gray-400);
}
body.dark-theme .contact-value {
  color: var(--gray-200);
}
body.dark-theme .contact-icon {
  background: var(--gray-600);
}
body.dark-theme .support-note {
  background: rgba(230, 126, 34, 0.15);
  color: var(--primary);
}
body.dark-theme .faq-question {
  background: var(--gray-700);
  color: var(--gray-200);
}
body.dark-theme .faq-question:hover {
  background: var(--gray-600);
}
body.dark-theme .faq-answer {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .faq-section {
  border-top-color: var(--gray-700);
}
</style>