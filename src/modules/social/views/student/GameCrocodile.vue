<template>
  <div class="game-fullscreen">
    <div class="game-header">
      <button @click="$router.push('/student/games')" class="btn-back">← Назад</button>
      <h1>🐊 Крокодил</h1>
      <div class="difficulty-selector">
        <button v-for="level in difficulties" :key="level.value"
          :class="{ active: difficulty === level.value }"
          @click="setDifficulty(level.value)">
          {{ level.label }}
        </button>
      </div>
    </div>

    <div class="game-card-wrapper" @dragstart.prevent>
      <div class="game-card"
        :class="{ dragging: isDragging, 'hint-correct': dragHint === 'correct', 'hint-incorrect': dragHint === 'incorrect' }"
        :style="{
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.2}deg)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @dragstart.prevent
        @selectstart.prevent>
        <div class="timer" :class="{ warning: timeLeft <= 5 }">⏱️ {{ timeLeft }} сек</div>
        <div class="term" v-if="currentTerm">{{ currentTerm.term }}</div>
        <div v-if="!showControls && !isDragging" class="waiting">Тяни карточку вправо ✅ или влево ❌</div>
        <div v-if="showControls && !isDragging" class="timeout-message">⏰ Время вышло! Нажмите в любом месте для продолжения</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">✅ Угадано: {{ correct }}</div>
      <div class="stat-item">❌ Не угадано: {{ incorrect }}</div>
      <div class="stat-item">📊 Всего: {{ total }}</div>
      <div class="stat-item">⏱️ Среднее время: {{ avgTime }} сек</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import topicsData from '@/modules/social/data/topics.json';

const difficulties = [
  { value: 'easy', label: 'Лёгкий', time: 45 },
  { value: 'medium', label: 'Средний', time: 30 },
  { value: 'hard', label: 'Сложный', time: 20 }
];

const difficulty = ref('medium');
const timeLimit = computed(() => difficulties.find(d => d.value === difficulty.value)?.time || 30);
const allTerms = ref([]);
let interval = null;
const timeLeft = ref(timeLimit.value);
const showControls = ref(false);
const currentTerm = ref(null);
const correct = ref(0);
const incorrect = ref(0);
const total = ref(0);
const avgTime = ref(0);
const userId = auth.currentUser?.uid;

// Drag & Drop
const isDragging = ref(false);
const dragOffset = ref(0);
const startX = ref(0);
const startOffset = ref(0);
const dragHint = ref(null);
const SWIPE_THRESHOLD = 80;

// Звук (Web Audio API)
let audioCtx = null;
const playBeep = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
    oscillator.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn('Web Audio API not supported');
  }
};

const startDrag = (e) => {
  if (showControls.value) return;
  isDragging.value = true;
  startX.value = e.clientX;
  startOffset.value = dragOffset.value;
  document.body.style.userSelect = 'none';
};
const onDrag = (e) => {
  if (!isDragging.value) return;
  const delta = e.clientX - startX.value;
  dragOffset.value = startOffset.value + delta;
  if (dragOffset.value > 30) dragHint.value = 'correct';
  else if (dragOffset.value < -30) dragHint.value = 'incorrect';
  else dragHint.value = null;
};
const endDrag = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.body.style.userSelect = '';
  const finalOffset = dragOffset.value;
  dragOffset.value = 0;
  dragHint.value = null;
  if (Math.abs(finalOffset) > SWIPE_THRESHOLD) {
    const isCorrectResult = finalOffset > 0;
    handleResult(isCorrectResult);
  }
};

const loadTerms = () => {
  const terms = [];
  const blocks = topicsData.blocks || [];
  blocks.forEach(block => {
    block.topics?.forEach(topic => {
      topic.definitions?.forEach(def => {
        terms.push({ term: def.term, definition: def.definition, topic: topic.name });
      });
    });
  });
  allTerms.value = terms;
};

const getRandomTerm = () => {
  if (allTerms.value.length === 0) return null;
  const idx = Math.floor(Math.random() * allTerms.value.length);
  return allTerms.value[idx];
};

const startTimer = () => {
  if (interval) clearInterval(interval);
  timeLeft.value = timeLimit.value;
  showControls.value = false;
  interval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      if (timeLeft.value === 0) {
        clearInterval(interval);
        showControls.value = true;
        playBeep(); // звук при окончании времени
      }
    }
  }, 1000);
};

const handleResult = async (isCorrectResult) => {
  if (showControls.value && isCorrectResult === undefined) {
    // таймер истёк, пользователь кликнул на карточку – засчитываем как неверный ответ
    isCorrectResult = false;
  }
  if (interval) clearInterval(interval);
  const timeSpent = timeLimit.value - timeLeft.value;
  if (isCorrectResult) correct.value++;
  else incorrect.value++;
  total.value++;
  const newTotalTime = (avgTime.value * (total.value - 1) + timeSpent) / total.value;
  avgTime.value = Math.round(newTotalTime);
  if (userId) {
    const statsRef = doc(db, 'gameStats', userId);
    await setDoc(statsRef, {
      crocodile: {
        correct: correct.value,
        incorrect: incorrect.value,
        total: total.value,
        difficulty: difficulty.value,
        avgTime: avgTime.value,
        updatedAt: new Date()
      }
    }, { merge: true });
  }
  nextTerm();
};

const nextTerm = () => {
  currentTerm.value = getRandomTerm();
  startTimer();
};

const setDifficulty = (level) => {
  difficulty.value = level;
  nextTerm();
};

const loadStats = async () => {
  if (!userId) return;
  const statsRef = doc(db, 'gameStats', userId);
  const statsSnap = await getDoc(statsRef);
  if (statsSnap.exists()) {
    const data = statsSnap.data();
    if (data.crocodile) {
      correct.value = data.crocodile.correct || 0;
      incorrect.value = data.crocodile.incorrect || 0;
      total.value = data.crocodile.total || 0;
      avgTime.value = data.crocodile.avgTime || 0;
      if (data.crocodile.difficulty) difficulty.value = data.crocodile.difficulty;
    }
  } else {
    await setDoc(statsRef, { 
      crocodile: { correct: 0, incorrect: 0, total: 0, difficulty: 'medium', avgTime: 0, updatedAt: new Date() }
    });
  }
};

// Скрытие лейаута
const hideLayout = () => {
  document.body.classList.add('hide-student-layout');
};
const showLayout = () => {
  document.body.classList.remove('hide-student-layout');
};

onMounted(async () => {
  hideLayout();
  loadTerms();
  await loadStats();
  nextTerm();
  // Обработчик клика по карточке при истекшем времени
  document.querySelector('.game-card')?.addEventListener('click', (e) => {
    if (showControls.value && !isDragging.value) {
      handleResult(false);
    }
  });
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  document.body.style.userSelect = '';
  showLayout();
  if (audioCtx) audioCtx.close();
});
</script>

<style scoped>
.game-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gray-50);
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
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
}
.btn-back {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 1rem;
}
.difficulty-selector {
  display: flex;
  gap: 0.5rem;
}
.difficulty-selector button {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--gray-300);
  background: white;
  border-radius: 2rem;
  cursor: pointer;
}
.difficulty-selector button.active {
  background: var(--primary);
  color: white;
}
.game-card-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 0;
  margin: 0.5rem 0;
}
.game-card {
  width: 90%;
  max-width: 500px;
  height: 60vh;
  max-height: 500px;
  background: white;
  border-radius: 2rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  text-align: center;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s, transform 0.1s linear;
  will-change: transform;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}
.game-card:active {
  cursor: grabbing;
}
.game-card.dragging {
  cursor: grabbing;
  box-shadow: var(--shadow-xl);
}
.game-card.hint-correct {
  box-shadow: 0 0 0 3px var(--success), var(--shadow-xl);
}
.game-card.hint-incorrect {
  box-shadow: 0 0 0 3px var(--danger), var(--shadow-xl);
}
.timer {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
.timer.warning {
  color: var(--danger);
  animation: pulse 1s infinite;
}
.term {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
  word-break: break-word;
}
.waiting, .timeout-message {
  font-size: 1rem;
  color: var(--gray-500);
  margin-top: 1rem;
}
.timeout-message {
  color: var(--danger);
  font-weight: bold;
}
.stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.stat-item {
  background: white;
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  box-shadow: var(--shadow-sm);
}
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
body.dark-theme .game-fullscreen {
  background: var(--gray-900);
}
body.dark-theme .game-card,
body.dark-theme .stat-item {
  background: var(--gray-800);
  color: white;
}
body.dark-theme .difficulty-selector button {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .difficulty-selector button.active {
  background: var(--primary);
}
</style>