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
import { auth, db } from '@/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import StudentLayout from '@/layouts/StudentLayout.vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const overallAvg = ref(0);
const completedTasks = ref(0);
const egePrediction = ref(0);
const bestTopic = ref('—');
const topicStats = ref([]);
const weakTopics = ref([]);

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
    
    const topicScores = new Map();
    const topicNames = {
      '1.1': 'Биосоциальная сущность человека',
      '1.2': 'Мировоззрение',
      '1.3': 'Деятельность',
      '1.4': 'Познание',
      '1.5': 'Истина',
      '1.6': 'Общество как система',
      '1.7': 'Социальные институты',
      '1.8': 'Типы обществ',
      '1.9': 'Общественный прогресс',
      '1.10': 'Культура',
      '1.11': 'Мораль',
      '1.12': 'Наука',
      '1.13': 'Образование',
      '1.14': 'Религия',
      '1.15': 'Искусство',
      '2.1': 'Экономика как наука',
      '2.2': 'Собственность',
      '2.3': 'Экономические системы',
      '2.4': 'Рыночный механизм',
      '2.5': 'Спрос и предложение',
      '2.6': 'Конкуренция',
      '2.7': 'Рынок труда',
      '2.8': 'Фирма в экономике',
      '2.9': 'Предпринимательство',
      '2.10': 'Банковская система',
      '2.11': 'Инфляция',
      '2.12': 'Государство в экономике',
      '2.13': 'Государственный бюджет',
      '2.14': 'Налоги',
      '2.15': 'Экономический рост',
      '2.16': 'Экономический цикл',
      '2.17': 'Мировая экономика',
      '3.1': 'Социальная стратификация',
      '3.2': 'Этнические общности',
      '3.3': 'Молодёжь',
      '3.4': 'Социальные статусы',
      '3.5': 'Семья',
      '3.6': 'Социализация',
      '3.7': 'Социальные нормы',
      '3.8': 'Социальный конфликт',
      '3.9': 'Социальная защита',
      '4.1': 'Политическая власть',
      '4.2': 'Политическая система',
      '4.3': 'Государство',
      '4.4': 'Демократия',
      '4.5': 'Федеративное устройство',
      '4.6': 'Органы власти',
      '4.7': 'Политическая культура',
      '4.8': 'Политическое участие',
      '4.9': 'Политические партии',
      '4.10': 'Избирательная система',
      '5.1': 'Право как институт',
      '5.2': 'Источники права',
      '5.3': 'Система права',
      '5.4': 'Правоотношения',
      '5.5': 'Правонарушения',
      '5.6': 'Конституция',
      '5.7': 'Права и свободы',
      '5.8': 'Гражданское право',
      '5.9': 'Семейное право',
      '5.10': 'Трудовое право',
      '5.11': 'Налоговое право',
      '5.12': 'Образовательное право',
      '5.13': 'Административное право',
      '5.14': 'Экологическое право',
      '5.15': 'Уголовное право'
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
        recommendation: `Повторите тему "${t.name}". Обратите внимание на основные понятия и закономерности.`
      }))
      .slice(0, 5);
    
    await loadDynamics(gradedSubmissions);
    
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadDynamics = async (gradedSubmissions) => {
  if (!chartCanvas.value) return;
  
  const dynamics = new Map();
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dynamics.set(dateStr, { total: 0, count: 0 });
  }
  
  gradedSubmissions.forEach(sub => {
    if (sub.gradedAt) {
      const date = sub.gradedAt.toDate ? sub.gradedAt.toDate() : new Date(sub.gradedAt);
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      if (dynamics.has(dateStr)) {
        const data = dynamics.get(dateStr);
        data.total += (sub.teacherGrade || 0);
        data.count++;
      }
    }
  });
  
  const labels = Array.from(dynamics.keys());
  const scores = Array.from(dynamics.values()).map(d => d.count > 0 ? Math.round(d.total / d.count) : 0);
  
  if (chart) chart.destroy();
  
  const textColor = getComputedStyle(document.body).getPropertyValue('--gray-400') || '#94a3b8';
  
  chart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Средний балл',
        data: scores,
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: textColor } },
        x: { ticks: { color: textColor } }
      }
    }
  });
};

onMounted(() => {
  loadStats();
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
  transition: transform 0.2s;
}
.recommendation-card:hover {
  transform: translateX(4px);
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
.rec-link:hover {
  text-decoration: underline;
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
body.dark-theme .recommendations {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .topic-stat-card,
body.dark-theme .recommendation-card {
  background: var(--gray-700);
}
body.dark-theme .topic-name,
body.dark-theme .rec-content h3 {
  color: #ffffff;
}
body.dark-theme .rec-content p {
  color: var(--gray-400);
}
</style>