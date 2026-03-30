<template>
  <TeacherLayout>
    <div class="chinese-teacher-dashboard">
      <div class="coming-soon">
        <div class="coming-soon-icon">👨‍🏫</div>
        <h2>Учительский раздел китайского языка</h2>
        <p>Функционал для учителей по китайскому языку находится в разработке.</p>
        <p>Здесь будут доступны:</p>
        <ul>
          <li>📊 Статистика учеников по уровням HSK</li>
          <li>📝 Проверка письменных и устных работ</li>
          <li>🎧 Прослушивание аудиозаписей учеников</li>
          <li>📚 Управление учебными материалами</li>
          <li>📋 Создание и назначение экзаменов HSK</li>
        </ul>
        <div class="btn-group">
          <button @click="$router.push('/teacher')" class="btn-primary">Вернуться к обществознанию</button>
          <button @click="openSettings" class="btn-outline">Настройки</button>
        </div>
      </div>

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
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TeacherLayout from '@core/layouts/TeacherLayout.vue'

const showSettingsModal = ref(false)
const fontSize = ref(parseInt(localStorage.getItem('teacherFontSize') || '16'))
const currentTheme = ref(localStorage.getItem('theme') || 'light')

function applySettings() {
  document.documentElement.style.fontSize = fontSize.value + 'px'
  if (currentTheme.value === 'dark') {
    document.body.classList.add('dark-theme')
  } else {
    document.body.classList.remove('dark-theme')
  }
}

function increaseFontSize() {
  if (fontSize.value < 24) {
    fontSize.value++
    localStorage.setItem('teacherFontSize', fontSize.value)
    applySettings()
  }
}

function decreaseFontSize() {
  if (fontSize.value > 12) {
    fontSize.value--
    localStorage.setItem('teacherFontSize', fontSize.value)
    applySettings()
  }
}

function setTheme(theme) {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  applySettings()
}

function openSettings() {
  showSettingsModal.value = true
}

onMounted(() => {
  applySettings()
})
</script>

<style scoped>
.chinese-teacher-dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.coming-soon {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid var(--gray-200);
}

.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.coming-soon h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}

.coming-soon p {
  margin-bottom: 1rem;
  color: var(--gray-600);
}

.coming-soon ul {
  text-align: left;
  max-width: 300px;
  margin: 0 auto 2rem;
  color: var(--gray-600);
}

.coming-soon li {
  margin: 0.5rem 0;
}

.btn-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.6rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
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

.font-size-controls,
.theme-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.font-size-controls button,
.theme-controls button {
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

body.dark-theme .coming-soon,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .coming-soon h2 {
  color: white;
}
</style>