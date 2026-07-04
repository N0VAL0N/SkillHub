<template>
  <StudentLayout>
    <div class="games-view">
      <div class="page-header">
        <h1>🎮 Игры</h1>
        <p class="subtitle">Развивай знания в игровой форме</p>
      </div>

      <div class="games-grid">
        <div class="game-card" @click="startGame('crocodile')">
          <div class="game-icon">🐊</div>
          <h3>Крокодил</h3>
          <p>Объясни термин без слов, пока не истекло время</p>
          <div class="game-stats" v-if="gameStats.crocodile">
            <span>✅ {{ gameStats.crocodile.correct || 0 }}</span>
            <span>❌ {{ gameStats.crocodile.incorrect || 0 }}</span>
          </div>
          <button class="btn-play">Играть →</button>
        </div>
        <div class="game-card" @click="startGame('memory')">
          <div class="game-icon">🧠</div>
          <h3>Мемори: термины</h3>
          <p>Найди пары терминов и определений</p>
          <div class="game-stats" v-if="gameStats.memory">
            <span>🏆 Лучшее: {{ gameStats.memory.bestAttempts || 0 }} попыток</span>
            <span>⏱️ Лучшее время: {{ formatTime(gameStats.memory.bestTime) }}</span>
          </div>
          <button class="btn-play">Играть →</button>
        </div>

        <div class="game-card coming-soon">
          <div class="game-icon">🔮</div>
          <h3>Скоро</h3>
          <p>Новые игры в разработке</p>
          <button class="btn-play disabled" disabled>Скоро</button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue';

const router = useRouter();
const gameStats = ref({});

// Функция форматирования времени
const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const startGame = (gameId) => {
  if (gameId === 'crocodile') {
    router.push('/student/game/crocodile');
  }
  if (gameId === 'memory') {
    router.push('/student/game/memory');
  }
};

const loadStats = async () => {
  const user = auth.currentUser;
  if (!user) return;
  const statsRef = doc(db, 'gameStats', user.uid);
  const snap = await getDoc(statsRef);
  if (snap.exists()) {
    gameStats.value = snap.data();
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.games-view {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 2rem;
}
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
.game-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}
.game-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}
.game-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
}
.game-card h3 {
  margin: 0.5rem 0;
  color: var(--secondary);
}
.game-card p {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin-bottom: 1rem;
}
.game-stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.8rem;
  color: var(--primary);
}
.btn-play {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-play:hover {
  background: var(--primary-dark);
}
.game-card.coming-soon {
  opacity: 0.7;
  cursor: default;
}
.game-card.coming-soon:hover {
  transform: none;
}
.btn-play.disabled {
  background: var(--gray-400);
  cursor: not-allowed;
}
body.dark-theme .game-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
</style>