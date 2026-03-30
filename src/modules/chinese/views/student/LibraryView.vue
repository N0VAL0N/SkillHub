<template>
  <StudentLayout>
    <div class="library-view">
      <div class="page-header">
        <h1>Библиотека</h1>
        <p class="subtitle">Словарь, грамматика, тексты и радикалы</p>
      </div>

      <!-- Уровни HSK (только для словаря/грамматики/текстов) -->
      <div class="level-selector" v-if="activeTab !== 'radicals'">
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: currentLevel === level }"
          @click="currentLevel = level"
        >
          HSK {{ level }}
        </button>
      </div>

      <!-- Табы -->
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'vocabulary' }"
          @click="activeTab = 'vocabulary'"
        >
          📖 Словарь ({{ filteredWords.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'grammar' }"
          @click="activeTab = 'grammar'"
        >
          📐 Грамматика ({{ filteredGrammar.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'readings' }"
          @click="activeTab = 'readings'"
        >
          📰 Тексты ({{ filteredReadings.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'radicals' }"
          @click="activeTab = 'radicals'"
        >
          ✍️ Радикалы ({{ radicals.length }})
        </button>
      </div>

      <!-- Поиск (для словаря, грамматики, радикалов) -->
      <div v-if="activeTab !== 'readings'" class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
        />
      </div>

      <!-- Словарь -->
      <div v-if="activeTab === 'vocabulary'" class="vocabulary-section">
        <div v-if="filteredWords.length === 0" class="empty-state">
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
      </div>

      <!-- Грамматика -->
      <div v-if="activeTab === 'grammar'" class="grammar-section">
        <div v-if="filteredGrammar.length === 0" class="empty-state">
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
      </div>

      <!-- Тексты -->
      <div v-if="activeTab === 'readings'" class="readings-section">
        <div v-if="filteredReadings.length === 0" class="empty-state">
          <div class="empty-icon">📰</div>
          <p>Нет текстов для выбранного уровня</p>
        </div>
        <div v-else class="readings-list">
          <div
            v-for="reading in filteredReadings"
            :key="reading.id"
            class="reading-card"
            :class="{ completed: isReadingCompleted(reading.id) }"
            @click="openReading(reading)"
          >
            <h3>{{ reading.title_ru || reading.title }}</h3>
            <p class="preview">{{ reading.content.slice(0, 100) }}...</p>
            <div class="reading-meta">
              <span class="questions-count">{{ reading.questions?.length || 0 }} вопросов</span>
              <span v-if="isReadingCompleted(reading.id)" class="completed-badge">✓ Прочитано</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Радикалы -->
      <div v-if="activeTab === 'radicals'" class="radicals-section">
        <div v-if="filteredRadicals.length === 0" class="empty-state">
          <div class="empty-icon">✍️</div>
          <p>Радикалы не найдены</p>
        </div>
        <div v-else class="radicals-grid">
          <div
            v-for="radical in filteredRadicals"
            :key="radical.id"
            class="radical-card"
            @click="openRadicalModal(radical)"
          >
            <div class="radical-char">{{ radical.character }}</div>
            <div class="radical-pinyin">{{ radical.pinyin }}</div>
            <div class="radical-meaning">{{ radical.meaning }}</div>
            <div class="radical-strokes">{{ radical.strokes }} черт</div>
            <div class="radical-examples" v-if="radical.examples?.length">
              <span class="examples-label">Примеры:</span>
              <span class="examples-chars">{{ radical.examples.slice(0, 5).join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалка деталей слова (без изменений) -->
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
              class="btn-primary"
              @click="markAsLearned(selectedWord.id)"
            >
              Отметить выученным
            </button>
            <button class="btn-outline" @click="playAudio(selectedWord.simplified)">
              🔊 Прослушать
            </button>
            <button class="btn-outline" @click="openStrokeOrder(selectedWord.simplified)">
              ✍️ Порядок черт
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка грамматики (без изменений) -->
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
                <span class="example-chinese">{{ typeof ex === 'string' ? ex : ex.chinese }}</span>
                <button class="audio-btn-small" @click="playAudio(typeof ex === 'string' ? ex : ex.chinese)">🔊</button>
                <span class="example-translation" v-if="typeof ex !== 'string' && ex.translation"> – {{ ex.translation }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Модалка текста (без изменений) -->
      <div v-if="selectedReading" class="modal-overlay" @click.self="selectedReading = null">
        <div class="modal reading-modal">
          <div class="modal-header">
            <h2>{{ selectedReading.title_ru || selectedReading.title }}</h2>
            <button class="close-btn" @click="selectedReading = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="reading-content">
              <p>{{ selectedReading.content }}</p>
            </div>
            <div v-if="selectedReading.questions?.length" class="questions">
              <h4>Вопросы:</h4>
              <div v-for="(q, idx) in selectedReading.questions" :key="idx" class="question-item">
                <p class="question-text">{{ q.question.ru || q.question.chinese }}</p>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in q.options"
                    :key="optIdx"
                    @click="!selectedReading.readonly && checkReadingAnswer(idx, optIdx)"
                    :disabled="selectedReading.readonly || readingAnswers[idx] !== undefined"
                    :class="[
                      'option-btn',
                      { correct: readingAnswers[idx] === optIdx && optIdx === q.answer }
                    ]"
                  >
                    {{ opt.ru || opt.chinese }}
                  </button>
                </div>
              </div>
              <div v-if="allReadingCorrect && !selectedReading.readonly" class="completion-message">
                <p>✅ Поздравляем! Вы правильно ответили на все вопросы.</p>
                <button class="btn-primary" @click="markReadingAsCompleted">Отметить прочитанным</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалка радикала -->
      <div v-if="selectedRadical" class="modal-overlay" @click.self="selectedRadical = null">
        <div class="modal radical-modal">
          <div class="modal-header">
            <h2>{{ selectedRadical.character }}</h2>
            <button class="close-btn" @click="selectedRadical = null">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>Пиньинь:</strong> {{ selectedRadical.pinyin }}</p>
            <p><strong>Значение:</strong> {{ selectedRadical.meaning }}</p>
            <p><strong>Количество черт:</strong> {{ selectedRadical.strokes }}</p>
            <div v-if="selectedRadical.examples?.length" class="radical-examples-full">
              <strong>Примеры иероглифов с этим радикалом:</strong>
              <div class="examples-grid">
                <span v-for="ex in selectedRadical.examples" :key="ex" class="example-char" @click="searchByExample(ex)">
                  {{ ex }}
                </span>
              </div>
            </div>
            <button class="btn-outline" @click="playAudio(selectedRadical.character)">
              🔊 Прослушать
            </button>
            <button class="btn-outline" @click="openStrokeOrder(selectedRadical.character)">
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
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChineseProgressStore } from '@modules/chinese/stores/chineseProgressStore'
import { useAppStore } from '@core/stores/appStore'
import { speak } from '@core/services/tts'
import StrokeOrder from '@modules/chinese/components/StrokeOrder.vue'

// Импорт данных напрямую из JSON
import hskAll from '@modules/chinese/data/hsk_all.json'
import grammarAll from '@modules/chinese/data/grammar_all.json'
import readingsData from '@modules/chinese/data/hsk-reading.json'
import radicalsData from '@modules/chinese/data/radicals.json'

const progressStore = useChineseProgressStore()
const appStore = useAppStore()

const levels = ['1', '2', '3', '4', '5']
const currentLevel = ref('1')
const activeTab = ref('vocabulary')
const searchQuery = ref('')

// Данные
const allWords = ref([])
const allGrammar = ref([])
const allReadings = ref([])
const radicals = ref([])

// Выбранные элементы для модалок
const selectedWord = ref(null)
const selectedGrammar = ref(null)
const selectedReading = ref(null)
const selectedRadical = ref(null)
const readingAnswers = ref({})
const showStrokeModal = ref(false)
const strokeCharacter = ref('')

// Фильтры
const filteredWords = computed(() => {
  let result = allWords.value.filter(w => String(w.level) === String(currentLevel.value))
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

const filteredGrammar = computed(() => {
  let result = allGrammar.value.filter(g => String(g.level) === String(currentLevel.value))
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(g =>
      g.pattern.toLowerCase().includes(q) ||
      g.explanation.toLowerCase().includes(q)
    )
  }
  return result
})

const filteredReadings = computed(() => {
  return allReadings.value.filter(r => String(r.level) === String(currentLevel.value))
})

const filteredRadicals = computed(() => {
  let result = radicals.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.character.includes(searchQuery.value) ||
      r.pinyin.toLowerCase().includes(q) ||
      r.meaning.toLowerCase().includes(q)
    )
  }
  return result
})

const searchPlaceholder = computed(() => {
  if (activeTab.value === 'vocabulary') return 'Поиск по иероглифу или переводу...'
  if (activeTab.value === 'grammar') return 'Поиск по паттерну или объяснению...'
  if (activeTab.value === 'radicals') return 'Поиск по радикалу, пиньинь или значению...'
  return ''
})

// Прогресс
function isLearned(wordId) {
  return progressStore.learnedWords.includes(wordId)
}

function isReadingCompleted(readingId) {
  return progressStore.completedReadings?.includes(readingId)
}

function markAsLearned(wordId) {
  progressStore.addLearnedWord(wordId)
  appStore.showToast('Слово отмечено выученным!', 'success')
}

// Модалки
function showWordDetails(word) {
  selectedWord.value = word
}

function openGrammarModal(item) {
  selectedGrammar.value = item
}

function openReading(reading) {
  selectedReading.value = {
    ...reading,
    readonly: isReadingCompleted(reading.id)
  }
  readingAnswers.value = {}
}

function openRadicalModal(radical) {
  selectedRadical.value = radical
}

function checkReadingAnswer(questionIndex, optionIndex) {
  if (readingAnswers.value[questionIndex] !== undefined) return
  readingAnswers.value[questionIndex] = optionIndex
}

const allReadingCorrect = computed(() => {
  if (!selectedReading.value?.questions) return false
  return selectedReading.value.questions.every((q, idx) => 
    readingAnswers.value[idx] === q.answer
  )
})

function markReadingAsCompleted() {
  if (selectedReading.value) {
    progressStore.addCompletedReading(selectedReading.value.id)
    selectedReading.value.readonly = true
    selectedReading.value = null
  }
}

function searchByExample(example) {
  // Переключаем на словарь и ищем этот иероглиф
  activeTab.value = 'vocabulary'
  searchQuery.value = example
}

// Аудио и порядок черт
async function playAudio(text) {
  try {
    await speak(text, 'zh-CN')
  } catch (error) {
    appStore.showToast('Ошибка воспроизведения аудио', 'error')
  }
}

function openStrokeOrder(char) {
  strokeCharacter.value = char
  showStrokeModal.value = true
}

// Загрузка данных
function loadData() {
  allWords.value = hskAll
  allGrammar.value = grammarAll
  allReadings.value = readingsData
  radicals.value = radicalsData
}

onMounted(async () => {
  loadData()
  await progressStore.loadProgress()
})
</script>

<style scoped>
/* ... все стили остаются как в предыдущей версии ... */
/* Добавляем стили для радикалов */

.radicals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.radical-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.radical-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.radical-char {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.radical-pinyin {
  font-size: 0.85rem;
  color: var(--gray-500);
}

.radical-meaning {
  font-size: 0.9rem;
  color: var(--gray-700);
  margin: 0.25rem 0;
}

.radical-strokes {
  font-size: 0.7rem;
  color: var(--gray-400);
  margin-bottom: 0.5rem;
}

.radical-examples {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
  border-top: 1px solid var(--gray-200);
  padding-top: 0.5rem;
}

.examples-label {
  font-weight: 500;
  margin-right: 0.25rem;
}

.examples-chars {
  word-break: break-word;
}

.radical-modal .examples-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.example-char {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: var(--gray-100);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.example-char:hover {
  background: var(--primary);
  color: white;
}

.radical-examples-full {
  margin: 1rem 0;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}

/* Тёмная тема для радикалов */
body.dark-theme .radical-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .radical-meaning {
  color: var(--gray-300);
}

body.dark-theme .radical-examples {
  border-color: var(--gray-700);
}

body.dark-theme .radical-examples-full {
  background: var(--gray-700);
}

body.dark-theme .example-char {
  background: var(--gray-600);
  color: var(--gray-200);
}

body.dark-theme .example-char:hover {
  background: var(--primary);
  color: white;
}
.library-view {
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

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--gray-500);
  border-radius: 2rem;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
}

.search-bar {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  font-size: 1rem;
}

/* Словарь */
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

/* Грамматика */
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

/* Тексты */
.readings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reading-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}

.reading-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.reading-card.completed {
  border-left: 4px solid var(--success);
}

.reading-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}

.preview {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--gray-500);
}

.reading-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.questions-count {
  font-size: 0.7rem;
  color: var(--gray-400);
}

.completed-badge {
  font-size: 0.7rem;
  color: var(--success);
}

/* Модалки */
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

.modal-body p {
  margin: 0.5rem 0;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  margin-right: 0.5rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  margin-top: 0.5rem;
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

.audio-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
}

.reading-content {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.question-item {
  margin-bottom: 1rem;
}

.question-text {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.option-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 2rem;
  cursor: pointer;
}

.option-btn.correct {
  background: rgba(16, 185, 129, 0.2);
  border-color: var(--success);
  color: var(--success);
}

.completion-message {
  margin-top: 1rem;
  text-align: center;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.75rem;
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

body.dark-theme .word-card,
body.dark-theme .grammar-card,
body.dark-theme .reading-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .word-hanzi {
  color: white;
}

body.dark-theme .reading-content {
  background: var(--gray-700);
}
</style>