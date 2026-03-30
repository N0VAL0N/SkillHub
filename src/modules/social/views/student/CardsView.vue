<template>
  <StudentLayout>
    <div class="cards-view">
      <div class="page-header">
        <h1>Карточки терминов</h1>
        <p class="subtitle">Запоминай определения в удобном формате</p>
      </div>

      <div class="block-selector">
        <button v-for="block in blocks" :key="block.id" class="block-btn" :class="{ active: selectedBlock === block.id }" @click="selectedBlock = block.id">
          {{ block.name }}
        </button>
      </div>

      <div class="cards-list">
        <div v-for="topic in filteredTopics" :key="topic.topic_id" class="topic-group">
          <h3>{{ topic.name }}</h3>
          <div class="term-cards">
            <div v-for="def in topic.definitions" :key="def.term" class="card" @click="toggleCard(def.term)">
              <div class="card-inner" :class="{ flipped: flippedCards[def.term] }">
                <div class="card-front">
                  <span class="term">{{ def.term }}</span>
                  <span class="card-hint">↻ нажми, чтобы перевернуть</span>
                </div>
                <div class="card-back">
                  <p>{{ def.definition }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="study-tip">
        <div class="tip-icon">💡</div>
        <div class="tip-text"><strong>Совет:</strong> Нажимайте на карточку, чтобы перевернуть и проверить определение. Повторяйте термины регулярно для лучшего запоминания.</div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import topicsData from '@/modules/social/data/topics.json';

const blocks = topicsData.blocks || [];
const selectedBlock = ref(1);
const flippedCards = ref({});

const filteredTopics = computed(() => {
  const block = blocks.find(b => b.id === selectedBlock.value);
  return block?.topics || [];
});

const toggleCard = (term) => { flippedCards.value = { ...flippedCards.value, [term]: !flippedCards.value[term] }; };
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.cards-view {
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color:var(--primary);
}
.subtitle {
  margin: 0.5rem 0 0;
  color: var(--gray-500);
}

/* ========== СЕЛЕКТОР БЛОКОВ ========== */
.block-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.block-btn {
  padding: 0.6rem 1.2rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--gray-500);
}
.block-btn:hover {
  background: var(--gray-200);
}
.block-btn.active {
  background: var(--primary);
  color: white;
}

/* ========== СПИСОК КАРТОЧЕК ========== */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}
.topic-group h3 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  padding-bottom: 0.5rem;
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}
.term-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ========== КАРТОЧКИ ========== */
.card {
  perspective: 1000px;
  cursor: pointer;
  height: 220px;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  border-radius: 1rem;
}
.card-inner.flipped {
  transform: rotateY(180deg);
}
.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}
.card-front {
  background: white;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow);
}
.term {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary);
  text-align: center;
  word-break: break-word;
}
.card-hint {
  font-size: 0.7rem;
  color: var(--gray-400);
  margin-top: 0.5rem;
}
.card-back {
  background: var(--primary-light);
  transform: rotateY(180deg);
  border: 1px solid var(--primary);
}
.card-back p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--gray-700);
  text-align: left;
  overflow-y: auto;
  max-height: 100%;
}

/* ========== СОВЕТ ========== */
.study-tip {
  background: var(--gray-100);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-top: 2rem;
}
.tip-icon {
  font-size: 1.5rem;
}
.tip-text {
  flex: 1;
  font-size: 0.85rem;
  color: var(--gray-600);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .card-front {
  background: var(--gray-800);
  border-color: var(--gray-500);
}
body.dark-theme .card-back {
  background: rgba(230, 126, 34, 0.2);
}
body.dark-theme .card-back p {
  color: var(--gray-500);
}
body.dark-theme .study-tip {
  background: var(--gray-800);
  border: 1px solid var(--gray-700);
}
body.dark-theme .tip-text {
  color: var(--gray-400);
}
</style>