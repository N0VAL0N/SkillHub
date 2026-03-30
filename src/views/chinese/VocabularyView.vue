<template>
  <StudentLayout>
    <div class="vocabulary-view">
      <div class="page-header">
        <h1>Словарь</h1>
        <p class="subtitle">HSK {{ currentLevel }}</p>
      </div>

      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level; loadWords()"
        >
          HSK {{ level }}
        </button>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по иероглифу или переводу..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading">Загрузка слов...</div>
      <div v-else-if="filteredWords.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <p>Слова не найдены</p>
      </div>
      <div v-else class="words-grid">
        <div
          v-for="word in filteredWords"
          :key="word.id"
          class="word-card"
          @click="showWordDetails(word)"
        >
          <div class="word-hanzi">{{ word.simplified }}</div>
          <div class="word-pinyin">{{ word.pinyin }}</div>
          <div class="word-translation">{{ word.translations?.ru || word.translations }}</div>
          <div class="word-topics" v-if="word.topics?.length">
            {{ word.topics.slice(0, 2).join(', ') }}
          </div>
          <div class="word-learned" v-if="isLearned(word.id)">
            <span class="learned-badge">✓ Выучено</span>
          </div>
        </div>
      </div>

      <!-- Модалка деталей слова -->
      <div v-if="selectedWord" class="modal-overlay" @click.self="selectedWord = null">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ selectedWord.simplified }}</h2>
            <button class="close-btn" @click="selectedWord = null">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>Пиньинь:</strong> {{ selectedWord.pinyin }}</p>
            <p><strong>Перевод:</strong> {{ selectedWord.translations?.ru || selectedWord.translations }}</p>
            <p><strong>Уровень:</strong> HSK {{ selectedWord.level }}</p>
            <p><strong>Темы:</strong> {{ selectedWord.topics?.join(', ') || '—' }}</p>
            <button
              v-if="!isLearned(selectedWord.id)"
              class="btn-primary mark-learned"
              @click="markAsLearned(selectedWord.id)"
            >
              Отметить выученным
            </button>
            <button class="btn-outline" @click="playAudio(selectedWord.simplified)">
              🔊 Прослушать
            </button>
            <button class="btn-outline" @click="openStrokeOrder(selectedWord)">
              ✍️ Порядок черт
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка порядка черт -->
      <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
        <div class="modal stroke-modal">
          <div class="modal-header">
            <h3>{{ strokeCharacter }}</h3>
            <button class="close-btn" @click="showStrokeModal = false">✕</button>
          </div>
          <StrokeOrder :character="strokeCharacter" :size="200" />
        </div>
      </div>

      <!-- Тост -->
      <div v-if="toastVisible" class="custom-toast" :class="toastType">
        <span class="toast-icon">{{ toastType === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-message">{{ toastMessage }}</span>
        <button class="toast-close" @click="hideToast">×</button>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@/layouts/StudentLayout.vue'
import { useChineseVocabularyStore } from '@/stores/chineseVocabularyStore'
import { useChineseProgressStore } from '@/stores/chineseProgressStore'
import { useAppStore } from '@/stores/appStore'
import { speak } from '@/services/tts'
import StrokeOrder from '@/components/chinese/StrokeOrder.vue'

const vocabStore = useChineseVocabularyStore()
const progressStore = useChineseProgressStore()
const appStore = useAppStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const searchQuery = ref('')
const loading = ref(false)
const selectedWord = ref(null)
const showStrokeModal = ref(false)
const strokeCharacter = ref('')

// Для тоста
const toastMessage = computed(() => appStore.toastMessage)
const toastType = computed(() => appStore.toastType)
const toastVisible = computed(() => appStore.toastVisible)
const hideToast = () => appStore.hideToast()

onMounted(async () => {
  await loadWords()
  await progressStore.loadProgress()
})

async function loadWords() {
  loading.value = true
  await vocabStore.loadVocabulary(currentLevel.value)
  loading.value = false
}

const filteredWords = computed(() => {
  let result = vocabStore.words
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(w =>
      w.simplified.includes(q) ||
      w.pinyin.includes(q) ||
      (w.translations?.ru || w.translations).toLowerCase().includes(q)
    )
  }
  return result
})

function isLearned(wordId) {
  return progressStore.learnedWords.includes(wordId)
}

function markAsLearned(wordId) {
  progressStore.addLearnedWord(wordId)
  appStore.showToast('Слово отмечено выученным!', 'success')
}

function showWordDetails(word) {
  selectedWord.value = word
}

async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error')
  }
}

function openStrokeOrder(word) {
  strokeCharacter.value = word.simplified
  showStrokeModal.value = true
}
</script>

<style scoped>
.vocabulary-view {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--secondary);
}
.subtitle {
  margin: 0.25rem 0 0;
  color: var(--gray-500);
}
.level-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.level-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.level-btn.active {
  background: var(--primary);
  color: white;
}
.search-bar {
  margin-bottom: 1.5rem;
}
.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  font-size: 1rem;
}
.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.word-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.word-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.word-hanzi {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--secondary);
}
.word-pinyin {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin: 0.25rem 0;
}
.word-translation {
  font-size: 0.9rem;
  color: var(--gray-700);
}
.word-topics {
  font-size: 0.7rem;
  color: var(--gray-400);
  margin-top: 0.5rem;
}
.word-learned {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}
.learned-badge {
  background: var(--success);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
}
.modal-overlay {
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
.modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h2 {
  margin: 0;
  color: var(--secondary);
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-body p {
  margin: 0.5rem 0;
}
.mark-learned {
  margin-top: 1rem;
  width: 100%;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  margin-top: 0.5rem;
  width: 100%;
}
.loading, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
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
body.dark-theme .word-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .word-hanzi {
  color: white;
}
body.dark-theme .word-translation {
  color: var(--gray-300);
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
</style>