<template>
  <StudentLayout>
    <div class="stats-view">
      <div class="page-header">
        <h1>Моя статистика</h1>
        <p class="subtitle">Твой прогресс в подготовке к ЕГЭ</p>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>{{ overallAvg }}%</h3>
            <p>Средний балл</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ completedTasks }}</h3>
            <p>Выполнено заданий</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <h3>{{ egePrediction }}</h3>
            <p>Прогноз ЕГЭ</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <h3>{{ bestTopic }}</h3>
            <p>Лучшая тема</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h2>Динамика успеваемости</h2>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <div class="topics-stats">
        <h2>Успеваемость по темам</h2>
        <div class="topics-list">
          <div v-for="topic in topicStats" :key="topic.name" class="topic-stat-card">
            <div class="topic-header">
              <span class="topic-name">{{ topic.name }}</span>
              <span class="topic-score">{{ topic.score }}%</span>
            </div>
            <div class="topic-bar">
              <div class="topic-fill" :style="{ width: topic.score + '%', background: getBarColor(topic.score) }"></div>
            </div>
            <div class="topic-status">
              <span v-if="topic.score >= 80" class="good">✓ Отлично</span>
              <span v-else-if="topic.score >= 60" class="medium">! Хорошо</span>
              <span v-else class="bad">⚠️ Нужно повторить</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ИГРОВАЯ СТАТИСТИКА -->
      <div class="game-stats-section" v-if="gameStats.crocodile">
        <h2>🎮 Статистика игры «Крокодил»</h2>
        <div class="game-stats-grid">
          <div class="game-stat-card">✅ Угадано: {{ gameStats.crocodile.correct || 0 }}</div>
          <div class="game-stat-card">❌ Не угадано: {{ gameStats.crocodile.incorrect || 0 }}</div>
          <div class="game-stat-card">📊 Всего попыток: {{ gameStats.crocodile.total || 0 }}</div>
          <div class="game-stat-card">⏱️ Среднее время: {{ gameStats.crocodile.avgTime || 0 }} сек</div>
          <div class="game-stat-card">⚙️ Сложность: {{ gameStats.crocodile.difficulty || 'средняя' }}</div>
        </div>
      </div>

      <div class="recommendations">
        <h2>Рекомендации</h2>
        <div v-if="weakTopics.length" class="recommendations-list">
          <div v-for="topic in weakTopics" :key="topic.id" class="recommendation-card">
            <div class="rec-icon">📚</div>
            <div class="rec-content">
              <h3>{{ topic.name }}</h3>
              <p>{{ topic.recommendation }}</p>
              <router-link :to="`/student/theory/${topic.id}`" class="rec-link">Изучить →</router-link>
            </div>
          </div>
        </div>
        <div v-else class="no-recommendations">
          <p>Отлично! Пока нет тем, требующих повторения. Продолжай в том же духе!</p>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { auth, db } from '@core/services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { Chart, registerables } from 'chart.js';
import { getCachedData, setCachedData } from '@core/services/storage';

Chart.register(...registerables);

const overallAvg = ref(0);
const completedTasks = ref(0);
const egePrediction = ref(0);
const bestTopic = ref('—');
const topicStats = ref([]);
const weakTopics = ref([]);
const gameStats = ref({});

const chartCanvas = ref(null);
let chart = null;

const getBarColor = (score) => {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
};

const loadStats = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Загружаем отправленные работы
    const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', user.uid)));
    const gradedSubmissions = submissionsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => s.status === 'graded' && s.teacherGrade);
    
    completedTasks.value = gradedSubmissions.length;
    
    if (gradedSubmissions.length > 0) {
      const total = gradedSubmissions.reduce((sum, s) => sum + (s.teacherGrade || 0), 0);
      overallAvg.value = Math.round(total / gradedSubmissions.length);
      const prediction = Math.min(100, Math.round(overallAvg.value * 0.9 + 10));
      egePrediction.value = prediction;
    }
    
    // Статистика по темам (упрощённо)
    const topicScores = new Map();
    const topicNames = {
      '1.1': 'Биосоциальная сущность человека',
      '2.1': 'Экономика как наука',
      // ... остальные можно оставить как есть или загружать из topics.json
    };
    
    gradedSubmissions.forEach(sub => {
      const topic = sub.topicId || 'unknown';
      if (!topicScores.has(topic)) {
        topicScores.set(topic, { total: 0, count: 0 });
      }
      const data = topicScores.get(topic);
      data.total += (sub.teacherGrade || 0);
      data.count++;
    });
    
    const processedTopics = Array.from(topicScores.entries())
      .map(([id, data]) => ({
        id,
        name: topicNames[id] || id,
        score: data.count > 0 ? Math.round(data.total / data.count) : 0
      }))
      .sort((a, b) => b.score - a.score);
    
    topicStats.value = processedTopics;
    
    if (processedTopics.length > 0) {
      bestTopic.value = processedTopics[0].name;
    }
    
    weakTopics.value = processedTopics
      .filter(t => t.score < 60)
      .map(t => ({
        id: t.id,
        name: t.name,
        recommendation: `Повторите тему "${t.name}". Обратите внимание на основные понятия.`
      }))
      .slice(0, 5);
    
    // Загрузка игровой статистики
    const gameStatsDoc = await getDoc(doc(db, 'gameStats', user.uid));
    if (gameStatsDoc.exists()) {
      gameStats.value = gameStatsDoc.data();
    }
    
    // Кэширование
    setCachedData('student_stats', {
      overallAvg: overallAvg.value,
      completedTasks: completedTasks.value,
      egePrediction: egePrediction.value,
      bestTopic: bestTopic.value,
      topicStats: topicStats.value,
      weakTopics: weakTopics.value,
      gameStats: gameStats.value
    });
    
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadDashboard = () => {
  const cached = getCachedData('student_stats');
  if (cached) {
    overallAvg.value = cached.overallAvg;
    completedTasks.value = cached.completedTasks;
    egePrediction.value = cached.egePrediction;
    bestTopic.value = cached.bestTopic;
    topicStats.value = cached.topicStats;
    weakTopics.value = cached.weakTopics;
    gameStats.value = cached.gameStats;
  }
  loadStats();
};

// График (динамика) – упрощённо
const initChart = () => {
  if (!chartCanvas.value) return;
  if (chart) chart.destroy();
  const ctx = chartCanvas.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'],
      datasets: [{
        label: 'Средний балл',
        data: [0, 0, 0, 0],
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230,126,34,0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100 } }
    }
  });
};

onMounted(() => {
  loadDashboard();
  initChart();
});
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.stats-view {
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
  color: var(--secondary);
}
.subtitle {
  margin: 0.5rem 0 0;
  color: var(--gray-500);
}

/* ========== КАРТОЧКИ СТАТИСТИКИ ========== */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--gray-200);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.stat-icon {
  font-size: 2.5rem;
}
.stat-info h3 {
  margin: 0;
  font-size: 2rem;
  color: var(--primary);
}
.stat-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-500);
}

/* ========== ГРАФИК ========== */
.chart-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.chart-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.chart-container {
  height: 300px;
  position: relative;
}

/* ========== УСПЕВАЕМОСТЬ ПО ТЕМАМ ========== */
.topics-stats {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.topics-stats h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.topics-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.topic-stat-card {
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}
.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.topic-name {
  font-weight: 500;
  color: var(--secondary);
}
.topic-score {
  font-weight: 600;
  color: var(--primary);
}
.topic-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.topic-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.topic-status {
  font-size: 0.75rem;
}
.good {
  color: var(--success);
}
.medium {
  color: var(--warning);
}
.bad {
  color: var(--danger);
}

/* ========== ИГРОВАЯ СТАТИСТИКА ========== */
.game-stats-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.game-stats-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.game-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.game-stat-card {
  background: var(--gray-50);
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-weight: 500;
  text-align: center;
}

/* ========== РЕКОМЕНДАЦИИ ========== */
.recommendations {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.recommendations h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.recommendation-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
}
.rec-icon {
  font-size: 2rem;
}
.rec-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--secondary);
}
.rec-content p {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--gray-600);
}
.rec-link {
  font-size: 0.8rem;
  color: var(--primary);
  text-decoration: none;
}
.no-recommendations {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .stat-card,
body.dark-theme .chart-section,
body.dark-theme .topics-stats,
body.dark-theme .game-stats-section,
body.dark-theme .recommendations {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .topic-stat-card,
body.dark-theme .game-stat-card,
body.dark-theme .recommendation-card {
  background: var(--gray-700);
}
body.dark-theme .topic-name,
body.dark-theme .rec-content h3,
body.dark-theme .game-stats-section h2,
body.dark-theme .chart-section h2,
body.dark-theme .topics-stats h2,
body.dark-theme .recommendations h2 {
  color: #ffffff;
}
body.dark-theme .rec-content p,
body.dark-theme .topic-score,
body.dark-theme .stat-info p {
  color: var(--gray-400);
}
</style>