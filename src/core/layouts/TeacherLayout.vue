<template>
  <div class="teacher-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>SkillHub</h2>
        <span class="role-badge">Учитель</span>
      </div>

      <nav class="sidebar-nav">
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

        <button @click="openSettings" class="nav-item settings-nav">
          <span class="nav-icon">⚙️</span>
          <span>Настройки</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-info" @click="goToProfile">
          <div class="profile-text">
            <span class="profile-name">{{ teacherDisplayName }}</span>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useTheme } from '@core/composables/useTheme';
import { useAppStore } from '@core/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

// Модалки
const showSupportModal = ref(false);
const showContactsModal = ref(false);
const openFaq = ref(null);

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}

// Данные
const teacherDisplayName = ref('');
const teacherEmail = ref('');
const pendingCount = ref(0);
const showSettingsModal = ref(false);
const fontSize = ref(parseInt(localStorage.getItem('appFontSize') || '16'));
const { currentTheme, setTheme } = useTheme();

// Подписки
let unsubscribePending = null;
let unsubscribeUser = null;

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

const openSettings = () => { showSettingsModal.value = true; };

const loadPendingCount = async () => {
  try {
    const pendingQuery = query(collection(db, 'submissions'), where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);
    pendingCount.value = pendingSnapshot.size;
  } catch (error) {
    console.error(error);
    pendingCount.value = 0;
  }
};

const goToProfile = () => router.push('/profile');

const logout = async () => {
  if (unsubscribePending) unsubscribePending();
  if (unsubscribeUser) unsubscribeUser();
  await signOut(auth);
  router.push('/');
};

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    teacherEmail.value = user.email;
    const userRef = doc(db, 'users', user.uid);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        teacherDisplayName.value = docSnap.data().displayName || docSnap.data().login || user.email;
      }
    });
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      teacherDisplayName.value = userDoc.data().displayName || userDoc.data().login || user.email;
    } else {
      teacherDisplayName.value = user.email;
    }
  }
  applyFontSize();
  await loadPendingCount();
  const pendingQuery = query(collection(db, 'submissions'), where('status', '==', 'pending'));
  unsubscribePending = onSnapshot(pendingQuery, () => loadPendingCount());
});

onUnmounted(() => {
  if (unsubscribePending) unsubscribePending();
  if (unsubscribeUser) unsubscribeUser();
});
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
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
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
  width: 100%;
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