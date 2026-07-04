<template>
  <StudentLayout>
    <div class="support-page">
      <div class="page-header">
        <h1>Поддержка</h1>
        <p>Возникла проблема? Напишите нам, и мы поможем!</p>
      </div>

      <div class="support-form">
        <div class="form-group">
          <label>Тема обращения</label>
          <select v-model="form.topic">
            <option value="error">Ошибка в работе платформы</option>
            <option value="suggestion">Предложение по улучшению</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div class="form-group">
          <label>Сообщение</label>
          <textarea v-model="form.message" rows="5" placeholder="Опишите проблему или предложение..."></textarea>
        </div>
        <div class="form-group">
          <label>Ваш email (для обратной связи)</label>
          <input type="email" v-model="form.email" placeholder="example@mail.ru" />
        </div>
        <button @click="sendMessage" class="btn-primary" :disabled="sending">
          {{ sending ? 'Отправка...' : 'Отправить' }}
        </button>

        <div v-if="sent" class="success-message">
          Спасибо! Ваше сообщение отправлено.
        </div>
      </div>

      <div class="faq-section">
        <h3>Частые вопросы</h3>
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
  </StudentLayout>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '@core/services/firebase';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useAppStore } from '@core/stores/appStore';

const appStore = useAppStore();
const form = ref({ topic: 'error', message: '', email: '' });
const sending = ref(false);
const sent = ref(false);
const openFaq = ref(null);

const toggleFaq = (index) => {
  openFaq.value = openFaq.value === index ? null : index;
};

const sendMessage = async () => {
  if (!form.value.message.trim()) {
    appStore.showToast('Введите сообщение', 'error');
    return;
  }
  sending.value = true;
  try {
    const user = auth.currentUser;
    const messages = JSON.parse(localStorage.getItem('support_messages') || '[]');
    messages.push({
      id: Date.now(),
      userId: user?.uid,
      userEmail: form.value.email || user?.email,
      topic: form.value.topic,
      message: form.value.message,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('support_messages', JSON.stringify(messages));
    sent.value = true;
    form.value = { topic: 'error', message: '', email: '' };
    setTimeout(() => { sent.value = false; }, 3000);
    appStore.showToast('Сообщение отправлено', 'success');
  } catch (err) {
    console.error(err);
    appStore.showToast('Ошибка отправки', 'error');
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
.support-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header {
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}
.support-form {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
}
select, textarea, input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  background: white;
  font-family: inherit;
  font-size: 1rem;
}
select:focus, textarea:focus, input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230,126,34,0.1);
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  width: 100%;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(16,185,129,0.1);
  color: var(--success);
  border-radius: 0.75rem;
  text-align: center;
}
.faq-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.faq-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--secondary);
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
  font-size: 0.9rem;
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
  font-size: 0.85rem;
  color: var(--gray-600);
  background: var(--gray-50);
  border-radius: 0.75rem;
  margin-top: 0.25rem;
}
body.dark-theme .support-form,
body.dark-theme .faq-section {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .form-group label {
  color: var(--gray-300);
}
body.dark-theme select,
body.dark-theme textarea,
body.dark-theme input {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
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
</style>