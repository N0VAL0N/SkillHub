<template>
  <StudentLayout>
    <div class="library-view">
      <div class="page-header">
        <div>
          <h1>Библиотека</h1>
          <p class="subtitle">Словарь, грамматика, идиомы, фразовые глаголы и многое другое</p>
        </div>
        <button class="btn-outline refresh-btn" @click="refreshAllData" :disabled="refreshing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4V10H17M1 20V14H7"/>
            <path d="M3.51 9C4.85 5.18 8.5 2.5 13 2.5C18.5 2.5 22.5 6.5 22.5 12"/>
            <path d="M20.49 15C19.15 18.82 15.5 21.5 11 21.5C5.5 21.5 1.5 17.5 1.5 12"/>
          </svg>
          Обновить
        </button>
      </div>

      <!-- Фильтр уровней -->
      <div class="level-selector multi">
        <span class="level-label">Фильтр по уровням:</span>
        <button
          v-for="level in levels"
          :key="level"
          class="level-btn"
          :class="{ active: selectedLevels.includes(level) }"
          @click="toggleLevel(level)"
        >
          {{ level }}
        </button>
        <button class="level-btn all-btn" @click="selectAllLevels">Все</button>
        <button class="level-btn reset-btn" @click="resetLevels">Сбросить</button>
      </div>

      <!-- Табы -->
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'vocabulary' }"
          @click="activeTab = 'vocabulary'"
        >
          📖 Словарь ({{ filteredVocabulary.length }})
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
          :class="{ active: activeTab === 'irregular' }"
          @click="activeTab = 'irregular'"
        >
          🔄 Неправ. глаголы ({{ filteredIrregular.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'phrasal' }"
          @click="activeTab = 'phrasal'"
        >
          🔗 Фразовые глаголы ({{ filteredPhrasal.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'idioms' }"
          @click="activeTab = 'idioms'"
        >
          💡 Идиомы ({{ filteredIdioms.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'collocations' }"
          @click="activeTab = 'collocations'"
        >
          🤝 Коллокации ({{ filteredCollocations.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'readings' }"
          @click="activeTab = 'readings'"
        >
          📰 Тексты ({{ filteredReadings.length }})
        </button>
      </div>

      <!-- Поиск -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
        />
      </div>

      <!-- Словарь -->
      <div v-if="activeTab === 'vocabulary'" class="vocabulary-section">
        <div v-if="filteredVocabulary.length === 0" class="empty-state">
          <div class="empty-icon">📖</div>
          <p>Слова не найдены</p>
        </div>
        <div v-else class="words-grid">
          <div
            v-for="word in filteredVocabulary"
            :key="word.id"
            class="word-card"
            @click="openWordModal(word)"
          >
            <div class="word-word">{{ word.word }}</div>
            <div class="word-transcription">{{ word.transcription }}</div>
            <div class="word-translation">{{ word.translation }}</div>
            <div class="word-part" v-if="word.part_of_speech">
              {{ word.part_of_speech }}
            </div>
            <div class="word-level">{{ word.level }}</div>
            <div class="word-learned" v-if="isLearned(word.id)">✓ Выучено</div>
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
            :key="item.rule_id"
            class="grammar-card"
            @click="openGrammarModal(item)"
          >
            <div class="grammar-title">{{ item.title }}</div>
            <div class="grammar-category">{{ item.category }}</div>
            <div class="grammar-preview">
              {{ item.theory ? item.theory.slice(0, 100) : '' }}...
            </div>
            <div class="grammar-level">{{ item.level }}</div>
          </div>
        </div>
      </div>

      <!-- Неправильные глаголы -->
      <div v-if="activeTab === 'irregular'" class="irregular-section">
        <div v-if="filteredIrregular.length === 0" class="empty-state">
          <div class="empty-icon">🔄</div>
          <p>Неправильные глаголы не найдены</p>
        </div>
        <div v-else class="irregular-grid">
          <div
            v-for="verb in filteredIrregular"
            :key="verb.id"
            class="irregular-card"
            @click="openIrregularModal(verb)"
          >
            <div class="irregular-base">{{ verb.base }}</div>
            <div class="irregular-forms">
              {{ verb.past_simple }} → {{ verb.past_participle }}
            </div>
            <div class="irregular-translation">{{ verb.translation }}</div>
            <div class="irregular-level">{{ verb.level }}</div>
          </div>
        </div>
      </div>

      <!-- Фразовые глаголы -->
      <div v-if="activeTab === 'phrasal'" class="phrasal-section">
        <div v-if="filteredPhrasal.length === 0" class="empty-state">
          <div class="empty-icon">🔗</div>
          <p>Фразовые глаголы не найдены</p>
        </div>
        <div v-else class="phrasal-grid">
          <div
            v-for="item in filteredPhrasal"
            :key="item.id"
            class="phrasal-card"
            @click="openPhrasalModal(item)"
          >
            <div class="phrasal-verb">{{ item.verb }}</div>
            <div class="phrasal-translation">{{ item.translation }}</div>
            <div class="phrasal-example">{{ item.example }}</div>
            <div class="phrasal-level">{{ item.level }}</div>
          </div>
        </div>
      </div>

      <!-- Идиомы -->
      <div v-if="activeTab === 'idioms'" class="idioms-section">
        <div v-if="filteredIdioms.length === 0" class="empty-state">
          <div class="empty-icon">💡</div>
          <p>Идиомы не найдены</p>
        </div>
        <div v-else class="idioms-grid">
          <div
            v-for="item in filteredIdioms"
            :key="item.id"
            class="idiom-card"
            @click="openIdiomModal(item)"
          >
            <div class="idiom-expression">{{ item.expression }}</div>
            <div class="idiom-translation">{{ item.translation }}</div>
            <div class="idiom-example">{{ item.example }}</div>
            <div class="idiom-level">{{ item.level }}</div>
          </div>
        </div>
      </div>

      <!-- Коллокации -->
      <div v-if="activeTab === 'collocations'" class="collocations-section">
        <div v-if="filteredCollocations.length === 0" class="empty-state">
          <div class="empty-icon">🤝</div>
          <p>Коллокации не найдены</p>
        </div>
        <div v-else class="collocations-grid">
          <div
            v-for="item in filteredCollocations"
            :key="item.id"
            class="collocation-card"
            @click="openCollocationModal(item)"
          >
            <div class="collocation-text">{{ item.collocation }}</div>
            <div class="collocation-translation">{{ item.translation }}</div>
            <div class="collocation-example">{{ item.example }}</div>
            <div class="collocation-level">{{ item.level }}</div>
          </div>
        </div>
      </div>

      <!-- Тексты -->
      <div v-if="activeTab === 'readings'" class="readings-section">
        <div v-if="filteredReadings.length === 0" class="empty-state">
          <div class="empty-icon">📰</div>
          <p>Нет текстов для выбранных уровней</p>
        </div>
        <div v-else class="readings-list">
          <div
            v-for="reading in filteredReadings"
            :key="reading.id"
            class="reading-card"
            @click="openReadingModal(reading)"
          >
            <h3>{{ reading.title }}</h3>
            <p class="preview">{{ reading.text ? reading.text.slice(0, 100) : '' }}...</p>
            <div class="reading-meta">
              <span class="questions-count">{{ reading.questions?.length || 0 }} вопросов</span>
              <span v-if="isReadingCompleted(reading.id)" class="completed-badge">✓ Прочитано</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== МОДАЛКИ ===================== -->

      <!-- Модалка слова -->
      <div v-if="selectedWord" class="modal-overlay" @click.self="selectedWord = null">
        <div class="modal word-modal">
          <div class="modal-header accent">
            <h2>{{ selectedWord.word }}</h2>
            <button class="close-btn custom-close" @click="selectedWord = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Транскрипция:</strong> {{ selectedWord.transcription }}</div>
            <div class="detail-row"><strong>Перевод:</strong> {{ selectedWord.translation }}</div>
            <div class="detail-row"><strong>Часть речи:</strong> {{ selectedWord.part_of_speech || '—' }}</div>
            <div class="detail-row"><strong>Уровень:</strong> {{ selectedWord.level }}</div>
            <div v-if="selectedWord.example" class="detail-row example">
              <strong>Пример:</strong> {{ selectedWord.example }}
            </div>
            <div class="modal-actions">
              <button
                v-if="!isLearned(selectedWord.id)"
                class="btn-primary"
                @click="markAsLearned(selectedWord.id)"
              >
                Отметить выученным
              </button>
              <button class="btn-outline" @click="playAudio(selectedWord.word)">
                🔊 Прослушать
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалка грамматики -->
      <div v-if="selectedGrammar" class="modal-overlay" @click.self="selectedGrammar = null">
        <div class="modal grammar-modal">
          <div class="modal-header accent">
            <h2>{{ selectedGrammar.title }}</h2>
            <button class="close-btn custom-close" @click="selectedGrammar = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Категория:</strong> {{ selectedGrammar.category }}</div>
            <div class="detail-row"><strong>Уровень:</strong> {{ selectedGrammar.level }}</div>
            <div class="theory">{{ selectedGrammar.theory }}</div>
            <h4>Примеры:</h4>
            <ul class="examples-list">
              <li v-for="(ex, idx) in selectedGrammar.examples" :key="idx">
                <div>{{ ex.sentence }}</div>
                <div class="translation">{{ ex.translation }}</div>
                <button class="audio-btn-small" @click="playAudio(ex.sentence)">🔊</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Модалка неправильного глагола -->
      <div v-if="selectedIrregular" class="modal-overlay" @click.self="selectedIrregular = null">
        <div class="modal irregular-modal">
          <div class="modal-header accent">
            <h2>{{ selectedIrregular.base }}</h2>
            <button class="close-btn custom-close" @click="selectedIrregular = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Past Simple:</strong> {{ selectedIrregular.past_simple }}</div>
            <div class="detail-row"><strong>Past Participle:</strong> {{ selectedIrregular.past_participle }}</div>
            <div class="detail-row"><strong>Перевод:</strong> {{ selectedIrregular.translation }}</div>
            <div v-if="selectedIrregular.notes" class="detail-row">
              <strong>Примечание:</strong> {{ selectedIrregular.notes }}
            </div>
            <button class="btn-outline" @click="playAudio(selectedIrregular.base)">
              🔊 Прослушать
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка фразового глагола -->
      <div v-if="selectedPhrasal" class="modal-overlay" @click.self="selectedPhrasal = null">
        <div class="modal phrasal-modal">
          <div class="modal-header accent">
            <h2>{{ selectedPhrasal.verb }}</h2>
            <button class="close-btn custom-close" @click="selectedPhrasal = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Перевод:</strong> {{ selectedPhrasal.translation }}</div>
            <div class="detail-row example"><strong>Пример:</strong> {{ selectedPhrasal.example }}</div>
            <div v-if="selectedPhrasal.notes" class="detail-row">
              <strong>Примечание:</strong> {{ selectedPhrasal.notes }}
            </div>
            <div class="detail-row"><strong>Уровень:</strong> {{ selectedPhrasal.level }}</div>
            <button class="btn-outline" @click="playAudio(selectedPhrasal.verb)">
              🔊 Прослушать
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка идиомы -->
      <div v-if="selectedIdiom" class="modal-overlay" @click.self="selectedIdiom = null">
        <div class="modal idiom-modal">
          <div class="modal-header accent">
            <h2>{{ selectedIdiom.expression }}</h2>
            <button class="close-btn custom-close" @click="selectedIdiom = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Перевод:</strong> {{ selectedIdiom.translation }}</div>
            <div class="detail-row example"><strong>Пример:</strong> {{ selectedIdiom.example }}</div>
            <div class="detail-row"><strong>Уровень:</strong> {{ selectedIdiom.level }}</div>
            <button class="btn-outline" @click="playAudio(selectedIdiom.expression)">
              🔊 Прослушать
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка коллокации -->
      <div v-if="selectedCollocation" class="modal-overlay" @click.self="selectedCollocation = null">
        <div class="modal collocation-modal">
          <div class="modal-header accent">
            <h2>{{ selectedCollocation.collocation }}</h2>
            <button class="close-btn custom-close" @click="selectedCollocation = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-row"><strong>Перевод:</strong> {{ selectedCollocation.translation }}</div>
            <div class="detail-row example"><strong>Пример:</strong> {{ selectedCollocation.example }}</div>
            <div class="detail-row"><strong>Уровень:</strong> {{ selectedCollocation.level }}</div>
            <button class="btn-outline" @click="playAudio(selectedCollocation.collocation)">
              🔊 Прослушать
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка текста -->
      <div v-if="selectedReading" class="modal-overlay" @click.self="selectedReading = null">
        <div class="modal reading-modal">
          <div class="modal-header accent">
            <h2>{{ selectedReading.title }}</h2>
            <button class="close-btn custom-close" @click="selectedReading = null">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="reading-content">{{ selectedReading.text }}</div>
            <div class="reading-translation" v-if="selectedReading.translation">
              {{ selectedReading.translation }}
            </div>
            <div
              v-if="selectedReading.vocabulary && selectedReading.vocabulary.length"
              class="reading-vocab"
            >
              <h4>Слова из текста:</h4>
              <ul>
                <li v-for="w in selectedReading.vocabulary" :key="w.word">
                  <strong>{{ w.word }}</strong> — {{ w.translation }}
                  <span class="transcription">[{{ w.transcription }}]</span>
                </li>
              </ul>
            </div>
            <div
              v-if="selectedReading.questions && selectedReading.questions.length"
              class="reading-questions"
            >
              <h4>Вопросы к тексту:</h4>
              <div
                v-for="(q, qIdx) in selectedReading.questions"
                :key="qIdx"
                class="question-item"
              >
                <p><strong>{{ q.question }}</strong></p>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in q.options"
                    :key="optIdx"
                    class="option-btn"
                    @click="checkReadingAnswer(qIdx, optIdx, q.correct, q.type)"
                    :disabled="readingAnswers[qIdx] !== undefined"
                  >
                    {{ opt }}
                  </button>
                </div>
                <div
                  v-if="readingAnswers[qIdx] !== undefined"
                  class="answer-feedback"
                  :class="{ correct: readingResults[qIdx], wrong: !readingResults[qIdx] }"
                >
                  {{ readingResults[qIdx] ? '✅ Верно' : '❌ Ошибка. Правильный ответ: ' + q.correct }}
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button
                v-if="!isReadingCompleted(selectedReading.id)"
                class="btn-primary"
                @click="markReadingAsCompleted(selectedReading.id)"
              >
                Отметить прочитанным
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useAppStore } from '@core/stores/appStore';
import { speak } from '@core/services/tts';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';
import irregularVerbs from '../data/irregular_verbs.json';
import phrasalVerbs from '../data/phrasal_verbs.json';
import idiomsData from '../data/idioms.json';
import collocationsData from '../data/collocations.json';
import readingsData from '../data/readings.json';

const progressFirestore = useEnglishProgressFirestore();
const packStore = useEnglishPackStore();
const appStore = useAppStore();

const refreshing = ref(false);
const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const selectedLevels = ref(['A0', 'A1', 'A2', 'B1', 'B2']);
const activeTab = ref('vocabulary');
const searchQuery = ref('');

const selectedWord = ref(null);
const selectedGrammar = ref(null);
const selectedIrregular = ref(null);
const selectedPhrasal = ref(null);
const selectedIdiom = ref(null);
const selectedCollocation = ref(null);
const selectedReading = ref(null);

const readingAnswers = ref({});
const readingResults = ref({});

// Функция обновления всех данных
async function refreshAllData() {
  refreshing.value = true;
  appStore.showToast('Обновление данных...', 'info');
  try {
    const { flushQueue } = await import('@/modules/english/services/syncService');
    await flushQueue();
    await progressFirestore.refresh();
    await packStore.refreshPacks();
    appStore.showToast('Данные обновлены', 'success');
  } catch (err) {
    console.error('Ошибка обновления:', err);
    appStore.showToast('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
}

function toggleLevel(level) {
  if (selectedLevels.value.includes(level)) {
    selectedLevels.value = selectedLevels.value.filter(l => l !== level);
  } else {
    selectedLevels.value.push(level);
  }
}

function selectAllLevels() {
  selectedLevels.value = [...levels];
}

function resetLevels() {
  selectedLevels.value = [];
}

const filteredVocabulary = computed(() => {
  let result = vocabularyData.filter(w => selectedLevels.value.includes(w.level));
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(w => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q));
  }
  return result;
});

const filteredGrammar = computed(() => grammarData.filter(g => selectedLevels.value.includes(g.level)));
const filteredIrregular = computed(() => irregularVerbs.filter(v => selectedLevels.value.includes(v.level)));
const filteredPhrasal = computed(() => phrasalVerbs.filter(p => selectedLevels.value.includes(p.level)));
const filteredIdioms = computed(() => idiomsData.filter(i => selectedLevels.value.includes(i.level)));
const filteredCollocations = computed(() => collocationsData.filter(c => selectedLevels.value.includes(c.level)));
const filteredReadings = computed(() => readingsData.filter(r => selectedLevels.value.includes(r.level)));

const searchPlaceholder = computed(() => {
  const placeholders = {
    vocabulary: 'Поиск по слову или переводу...',
    grammar: 'Поиск по теме...',
    irregular: 'Поиск по глаголу...',
    phrasal: 'Поиск по фразовому глаголу...',
    idioms: 'Поиск по идиоме...',
    collocations: 'Поиск по коллокации...'
  };
  return placeholders[activeTab.value] || 'Поиск...';
});

function isLearned(wordId) {
  return progressFirestore.learnedWords.includes(wordId);
}

function isReadingCompleted(readingId) {
  const completed = JSON.parse(localStorage.getItem('english_completed_readings') || '[]');
  return completed.includes(readingId);
}

async function playAudio(text) {
  try {
    await speak(text, 'en-US');
  } catch (e) {
    appStore.showToast('Ошибка воспроизведения', 'error');
  }
}

async function markAsLearned(wordId) {
  // Добавляем в глобальный список выученных слов
  await progressFirestore.addLearnedWord(wordId);
  
  // Также обновляем прогресс во всех паках, где есть это слово
  const word = vocabularyData.find(w => w.id === wordId);
  if (word) {
    for (const pack of packStore.packs) {
      const card = pack.cards?.find(c => c.front === word.word);
      if (card) {
        const progress = progressFirestore.getPackProgress(pack.id);
        const learnedIds = progress.learnedCardIds || [];
        if (!learnedIds.includes(card.id)) {
          learnedIds.push(card.id);
          await progressFirestore.updatePackProgress(pack.id, learnedIds);
        }
      }
    }
  }
  
  appStore.showToast('Слово отмечено выученным!', 'success');
}

function markReadingAsCompleted(readingId) {
  const completed = JSON.parse(localStorage.getItem('english_completed_readings') || '[]');
  if (!completed.includes(readingId)) {
    completed.push(readingId);
    localStorage.setItem('english_completed_readings', JSON.stringify(completed));
  }
  appStore.showToast('Текст отмечен прочитанным!', 'success');
  selectedReading.value = null;
}

function openWordModal(word) {
  selectedWord.value = word;
}

function openGrammarModal(item) {
  selectedGrammar.value = item;
}

function openIrregularModal(verb) {
  selectedIrregular.value = verb;
}

function openPhrasalModal(item) {
  selectedPhrasal.value = item;
}

function openIdiomModal(item) {
  selectedIdiom.value = item;
}

function openCollocationModal(item) {
  selectedCollocation.value = item;
}

function openReadingModal(reading) {
  selectedReading.value = reading;
  readingAnswers.value = {};
  readingResults.value = {};
}

function checkReadingAnswer(qIdx, optIdx, correctAnswer, type) {
  if (readingAnswers.value[qIdx] !== undefined) return;
  readingAnswers.value[qIdx] = optIdx;
  let isCorrect = false;
  if (type === 'multiple_choice') {
    isCorrect = (optIdx === correctAnswer);
  } else if (type === 'true_false') {
    const optText = selectedReading.value.questions[qIdx].options[optIdx];
    isCorrect = (optText === correctAnswer);
  } else {
    isCorrect = (optIdx === correctAnswer);
  }
  readingResults.value[qIdx] = isCorrect;
  appStore.showToast(isCorrect ? '✅ Верно!' : '❌ Неправильно!', isCorrect ? 'success' : 'error');
}

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
});
</script>

<style scoped>
.library-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
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

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
}

.refresh-btn svg {
  transition: transform 0.3s;
}

.refresh-btn:hover svg {
  transform: rotate(180deg);
}

.level-selector.multi {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.level-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}

.level-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.level-btn.active {
  background: var(--primary);
  color: white;
}

.all-btn {
  background: var(--gray-200);
}

.all-btn:hover {
  background: var(--primary);
  color: white;
}

.reset-btn {
  background: var(--danger);
  color: white;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 2rem;
  font-size: 0.9rem;
  transition: all 0.2s;
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
  font-size: 0.9rem;
}

.words-grid,
.irregular-grid,
.phrasal-grid,
.idioms-grid,
.collocations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.word-card,
.irregular-card,
.phrasal-card,
.idiom-card,
.collocation-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.word-card:hover,
.irregular-card:hover,
.phrasal-card:hover,
.idiom-card:hover,
.collocation-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.word-word,
.irregular-base,
.phrasal-verb,
.idiom-expression,
.collocation-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 0.25rem;
}

.word-transcription {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: 0.25rem;
}

.word-translation,
.irregular-translation,
.phrasal-translation,
.idiom-translation,
.collocation-translation {
  font-size: 0.9rem;
  color: var(--gray-700);
  margin-bottom: 0.25rem;
}

.irregular-forms {
  font-size: 0.8rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.word-level,
.irregular-level,
.phrasal-level,
.idiom-level,
.collocation-level {
  font-size: 0.7rem;
  display: inline-block;
  background: var(--gray-100);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  margin-top: 0.5rem;
}

.word-learned {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--success);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
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

.grammar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.grammar-category {
  font-size: 0.7rem;
  background: var(--gray-100);
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  margin-bottom: 0.5rem;
}

.grammar-preview {
  font-size: 0.85rem;
  color: var(--gray-600);
}

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

.reading-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
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

.completed-badge {
  color: var(--success);
  font-size: 0.7rem;
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
}

.modal {
  background: white;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header.accent {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--primary-light);
  border-bottom: 1px solid var(--gray-200);
  padding: 1rem 1.5rem;
  border-radius: 1.5rem 1.5rem 0 0;
}

.modal-header.accent h2 {
  margin: 0;
  color: var(--primary);
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  margin-bottom: 0.75rem;
}

.example {
  background: var(--gray-50);
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.theory {
  background: var(--gray-50);
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin: 1rem 0;
  line-height: 1.5;
}

.examples-list {
  padding-left: 1rem;
}

.examples-list li {
  margin-bottom: 0.5rem;
}

.translation {
  color: var(--gray-600);
  font-size: 0.85rem;
}

.reading-content {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reading-translation {
  background: var(--primary-light);
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.reading-vocab ul,
.reading-questions {
  margin: 0;
  padding-left: 1rem;
}

.reading-vocab li {
  margin-bottom: 0.25rem;
}

.transcription {
  color: var(--gray-500);
  font-size: 0.8rem;
}

.question-item {
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 0.5rem;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.option-btn {
  padding: 0.3rem 0.8rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
}

.answer-feedback {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.answer-feedback.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.answer-feedback.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-outline {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}

.custom-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--gray-400);
  transition: all 0.2s;
}

.custom-close:hover {
  color: var(--danger);
  transform: rotate(90deg);
}

.audio-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Тёмная тема */
body.dark-theme .word-card,
body.dark-theme .grammar-card,
body.dark-theme .irregular-card,
body.dark-theme .phrasal-card,
body.dark-theme .idiom-card,
body.dark-theme .collocation-card,
body.dark-theme .reading-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .word-word,
body.dark-theme .irregular-base,
body.dark-theme .phrasal-verb,
body.dark-theme .idiom-expression,
body.dark-theme .collocation-text,
body.dark-theme .grammar-title,
body.dark-theme .reading-card h3 {
  color: white;
}

body.dark-theme .word-translation,
body.dark-theme .irregular-translation,
body.dark-theme .phrasal-translation,
body.dark-theme .idiom-translation,
body.dark-theme .collocation-translation {
  color: var(--gray-300);
}

body.dark-theme .modal-header.accent {
  background: rgba(230, 126, 34, 0.2);
}

body.dark-theme .example,
body.dark-theme .theory,
body.dark-theme .reading-content {
  background: var(--gray-700);
}

body.dark-theme .reading-translation {
  background: rgba(230, 126, 34, 0.15);
}
</style>