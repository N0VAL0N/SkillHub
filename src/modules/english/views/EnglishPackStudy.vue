<template>
  <div class="pack-study">
    <div class="study-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Назад
      </button>
      <div class="pack-title">{{ pack?.name }}</div>
      <div class="progress-text">
        {{ mode === 'study' ? currentCardIndex + 1 : cards.length + currentTestIndex + 1 }} / {{ totalSteps }}
      </div>
    </div>

    <div class="progress-bar custom-progress">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- ЭТАП 1: Изучение карточек -->
    <div v-if="mode === 'study' && currentCard" class="card-container">
      <div class="card-flip" @click="flipCard" :class="{ flipped: isFlipped }">
        <div class="card-front">
          <span class="front-text">{{ currentCard.front }}</span>
        </div>
        <div class="card-back">
          <span class="back-text">{{ currentCard.back }}</span>
          <div class="example" v-if="currentCard.example">{{ currentCard.example }}</div>
        </div>
      </div>
      <p class="flip-hint">👆 нажми на карточку, чтобы увидеть перевод</p>
      <div class="study-actions">
        <button class="nav-btn" @click="prevCard" :disabled="currentCardIndex === 0">← Назад</button>
        <button class="nav-btn next" @click="nextCard">Далее →</button>
      </div>
    </div>

    <!-- ЭТАП 2: Тестирование -->
    <div v-else-if="mode === 'test'" class="test-container">
      <div class="test-mode-indicator">
        <span class="mode-badge" :class="testMode">
          {{ testMode === 'eng2rus' ? '🇬🇧 → 🇷🇺 Англ → Русский' : testMode === 'rus2eng' ? '🇷🇺 → 🇬🇧 Русский → Англ' : '🔗 Сопоставление' }}
        </span>
        <span class="mode-progress">{{ currentTestIndex + 1 }} / {{ testQuestions.length }}</span>
      </div>

      <!-- Multiple Choice -->
      <div v-if="testMode !== 'matching' && currentTestQuestion" class="multiple-choice-area">
        <div class="question-word">{{ currentTestQuestion.question }}</div>
        <div class="options">
          <button
            v-for="(opt, idx) in currentTestQuestion.options"
            :key="idx"
            class="option-card"
            :class="{ 
              selected: selectedTestOption === idx,
              correct: showTestResult && idx === currentTestQuestion.correct,
              wrong: showTestResult && selectedTestOption === idx && idx !== currentTestQuestion.correct
            }"
            @click="selectTestOption(idx)"
            :disabled="showTestResult"
          >
            {{ opt }}
          </button>
        </div>
        <div v-if="showTestResult" class="result-area">
          <div class="result-message" :class="{ correct: isTestCorrect, wrong: !isTestCorrect }">
            {{ isTestCorrect ? '✅ Правильно!' : '❌ Неправильно!' }}
          </div>
          <div v-if="!isTestCorrect" class="correct-answer">
            Правильный ответ: {{ currentTestQuestion.correctAnswerText }}
          </div>
          <button class="btn-next" @click="nextTestQuestion">
            {{ isLastTest ? 'Завершить' : 'Следующий вопрос →' }}
          </button>
        </div>
      </div>

      <!-- Matching -->
      <div v-else-if="testMode === 'matching' && currentTestQuestion" class="matching-area">
        <div class="matching-container">
          <div class="matching-column">
            <h4>🇬🇧 Английский</h4>
            <div
              v-for="item in availableLeft"
              :key="item.id"
              class="match-card"
              :class="{ selected: tempMatchSelected.left === item.id }"
              @click="selectMatchLeft(item.id, item.text)"
            >
              {{ item.text }}
            </div>
          </div>
          <div class="matching-column">
            <h4>🇷🇺 Русский</h4>
            <div
              v-for="item in availableRight"
              :key="item.id"
              class="match-card"
              :class="{ selected: tempMatchSelected.right === item.id }"
              @click="selectMatchRight(item.id, item.text)"
            >
              {{ item.text }}
            </div>
          </div>
        </div>
        <div v-if="matchedPairs.length > 0" class="matching-matched">
          <h4>✓ Сопоставленные пары</h4>
          <div class="matched-pairs">
            <div v-for="pair in matchedPairs" :key="pair.enId" class="matched-pair">
              <span>{{ pair.en }}</span>
              <span class="pair-arrow">→</span>
              <span>{{ pair.ru }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResultsModal" class="modal-overlay" @click.self="showResultsModal = false">
      <div class="modal results-modal">
        <h2>Результаты</h2>
        <div class="score-circle">
          <div class="score-percent">{{ scorePercent }}%</div>
        </div>
        <p>✅ Правильно: {{ testCorrect }} из {{ testTotal }}</p>
        <p>🎯 Точность: {{ scorePercent }}%</p>
        <div class="learned-words-section" v-if="learnedWordsCount > 0">
          <h4>📚 Выучено слов: {{ learnedWordsCount }} / {{ cards.length }}</h4>
          <div class="learned-words-list">
            <span v-for="word in learnedWordsList" :key="word.id" class="learned-badge">
              {{ word.front }} ✓
            </span>
          </div>
        </div>
        <div class="not-learned-section" v-if="notLearnedWordsCount > 0">
          <h4>📖 Осталось выучить: {{ notLearnedWordsCount }}</h4>
        </div>
        <div class="modal-actions">
          <button v-if="!isReviewMode" class="btn-primary" @click="retryMistakes">Повторить ошибки</button>
          <button class="btn-primary" @click="resetPack">Пройти заново</button>
          <button class="btn-outline" @click="goBack">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useAppStore } from '@core/stores/appStore';
import vocabularyData from '../data/vocabulary.json';

const router = useRouter();
const route = useRoute();
const packId = route.params.id;
const studyMode = route.query.mode || 'unlearned';
const isReviewMode = ref(studyMode === 'review');

const packStore = useEnglishPackStore();
const progressFirestore = useEnglishProgressFirestore();
const appStore = useAppStore();

const pack = ref(null);
const allCards = ref([]);
const cards = ref([]);
const mode = ref('study');
const currentCardIndex = ref(0);
const isFlipped = ref(false);

const testQuestions = ref([]);
const currentTestIndex = ref(0);
const selectedTestOption = ref(null);
const showTestResult = ref(false);
const isTestCorrect = ref(false);
const testCorrect = ref(0);
const showResultsModal = ref(false);
const testMode = ref('eng2rus');

// Matching state
const shuffledLeft = ref([]);
const shuffledRight = ref([]);
const matchedPairs = ref([]);
const tempMatchSelected = ref({ left: null, right: null });
const matchingCompleted = ref(false);

// Прогресс слов
const wordStatus = ref({});
const learnedWordsCache = ref(new Set());
const wordHasMistake = ref({});

const STUDY_STORAGE_KEY = `pack_study_${packId}`;

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getWordIdByFront(front) {
  const word = vocabularyData.find(w => w.word === front);
  return word?.id || null;
}

function initWordStatus() {
  const status = {};
  for (const card of cards.value) {
    const wordId = getWordIdByFront(card.front);
    const isAlreadyLearned = wordId && learnedWordsCache.value.has(wordId);
    status[card.id] = {
      eng2rus: isAlreadyLearned,
      rus2eng: isAlreadyLearned,
      matching: isAlreadyLearned,
      front: card.front,
      back: card.back,
      wordId: wordId
    };
  }
  wordStatus.value = status;
  for (const card of cards.value) {
    wordHasMistake.value[card.id] = false;
  }
}

function isWordFullyLearned(cardId) {
  const s = wordStatus.value[cardId];
  return s && s.eng2rus && s.rus2eng && s.matching;
}

function updateWordProgress(cardId, type, isCorrect) {
  if (isReviewMode.value) return false;
  const s = wordStatus.value[cardId];
  if (!s) return false;
  if (!isCorrect) {
    wordHasMistake.value[cardId] = true;
    return false;
  }
  if (wordHasMistake.value[cardId]) return false;
  if (type === 'eng2rus') s.eng2rus = true;
  if (type === 'rus2eng') s.rus2eng = true;
  if (type === 'matching') s.matching = true;
  if (s.eng2rus && s.rus2eng && s.matching) {
    if (s.wordId && !learnedWordsCache.value.has(s.wordId)) {
      progressFirestore.addLearnedWord(s.wordId).then(() => {
        learnedWordsCache.value.add(s.wordId);
        appStore.showToast(`🎉 Слово "${s.front}" выучено!`, 'success');
      });
    }
    const packProgress = progressFirestore.getPackProgress(packId);
    const learnedIds = packProgress.learnedCardIds || [];
    if (!learnedIds.includes(cardId)) {
      learnedIds.push(cardId);
      progressFirestore.updatePackProgress(packId, learnedIds);
    }
    return true;
  }
  return false;
}

function generateWrongOptions(correctValue, type) {
  const allValues = type === 'rus' ? cards.value.map(c => c.back) : cards.value.map(c => c.front);
  const unique = [...new Set(allValues.filter(v => v !== correctValue))];
  const shuffled = shuffleArray(unique);
  return shuffled.slice(0, 3);
}

function generateTestQuestions() {
  let notLearnedCards;
  if (isReviewMode.value) {
    notLearnedCards = cards.value;
  } else {
    notLearnedCards = cards.value.filter(card => !isWordFullyLearned(card.id));
  }
  
  const questions = [];
  
  for (const card of notLearnedCards) {
    if (!wordStatus.value[card.id]?.eng2rus) {
      const wrong = generateWrongOptions(card.back, 'rus');
      const options = [card.back, ...wrong].sort(() => 0.5 - Math.random());
      questions.push({
        id: `${card.id}_eng2rus`,
        cardId: card.id,
        mode: 'eng2rus',
        question: `Что означает "${card.front}"?`,
        options,
        correct: options.indexOf(card.back),
        correctAnswerText: card.back
      });
    }
    if (!wordStatus.value[card.id]?.rus2eng) {
      const wrong = generateWrongOptions(card.front, 'eng');
      const options = [card.front, ...wrong].sort(() => 0.5 - Math.random());
      questions.push({
        id: `${card.id}_rus2eng`,
        cardId: card.id,
        mode: 'rus2eng',
        question: `Как переводится "${card.back}"?`,
        options,
        correct: options.indexOf(card.front),
        correctAnswerText: card.front
      });
    }
  }
  
  const notLearnedForMatching = notLearnedCards.filter(c => !wordStatus.value[c.id]?.matching);
  if (notLearnedForMatching.length >= 1) {
    if (notLearnedForMatching.length === 1) {
      const card = notLearnedForMatching[0];
      questions.push({
        id: `matching_${Date.now()}_single`,
        cardIds: [card.id],
        mode: 'matching',
        items: [{ id: card.id, eng: card.front, rus: card.back }]
      });
    } else {
      const chunkSize = Math.min(6, notLearnedForMatching.length);
      for (let i = 0; i < notLearnedForMatching.length; i += chunkSize) {
        const chunk = notLearnedForMatching.slice(i, i + chunkSize);
        if (chunk.length >= 2) {
          questions.push({
            id: `matching_${Date.now()}_${i}`,
            cardIds: chunk.map(c => c.id),
            mode: 'matching',
            items: chunk.map(c => ({ id: c.id, eng: c.front, rus: c.back }))
          });
        }
      }
    }
  }
  
  testQuestions.value = shuffleArray(questions);
  if (testQuestions.value.length) {
    testMode.value = testQuestions.value[0].mode;
    resetMatchingState();
  } else {
    // Если нет вопросов, сразу показываем результаты
    finishTest();
  }
}

function resetMatchingState() {
  if (testMode.value !== 'matching' || !currentTestQuestion.value) return;
  const items = currentTestQuestion.value.items;
  const left = items.map(item => ({ id: item.id, text: item.eng }));
  const right = items.map(item => ({ id: item.id, text: item.rus }));
  shuffledLeft.value = left;
  shuffledRight.value = shuffleArray([...right]);
  matchedPairs.value = [];
  tempMatchSelected.value = { left: null, right: null };
  matchingCompleted.value = false;
}

const availableLeft = computed(() => {
  const matchedIds = matchedPairs.value.map(p => p.enId);
  return shuffledLeft.value.filter(item => !matchedIds.includes(item.id));
});
const availableRight = computed(() => {
  const matchedIds = matchedPairs.value.map(p => p.ruId);
  return shuffledRight.value.filter(item => !matchedIds.includes(item.id));
});

function selectMatchLeft(id, text) {
  if (matchingCompleted.value) return;
  if (matchedPairs.value.some(p => p.enId === id)) return;
  if (tempMatchSelected.value.right) {
    const rightId = tempMatchSelected.value.right;
    const leftItem = currentTestQuestion.value.items.find(i => i.id === id);
    const rightItem = currentTestQuestion.value.items.find(i => i.id === rightId);
    if (leftItem && rightItem && leftItem.eng === rightItem.eng) {
      matchedPairs.value.push({ enId: id, ruId: rightId, en: leftItem.eng, ru: rightItem.rus });
      tempMatchSelected.value = { left: null, right: null };
      if (matchedPairs.value.length === currentTestQuestion.value.items.length) {
        matchingCompleted.value = true;
        let allCorrect = true;
        for (const item of currentTestQuestion.value.items) {
          const correct = updateWordProgress(item.id, 'matching', true);
          if (!correct) allCorrect = false;
        }
        if (allCorrect) {
          testCorrect.value++;
        }
        setTimeout(() => nextTestQuestion(), 1000);
      }
    } else {
      appStore.showToast('❌ Неверное сопоставление!', 'error');
      if (leftItem) wordHasMistake.value[leftItem.id] = true;
      if (rightItem) wordHasMistake.value[rightItem.id] = true;
      tempMatchSelected.value = { left: null, right: null };
    }
  } else {
    tempMatchSelected.value = { left: id, right: null };
  }
}

function selectMatchRight(id, text) {
  if (matchingCompleted.value) return;
  if (matchedPairs.value.some(p => p.ruId === id)) return;
  if (tempMatchSelected.value.left) {
    const leftId = tempMatchSelected.value.left;
    const leftItem = currentTestQuestion.value.items.find(i => i.id === leftId);
    const rightItem = currentTestQuestion.value.items.find(i => i.id === id);
    if (leftItem && rightItem && leftItem.eng === rightItem.eng) {
      matchedPairs.value.push({ enId: leftId, ruId: id, en: leftItem.eng, ru: rightItem.rus });
      tempMatchSelected.value = { left: null, right: null };
      if (matchedPairs.value.length === currentTestQuestion.value.items.length) {
        matchingCompleted.value = true;
        let allCorrect = true;
        for (const item of currentTestQuestion.value.items) {
          const correct = updateWordProgress(item.id, 'matching', true);
          if (!correct) allCorrect = false;
        }
        if (allCorrect) {
          testCorrect.value++;
        }
        setTimeout(() => nextTestQuestion(), 1000);
      }
    } else {
      appStore.showToast('❌ Неверное сопоставление!', 'error');
      if (leftItem) wordHasMistake.value[leftItem.id] = true;
      if (rightItem) wordHasMistake.value[rightItem.id] = true;
      tempMatchSelected.value = { left: null, right: null };
    }
  } else {
    tempMatchSelected.value = { left: null, right: id };
  }
}

function selectTestOption(idx) {
  if (showTestResult.value) return;
  selectedTestOption.value = idx;
  const isCorrect = idx === currentTestQuestion.value.correct;
  isTestCorrect.value = isCorrect;
  showTestResult.value = true;
  updateWordProgress(currentTestQuestion.value.cardId, currentTestQuestion.value.mode, isCorrect);
  if (!isLastTest.value) {
    setTimeout(() => nextTestQuestion(), 1000);
  }
}

function nextTestQuestion() {
  if (currentTestIndex.value + 1 < testQuestions.value.length) {
    currentTestIndex.value++;
    selectedTestOption.value = null;
    showTestResult.value = false;
    const newMode = testQuestions.value[currentTestIndex.value].mode;
    if (newMode !== testMode.value) {
      testMode.value = newMode;
      resetMatchingState();
    } else if (testMode.value === 'matching') {
      resetMatchingState();
    }
  } else {
    finishTest();
  }
}

function finishTest() {
  showResultsModal.value = true;
}

function nextCard() {
  if (currentCardIndex.value + 1 < cards.value.length) {
    currentCardIndex.value++;
    isFlipped.value = false;
    saveState();
  } else {
    mode.value = 'test';
    generateTestQuestions();
    saveState();
  }
}

function prevCard() {
  if (currentCardIndex.value > 0) {
    currentCardIndex.value--;
    isFlipped.value = false;
    saveState();
  }
}

function flipCard() { isFlipped.value = !isFlipped.value; }

function retryMistakes() {
  for (const card of cards.value) {
    wordHasMistake.value[card.id] = false;
  }
  const notLearnedCardIds = Object.entries(wordStatus.value)
    .filter(([_, s]) => !(s.eng2rus && s.rus2eng && s.matching))
    .map(([id]) => id);
  const notLearnedCards = cards.value.filter(c => notLearnedCardIds.includes(c.id));
  if (notLearnedCards.length === 0) {
    appStore.showToast('Все слова выучены!', 'success');
    showResultsModal.value = false;
    goBack();
    return;
  }
  const newQuestions = [];
  for (const card of notLearnedCards) {
    if (!wordStatus.value[card.id]?.eng2rus) {
      const wrong = generateWrongOptions(card.back, 'rus');
      const options = [card.back, ...wrong].sort(() => 0.5 - Math.random());
      newQuestions.push({
        id: `${card.id}_eng2rus`,
        cardId: card.id,
        mode: 'eng2rus',
        question: `Что означает "${card.front}"?`,
        options,
        correct: options.indexOf(card.back),
        correctAnswerText: card.back
      });
    }
    if (!wordStatus.value[card.id]?.rus2eng) {
      const wrong = generateWrongOptions(card.front, 'eng');
      const options = [card.front, ...wrong].sort(() => 0.5 - Math.random());
      newQuestions.push({
        id: `${card.id}_rus2eng`,
        cardId: card.id,
        mode: 'rus2eng',
        question: `Как переводится "${card.back}"?`,
        options,
        correct: options.indexOf(card.front),
        correctAnswerText: card.front
      });
    }
  }
  const notLearnedForMatching = notLearnedCards.filter(c => !wordStatus.value[c.id]?.matching);
  if (notLearnedForMatching.length >= 1) {
    if (notLearnedForMatching.length === 1) {
      const card = notLearnedForMatching[0];
      newQuestions.push({
        id: `matching_${Date.now()}_single`,
        cardIds: [card.id],
        mode: 'matching',
        items: [{ id: card.id, eng: card.front, rus: card.back }]
      });
    } else {
      const chunkSize = Math.min(6, notLearnedForMatching.length);
      for (let i = 0; i < notLearnedForMatching.length; i += chunkSize) {
        const chunk = notLearnedForMatching.slice(i, i + chunkSize);
        if (chunk.length >= 2) {
          newQuestions.push({
            id: `matching_${Date.now()}_${i}`,
            cardIds: chunk.map(c => c.id),
            mode: 'matching',
            items: chunk.map(c => ({ id: c.id, eng: c.front, rus: c.back }))
          });
        }
      }
    }
  }
  testQuestions.value = shuffleArray(newQuestions);
  currentTestIndex.value = 0;
  testCorrect.value = 0;
  selectedTestOption.value = null;
  showTestResult.value = false;
  showResultsModal.value = false;
  if (testQuestions.value.length) {
    testMode.value = testQuestions.value[0].mode;
    resetMatchingState();
  }
  saveState();
}

function resetPack() {
  for (const card of cards.value) {
    if (wordStatus.value[card.id]) {
      wordStatus.value[card.id].eng2rus = false;
      wordStatus.value[card.id].rus2eng = false;
      wordStatus.value[card.id].matching = false;
    }
    wordHasMistake.value[card.id] = false;
  }
  mode.value = 'study';
  currentCardIndex.value = 0;
  isFlipped.value = false;
  testQuestions.value = [];
  currentTestIndex.value = 0;
  testCorrect.value = 0;
  showResultsModal.value = false;
  generateTestQuestions();
  saveState();
}

function saveState() {
  const state = {
    mode: mode.value,
    currentCardIndex: currentCardIndex.value,
    testMode: testMode.value,
    testQuestions: testQuestions.value,
    currentTestIndex: currentTestIndex.value,
    testCorrect: testCorrect.value,
    wordStatus: wordStatus.value,
    wordHasMistake: wordHasMistake.value
  };
  localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STUDY_STORAGE_KEY);
  if (saved) {
    try {
      const state = JSON.parse(saved);
      mode.value = state.mode || 'study';
      currentCardIndex.value = state.currentCardIndex || 0;
      if (state.testMode) testMode.value = state.testMode;
      if (state.testQuestions) testQuestions.value = state.testQuestions;
      currentTestIndex.value = state.currentTestIndex || 0;
      testCorrect.value = state.testCorrect || 0;
      if (state.wordStatus) wordStatus.value = state.wordStatus;
      if (state.wordHasMistake) wordHasMistake.value = state.wordHasMistake;
    } catch(e) {}
  }
}

function goBack() {
  router.push('/english/packs');
}

const currentCard = computed(() => cards.value[currentCardIndex.value]);
const totalSteps = computed(() => cards.value.length + testQuestions.value.length);
const progressPercent = computed(() => {
  if (mode.value === 'study') {
    return ((currentCardIndex.value + 1) / totalSteps.value) * 100;
  } else {
    return ((cards.value.length + currentTestIndex.value + 1) / totalSteps.value) * 100;
  }
});
const currentTestQuestion = computed(() => testQuestions.value[currentTestIndex.value]);
const isLastTest = computed(() => currentTestIndex.value === testQuestions.value.length - 1);
const testTotal = computed(() => testQuestions.value.length);
const totalPossibleCorrect = computed(() => cards.value.length * 3);
const scorePercent = computed(() => {
  if (totalPossibleCorrect.value === 0) return 0;
  return Math.round((testCorrect.value / totalPossibleCorrect.value) * 100);
});
const learnedWordsCount = computed(() => Object.values(wordStatus.value).filter(s => s.eng2rus && s.rus2eng && s.matching).length);
const notLearnedWordsCount = computed(() => cards.value.length - learnedWordsCount.value);
const learnedWordsList = computed(() => cards.value.filter(card => isWordFullyLearned(card.id)));

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  pack.value = packStore.packs.find(p => p.id === packId);
  if (pack.value) {
    allCards.value = pack.value.cards || [];
    const progress = progressFirestore.getPackProgress(packId);
    const learnedIds = new Set(progress.learnedCardIds || []);
    
    if (studyMode === 'unlearned') {
      cards.value = allCards.value.filter(card => !learnedIds.has(card.id));
    } else if (studyMode === 'review') {
      cards.value = [...allCards.value];
    } else {
      cards.value = [...allCards.value];
    }
    
    if (cards.value.length === 0) {
      appStore.showToast(studyMode === 'review' ? 'Нет слов для повторения' : 'Все слова уже выучены!', 'info');
      router.push('/english/packs');
      return;
    }
    
    learnedWordsCache.value = new Set(progressFirestore.learnedWords);
    initWordStatus();
    loadState();
    if (mode.value === 'test') {
      generateTestQuestions();
    }
  }
});
</script>


<style scoped>
.pack-study {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: var(--gray-50);
}
.study-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.pack-title {
  font-weight: 600;
  color: var(--secondary);
}
.progress-text {
  font-size: 0.9rem;
  color: var(--gray-500);
}
.custom-progress {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.custom-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  transition: width 0.3s;
}
.card-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.card-flip {
  position: relative;
  width: 100%;
  min-height: 300px;
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
.front-text {
  font-size: 2rem;
  font-weight: bold;
  color: var(--secondary);
  text-align: center;
}
.back-text {
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--primary);
  text-align: center;
}
.example {
  font-size: 0.9rem;
  color: var(--gray-600);
  margin-top: 1rem;
  text-align: center;
}
.flip-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--gray-400);
}
.study-actions {
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
.nav-btn.next {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.nav-btn.next:hover {
  background: var(--primary-dark);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.test-container {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.test-mode-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.mode-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 500;
}
.mode-badge.eng2rus {
  background: #3b82f620;
  color: #3b82f6;
}
.mode-badge.rus2eng {
  background: #10b98120;
  color: #10b981;
}
.mode-badge.matching {
  background: #8b5cf620;
  color: #8b5cf6;
}
.mode-progress {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.question-word {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: var(--secondary);
  margin-bottom: 2rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.option-card {
  flex: 1;
  min-width: 180px;
  padding: 1rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.option-card.selected {
  background: var(--primary);
  color: white;
}
.option-card.correct {
  background: var(--success);
  color: white;
}
.option-card.wrong {
  background: var(--danger);
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
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.match-card:hover {
  border-color: var(--primary);
}
.match-card.selected {
  background: var(--primary);
  color: white;
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
.result-area {
  text-align: center;
  margin-top: 1rem;
}
.result-message {
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}
.result-message.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.result-message.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.correct-answer {
  font-size: 0.85rem;
  color: var(--success);
  margin-bottom: 0.75rem;
}
.btn-next {
  padding: 0.5rem 1.2rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
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
  max-width: 450px;
  width: 90%;
  text-align: center;
  max-height: 80vh;
  overflow-y: auto;
}
.score-percent {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
}
.learned-words-section, .not-learned-section {
  margin-top: 1rem;
  text-align: left;
}
.learned-words-section h4, .not-learned-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
}
.learned-words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.learned-badge {
  background: var(--success-light);
  color: var(--success);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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
body.dark-theme .pack-study {
  background: var(--gray-900);
}
body.dark-theme .card-front,
body.dark-theme .card-back,
body.dark-theme .test-container,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .front-text {
  color: white;
}
body.dark-theme .option-card,
body.dark-theme .match-card {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .option-card.selected,
body.dark-theme .match-card.selected {
  background: var(--primary);
  color: white;
}
body.dark-theme .question-word {
  color: white;
}
body.dark-theme .learned-badge {
  background: rgba(16, 185, 129, 0.2);
}
body.dark-theme .matched-pair {
  background: rgba(16, 185, 129, 0.25);
}
</style>