<template>
  <StudentLayout>
    <div class="grammar-view">
      <div class="page-header">
        <h1>Грамматика</h1>
        <p class="subtitle">HSK {{ currentLevel }}</p>
      </div>

      <div class="level-selector">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level; loadGrammar()"
        >
          HSK {{ level }}
        </button>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по паттерну или объяснению..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading">Загрузка грамматики...</div>
      <div v-else-if="filteredGrammar.length === 0" class="empty-state">
        <div class="empty-icon">📐</div>
        <p>Грамматические темы не найдены</p>
      </div>
      <div v-else class="grammar-list">
        <div
          v-for="item in filteredGrammar"
          :key="item.id"
          class="grammar-card"
          @click="openGrammarModal(item)"
        >
          <div class="grammar-pattern">{{ item.pattern }}</div>
          <div class="grammar-explanation-preview">{{ item.explanation.slice(0, 100) }}...</div>
          <div class="grammar-level">HSK {{ item.level }}</div>
        </div>
      </div>

      <!-- Модалка деталей грамматики -->
      <div v-if="selectedGrammar" class="modal-overlay" @click.self="selectedGrammar = null">
        <div class="modal grammar-modal">
          <div class="modal-header">
            <h2>{{ selectedGrammar.pattern }}</h2>
            <button class="close-btn" @click="selectedGrammar = null">✕</button>
          </div>
          <div class="modal-body">
            <p class="explanation-full">{{ selectedGrammar.explanation }}</p>
            <h4>Примеры:</h4>
            <ul class="examples-list">
              <li v-for="(ex, idx) in selectedGrammar.examples" :key="idx">
                <template v-if="typeof ex === 'string'">
                  <span class="example-chinese">{{ ex }}</span>
                  <button class="audio-btn-small" @click="playAudio(ex)">🔊</button>
                </template>
                <template v-else>
                  <span class="example-chinese">{{ ex.chinese }}</span>
                  <button class="audio-btn-small" @click="playAudio(ex.chinese)">🔊</button>
                  <span class="example-pinyin" v-if="ex.pinyin"> ({{ ex.pinyin }})</span>
                  <span class="example-translation" v-if="ex.translation"> – {{ ex.translation }}</span>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@/layouts/StudentLayout.vue'
import { useChineseGrammarStore } from '@/stores/chineseGrammarStore'
import { speak } from '@/services/tts'

const grammarStore = useChineseGrammarStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const searchQuery = ref('')
const loading = ref(false)
const selectedGrammar = ref(null)

onMounted(async () => {
  await loadGrammar()
})

async function loadGrammar() {
  loading.value = true
  await grammarStore.loadGrammar(currentLevel.value)
  loading.value = false
}

const filteredGrammar = computed(() => {
  let result = grammarStore.grammarPoints
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(g =>
      g.pattern.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q)
    )
  }
  return result
})

function openGrammarModal(item) {
  selectedGrammar.value = item
}

async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    console.error('Audio error:', error)
  }
}
</script>

<style scoped>
.grammar-view {
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
.grammar-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}
.grammar-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}
.grammar-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.grammar-pattern {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 0.5rem;
}
.grammar-explanation-preview {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}
.grammar-level {
  font-size: 0.7rem;
  color: var(--gray-400);
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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
.explanation-full {
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}
.examples-list {
  margin: 0;
  padding-left: 1rem;
}
.examples-list li {
  margin: 0.5rem 0;
}
.example-chinese {
  font-weight: 500;
}
.example-pinyin {
  color: var(--gray-500);
  font-style: italic;
}
.example-translation {
  color: var(--gray-500);
}
.audio-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
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
body.dark-theme .grammar-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .grammar-pattern {
  color: var(--primary);
}
body.dark-theme .grammar-explanation-preview {
  color: var(--gray-400);
}
</style>