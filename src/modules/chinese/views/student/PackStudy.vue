<template>
  <StudentLayout>

  <div class="pack-study">
    <div class="study-header">
      <button class="back-btn" @click="goBack">← Назад</button>
      <div class="progress-text">{{ currentIndex + 1 }} / {{ cards.length }}</div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <div v-if="currentCard" class="card-container">
      <div class="card-flip" @click="flipCard" :class="{ flipped: isFlipped }">
        <div class="card-front">
          <span class="front-text">{{ currentCard.front }}</span>
          <span class="pinyin" v-if="currentCard.pinyin">{{ currentCard.pinyin }}</span>
        </div>
        <div class="card-back">
          <span class="back-text">{{ currentCard.back }}</span>
        </div>
      </div>
      <p class="flip-hint">👆 нажми на карточку, чтобы увидеть перевод</p>

      <div class="rating-buttons" v-if="isFlipped">
        <button class="rating-btn hard" @click="rateCard(1)">
          😫 Сложно
        </button>
        <button class="rating-btn good" @click="rateCard(3)">
          😊 Нормально
        </button>
        <button class="rating-btn easy" @click="rateCard(5)">
          😎 Легко
        </button>
      </div>
    </div>

    <div v-if="cards.length === 0" class="empty-state">
      <div class="empty-icon">🃏</div>
      <p>В этом паке пока нет карточек</p>
      <button class="btn-primary" @click="goBack">Назад</button>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
      <div class="modal results-modal">
        <h2>Сессия завершена!</h2>
        <div class="stats">
          <p>📊 Изучено: {{ studiedCount }} / {{ totalCards }}</p>
          <p>✅ Правильно: {{ correctCount }}</p>
          <p>📈 Прогресс: {{ Math.round((studiedCount / totalCards) * 100) }}%</p>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="continueSession">Продолжить</button>
          <button class="btn-outline" @click="goBack">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChinesePackStore } from '@modules/chinese/stores/chinesePackStore'

const router = useRouter()
const route = useRoute()
const packId = route.params.id

const packStore = useChinesePackStore()

const cards = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const showResults = ref(false)
const studiedCount = ref(0)
const correctCount = ref(0)

onMounted(async () => {
  await packStore.loadPack(packId)
  cards.value = packStore.getDueCards(packId, 20)
  
  if (cards.value.length === 0) {
    showResults.value = true
  }
})

const currentCard = computed(() => cards.value[currentIndex.value])
const totalCards = computed(() => cards.value.length)
const progressPercent = computed(() => ((currentIndex.value + 1) / totalCards.value) * 100)

function flipCard() {
  isFlipped.value = !isFlipped.value
}

async function rateCard(quality) {
  const card = currentCard.value
  if (!card) return
  
  await packStore.answerCard(card.id, quality)
  
  studiedCount.value++
  if (quality >= 3) correctCount.value++
  
  if (currentIndex.value + 1 < cards.value.length) {
    currentIndex.value++
    isFlipped.value = false
  } else {
    showResults.value = true
  }
}

function continueSession() {
  cards.value = packStore.getDueCards(packId, 20)
  currentIndex.value = 0
  studiedCount.value = 0
  correctCount.value = 0
  showResults.value = false
  
  if (cards.value.length === 0) {
    showResults.value = true
  }
}

function goBack() {
  router.push('/chinese/packs')
}
</script>

<style scoped>
.pack-study {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}
.study-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
}
.progress-text {
  font-size: 1rem;
  color: var(--gray-500);
}
.progress-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
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
.card-front {
  transform: rotateY(0deg);
}
.card-back {
  transform: rotateY(180deg);
}
.front-text {
  font-size: 2rem;
  font-weight: bold;
  color: var(--secondary);
  text-align: center;
}
.pinyin {
  font-size: 1rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
}
.back-text {
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--primary);
  text-align: center;
}
.flip-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--gray-400);
  text-align: center;
}
.rating-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.rating-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}
.rating-btn.hard {
  background: var(--danger);
  color: white;
}
.rating-btn.good {
  background: var(--warning);
  color: white;
}
.rating-btn.easy {
  background: var(--success);
  color: white;
}
.rating-btn:hover {
  transform: translateY(-2px);
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
  max-width: 350px;
  width: 90%;
  text-align: center;
}
.results-modal .stats {
  margin: 1rem 0;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
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
body.dark-theme .card-front,
body.dark-theme .card-back,
body.dark-theme .modal {
  background: var(--gray-800);
}
body.dark-theme .front-text {
  color: white;
}
</style>