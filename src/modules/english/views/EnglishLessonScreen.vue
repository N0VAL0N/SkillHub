<template>
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
      <button v-if="!isCompleted" class="reset-lesson-btn" @click="confirmReset" title="Сбросить прогресс урока">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"/>
          <path d="M12 8V12L15 15"/>
        </svg>
      </button>
    </div>

    <div class="lives-indicator" v-if="!isCompleted && totalPages > 0">
      <span v-for="i in maxLives" :key="i" class="heart" :class="{ lost: i > lives }">❤️</span>
    </div>

    <div class="lesson-content" v-if="lesson && currentPageData">
      <!-- Титульная страница -->
      <div v-if="currentPageData.type === 'title'" class="title-page centered">
        <div class="title-icon">📖</div>
        <h2>{{ currentPageData.title }}</h2>
        <p class="description">{{ currentPageData.description }}</p>
        <button class="btn-start" @click="nextPage">Начать урок →</button>
      </div>

      <!-- Карточка слова -->
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
        <p class="flip-hint">👆 Нажми на карточку, чтобы увидеть перевод</p>
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
            <h4>📝 Примеры:</h4>
            <ul class="examples-list">
              <li v-for="(ex, idx) in currentPageData.grammar.examples" :key="idx">
                <div class="example-sentence">
                  <span>{{ ex.sentence }}</span>
                  <button class="audio-btn-small" @click="playAudio(ex.sentence)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"/>
                      <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"/>
                      <path d="M12 19V22"/>
                    </svg>
                  </button>
                </div>
                <div class="example-translation" v-if="showTranslations[idx]">{{ ex.translation }}</div>
                <button class="show-translation-btn" @click="toggleTranslation(idx)">
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

      <!-- Диалог + вопросы -->
      <div v-else-if="currentPageData.type === 'dialogue'" class="dialogue-page">
        <div class="dialogue-header">
          <span class="dialogue-icon">💬</span>
          <h3>{{ currentPageData.dialogue.title }}</h3>
          <button class="hint-btn" @click="showExerciseHint = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
          </button>
        </div>
        <div class="dialogue-container" v-if="currentPageData.dialogue.lines && currentPageData.dialogue.lines.length">
          <div v-for="(line, idx) in currentPageData.dialogue.lines" :key="idx" class="dialogue-line" :class="line.speaker.toLowerCase()">
            <div class="speaker">
              <span class="speaker-name">{{ line.speaker }}</span>
            </div>
            <div class="dialogue-content">
              <div class="english-row">
                {{ line.text }}
                <button class="audio-btn-small" @click="playAudio(line.text)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"/>
                    <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10"/>
                    <path d="M12 19V22"/>
                  </svg>
                </button>
              </div>
              <div class="translation" v-if="dialogueTranslations[idx]">{{ line.translation }}</div>
              <button class="show-translation-btn" @click="toggleDialogueTranslation(idx)">
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
        <div v-if="currentPageData.dialogue.comprehension_questions && currentPageData.dialogue.comprehension_questions.length" class="dialogue-questions">
          <h4>📝 Вопросы по диалогу</h4>
          <div v-for="(q, qIdx) in currentPageData.dialogue.comprehension_questions" :key="qIdx" class="comprehension-item">
            <p class="question">{{ q.question }}</p>
            <input
              v-model="comprehensionAnswers[qIdx]"
              type="text"
              class="answer-input small"
              placeholder="Введите ответ..."
              :disabled="comprehensionAnswered[qIdx]"
              @keyup.enter="checkComprehensionAnswer(qIdx, q.correct)"
            />
            <button v-if="!comprehensionAnswered[qIdx]" class="btn-check" @click="checkComprehensionAnswer(qIdx, q.correct)">Проверить</button>
            <div v-if="comprehensionAnswered[qIdx]" class="answer-feedback" :class="{ correct: comprehensionResults[qIdx], wrong: !comprehensionResults[qIdx] }">
              <span v-if="comprehensionResults[qIdx]">✅ Верно!</span>
              <span v-else>❌ Неверно. Правильный ответ: {{ q.correct }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fill Gap (всегда с кастомным селектором, options генерируются из всех correct) -->
      <div v-else-if="currentPageData.type === 'fill_gap'" class="exercise-page">
        <div class="exercise-header">
          <span class="exercise-icon">✏️</span>
          <h3>{{ currentPageData.instruction || 'Заполните пропуск' }}</h3>
          <button class="hint-btn" @click="showExerciseHint = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
          </button>
        </div>
        <div v-for="(item, idx) in currentPageData.items" :key="idx" class="exercise-item">
          <p class="sentence">{{ item.sentence }}</p>
          <div class="custom-select">
            <div class="select-trigger" @click.stop="toggleSelect(idx)">
              <span>{{ selectedFillGap[idx] !== undefined ? currentPageData._optionsMap[idx][selectedFillGap[idx]] : 'Выберите ответ' }}</span>
              <span class="select-arrow">▼</span>
            </div>
            <div class="select-dropdown" v-if="openSelectIdx === idx">
              <div
                v-for="(opt, optIdx) in currentPageData._optionsMap[idx]"
                :key="optIdx"
                class="select-option"
                :class="{ selected: selectedFillGap[idx] === optIdx }"
                @click.stop="selectFillGapOption(idx, optIdx, opt, item.correct)"
              >
                {{ opt }}
              </div>
            </div>
          </div>
          <div v-if="answeredFillGap[idx]" class="answer-feedback" :class="{ correct: answerFillGapResults[idx], wrong: !answerFillGapResults[idx] }">
            <span v-if="answerFillGapResults[idx]">✅ Верно!</span>
            <span v-else>❌ Неверно. Правильный ответ: {{ item.correct }}</span>
          </div>
        </div>
      </div>

      <!-- Match Words -->
      <div v-else-if="currentPageData.type === 'match_words'" class="exercise-page">
        <div class="exercise-header">
          <span class="exercise-icon">🔗</span>
          <h3>{{ currentPageData.instruction || 'Сопоставьте слово с переводом' }}</h3>
          <button class="hint-btn" @click="showExerciseHint = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
          </button>
        </div>
        <div class="matching-container">
          <div class="matching-column">
            <h4>🇬🇧 Английский</h4>
            <div
              v-for="item in filteredMatchLeft"
              :key="'left-' + item.originalIndex"
              class="match-card"
              :class="{ selected: selectedMatchLeft === item.originalIndex }"
              @click="selectMatchLeft(item.originalIndex)"
            >
              {{ item.data.en }}
            </div>
          </div>
          <div class="matching-column">
            <h4>🇷🇺 Русский</h4>
            <div
              v-for="item in filteredMatchRight"
              :key="'right-' + item.originalIndex"
              class="match-card"
              :class="{ selected: selectedMatchRight === item.originalIndex }"
              @click="selectMatchRight(item.originalIndex)"
            >
              {{ item.data.ru }}
            </div>
          </div>
        </div>
        <div v-if="matchCompleted" class="match-feedback correct">✅ Все слова сопоставлены верно!</div>
        <div v-if="matchError" class="match-feedback wrong">❌ {{ matchError }}</div>
        <div v-if="getMatchedPairsList().length > 0" class="matching-matched">
          <h4>✓ Сопоставленные пары</h4>
          <div class="matched-pairs">
            <div v-for="pair in getMatchedPairsList()" :key="pair.en" class="matched-pair">
              <span>{{ pair.en }}</span>
              <span class="pair-arrow">→</span>
              <span>{{ pair.ru }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Make Sentence -->
      <div v-else-if="currentPageData.type === 'make_sentence'" class="exercise-page">
        <div class="exercise-header">
          <span class="exercise-icon">📝</span>
          <h3>{{ currentPageData.instruction || 'Составьте предложение' }}</h3>
          <button class="hint-btn" @click="showExerciseHint = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
          </button>
        </div>
        <div v-for="(item, qIdx) in currentPageData.items" :key="qIdx" class="exercise-item">
          <div v-if="item.source" class="translation-source">
            <strong>Переведите:</strong> {{ item.source }}
          </div>
          <div class="sentence-builder">
            <div class="words-pool" v-if="item.words && item.words.length">
              <div
                v-for="(word, wordIdx) in getRemainingWords(qIdx)"
                :key="wordIdx"
                class="word-block"
                @click="addWordToSentence(qIdx, word)"
              >
                {{ word }}
              </div>
            </div>
            <div class="sentence-preview">
              <span v-if="userSentence[qIdx] && userSentence[qIdx].length === 0" class="placeholder">Нажмите на слова, чтобы составить предложение...</span>
              <template v-else>
                <span v-for="(word, wIdx) in userSentence[qIdx]" :key="wIdx" class="sentence-word">
                  {{ word }}
                  <button class="remove-word" @click="removeWordFromSentence(qIdx, wIdx)">✕</button>
                </span>
              </template>
            </div>
            <div class="sentence-actions">
              <button class="btn-outline small" @click="clearSentence(qIdx)">Очистить</button>
              <button class="btn-check" @click="checkMakeSentence(qIdx, item.correct)" :disabled="answeredMakeSentence[qIdx]">
                Проверить
              </button>
            </div>
          </div>
          <div v-if="answeredMakeSentence[qIdx]" class="answer-feedback" :class="{ correct: answerMakeSentenceResults[qIdx], wrong: !answerMakeSentenceResults[qIdx] }">
            <span v-if="answerMakeSentenceResults[qIdx]">✅ Верно!</span>
            <span v-else>❌ Неверно. Правильный ответ: {{ item.correct }}</span>
          </div>
        </div>
      </div>

      <!-- Завершение -->
      <div v-else-if="currentPageData.type === 'completion'" class="completion-page centered">
        <div class="completion-icon">🎉</div>
        <h2>Урок завершён!</h2>
        <p>Отличная работа!</p>
        <div class="completion-stats" v-if="mistakesCount > 0">
          <p>⚠️ Допущено ошибок: {{ mistakesCount }}</p>
          <p>💪 Жизней осталось: {{ lives }}</p>
        </div>
        <div class="completion-buttons">
          <button class="btn-primary" @click="finishLesson">Завершить</button>
          <button class="btn-outline" @click="restartLesson">Пройти заново</button>
        </div>
      </div>
    </div>

    <div class="lesson-footer" v-if="currentPageData && currentPageData.type !== 'completion'">
      <button class="nav-btn prev" :disabled="currentPage === 1" @click="prevPage">← Назад</button>
      <button class="nav-btn next" @click="nextPage" :disabled="!canGoNext">Далее →</button>
    </div>

    <!-- Модалки -->
    <div v-if="showExerciseHint" class="modal-overlay" @click.self="showExerciseHint = false">
      <div class="modal hint-modal">
        <div class="modal-header">
          <h3>ℹ️ Что нужно сделать?</h3>
          <button class="close-btn custom-close" @click="showExerciseHint = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="currentPageData?.type === 'fill_gap'">
            <p><strong>Заполните пропуск</strong> – выберите правильный вариант из выпадающего списка.</p>
          </div>
          <div v-else-if="currentPageData?.type === 'match_words'">
            <p><strong>Сопоставьте</strong> английские слова с их переводом на русский. Нажмите на слово слева, затем на слово справа. Правильные пары появятся внизу.</p>
          </div>
          <div v-else-if="currentPageData?.type === 'make_sentence'">
            <p><strong>Составьте предложение</strong> – нажимайте на слова в нужном порядке. Чтобы убрать слово, нажмите на крестик рядом с ним.</p>
          </div>
          <div v-else-if="currentPageData?.type === 'dialogue'">
            <p><strong>Прочитайте диалог</strong> и ответьте на вопросы ниже.</p>
          </div>
          <div v-else>
            <p>Выполните задание согласно инструкции выше.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showExerciseHint = false">Понятно</button>
        </div>
      </div>
    </div>

    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal reset-modal">
        <h3>Сбросить прогресс урока?</h3>
        <p>Вы потеряете текущий прогресс, но урок останется пройденным (если вы его завершали).</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="showResetConfirm = false">Отмена</button>
          <button class="btn-danger" @click="resetCurrentProgress">Сбросить</button>
        </div>
      </div>
    </div>

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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useAppStore } from '@core/stores/appStore';
import { speak } from '@core/services/tts';
import { normalizeAnswer } from '../utils/normalizeAnswer';
import lessonsData from '../data/lessons.json';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';
import phrasalVerbs from '../data/phrasal_verbs.json';
import irregularVerbs from '../data/irregular_verbs.json';
import collocationsData from '../data/collocations.json';
import idiomsData from '../data/idioms.json';

const router = useRouter();
const route = useRoute();
const lessonId = route.params.id;
const progressFirestore = useEnglishProgressFirestore();
const packStore = useEnglishPackStore();
const appStore = useAppStore();

const numericLessonId = parseInt(lessonId.replace('lesson_', ''));

const lesson = ref(null);
const pages = ref([]);
const currentPage = ref(1);
const isFlipped = ref(false);
const maxLives = 5;
const lives = ref(5);
const showDeathModal = ref(false);
const showResetConfirm = ref(false);
const showExerciseHint = ref(false);

// ========== ПОСТРАНИЧНОЕ ХРАНЕНИЕ СОСТОЯНИЯ ==========
const pageStates = ref({});

const currentState = computed(() => {
  if (!pageStates.value[currentPage.value]) {
    pageStates.value[currentPage.value] = {
      type: currentPageData.value?.type,
      selectedFillGap: {},
      openSelectIdx: null,
      answeredFillGap: {},
      answerFillGapResults: {},
      matchLeftItems: [],
      matchRightItems: [],
      matchMatchedLeft: [],
      matchMatchedRight: [],
      selectedMatchLeft: null,
      selectedMatchRight: null,
      matchCompleted: false,
      matchError: '',
      userSentence: {},
      remainingWords: {},
      answeredMakeSentence: {},
      answerMakeSentenceResults: {},
      comprehensionAnswers: {},
      comprehensionAnswered: {},
      comprehensionResults: {},
      dialogueTranslations: {},
      showTranslations: {}
    };
  }
  return pageStates.value[currentPage.value];
});

// Прокси-свойства
const selectedFillGap = computed({
  get: () => currentState.value.selectedFillGap,
  set: (val) => { currentState.value.selectedFillGap = val; saveState(); }
});
const openSelectIdx = computed({
  get: () => currentState.value.openSelectIdx,
  set: (val) => { currentState.value.openSelectIdx = val; saveState(); }
});
const answeredFillGap = computed({
  get: () => currentState.value.answeredFillGap,
  set: (val) => { currentState.value.answeredFillGap = val; saveState(); }
});
const answerFillGapResults = computed({
  get: () => currentState.value.answerFillGapResults,
  set: (val) => { currentState.value.answerFillGapResults = val; saveState(); }
});

const matchLeftItems = computed({
  get: () => currentState.value.matchLeftItems,
  set: (val) => { currentState.value.matchLeftItems = val; saveState(); }
});
const matchRightItems = computed({
  get: () => currentState.value.matchRightItems,
  set: (val) => { currentState.value.matchRightItems = val; saveState(); }
});
const matchMatchedLeft = computed({
  get: () => currentState.value.matchMatchedLeft,
  set: (val) => { currentState.value.matchMatchedLeft = val; saveState(); }
});
const matchMatchedRight = computed({
  get: () => currentState.value.matchMatchedRight,
  set: (val) => { currentState.value.matchMatchedRight = val; saveState(); }
});
const selectedMatchLeft = computed({
  get: () => currentState.value.selectedMatchLeft,
  set: (val) => { currentState.value.selectedMatchLeft = val; saveState(); }
});
const selectedMatchRight = computed({
  get: () => currentState.value.selectedMatchRight,
  set: (val) => { currentState.value.selectedMatchRight = val; saveState(); }
});
const matchCompleted = computed({
  get: () => currentState.value.matchCompleted,
  set: (val) => { currentState.value.matchCompleted = val; saveState(); }
});
const matchError = computed({
  get: () => currentState.value.matchError,
  set: (val) => { currentState.value.matchError = val; saveState(); }
});

const userSentence = computed({
  get: () => currentState.value.userSentence,
  set: (val) => { currentState.value.userSentence = val; saveState(); }
});
const remainingWords = computed({
  get: () => currentState.value.remainingWords,
  set: (val) => { currentState.value.remainingWords = val; saveState(); }
});
const answeredMakeSentence = computed({
  get: () => currentState.value.answeredMakeSentence,
  set: (val) => { currentState.value.answeredMakeSentence = val; saveState(); }
});
const answerMakeSentenceResults = computed({
  get: () => currentState.value.answerMakeSentenceResults,
  set: (val) => { currentState.value.answerMakeSentenceResults = val; saveState(); }
});

const comprehensionAnswers = computed({
  get: () => currentState.value.comprehensionAnswers,
  set: (val) => { currentState.value.comprehensionAnswers = val; saveState(); }
});
const comprehensionAnswered = computed({
  get: () => currentState.value.comprehensionAnswered,
  set: (val) => { currentState.value.comprehensionAnswered = val; saveState(); }
});
const comprehensionResults = computed({
  get: () => currentState.value.comprehensionResults,
  set: (val) => { currentState.value.comprehensionResults = val; saveState(); }
});
const dialogueTranslations = computed({
  get: () => currentState.value.dialogueTranslations,
  set: (val) => { currentState.value.dialogueTranslations = val; saveState(); }
});
const showTranslations = computed({
  get: () => currentState.value.showTranslations,
  set: (val) => { currentState.value.showTranslations = val; saveState(); }
});

// ========== ВЫЧИСЛЯЕМЫЕ СВОЙСТВА ДЛЯ MATCH_WORDS ==========
const filteredMatchLeft = computed(() => {
  const items = matchLeftItems.value;
  const matched = matchMatchedLeft.value;
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(matched)) {
    return items.map((item, idx) => ({ originalIndex: idx, data: item }));
  }
  return items
    .map((item, idx) => ({ originalIndex: idx, data: item }))
    .filter(item => !matched.includes(item.originalIndex));
});

const filteredMatchRight = computed(() => {
  const items = matchRightItems.value;
  const matched = matchMatchedRight.value;
  if (!Array.isArray(items)) return [];
  if (!Array.isArray(matched)) {
    return items.map((item, idx) => ({ originalIndex: idx, data: item }));
  }
  return items
    .map((item, idx) => ({ originalIndex: idx, data: item }))
    .filter(item => !matched.includes(item.originalIndex));
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getMatchedPairsList() {
  const leftMatched = matchMatchedLeft.value || [];
  const rightMatched = matchMatchedRight.value || [];
  const leftItems = matchLeftItems.value || [];
  const rightItems = matchRightItems.value || [];
  const pairs = [];
  for (let i = 0; i < leftMatched.length; i++) {
    const leftIdx = leftMatched[i];
    const rightIdx = rightMatched[i];
    if (leftIdx !== undefined && rightIdx !== undefined && leftItems[leftIdx] && rightItems[rightIdx]) {
      pairs.push({
        en: leftItems[leftIdx].en,
        ru: rightItems[rightIdx].ru
      });
    }
  }
  return pairs;
}

// ========== MATCH WORDS ==========
function initMatchItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return;
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
  if (!Array.isArray(matchMatchedLeft.value) || matchMatchedLeft.value.includes(idx)) return;
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
        setTimeout(() => nextPage(), 1000);
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
  if (!Array.isArray(matchMatchedRight.value) || matchMatchedRight.value.includes(idx)) return;
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
        setTimeout(() => nextPage(), 1000);
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

// ========== FILL GAP (всегда с селектором, options генерируются из всех correct) ==========
function generateFillGapOptions(items) {
  // Собираем уникальные правильные ответы из всех items
  const allCorrect = [...new Set(items.map(item => item.correct))];
  // Для каждого item создаём перемешанный массив options
  const optionsMap = items.map(() => shuffleArray([...allCorrect]));
  return optionsMap;
}

function toggleSelect(idx) {
  if (answeredFillGap.value[idx]) return;
  openSelectIdx.value = openSelectIdx.value === idx ? null : idx;
}

function selectFillGapOption(idx, optIdx, optValue, correctValue) {
  if (answeredFillGap.value[idx]) return;
  selectedFillGap.value[idx] = optIdx;
  openSelectIdx.value = null;
  const isCorrect = optValue === correctValue;
  answerFillGapResults.value[idx] = isCorrect;
  answeredFillGap.value[idx] = true;
  progressFirestore.updateStats(isCorrect);
  if (isCorrect) {
    if (allItemsAnsweredOnCurrentPage()) setTimeout(() => nextPage(), 1000);
  } else {
    handleMistake();
  }
}

// ========== MAKE SENTENCE ==========
function initMakeSentence(itemIdx, wordsArray) {
  if (!wordsArray || wordsArray.length === 0) return;
  if (remainingWords.value[itemIdx] !== undefined && userSentence.value[itemIdx] !== undefined) return;
  const shuffled = shuffleArray([...wordsArray]);
  remainingWords.value[itemIdx] = [...shuffled];
  userSentence.value[itemIdx] = [];
  answeredMakeSentence.value[itemIdx] = false;
  answerMakeSentenceResults.value[itemIdx] = false;
}

function getRemainingWords(itemIdx) {
  return remainingWords.value[itemIdx] || [];
}

function addWordToSentence(itemIdx, word) {
  if (answeredMakeSentence.value[itemIdx]) return;
  const idx = remainingWords.value[itemIdx].indexOf(word);
  if (idx !== -1) {
    remainingWords.value[itemIdx].splice(idx, 1);
    userSentence.value[itemIdx].push(word);
  }
}

function removeWordFromSentence(itemIdx, wordIdx) {
  if (answeredMakeSentence.value[itemIdx]) return;
  const word = userSentence.value[itemIdx][wordIdx];
  userSentence.value[itemIdx].splice(wordIdx, 1);
  remainingWords.value[itemIdx].push(word);
}

function clearSentence(itemIdx) {
  if (answeredMakeSentence.value[itemIdx]) return;
  const allWords = [...userSentence.value[itemIdx], ...remainingWords.value[itemIdx]];
  const shuffled = shuffleArray(allWords);
  remainingWords.value[itemIdx] = shuffled;
  userSentence.value[itemIdx] = [];
}

async function checkMakeSentence(itemIdx, correct) {
  if (answeredMakeSentence.value[itemIdx]) return;
  if (!userSentence.value[itemIdx]) userSentence.value[itemIdx] = [];
  const userSentenceStr = userSentence.value[itemIdx].join(' ');
  const normalize = (str) => str.toLowerCase().replace(/[\s.,!?;:]+/g, '');
  const isCorrect = normalize(userSentenceStr) === normalize(correct);
  answerMakeSentenceResults.value[itemIdx] = isCorrect;
  answeredMakeSentence.value[itemIdx] = true;
  await progressFirestore.updateStats(isCorrect);
  if (isCorrect) {
    if (allItemsAnsweredOnCurrentPage()) setTimeout(() => nextPage(), 1000);
  } else {
    handleMistake();
  }
}

// ========== COMPREHENSION ==========
function normalizeAnswerLocal(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

function normalizeYesNo(answer) {
  const yesVariants = ['yes', 'yeah', 'yep', 'y', 'true', 'yes, she is', 'yes, he is', 'yes, they are', 'yes, i am', 'yes, i\'m', 'yes, it is', 'yes, it\'s'];
  const noVariants = ['no', 'nope', 'nah', 'false', 'no, she isn\'t', 'no, he isn\'t', 'no, they aren\'t', 'no, i\'m not', 'no, it isn\'t'];
  const normalized = normalizeAnswerLocal(answer);
  if (yesVariants.some(v => normalizeAnswerLocal(v) === normalized)) return 'yes';
  if (noVariants.some(v => normalizeAnswerLocal(v) === normalized)) return 'no';
  return normalized;
}

function normalizeSpacesAndDashes(str) {
  return normalizeAnswerLocal(str).replace(/\s+/g, '').replace(/-/g, '');
}

function normalizeTimeAnswer(answer) {
  let t = normalizeAnswerLocal(answer);
  t = t.replace(/o'clock/g, '');
  t = t.replace(/am|pm/g, '');
  t = t.replace(/:/g, '');
  t = t.replace(/\s+/g, '');
  return t;
}

function normalizeListAnswer(answer, expectedItems) {
  const separators = /\s+and\s+|\s*,\s*|\s*&\s*|\s+/i;
  const parts = answer.split(separators).map(p => normalizeAnswerLocal(p)).filter(p => p.length > 0);
  const expectedNorm = expectedItems.map(i => normalizeAnswerLocal(i)).sort();
  const answerNorm = [...parts].sort();
  return JSON.stringify(answerNorm) === JSON.stringify(expectedNorm);
}

function isComprehensionAnswerCorrect(answer, correct) {
  const normAnswer = normalizeAnswerLocal(answer);
  const normCorrect = normalizeAnswerLocal(correct);
  const yesNo = normalizeYesNo(answer);
  const correctYesNo = normalizeYesNo(correct);
  if (yesNo === 'yes' || yesNo === 'no') return yesNo === correctYesNo;
  if (normCorrect.includes('o\'clock') || /^\d+/.test(normCorrect)) {
    if (normalizeTimeAnswer(answer) === normalizeTimeAnswer(correct)) return true;
  }
  if (normCorrect.includes(' and ') || normCorrect.includes(',')) {
    const expectedItems = correct.split(/\s+and\s+|\s*,\s*/);
    if (normalizeListAnswer(answer, expectedItems)) return true;
  }
  if (normalizeSpacesAndDashes(answer) === normalizeSpacesAndDashes(correct)) return true;
  return normAnswer === normCorrect;
}

async function checkComprehensionAnswer(idx, correct) {
  if (comprehensionAnswered.value[idx]) return;
  const userAnswer = comprehensionAnswers.value[idx] || '';
  const isCorrect = isComprehensionAnswerCorrect(userAnswer, correct);
  comprehensionResults.value[idx] = isCorrect;
  comprehensionAnswered.value[idx] = true;
  await progressFirestore.updateStats(isCorrect);
  if (!isCorrect) {
    handleMistake();
    appStore.showToast(`❌ Неправильно. Правильный ответ: ${correct}`, 'error');
  } else {
    if (allItemsAnsweredOnCurrentPage()) setTimeout(() => nextPage(), 1000);
  }
}

// ========== ОБЩАЯ ЛОГИКА ==========
function handleMistake() {
  if (isCompleted.value) return;
  if (lives.value <= 0) return;
  lives.value--;
  appStore.showToast(`Ошибка! Осталось жизней: ${lives.value}`, 'warning');
  if (lives.value <= 0) showDeathModal.value = true;
}

function allItemsAnsweredOnCurrentPage() {
  const data = currentPageData.value;
  if (!data) return true;
  if (data.type === 'fill_gap' && data.items) {
    return data.items.every((_, idx) => answeredFillGap.value[idx] === true);
  }
  if (data.type === 'make_sentence' && data.items) {
    return data.items.every((_, idx) => answeredMakeSentence.value[idx] === true);
  }
  if (data.type === 'dialogue' && data.dialogue.comprehension_questions) {
    return data.dialogue.comprehension_questions.every((_, idx) => comprehensionAnswered.value[idx] === true);
  }
  return true;
}

function toggleDialogueTranslation(idx) { dialogueTranslations.value[idx] = !dialogueTranslations.value[idx]; }
function toggleTranslation(idx) { showTranslations.value[idx] = !showTranslations.value[idx]; }

// ========== ЗАГРУЗКА УРОКА ==========
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
  if (raw.new_phrasal_verb_ids) {
    for (const pid of raw.new_phrasal_verb_ids) {
      const phrasal = phrasalVerbs.find(p => p.id === pid);
      if (phrasal) {
        newPages.push({ type: 'word', word: { word: phrasal.verb, translation: phrasal.translation, example: phrasal.example, transcription: '' } });
      }
    }
  }
  if (raw.new_irregular_verb_ids) {
    for (const iid of raw.new_irregular_verb_ids) {
      const irregular = irregularVerbs.find(i => i.id === iid);
      if (irregular) {
        newPages.push({ type: 'word', word: { word: irregular.base, translation: irregular.translation, example: `${irregular.past_simple} / ${irregular.past_participle}`, transcription: '' } });
      }
    }
  }
  if (raw.new_collocation_ids) {
    for (const cid of raw.new_collocation_ids) {
      const coll = collocationsData.find(c => c.id === cid);
      if (coll) {
        newPages.push({ type: 'word', word: { word: coll.collocation, translation: coll.translation, example: coll.example, transcription: '' } });
      }
    }
  }
  if (raw.new_idiom_ids) {
    for (const iid of raw.new_idiom_ids) {
      const idiom = idiomsData.find(i => i.id === iid);
      if (idiom) {
        newPages.push({ type: 'word', word: { word: idiom.expression, translation: idiom.translation, example: idiom.example, transcription: '' } });
      }
    }
  }
  if (raw.new_grammar_ids) {
    for (const gid of raw.new_grammar_ids) {
      const grammar = grammarData.find(g => g.rule_id === gid);
      if (grammar) newPages.push({ type: 'grammar', grammar });
    }
  }
  if (raw.dialog && raw.dialog.lines && raw.dialog.lines.length) {
    newPages.push({ type: 'dialogue', dialogue: raw.dialog });
  }
  if (raw.exercises) {
    for (const ex of raw.exercises) {
      if (ex.type === 'match_words') {
        newPages.push({ ...ex });
      } else if (ex.type === 'make_sentence') {
        const itemsWithInit = ex.items.map((item, idx) => ({ ...item, _initialized: false }));
        newPages.push({ ...ex, items: itemsWithInit });
      } else if (ex.type === 'translation') {
        const makeSentenceItems = ex.items.map(item => {
          const target = item.target;
          const wordsAndPunctuation = [];
          const parts = target.split(/(\s+|[,.!?;:])/);
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed === '') continue;
            if (/^[,.!?;:]+$/.test(trimmed)) {
              wordsAndPunctuation.push(trimmed);
            } else {
              const subWords = trimmed.split(/\s+/);
              wordsAndPunctuation.push(...subWords);
            }
          }
          return {
            words: wordsAndPunctuation,
            correct: target,
            source: item.source
          };
        });
        newPages.push({
          type: 'make_sentence',
          instruction: ex.instruction || 'Составьте предложение, перетаскивая слова в правильном порядке',
          items: makeSentenceItems.map(item => ({ ...item, _initialized: false }))
        });
      } else if (ex.type === 'fill_gap') {
        // Генерируем options для всех items на основе всех correct
        const optionsMap = generateFillGapOptions(ex.items);
        newPages.push({ 
          ...ex, 
          _initialized: false,
          _optionsMap: optionsMap 
        });
      } else {
        newPages.push({ ...ex });
      }
    }
  }
  newPages.push({ type: 'completion' });
  pages.value = newPages;
}

// ========== ВЫЧИСЛЯЕМЫЕ ==========
const totalPages = computed(() => pages.value.length);
const currentPageData = computed(() => pages.value[currentPage.value - 1]);
const progressPercent = computed(() => Math.min(100, (currentPage.value / totalPages.value) * 100));
const mistakesCount = computed(() => {
  let count = 0;
  for (const pageIdx in pageStates.value) {
    const state = pageStates.value[pageIdx];
    if (state.answerFillGapResults) {
      Object.values(state.answerFillGapResults).forEach(r => { if (r === false) count++; });
    }
    if (state.answerMakeSentenceResults) {
      Object.values(state.answerMakeSentenceResults).forEach(r => { if (r === false) count++; });
    }
    if (state.comprehensionResults) {
      Object.values(state.comprehensionResults).forEach(r => { if (r === false) count++; });
    }
  }
  return count;
});
const isCompleted = computed(() => progressFirestore.completedLessons.includes(lessonId));

const canGoNext = computed(() => {
  const data = currentPageData.value;
  if (!data) return false;
  if (data.type === 'match_words') return matchCompleted.value;
  if (data.type === 'fill_gap') {
    const items = data.items || [];
    return items.length > 0 && items.every((_, idx) => answeredFillGap.value[idx] === true);
  }
  if (data.type === 'make_sentence') {
    const items = data.items || [];
    return items.length > 0 && items.every((_, idx) => answeredMakeSentence.value[idx] === true);
  }
  if (data.type === 'dialogue' && data.dialogue.comprehension_questions && data.dialogue.comprehension_questions.length) {
    return data.dialogue.comprehension_questions.every((_, idx) => comprehensionAnswered.value[idx] === true);
  }
  return true;
});

// ========== НАВИГАЦИЯ ==========
function nextPage() {
  if (currentPage.value < totalPages.value && canGoNext.value) {
    currentPage.value++;
    saveState();
    if (!pageStates.value[currentPage.value]) {
      pageStates.value[currentPage.value] = {
        type: currentPageData.value?.type,
        selectedFillGap: {},
        openSelectIdx: null,
        answeredFillGap: {},
        answerFillGapResults: {},
        matchLeftItems: [],
        matchRightItems: [],
        matchMatchedLeft: [],
        matchMatchedRight: [],
        selectedMatchLeft: null,
        selectedMatchRight: null,
        matchCompleted: false,
        matchError: '',
        userSentence: {},
        remainingWords: {},
        answeredMakeSentence: {},
        answerMakeSentenceResults: {},
        comprehensionAnswers: {},
        comprehensionAnswered: {},
        comprehensionResults: {},
        dialogueTranslations: {},
        showTranslations: {}
      };
    }
    if (currentPageData.value?.type === 'match_words' && matchLeftItems.value.length === 0) {
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
  } else if (currentPage.value === totalPages.value) {
    finishLesson();
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    saveState();
    if (currentPageData.value?.type === 'match_words' && matchLeftItems.value.length === 0) {
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

// ========== СОХРАНЕНИЕ ==========
function saveState() {
  const stateToSave = {
    currentPage: currentPage.value,
    lives: lives.value,
    pageStates: pageStates.value
  };
  localStorage.setItem(`eng_lesson_${numericLessonId}_state`, JSON.stringify(stateToSave));
}

function loadState() {
  const saved = localStorage.getItem(`eng_lesson_${numericLessonId}_state`);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      currentPage.value = state.currentPage || 1;
      if (!isCompleted.value) {
        lives.value = state.lives !== undefined ? state.lives : maxLives;
      }
      if (state.pageStates) {
        pageStates.value = state.pageStates;
      }
    } catch(e) {}
  }
}

function resetCurrentProgress() {
  if (isCompleted.value) {
    appStore.showToast('Урок уже пройден, сброс невозможен', 'warning');
    showResetConfirm.value = false;
    return;
  }
  currentPage.value = 1;
  lives.value = maxLives;
  pageStates.value = {};
  for (let i = 0; i < pages.value.length; i++) {
    if (pages.value[i].type === 'make_sentence') {
      for (let idx = 0; idx < pages.value[i].items.length; idx++) {
        pages.value[i].items[idx]._initialized = false;
      }
    }
  }
  showResetConfirm.value = false;
  saveState();
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
  appStore.showToast('Прогресс урока сброшен', 'info');
}

function restartLesson() {
  if (isCompleted.value) {
    appStore.showToast('Урок уже пройден, начните новый урок', 'warning');
    router.push('/english/lessons');
    return;
  }
  resetCurrentProgress();
  localStorage.removeItem(`eng_lesson_${numericLessonId}_state`);
  showDeathModal.value = false;
  appStore.showToast('Урок начат заново', 'success');
}

async function ensurePackFromLesson() {
  const uid = progressFirestore.getUserId();
  if (!uid) return;
  const packName = `${lesson.value.title} (урок ${lesson.value.lesson_id})`;
  const existingPack = packStore.packs.find(p => p.name === packName);
  if (existingPack) return;
  const words = [];
  for (const wid of lesson.value.new_vocabulary_ids || []) {
    const word = vocabularyData.find(w => w.id === wid);
    if (word) {
      words.push({
        front: word.word,
        back: word.translation,
        level: lesson.value.level,
        example: word.example || ''
      });
    }
  }
  if (words.length > 0) {
    await packStore.createPack({
      name: packName,
      level: lesson.value.level,
      cards: words
    });
    await packStore.refreshPacks();
    appStore.showToast(`📦 Создан пак "${packName}"`, 'success');
  }
}

async function finishLesson() {
  if (!isCompleted.value) {
    await progressFirestore.addCompletedLesson(lessonId);
    await ensurePackFromLesson();
    lives.value = maxLives;
  }
  localStorage.removeItem(`eng_lesson_${numericLessonId}_state`);
  router.push('/english/lessons');
}

function goBack() {
  saveState();
  router.push('/english/lessons');
}

function confirmReset() { showResetConfirm.value = true; }

// ========== ЗАКРЫТИЕ СЕЛЕКТА ПРИ КЛИКЕ ВНЕ ==========
function handleClickOutside(event) {
  if (openSelectIdx.value !== null) {
    const selectElements = document.querySelectorAll('.custom-select');
    let isInside = false;
    for (let el of selectElements) {
      if (el.contains(event.target)) {
        isInside = true;
        break;
      }
    }
    if (!isInside) {
      openSelectIdx.value = null;
    }
  }
}

watch(lives, (newVal) => {
  if (!isCompleted.value && newVal <= 0) {
    showDeathModal.value = true;
  }
});

watch(currentPage, () => {
  if (currentPageData.value?.type === 'make_sentence') {
    for (let idx = 0; idx < currentPageData.value.items.length; idx++) {
      if (!currentPageData.value.items[idx]._initialized) {
        initMakeSentence(idx, currentPageData.value.items[idx].words);
        currentPageData.value.items[idx]._initialized = true;
      }
    }
  }
  if (currentPageData.value?.type === 'match_words' && matchLeftItems.value.length === 0) {
    initMatchItems(currentPageData.value.items);
  }
});

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  await loadLesson();
  loadState();
  if (currentPageData.value?.type === 'match_words' && matchLeftItems.value.length === 0) {
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
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  saveState();
});
</script>

<style scoped>
/* Стили остаются без изменений (такие же, как у вас были) */
.lesson-screen {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: var(--gray-50);
}
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
  background-size: 200% 100%;
  transition: width 0.3s ease;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
.page-counter {
  font-size: 0.85rem;
  color: var(--gray-500);
}
.reset-lesson-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all 0.2s;
}
.reset-lesson-btn:hover {
  background: var(--gray-100);
  color: var(--warning);
}
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
.centered {
  text-align: center;
}
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
.dialogue-questions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.dialogue-questions h4 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--secondary);
}
.comprehension-item {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}
.comprehension-item .question {
  font-weight: 500;
  margin-bottom: 0.5rem;
}
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
  flex: 1;
}
.hint-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--primary);
  transition: transform 0.2s;
}
.hint-btn:hover {
  transform: scale(1.1);
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
.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}
.answer-input.small {
  width: 100%;
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
.custom-select {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0.5rem 0;
}
.select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.select-arrow {
  font-size: 0.7rem;
  color: var(--gray-500);
}
.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 1rem;
  margin-top: 0.25rem;
  z-index: 10;
  box-shadow: var(--shadow-md);
}
.select-option {
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.select-option:hover {
  background: var(--gray-100);
}
.select-option.selected {
  background: var(--primary);
  color: white;
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
  margin-bottom: 0.5rem;
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
.matching-matched {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.matched-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.matched-pair {
  background: rgba(16, 185, 129, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.pair-arrow {
  color: var(--gray-500);
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
  background: rgba(239, 68, 68, 0.2);
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
.hint-modal {
  max-width: 500px;
  text-align: left;
}
.hint-modal .modal-body {
  text-align: left;
}
.reset-modal .btn-danger {
  background: var(--danger);
  color: white;
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
.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
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
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
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
body.dark-theme .lesson-screen {
  background: var(--gray-900);
}
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
body.dark-theme .exercise-item,
body.dark-theme .sentence-preview,
body.dark-theme .custom-select .select-trigger,
body.dark-theme .custom-select .select-dropdown {
  background: var(--gray-700);
}
body.dark-theme .word {
  color: white;
}
body.dark-theme .back-btn:hover {
  background: var(--gray-700);
}
body.dark-theme .option-btn,
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
body.dark-theme .hint-btn {
  color: var(--primary-light);
}
.translation-source {
  background: var(--primary-light);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--secondary);
}
</style>