<template>
  <StudentLayout>
    <div class="repeat-page">
      <div class="page-header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Назад
        </button>
        <h1>Повторение слов</h1>
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="dueWords.length === 0" class="empty-state">
        <div class="empty-icon">🎉</div>
        <p>Нет слов для повторения!</p>
        <button class="btn-primary" @click="goBack">На главную</button>
      </div>
      <div v-else-if="currentCardIndex < dueWords.length" class="card-container">
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
        
        <div v-if="isFlipped" class="rating-buttons">
          <p class="rating-question">Как хорошо вы знаете это слово?</p>
          <div class="rating-grid">
            <button class="rating-btn wrong" @click="submitAnswer(0)">❌ Забыл</button>
            <button class="rating-btn hard" @click="submitAnswer(2)">😕 Трудно</button>
            <button class="rating-btn good" @click="submitAnswer(3)">👍 Нормально</button>
            <button class="rating-btn easy" @click="submitAnswer(5)">✅ Легко</button>
          </div>
        </div>
        
        <div class="progress-text">
          {{ currentCardIndex + 1 }} / {{ dueWords.length }}
        </div>
      </div>
      
      <div v-else class="completion">
        <div class="completion-icon">🎉</div>
        <h2>Повторение завершено!</h2>
        <p>Вы повторили все слова.</p>
        <button class="btn-primary" @click="goBack">На главную</button>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useEnglishSm2Store } from '../stores/englishSm2Store';
import vocabularyData from '../data/vocabulary.json';

const router = useRouter();
const progressFirestore = useEnglishProgressFirestore();
const sm2Store = useEnglishSm2Store();

const loading = ref(true);
const dueWords = ref([]);
const currentCardIndex = ref(0);
const isFlipped = ref(false);

// Получаем список выученных слов (learnedWords) и для каждого проверяем, нужно ли повторять
const learnedWordsIds = computed(() => progressFirestore.learnedWords || []);

// Детальная информация о словах
const wordsMap = computed(() => {
  const map = {};
  for (const w of vocabularyData) {
    map[w.id] = w;
  }
  return map;
});

const currentCard = computed(() => {
  const wordId = dueWords.value[currentCardIndex.value];
  const word = wordsMap.value[wordId];
  return {
    front: word?.word || 'Слово не найдено',
    back: word?.translation || '',
    example: word?.example || ''
  };
});

async function loadDueWords() {
  loading.value = true;
  await progressFirestore.loadProgress();
  await sm2Store.loadSm2Data();
  
  const learned = learnedWordsIds.value;
  const due = sm2Store.getDueWords(learned);
  dueWords.value = due;
  loading.value = false;
}

function flipCard() {
  isFlipped.value = true;
}

async function submitAnswer(quality) {
  const wordId = dueWords.value[currentCardIndex.value];
  await sm2Store.recordAnswer(wordId, quality);
  
  isFlipped.value = false;
  currentCardIndex.value++;
  
  // Если закончили, остаёмся на странице с поздравлением
}

function goBack() {
  router.push('/english');
}

onMounted(() => {
  loadDueWords();
});
</script>

<style scoped>
.repeat-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
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
}
.back-btn:hover {
  background: var(--gray-100);
}
h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--secondary);
}
.card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
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
.rating-buttons {
  margin-top: 2rem;
  text-align: center;
}
.rating-question {
  margin-bottom: 1rem;
  font-weight: 500;
}
.rating-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.rating-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.rating-btn.wrong {
  background: rgba(239,68,68,0.2);
  color: var(--danger);
}
.rating-btn.wrong:hover {
  background: var(--danger);
  color: white;
}
.rating-btn.hard {
  background: rgba(245,158,11,0.2);
  color: var(--warning);
}
.rating-btn.hard:hover {
  background: var(--warning);
  color: white;
}
.rating-btn.good {
  background: rgba(59,130,246,0.2);
  color: var(--info);
}
.rating-btn.good:hover {
  background: var(--info);
  color: white;
}
.rating-btn.easy {
  background: rgba(16,185,129,0.2);
  color: var(--success);
}
.rating-btn.easy:hover {
  background: var(--success);
  color: white;
}
.progress-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--gray-500);
}
.completion {
  text-align: center;
  padding: 2rem;
}
.completion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.loading, .empty-state {
  text-align: center;
  padding: 2rem;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
body.dark-theme .card-front, 
body.dark-theme .card-back {
  background: var(--gray-800);
}
body.dark-theme .front-text {
  color: white;
}
body.dark-theme .back-btn:hover {
  background: var(--gray-700);
}
</style>