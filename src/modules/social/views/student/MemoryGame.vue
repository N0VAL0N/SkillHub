<template>
  <div class="memory-game-fullscreen">
    <div class="game-header">
      <button @click="$router.push('/student/games')" class="btn-back">← Назад</button>
      <h1>🧠 Мемори: термины</h1>
      <div class="difficulty-selector">
        <button 
          v-for="level in difficultyOptions" 
          :key="level.value"
          class="difficulty-btn"
          :class="{ active: difficulty === level.value }"
          @click="changeDifficulty(level.value)"
        >
          {{ level.label }}
        </button>
      </div>
    </div>

    <div class="game-stats-header">
      <span>🎯 Попытки: {{ attempts }}</span>
      <span>⏱️ {{ formatTime(elapsedTime) }}</span>
      <span>✅ Найдено пар: {{ matchedPairs }} / {{ totalPairs }}</span>
    </div>

    <div class="cards-grid" :class="gridClass">
      <div
        v-for="(card, idx) in cards"
        :key="idx"
        class="memory-card"
        :class="{ 
          flipped: card.flipped || card.matched, 
          matched: card.matched,
          [`pair-${card.pairId % 12}`]: card.matched
        }"
        @click="flipCard(idx)"
      >
        <div class="card-front">
          <span>{{ card.front }}</span>
        </div>
        <div class="card-back">
          <span>?</span>
        </div>
      </div>
    </div>

    <div v-if="gameFinished" class="completion-overlay">
      <div class="completion-modal">
        <div class="completion-icon">🎉</div>
        <h2>Поздравляем!</h2>
        <p>Вы нашли все пары за {{ attempts }} попыток</p>
        <p>Время: {{ formatTime(elapsedTime) }}</p>
        <div class="completion-buttons">
          <button class="btn-primary" @click="resetGame">Играть снова</button>
          <button class="btn-outline" @click="goBack">На главную</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import topicsData from '@/modules/social/data/topics.json';

const router = useRouter();
const userId = auth.currentUser?.uid;

// Цвета для пар (12 разных цветов)
const pairColors = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
  '#F44336', '#00BCD4', '#FFEB3B', '#E91E63',
  '#8BC34A', '#673AB7', '#FF5722', '#009688'
];

// Конфигурация сложности
const difficultyOptions = [
  { value: 'easy', label: 'Лёгкий', cols: 4, rows: 2, totalPairs: 4 },
  { value: 'medium', label: 'Средний', cols: 4, rows: 4, totalPairs: 8 },
  { value: 'hard', label: 'Сложный', cols: 4, rows: 6, totalPairs: 12 }
];

const difficulty = ref('medium');
const allTerms = ref([]);

const cards = ref([]);
const flippedIndexes = ref([]);
const matchedPairs = ref(0);
const attempts = ref(0);
const gameFinished = ref(false);
let timerInterval = null;
const elapsedTime = ref(0);

// Вычисляемые свойства
const totalPairs = computed(() => {
  const config = difficultyOptions.find(d => d.value === difficulty.value);
  return config?.totalPairs || 8;
});

const gridClass = computed(() => {
  const config = difficultyOptions.find(d => d.value === difficulty.value);
  return `grid-${config?.cols}x${config?.rows}`;
});

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Загрузка терминов из topics.json
const loadTerms = () => {
  const terms = [];
  const blocks = topicsData.blocks || [];
  blocks.forEach(block => {
    block.topics?.forEach(topic => {
      topic.definitions?.forEach(def => {
        terms.push({ term: def.term, definition: def.definition });
      });
    });
  });
  allTerms.value = terms;
};

// Инициализация колоды под текущую сложность
const initCards = () => {
  const config = difficultyOptions.find(d => d.value === difficulty.value);
  const neededPairs = config.totalPairs;
  
  if (allTerms.value.length < neededPairs) return;
  
  const shuffledTerms = shuffleArray([...allTerms.value]);
  const selected = shuffledTerms.slice(0, neededPairs);
  
  let deck = [];
  selected.forEach((pair, idx) => {
    deck.push({ id: idx, text: pair.term, pairId: idx, color: pairColors[idx % pairColors.length] });
    deck.push({ id: idx, text: pair.definition, pairId: idx, color: pairColors[idx % pairColors.length] });
  });
  
  deck = shuffleArray(deck);
  
  cards.value = deck.map((card, idx) => ({
    id: idx,
    front: card.text,
    pairId: card.pairId,
    color: card.color,
    flipped: false,
    matched: false
  }));
};

const changeDifficulty = (newDifficulty) => {
  difficulty.value = newDifficulty;
  resetGame();
};

const resetGame = async () => {
  if (timerInterval) clearInterval(timerInterval);
  elapsedTime.value = 0;
  attempts.value = 0;
  matchedPairs.value = 0;
  gameFinished.value = false;
  flippedIndexes.value = [];
  startTimer();
  initCards();
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameFinished.value) {
      elapsedTime.value++;
    }
  }, 1000);
};

const flipCard = (idx) => {
  if (gameFinished.value) return;
  const card = cards.value[idx];
  if (card.flipped || card.matched) return;
  if (flippedIndexes.value.length === 2) return;

  card.flipped = true;
  flippedIndexes.value.push(idx);

  if (flippedIndexes.value.length === 2) {
    attempts.value++;
    const idx1 = flippedIndexes.value[0];
    const idx2 = flippedIndexes.value[1];
    const card1 = cards.value[idx1];
    const card2 = cards.value[idx2];

    if (card1.pairId === card2.pairId) {
      card1.matched = true;
      card2.matched = true;
      matchedPairs.value++;
      flippedIndexes.value = [];
      
      if (matchedPairs.value === totalPairs.value) {
        gameFinished.value = true;
        if (timerInterval) clearInterval(timerInterval);
        saveStats();
      }
    } else {
      setTimeout(() => {
        if (!cards.value[idx1]?.matched) cards.value[idx1].flipped = false;
        if (!cards.value[idx2]?.matched) cards.value[idx2].flipped = false;
        flippedIndexes.value = [];
      }, 800);
    }
  }
};

const saveStats = async () => {
  if (!userId) return;
  const statsRef = doc(db, 'gameStats', userId);
  const statsSnap = await getDoc(statsRef);
  const currentStats = statsSnap.exists() ? statsSnap.data() : {};
  
  const diffKey = difficulty.value;
  const memoryStats = currentStats.memory || {};
  const diffStats = memoryStats[diffKey] || {
    gamesPlayed: 0,
    bestAttempts: null,
    bestTime: null,
    totalAttempts: 0,
    totalTime: 0
  };
  
  diffStats.gamesPlayed++;
  diffStats.totalAttempts += attempts.value;
  diffStats.totalTime += elapsedTime.value;
  
  if (diffStats.bestAttempts === null || attempts.value < diffStats.bestAttempts) {
    diffStats.bestAttempts = attempts.value;
  }
  if (diffStats.bestTime === null || elapsedTime.value < diffStats.bestTime) {
    diffStats.bestTime = elapsedTime.value;
  }
  
  memoryStats[diffKey] = diffStats;
  await setDoc(statsRef, { memory: memoryStats }, { merge: true });
};

const goBack = () => {
  router.push('/student/games');
};

onMounted(() => {
  loadTerms();
  initCards();
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.memory-game-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gray-100);
  z-index: 1000;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.btn-back {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.4rem;
}

.game-header h1 {
  font-size: 1.2rem;
  margin: 0;
}

.difficulty-selector {
  display: flex;
  gap: 0.3rem;
}

.difficulty-btn {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--gray-300);
  background: white;
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s;
}

.difficulty-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.game-stats-header {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  font-size: 0.7rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cards-grid {
  display: grid;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 0;
}

/* Сетки на всю ширину и высоту */
.grid-4x2 {
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(0, 1fr);
  height: calc(100vh - 140px);
}

.grid-4x4 {
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(0, 1fr);
  height: calc(100vh - 140px);
}

.grid-4x6 {
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(0, 1fr);
  height: calc(100vh - 140px);
}

.memory-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.memory-card.flipped {
  transform: rotateY(180deg);
}

.memory-card.matched {
  cursor: default;
  transform: rotateY(180deg);
}

/* Цветные пары для найденных карточек */
.memory-card.matched.pair-0 .card-front {
  background: #4CAF50;
  color: white;
}
.memory-card.matched.pair-1 .card-front {
  background: #2196F3;
  color: white;
}
.memory-card.matched.pair-2 .card-front {
  background: #FF9800;
  color: white;
}
.memory-card.matched.pair-3 .card-front {
  background: #9C27B0;
  color: white;
}
.memory-card.matched.pair-4 .card-front {
  background: #F44336;
  color: white;
}
.memory-card.matched.pair-5 .card-front {
  background: #00BCD4;
  color: white;
}
.memory-card.matched.pair-6 .card-front {
  background: #FFEB3B;
  color: #333;
}
.memory-card.matched.pair-7 .card-front {
  background: #E91E63;
  color: white;
}
.memory-card.matched.pair-8 .card-front {
  background: #8BC34A;
  color: white;
}
.memory-card.matched.pair-9 .card-front {
  background: #673AB7;
  color: white;
}
.memory-card.matched.pair-10 .card-front {
  background: #FF5722;
  color: white;
}
.memory-card.matched.pair-11 .card-front {
  background: #009688;
  color: white;
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.5rem;
  text-align: center;
  font-size: clamp(0.6rem, 3vw, 0.9rem);
  word-break: break-word;
  overflow-y: auto;
}

.card-front {
  background: var(--primary-light);
  transform: rotateY(180deg);
  color: var(--primary-dark);
}

.card-back {
  background: var(--primary);
  color: white;
  font-size: clamp(1.5rem, 8vw, 2.5rem);
}

.completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.completion-modal {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
  max-width: 90%;
  width: 300px;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.completion-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.completion-modal h2 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.completion-modal p {
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.completion-buttons {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-primary, .btn-outline {
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}

.btn-outline:hover {
  background: var(--gray-100);
}

/* Тёмная тема */
body.dark-theme .memory-game-fullscreen {
  background: var(--gray-900);
}

body.dark-theme .memory-card {
  background: var(--gray-800);
}

body.dark-theme .game-stats-header {
  background: var(--gray-800);
  color: var(--gray-200);
}

body.dark-theme .difficulty-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-300);
}

body.dark-theme .difficulty-btn.active {
  background: var(--primary);
  color: white;
}

body.dark-theme .completion-modal {
  background: var(--gray-800);
  color: white;
}

body.dark-theme .btn-outline {
  border-color: var(--gray-600);
  color: var(--gray-300);
}

body.dark-theme .btn-outline:hover {
  background: var(--gray-700);
}

/* Адаптив для совсем маленьких экранов */
@media (max-width: 480px) {
  .memory-game-fullscreen {
    padding: 0.5rem;
  }
  
  .game-header {
    gap: 0.3rem;
  }
  
  .game-header h1 {
    font-size: 1rem;
  }
  
  .difficulty-btn {
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
  }
  
  .game-stats-header {
    gap: 0.5rem;
    padding: 0.3rem 0.6rem;
    font-size: 0.65rem;
  }
  
  .cards-grid {
    gap: 0.3rem;
  }
  
  .grid-4x2, .grid-4x4, .grid-4x6 {
    height: calc(100vh - 120px);
  }
  
  .card-front, .card-back {
    padding: 0.25rem;
  }
}
</style>