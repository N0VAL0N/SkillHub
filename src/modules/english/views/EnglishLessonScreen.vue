<template>
  <StudentLayout>
    <div class="lesson-screen">
      <div class="lesson-header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Назад
        </button>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="page-counter">{{ currentPage }} / {{ totalPages }}</div>
      </div>

      <div class="lives-indicator" v-if="!isCompleted && totalPages > 0">
        <span v-for="i in maxLives" :key="i" class="heart" :class="{ lost: i > lives }">❤️</span>
      </div>

      <div class="lesson-content" v-if="lesson && currentPageData">
        <!-- Титул -->
        <div v-if="currentPageData.type === 'title'" class="title-page centered">
          <div class="title-icon">📖</div>
          <h2>{{ currentPageData.title }}</h2>
          <p>{{ currentPageData.description }}</p>
          <button class="btn-start" @click="nextPage">Начать урок →</button>
        </div>

        <!-- Слово (карточка) -->
        <div v-else-if="currentPageData.type === 'word'" class="word-page">
          <div class="card-flip" @click="flipCard" :class="{ flipped: isFlipped }">
            <div class="card-front">
              <span class="word">{{ currentPageData.word.word }}</span>
              <span class="transcription">{{ currentPageData.word.transcription }}</span>
            </div>
            <div class="card-back">
              <span class="translation">{{ currentPageData.word.translation }}</span>
              <div class="example" v-if="currentPageData.word.example">{{ currentPageData.word.example }}</div>
            </div>
          </div>
          <div class="word-actions">
            <button class="btn-primary audio-btn" @click="playAudio(currentPageData.word.word)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"/>
                <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"/>
                <path d="M12 19V22"/>
              </svg>
              Прослушать
            </button>
            <button class="btn-outline" @click="skipWord">⏭️ Пропустить</button>
          </div>
          <p class="flip-hint">👆 Нажми на карточку</p>
        </div>

        <!-- Грамматика -->
        <div v-else-if="currentPageData.type === 'grammar'" class="grammar-page">
          <div class="grammar-header">
            <span class="grammar-icon">📐</span>
            <h3>{{ currentPageData.grammar.title }}</h3>
          </div>
          <div class="grammar-content">
            <div class="theory">{{ currentPageData.grammar.theory }}</div>
            <div class="examples-section">
              <h4>Примеры:</h4>
              <ul class="examples-list">
                <li v-for="(ex, idx) in currentPageData.grammar.examples" :key="idx">
                  <div class="example-sentence">
                    <span>{{ ex.sentence }}</span>
                    <button class="icon-btn" @click="playAudio(ex.sentence)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"/>
                        <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"/>
                        <path d="M12 19V22"/>
                      </svg>
                    </button>
                  </div>
                  <div class="example-translation" v-if="showTranslations[idx]">{{ ex.translation }}</div>
                  <button class="icon-btn" @click="toggleTranslation(idx)">
                    <svg v-if="showTranslations[idx]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"/>
                      <circle cx="12" cy="12" r="3"/>
                      <line x1="3" y1="3" x2="21" y2="21"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Диалог -->
        <div v-else-if="currentPageData.type === 'dialogue'" class="dialogue-page">
          <div class="dialogue-header">
            <span class="dialogue-icon">💬</span>
            <h3>{{ currentPageData.dialogue.title }}</h3>
          </div>
          <div class="dialogue-container">
            <div v-for="(line, idx) in currentPageData.dialogue.lines" :key="idx" class="dialogue-line" :class="line.speaker.toLowerCase()">
              <div class="speaker">
                <span class="speaker-avatar">{{ getSpeakerAvatar(line.speaker) }}</span>
                <span class="speaker-name">{{ line.speaker }}</span>
              </div>
              <div class="dialogue-content">
                <div class="english-row">
                  {{ line.text }}
                  <button class="icon-btn" @click="playAudio(line.text)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"/>
                      <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"/>
                      <path d="M12 19V22"/>
                    </svg>
                  </button>
                </div>
                <div class="translation" v-if="dialogueTranslations[idx]">{{ line.translation }}</div>
                <button class="icon-btn" @click="toggleDialogueTranslation(idx)">
                  <svg v-if="dialogueTranslations[idx]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="3" y1="3" x2="21" y2="21"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- FILL GAP (ввод слова) -->
        <div v-else-if="currentPageData.type === 'fill_gap'" class="exercise-page">
          <div class="exercise-header">
            <span class="exercise-icon">✏️</span>
            <h3>{{ currentPageData.instruction || 'Заполните пропуск' }}</h3>
          </div>
          <div v-for="(item, idx) in currentPageData.items" :key="idx" class="exercise-item">
            <p class="sentence">{{ item.sentence }}</p>
            <input
              v-model="userAnswers[idx]"
              type="text"
              class="answer-input"
              placeholder="Введите слово..."
              :disabled="answered[idx]"
              @keyup.enter="!answered[idx] && checkFillGapAnswer(idx, item.correct)"
            />
            <button
              v-if="!answered[idx]"
              class="btn-check"
              @click="checkFillGapAnswer(idx, item.correct)"
            >
              Проверить
            </button>
            <div v-if="answered[idx]" class="answer-feedback" :class="{ correct: answerResults[idx], wrong: !answerResults[idx] }">
              <span v-if="answerResults[idx]">✅ Верно!</span>
              <span v-else>❌ Неверно. Правильный ответ: {{ item.correct }}</span>
            </div>
          </div>
        </div>

        <!-- TRANSLATION (перевод с русского на английский) -->
        <div v-else-if="currentPageData.type === 'translation'" class="exercise-page">
          <div class="exercise-header">
            <span class="exercise-icon">🌐</span>
            <h3>{{ currentPageData.instruction || 'Переведите на английский' }}</h3>
          </div>
          <div v-for="(item, idx) in currentPageData.items" :key="idx" class="exercise-item">
            <p class="source-text">{{ item.source }}</p>
            <input
              v-model="userAnswers[idx]"
              type="text"
              class="answer-input"
              placeholder="Введите перевод..."
              :disabled="answered[idx]"
              @keyup.enter="!answered[idx] && checkTranslationAnswer(idx, item.target)"
            />
            <button
              v-if="!answered[idx]"
              class="btn-check"
              @click="checkTranslationAnswer(idx, item.target)"
            >
              Проверить
            </button>
            <div v-if="answered[idx]" class="answer-feedback" :class="{ correct: answerResults[idx], wrong: !answerResults[idx] }">
              <span v-if="answerResults[idx]">✅ Верно!</span>
              <span v-else>❌ Неверно. Правильный ответ: {{ item.target }}</span>
            </div>
          </div>
        </div>

        <!-- MAKE SENTENCE (составление из блоков) -->
        <div v-else-if="currentPageData.type === 'make_sentence'" class="exercise-page">
          <div class="exercise-header">
            <span class="exercise-icon">📝</span>
            <h3>{{ currentPageData.instruction || 'Составьте предложение' }}</h3>
          </div>
          <div v-for="(item, idx) in currentPageData.items" :key="idx" class="exercise-item">
            <div class="sentence-builder">
              <div class="words-pool">
                <div
                  v-for="(word, wordIdx) in getRemainingWords(idx)"
                  :key="wordIdx"
                  class="word-block"
                  @click="addWordToSentence(idx, word)"
                >
                  {{ word }}
                </div>
              </div>
              <div class="sentence-preview">
                <span v-if="userSentence[idx] && userSentence[idx].length === 0" class="placeholder">Нажмите на слова, чтобы составить предложение...</span>
                <template v-else>
                  <span v-for="(word, wIdx) in userSentence[idx]" :key="wIdx" class="sentence-word">
                    {{ word }}
                    <button class="remove-word" @click="removeWordFromSentence(idx, wIdx)">✕</button>
                  </span>
                </template>
              </div>
              <div class="sentence-actions">
                <button class="btn-outline small" @click="clearSentence(idx)">Очистить</button>
                <button class="btn-check" @click="checkMakeSentence(idx, item.correct)" :disabled="answered[idx]">
                  Проверить
                </button>
              </div>
            </div>
            <div v-if="answered[idx]" class="answer-feedback" :class="{ correct: answerResults[idx], wrong: !answerResults[idx] }">
              <span v-if="answerResults[idx]">✅ Верно!</span>
              <span v-else>❌ Неверно. Правильный ответ: {{ item.correct }}</span>
            </div>
          </div>
        </div>

        <!-- MATCH WORDS -->
        <div v-else-if="currentPageData.type === 'match_words'" class="exercise-page">
          <div class="exercise-header">
            <span class="exercise-icon">🔗</span>
            <h3>{{ currentPageData.instruction || 'Сопоставьте слово с переводом' }}</h3>
          </div>
          <div class="matching-container">
            <div class="matching-column">
              <h4>🇬🇧 Английский</h4>
              <div
                v-for="(item, idx) in matchLeftItems"
                :key="'left-' + idx"
                class="match-card"
                :class="{ matched: matchMatchedLeft.includes(idx), selected: selectedMatchLeft === idx }"
                @click="selectMatchLeft(idx)"
              >
                {{ item.en }}
              </div>
            </div>
            <div class="matching-column">
              <h4>🇷🇺 Русский</h4>
              <div
                v-for="(item, idx) in matchRightItems"
                :key="'right-' + idx"
                class="match-card"
                :class="{ matched: matchMatchedRight.includes(idx), selected: selectedMatchRight === idx }"
                @click="selectMatchRight(idx)"
              >
                {{ item.ru }}
              </div>
            </div>
          </div>
          <div v-if="matchCompleted" class="match-feedback correct">✅ Все слова сопоставлены верно!</div>
          <div v-if="matchError" class="match-feedback wrong">❌ {{ matchError }}</div>
        </div>

        <!-- Вопросы по диалогу -->
        <div v-else-if="currentPageData.type === 'dialog_comprehension'" class="exercise-page">
          <div class="exercise-header">
            <span class="exercise-icon">📝</span>
            <h3>{{ currentPageData.instruction || 'Ответьте на вопросы' }}</h3>
          </div>
          <div v-for="(item, idx) in currentPageData.items" :key="idx" class="exercise-item">
            <p class="question">{{ item.question }}</p>
            <input
              v-model="userAnswers[idx]"
              type="text"
              class="answer-input"
              placeholder="Введите ответ..."
              :disabled="answered[idx]"
            />
            <button v-if="!answered[idx]" class="btn-check" @click="checkComprehensionAnswer(idx, item.correct)">Проверить</button>
            <div v-if="answered[idx]" class="answer-feedback" :class="{ correct: answerResults[idx], wrong: !answerResults[idx] }">
              <span v-if="answerResults[idx]">✅ Верно!</span>
              <span v-else>❌ Неверно. Правильный ответ: {{ item.correct }}</span>
            </div>
          </div>
        </div>

        <!-- Завершение урока -->
        <div v-else-if="currentPageData.type === 'completion'" class="completion-page centered">
          <div class="completion-icon">🎉</div>
          <h2>Урок завершён!</h2>
          <p>Отличная работа!</p>
          <div class="completion-stats" v-if="mistakesCount > 0">
            <p>⚠️ Допущено ошибок: {{ mistakesCount }}</p>
          </div>
          <div class="completion-buttons">
            <button class="btn-primary" @click="finishLesson">Завершить</button>
            <button class="btn-outline" @click="restartLesson">Пройти заново</button>
          </div>
        </div>
      </div>

      <!-- Навигация -->
      <div class="lesson-footer" v-if="currentPageData && currentPageData.type !== 'completion' && !isCompleted">
        <button class="nav-btn prev" :disabled="currentPage === 1" @click="prevPage">← Назад</button>
        <button class="nav-btn next" @click="nextPage" :disabled="!canGoNext">Далее →</button>
      </div>

      <!-- Модалка смерти -->
      <div v-if="showDeathModal" class="modal-overlay" @click.self="showDeathModal = false">
        <div class="modal death-modal">
          <div class="death-icon">💔</div>
          <h2>Жизни кончились</h2>
          <p>Попробуйте начать урок заново.</p>
          <div class="modal-actions">
            <button class="btn-primary" @click="restartLesson">Начать заново</button>
            <button class="btn-outline" @click="finishLesson">На главную</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressStore } from '../stores/englishProgressStore';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useAppStore } from '@core/stores/appStore';
import { speak } from '@core/services/tts';
import { auth, db } from '@core/services/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import lessonsData from '../data/lessons.json';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';

const router = useRouter();
const route = useRoute();
const lessonId = route.params.id;
const progressStore = useEnglishProgressStore();
const packStore = useEnglishPackStore();
const appStore = useAppStore();

const numericLessonId = parseInt(lessonId.replace('lesson_', ''));

// Состояние
const lesson = ref(null);
const pages = ref([]);
const currentPage = ref(1);
const isFlipped = ref(false);
const maxLives = 5;
const lives = ref(5);
const showDeathModal = ref(false);
const showResult = ref(false);

// Ответы на упражнения
const userAnswers = ref({});      // для fill_gap / translation / comprehension
const userSentence = ref({});     // для make_sentence – массив выбранных слов
const remainingWords = ref({});   // для make_sentence – массив ещё не выбранных слов
const answered = ref({});
const answerResults = ref({});

// Для диалогов и грамматики
const dialogueTranslations = ref({});
const showTranslations = ref({});

// Для match_words
const matchLeftItems = ref([]);
const matchRightItems = ref([]);
const matchMatchedLeft = ref([]);
const matchMatchedRight = ref([]);
const selectedMatchLeft = ref(null);
const selectedMatchRight = ref(null);
const matchCompleted = ref(false);
const matchError = ref('');

// Нормализация строки для сравнения (игнорирует регистр, лишние пробелы, знаки препинания, сокращения)
function normalizeAnswer(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    // Заменяем апострофы на обычные
    .replace(/[`'‘’]/g, "'")
    // Заменяем it's на it is, don't на do not и т.д. (простые сокращения)
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bwouldn't\b/g, 'would not')
    .replace(/\bshouldn't\b/g, 'should not')
    .replace(/\bcouldn't\b/g, 'could not')
    .replace(/\bmustn't\b/g, 'must not')
    .replace(/\bhaven't\b/g, 'have not')
    .replace(/\bhasn't\b/g, 'has not')
    .replace(/\bhadn't\b/g, 'had not')
    .replace(/\bain't\b/g, 'am not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    // Удаляем все знаки препинания, кроме букв, цифр и пробелов
    .replace(/[^\w\s]/g, '')
    // Удаляем лишние пробелы
    .replace(/\s+/g, ' ')
    .trim();
}

// Перемешивание
function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ---------- FILL GAP ----------
async function checkFillGapAnswer(idx, correct) {
  if (answered.value[idx]) return;
  const user = normalizeAnswer(userAnswers.value[idx] || '');
  const isCorrect = user === normalizeAnswer(correct);
  answerResults.value[idx] = isCorrect;
  answered.value[idx] = true;
  if (isCorrect) handleCorrectAnswer(idx);
  else handleMistake();
  await autoProgressAfterCorrect(idx, isCorrect);
}

// ---------- TRANSLATION ----------
async function checkTranslationAnswer(idx, correct) {
  if (answered.value[idx]) return;
  const user = normalizeAnswer(userAnswers.value[idx] || '');
  const isCorrect = user === normalizeAnswer(correct);
  answerResults.value[idx] = isCorrect;
  answered.value[idx] = true;
  if (isCorrect) handleCorrectAnswer(idx);
  else handleMistake();
  await autoProgressAfterCorrect(idx, isCorrect);
}

// ---------- MAKE SENTENCE ----------
function initMakeSentence(itemIdx, wordsArray) {
  const shuffled = shuffleArray([...wordsArray]);
  remainingWords.value[itemIdx] = [...shuffled];
  userSentence.value[itemIdx] = [];
}

function getRemainingWords(itemIdx) {
  return remainingWords.value[itemIdx] || [];
}

function addWordToSentence(itemIdx, word) {
  if (answered.value[itemIdx]) return;
  const idx = remainingWords.value[itemIdx].indexOf(word);
  if (idx !== -1) {
    remainingWords.value[itemIdx].splice(idx, 1);
    userSentence.value[itemIdx].push(word);
  }
}

function removeWordFromSentence(itemIdx, wordIdx) {
  if (answered.value[itemIdx]) return;
  const word = userSentence.value[itemIdx][wordIdx];
  userSentence.value[itemIdx].splice(wordIdx, 1);
  remainingWords.value[itemIdx].push(word);
}

function clearSentence(itemIdx) {
  if (answered.value[itemIdx]) return;
  const allWords = [...userSentence.value[itemIdx], ...remainingWords.value[itemIdx]];
  const shuffled = shuffleArray(allWords);
  remainingWords.value[itemIdx] = shuffled;
  userSentence.value[itemIdx] = [];
}

async function checkMakeSentence(itemIdx, correct) {
  if (answered.value[itemIdx]) return;
  const userSentenceStr = userSentence.value[itemIdx].join(' ').toLowerCase().trim();
  const isCorrect = normalizeAnswer(userSentenceStr) === normalizeAnswer(correct);
  answerResults.value[itemIdx] = isCorrect;
  answered.value[itemIdx] = true;
  if (isCorrect) handleCorrectAnswer(itemIdx);
  else handleMistake();
  await autoProgressAfterCorrect(itemIdx, isCorrect);
}

// ---------- MATCH WORDS ----------
function initMatchItems(items) {
  matchLeftItems.value = items.map(item => ({ id: item.en, en: item.en, ru: item.ru }));
  const rightRaw = items.map(item => ({ id: item.en, ru: item.ru }));
  matchRightItems.value = shuffleArray([...rightRaw]);
  matchMatchedLeft.value = [];
  matchMatchedRight.value = [];
  selectedMatchLeft.value = null;
  selectedMatchRight.value = null;
  matchCompleted.value = false;
  matchError.value = '';
}

function selectMatchLeft(idx) {
  if (matchCompleted.value) return;
  if (matchMatchedLeft.value.includes(idx)) return;
  if (selectedMatchLeft.value !== null && selectedMatchRight.value !== null) return;
  if (selectedMatchLeft.value === idx) {
    selectedMatchLeft.value = null;
  } else if (selectedMatchRight.value !== null) {
    const leftItem = matchLeftItems.value[idx];
    const rightItem = matchRightItems.value[selectedMatchRight.value];
    if (leftItem.id === rightItem.id) {
      matchMatchedLeft.value.push(idx);
      matchMatchedRight.value.push(selectedMatchRight.value);
      if (matchMatchedLeft.value.length === matchLeftItems.value.length) {
        matchCompleted.value = true;
        handleCorrectAnswer(null);
        setTimeout(() => nextPage(), 1500);
      }
    } else {
      matchError.value = 'Неверное сопоставление!';
      setTimeout(() => { matchError.value = ''; }, 1500);
      handleMistake();
    }
    selectedMatchLeft.value = null;
    selectedMatchRight.value = null;
  } else {
    selectedMatchLeft.value = idx;
  }
}

function selectMatchRight(idx) {
  if (matchCompleted.value) return;
  if (matchMatchedRight.value.includes(idx)) return;
  if (selectedMatchLeft.value !== null && selectedMatchRight.value !== null) return;
  if (selectedMatchRight.value === idx) {
    selectedMatchRight.value = null;
  } else if (selectedMatchLeft.value !== null) {
    const leftItem = matchLeftItems.value[selectedMatchLeft.value];
    const rightItem = matchRightItems.value[idx];
    if (leftItem.id === rightItem.id) {
      matchMatchedLeft.value.push(selectedMatchLeft.value);
      matchMatchedRight.value.push(idx);
      if (matchMatchedLeft.value.length === matchLeftItems.value.length) {
        matchCompleted.value = true;
        handleCorrectAnswer(null);
        setTimeout(() => nextPage(), 1500);
      }
    } else {
      matchError.value = 'Неверное сопоставление!';
      setTimeout(() => { matchError.value = ''; }, 1500);
      handleMistake();
    }
    selectedMatchLeft.value = null;
    selectedMatchRight.value = null;
  } else {
    selectedMatchRight.value = idx;
  }
}

// ---------- COMPREHENSION ----------
async function checkComprehensionAnswer(idx, correct) {
  if (answered.value[idx]) return;
  const user = normalizeAnswer(userAnswers.value[idx] || '');
  const isCorrect = user === normalizeAnswer(correct);
  answerResults.value[idx] = isCorrect;
  answered.value[idx] = true;
  if (isCorrect) handleCorrectAnswer(idx);
  else handleMistake();
  await autoProgressAfterCorrect(idx, isCorrect);
}

// ---------- Общие функции ----------
function handleCorrectAnswer(itemIdx) {
  // можно добавить звук
}

function handleMistake() {
  if (lives.value <= 0) return;
  lives.value--;
  appStore.showToast(`Ошибка! Осталось жизней: ${lives.value}`, 'warning');
  if (lives.value <= 0) showDeathModal.value = true;
}

function allItemsAnsweredOnCurrentPage() {
  const data = currentPageData.value;
  if (!data || !data.items) return true;
  if (data.type === 'match_words') return matchCompleted.value;
  return data.items.every((_, idx) => answered.value[idx] === true);
}

async function autoProgressAfterCorrect(itemIdx, isCorrect) {
  if (!isCorrect) return;
  const data = currentPageData.value;
  if (!data || !data.items) return;
  
  // Если это не последний item на странице
  if (itemIdx + 1 < data.items.length) {
    await nextTick();
    // Фокусируемся на следующем поле ввода, если есть
    const nextInput = document.querySelector(`.exercise-item:nth-child(${itemIdx + 2}) input`);
    if (nextInput) nextInput.focus();
  } else if (allItemsAnsweredOnCurrentPage()) {
    // Если это последний item и все ответы даны – переходим на следующую страницу
    setTimeout(() => nextPage(), 1500);
  }
}

// ---------- Создание пака из слов урока (если его нет) ----------
async function ensurePackFromLesson() {
  const user = auth.currentUser;
  if (!user) return;
  
  const lessonData = lesson.value;
  if (!lessonData) return;
  
  const packName = `${lessonData.title} (урок ${lessonData.lesson_id})`;
  const packLevel = lessonData.level;
  
  // Проверяем, существует ли уже пак с таким названием
  packStore.loadPacks();
  const existingPack = packStore.packs.find(p => p.name === packName);
  if (existingPack) return;
  
  // Получаем все слова из урока по ID
  const wordIds = lessonData.new_vocabulary_ids || [];
  const cards = [];
  for (const wid of wordIds) {
    const word = vocabularyData.find(w => w.id === wid);
    if (word) {
      cards.push({
        id: Date.now().toString() + Math.random(),
        front: word.word,
        back: word.translation,
        level: word.level || packLevel,
        example: word.example || '',
        repetitions: 0,
        interval: 1,
        easiness: 2.5,
        nextReview: Date.now()
      });
    }
  }
  
  if (cards.length === 0) return;
  
  // Создаём новый пак
  const newPack = packStore.createPack({
    name: packName,
    levels: [packLevel],
    cards: cards
  });
  
  // Добавляем карточки
  for (const card of cards) {
    packStore.addCard(newPack.id, card);
  }
  
  appStore.showToast(`📦 Создан пак "${packName}" с ${cards.length} словами`, 'success');
}

// ---------- Сохранение пройденного урока в Firebase ----------
async function saveCompletedLessonToFirebase() {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      completedLessons: arrayUnion(lessonId)
    });
  } catch (err) {
    console.error('Ошибка сохранения пройденного урока:', err);
  }
}

// ---------- Загрузка урока ----------
async function loadLesson() {
  const raw = lessonsData.lessons.find(l => l.lesson_id === numericLessonId);
  if (!raw) {
    appStore.showToast('Урок не найден', 'error');
    router.push('/english/lessons');
    return;
  }
  lesson.value = raw;
  const newPages = [{ type: 'title', title: raw.title, description: `Lesson ${raw.lesson_id}` }];
  
  if (raw.new_vocabulary_ids) {
    for (const wid of raw.new_vocabulary_ids) {
      const word = vocabularyData.find(w => w.id === wid);
      if (word) newPages.push({ type: 'word', word });
    }
  }
  if (raw.new_grammar_ids) {
    for (const gid of raw.new_grammar_ids) {
      const grammar = grammarData.find(g => g.rule_id === gid);
      if (grammar) newPages.push({ type: 'grammar', grammar });
    }
  }
  if (raw.dialog) newPages.push({ type: 'dialogue', dialogue: raw.dialog });
  if (raw.exercises) {
    for (const ex of raw.exercises) {
      if (ex.type === 'match_words') {
        newPages.push({ ...ex });
      } else if (ex.type === 'make_sentence') {
        const itemsWithInit = ex.items.map((item, idx) => {
          return { ...item, _initialized: false };
        });
        newPages.push({ ...ex, items: itemsWithInit });
      } else {
        newPages.push({ ...ex });
      }
    }
  }
  newPages.push({ type: 'completion' });
  pages.value = newPages;
  
  // Инициализация match_words и make_sentence для первой страницы
  for (let i = 0; i < pages.value.length; i++) {
    if (pages.value[i].type === 'match_words') {
      initMatchItems(pages.value[i].items);
      break;
    }
    if (pages.value[i].type === 'make_sentence') {
      for (let idx = 0; idx < pages.value[i].items.length; idx++) {
        if (!pages.value[i].items[idx]._initialized) {
          initMakeSentence(idx, pages.value[i].items[idx].words);
          pages.value[i].items[idx]._initialized = true;
        }
      }
      break;
    }
  }
}

const totalPages = computed(() => pages.value.length);
const currentPageData = computed(() => pages.value[currentPage.value - 1]);
const progressPercent = computed(() => (currentPage.value / totalPages.value) * 100);
const mistakesCount = computed(() => Object.values(answerResults.value).filter(r => r === false).length);
const isCompleted = computed(() => progressStore.completedLessons.includes(lessonId));

const canGoNext = computed(() => {
  const data = currentPageData.value;
  if (!data) return false;
  if (data.type === 'match_words') return matchCompleted.value;
  if (data.type === 'make_sentence' || data.type === 'fill_gap' || data.type === 'translation' || data.type === 'dialog_comprehension') {
    const items = data.items || [];
    return items.length > 0 && items.every((_, idx) => answered.value[idx] === true);
  }
  return true;
});

// Навигация
async function nextPage() {
  if (currentPage.value < totalPages.value && canGoNext.value) {
    currentPage.value++;
    // Сброс состояния для новой страницы
    answered.value = {};
    answerResults.value = {};
    userAnswers.value = {};
    userSentence.value = {};
    remainingWords.value = {};
    matchCompleted.value = false;
    matchMatchedLeft.value = [];
    matchMatchedRight.value = [];
    if (currentPageData.value?.type === 'match_words') {
      initMatchItems(currentPageData.value.items);
    }
    if (currentPageData.value?.type === 'make_sentence') {
      for (let idx = 0; idx < currentPageData.value.items.length; idx++) {
        if (!currentPageData.value.items[idx]._initialized) {
          initMakeSentence(idx, currentPageData.value.items[idx].words);
          currentPageData.value.items[idx]._initialized = true;
        }
      }
    }
    saveState();
  } else if (currentPage.value === totalPages.value && canGoNext.value) {
    await finishLesson();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    saveState();
  }
}

function skipWord() {
  const target = pages.value.findIndex(p => p.type !== 'word' && p.type !== 'title');
  if (target !== -1) currentPage.value = target + 1;
  else currentPage.value = totalPages.value;
  saveState();
}

function flipCard() { isFlipped.value = !isFlipped.value; }
async function playAudio(text) { try { await speak(text, 'en-US'); } catch(e) {} }

function getSpeakerAvatar(speaker) {
  const avatars = { 'Anna': '👩', 'Tom': '👨', 'John': '👨', 'Mary': '👩', 'Teacher': '👩‍🏫', 'Student': '👨‍🎓' };
  return avatars[speaker] || '💬';
}

function toggleDialogueTranslation(idx) {
  dialogueTranslations.value[idx] = !dialogueTranslations.value[idx];
}
function toggleTranslation(idx) {
  showTranslations.value[idx] = !showTranslations.value[idx];
}

function restartLesson() {
  lives.value = maxLives;
  currentPage.value = 1;
  answered.value = {};
  answerResults.value = {};
  userAnswers.value = {};
  userSentence.value = {};
  remainingWords.value = {};
  dialogueTranslations.value = {};
  showTranslations.value = {};
  matchMatchedLeft.value = [];
  matchMatchedRight.value = [];
  matchCompleted.value = false;
  showDeathModal.value = false;
  if (currentPageData.value?.type === 'match_words') initMatchItems(currentPageData.value.items);
  if (currentPageData.value?.type === 'make_sentence') {
    for (let idx = 0; idx < currentPageData.value.items.length; idx++) {
      initMakeSentence(idx, currentPageData.value.items[idx].words);
    }
  }
  saveState();
}

async function finishLesson() {
  // Отмечаем урок как пройденный в store и Firebase
  progressStore.completeLesson(lessonId);
  await saveCompletedLessonToFirebase();
  
  // Создаём пак со словами урока (если ещё не создан)
  await ensurePackFromLesson();
  
  // Очищаем сохранённое состояние
  localStorage.removeItem(`eng_lesson_${numericLessonId}_state`);
  router.push('/english/lessons');
}

function goBack() {
  saveState();
  router.push('/english/lessons');
}

function saveState() {
  const state = {
    page: currentPage.value,
    lives: lives.value,
    userAnswers: userAnswers.value,
    userSentence: userSentence.value,
    remainingWords: remainingWords.value,
    answered: answered.value,
    answerResults: answerResults.value
  };
  localStorage.setItem(`eng_lesson_${numericLessonId}_state`, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(`eng_lesson_${numericLessonId}_state`);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      currentPage.value = state.page || 1;
      lives.value = state.lives !== undefined ? state.lives : maxLives;
      userAnswers.value = state.userAnswers || {};
      userSentence.value = state.userSentence || {};
      remainingWords.value = state.remainingWords || {};
      answered.value = state.answered || {};
      answerResults.value = state.answerResults || {};
    } catch(e) {}
  }
}

onMounted(async () => {
  await progressStore.loadProgress();
  await loadLesson();
  loadState();
  // Если текущая страница - make_sentence, инициализируем блоки
  if (currentPageData.value?.type === 'make_sentence') {
    for (let idx = 0; idx < currentPageData.value.items.length; idx++) {
      if (!remainingWords.value[idx] || remainingWords.value[idx].length === 0) {
        initMakeSentence(idx, currentPageData.value.items[idx].words);
      }
    }
  }
});

watch(currentPage, () => {
  if (currentPageData.value?.type === 'make_sentence') {
    for (let idx = 0; idx < currentPageData.value.items.length; idx++) {
      if (!remainingWords.value[idx] || remainingWords.value[idx].length === 0) {
        initMakeSentence(idx, currentPageData.value.items[idx].words);
      }
    }
  }
  if (currentPageData.value?.type === 'match_words') {
    if (matchLeftItems.value.length === 0) initMatchItems(currentPageData.value.items);
  }
});

onBeforeUnmount(() => saveState());
</script>

<style scoped>
/* стили – оставляем те же, что были ранее, добавляем новые для make_sentence */
.sentence-builder {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.words-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--gray-300);
}
.word-block {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.word-block:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.02);
}
.sentence-preview {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  min-height: 70px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--gray-200);
  margin-bottom: 1rem;
}
.sentence-word {
  background: var(--gray-100);
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}
.remove-word {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger);
  font-size: 0.8rem;
  padding: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.remove-word:hover {
  background: rgba(239,68,68,0.2);
}
.placeholder {
  color: var(--gray-400);
  font-style: italic;
}
.sentence-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn-outline.small {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: color 0.2s;
}
.icon-btn:hover {
  color: var(--primary);
}
.sentence-builder {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.words-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--gray-300);
}
.word-block {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.word-block:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.02);
}
.sentence-preview {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  min-height: 70px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--gray-200);
  margin-bottom: 1rem;
}
.sentence-word {
  background: var(--gray-100);
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}
.remove-word {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger);
  font-size: 0.8rem;
  padding: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.remove-word:hover {
  background: rgba(239,68,68,0.2);
}
.placeholder {
  color: var(--gray-400);
  font-style: italic;
}
.sentence-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn-outline.small {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: color 0.2s;
}
.icon-btn:hover {
  color: var(--primary);
}
.matching-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}
.matching-column {
  flex: 1;
}
.matching-column h4 {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--secondary);
}
.match-card {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.match-card:hover:not(.matched) {
  border-color: var(--primary);
  transform: translateX(4px);
}
.match-card.selected {
  background: var(--primary);
  color: white;
}
.match-card.matched {
  background: var(--success);
  color: white;
  opacity: 0.7;
  cursor: default;
}
.match-feedback {
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-top: 1rem;
}
.match-feedback.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.match-feedback.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.lesson-screen {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

/* Хедер */
.lesson-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 2rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-100);
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  transition: width 0.3s;
}

.page-counter {
  font-size: 0.85rem;
  color: var(--gray-500);
}

/* Жизни */
.lives-indicator {
  text-align: center;
  margin-bottom: 1rem;
}

.heart {
  font-size: 1.2rem;
  margin: 0 0.1rem;
  transition: opacity 0.3s;
}

.heart.lost {
  opacity: 0.3;
}

/* Центрированные страницы */
.centered {
  text-align: center;
}

/* Титульная страница */
.title-page {
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-light), white);
  border-radius: 1.5rem;
  margin: 1rem 0;
}

.title-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.title-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}

.title-page .description {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
}

.btn-start {
  padding: 0.75rem 2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-start:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* Карточка слова */
.word-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
}

.card-flip {
  position: relative;
  width: 100%;
  min-height: 280px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card-flip.flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
}

.card-back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, var(--primary-light), white);
}

.word {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--secondary);
}

.transcription {
  font-size: 1rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
}

.translation {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--primary);
}

.example {
  font-size: 0.9rem;
  color: var(--gray-600);
  margin-top: 1rem;
  text-align: center;
}

.word-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.flip-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--gray-400);
}

/* Грамматика */
.grammar-page {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}

.grammar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-light);
}

.grammar-icon {
  font-size: 1.5rem;
}

.grammar-header h3 {
  margin: 0;
  color: var(--secondary);
}

.theory {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.examples-section h4 {
  margin: 0 0 0.75rem;
  color: var(--gray-700);
}

.examples-list {
  list-style: none;
  padding: 0;
}

.examples-list li {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.example-sentence {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  color: var(--secondary);
}

.example-translation {
  margin-top: 0.5rem;
  color: var(--gray-600);
  font-size: 0.85rem;
}

/* Диалог */
.dialogue-page {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}

.dialogue-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-light);
}

.dialogue-icon {
  font-size: 1.5rem;
}

.dialogue-header h3 {
  margin: 0;
  color: var(--secondary);
}

.dialogue-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialogue-line {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1rem;
  transition: all 0.2s;
}

.dialogue-line.anna {
  border-left: 4px solid #e74c3c;
}

.dialogue-line.tom {
  border-left: 4px solid #3498db;
}

.speaker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.speaker-avatar {
  font-size: 1.2rem;
}

.speaker-name {
  font-weight: bold;
  color: var(--secondary);
}

.english-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.translation {
  color: var(--gray-600);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

/* Упражнения */
.exercise-page {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}

.exercise-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-light);
}

.exercise-icon {
  font-size: 1.3rem;
}

.exercise-header h3 {
  margin: 0;
  color: var(--secondary);
  font-size: 1rem;
}

.exercise-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}

.sentence, .question, .source-text, .hint {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.hint {
  color: var(--gray-500);
  font-size: 0.85rem;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.option-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--primary-light);
}

.option-btn.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.option-btn.correct {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.option-btn.wrong {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.answer-input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-check {
  padding: 0.5rem 1.25rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-check:hover {
  background: var(--primary-dark);
}

.answer-feedback {
  margin-top: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  text-align: center;
}

.answer-feedback.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.answer-feedback.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

/* Matching */
.matching-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.matching-column {
  flex: 1;
}

.matching-column h4 {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--secondary);
}

.match-card {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.match-card:hover:not(.matched) {
  border-color: var(--primary);
  transform: translateX(4px);
}

.match-card.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.match-card.matched {
  background: var(--success);
  color: white;
  opacity: 0.7;
  cursor: default;
}

.match-feedback {
  text-align: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-top: 1rem;
}

.match-feedback.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

/* Кнопки перевода */
.show-translation-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  transition: all 0.2s;
}

.show-translation-btn:hover {
  background: var(--gray-200);
  color: var(--primary);
}

.audio-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.audio-btn-small:hover {
  background: var(--gray-200);
}

/* Завершение */
.completion-page {
  padding: 2rem;
  background: linear-gradient(135deg, var(--success-light), white);
  border-radius: 1.5rem;
}

.completion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.completion-page h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}

.completion-stats {
  margin: 1rem 0;
  color: var(--warning);
}

.completion-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Навигация */
.lesson-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.nav-btn {
  padding: 0.6rem 1.5rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--gray-200);
}

.nav-btn.next {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.nav-btn.next:hover:not(:disabled) {
  background: var(--primary-dark);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Модалки */
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
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 350px;
  width: 90%;
  text-align: center;
}

.death-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
}

.btn-primary, .btn-outline {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
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

/* Тёмная тема */
body.dark-theme .card-front,
body.dark-theme .card-back,
body.dark-theme .grammar-page,
body.dark-theme .dialogue-page,
body.dark-theme .exercise-page,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .theory,
body.dark-theme .examples-list li,
body.dark-theme .dialogue-line,
body.dark-theme .exercise-item {
  background: var(--gray-700);
}

body.dark-theme .word {
  color: white;
}

body.dark-theme .back-btn:hover {
  background: var(--gray-700);
}

body.dark-theme .option-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
}

body.dark-theme .match-card {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: white;
}

body.dark-theme .grammar-header h3,
body.dark-theme .dialogue-header h3,
body.dark-theme .exercise-header h3 {
  color: white;
}

body.dark-theme .speaker-name {
  color: white;
}
</style>