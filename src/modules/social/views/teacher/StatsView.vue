<template>
  <TeacherLayout>
    <div class="stats-view">
      <div class="page-header">
        <h1>Статистика</h1>
        <p class="subtitle">Аналитика успеваемости и прогресса учеников</p>
        <button @click="refreshStats" class="btn-refresh" :disabled="refreshing">
          {{ refreshing ? 'Обновление...' : 'Обновить статистику' }}
        </button>
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
            <h3>{{ completionRate }}%</h3>
            <p>Выполнено заданий</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ activeStudents }}</h3>
            <p>Активных учеников</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <h3>{{ egePrediction }}</h3>
            <p>Прогноз ЕГЭ</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h2>Динамика успеваемости</h2>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <div class="classes-stats-section">
        <h2>Успеваемость по классам</h2>
        <div class="classes-stats-grid">
          <div v-for="cls in classStats" :key="cls.name" class="class-stat-card">
            <h3>{{ cls.name }}</h3>
            <div class="class-stat-value">{{ cls.avgScore }}%</div>
            <div class="class-stat-bar">
              <div class="class-stat-fill" :style="{ width: cls.avgScore + '%' }"></div>
            </div>
            <p>{{ cls.studentsCount }} учеников</p>
          </div>
        </div>
      </div>

      <div class="weak-spots-section">
        <h2>Слабые места</h2>
        <div class="weak-spots-list">
          <div v-for="topic in weakTopics" :key="topic.topicId" class="weak-spot-card">
            <div class="weak-spot-header">
              <span class="weak-spot-name">{{ topic.topicName }}</span>
              <span class="weak-spot-error-rate">{{ topic.errorRate }}% ошибок</span>
            </div>
            <div class="weak-spot-bar">
              <div class="weak-spot-fill" :style="{ width: topic.errorRate + '%' }"></div>
            </div>
            <p class="weak-spot-recommendation">{{ getRecommendation(topic.topicName) }}</p>
          </div>
        </div>
      </div>

      <div class="predictions-section">
        <h2>Прогноз результатов ЕГЭ</h2>
        <div class="predictions-list">
          <div v-for="student in studentPredictions" :key="student.id" class="prediction-card">
            <div class="prediction-student">
              <span class="student-name">{{ student.displayName || student.login }}</span>
              <span class="student-class">{{ student.className || 'Без класса' }}</span>
            </div>
            <div class="prediction-score">
              <span class="current-score">Текущий: {{ student.currentAvg }}%</span>
              <span class="predicted-score">
                <template v-if="student.currentAvg === 0 && student.submissionsCount === 0">Нет данных</template>
                <template v-else>Прогноз: {{ student.predictedScore }} баллов</template>
              </span>
              <span v-if="student.avgTimeSpent" class="time-spent">
                ⏱️ Среднее время: {{ formatTime(student.avgTimeSpent) }}
              </span>
            </div>
            <div class="prediction-bar" v-if="student.currentAvg !== 0 || student.submissionsCount > 0">
              <div class="prediction-fill" :style="{ width: (student.predictedScore / 100) * 100 + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { auth, db } from '@core/services/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import TeacherLayout from '@core/layouts/TeacherLayout.vue';
import { Chart, registerables } from 'chart.js';
import { getCachedData, setCachedData } from '@core/services/storage';

Chart.register(...registerables);

const overallAvg = ref(0);
const completionRate = ref(0);
const activeStudents = ref(0);
const egePrediction = ref(0);
const classStats = ref([]);
const weakTopics = ref([]);
const studentPredictions = ref([]);
const refreshing = ref(false);
const chartCanvas = ref(null);
let chart = null;

const formatTime = (seconds) => {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
};

const getRecommendation = (topicName) => {
  const recommendations = {
    'Экономика': 'Повторите закон спроса и предложения, факторы влияния',
    'Социальная стратификация': 'Повторите критерии стратификации, социальные лифты',
    'Семья и брак': 'Повторите условия заключения брака, права и обязанности супругов',
    'Политическая система': 'Повторите структуру политической системы, функции государства',
    'Гражданское право': 'Повторите правоспособность, дееспособность, виды сделок'
  };
  return recommendations[topicName] || 'Повторите основные понятия темы';
};

const initChart = () => {
  if (!chartCanvas.value) return;
  if (chart) chart.destroy();
  
  const textColor = getComputedStyle(document.body).getPropertyValue('--gray-400') || '#94a3b8';
  
  chart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      datasets: [{
        label: 'Средний балл',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230,126,34,0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: { y: { min: 0, max: 100, ticks: { color: textColor } }, x: { ticks: { color: textColor } } }
    }
  });
};

const loadChartData = async () => {
  if (!chart) {
    await nextTick();
    initChart();
  }
  
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const scores = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    const subsSnap = await getDocs(query(collection(db, 'submissions'), where('status', '==', 'graded')));
    let dailyScore = 0, dailyCount = 0;
    subsSnap.docs.forEach(doc => {
      const subDate = doc.data().gradedAt?.toDate?.();
      if (subDate && subDate.toISOString().slice(0, 10) === dateStr) {
        dailyScore += doc.data().teacherGrade || 0;
        dailyCount++;
      }
    });
    scores.push(dailyCount > 0 ? Math.round(dailyScore / dailyCount) : 0);
  }
  
  if (chart) {
    chart.data.datasets[0].data = scores;
    chart.update();
  }
};

const loadStats = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', user.uid)));
    const teacherClassIds = classesSnap.docs.map(d => d.id);

    if (teacherClassIds.length === 0) return;

    let totalScore = 0;
    let totalStudents = 0;
    let totalTasks = 0;
    const classes = [];

    if (teacherClassIds.length) {
      const statsSnap = await getDocs(query(collection(db, 'aggregatedStats'), where('__name__', 'in', teacherClassIds)));
      const statsMap = new Map();
      statsSnap.docs.forEach(doc => {
        statsMap.set(doc.id, doc.data());
      });

      for (const classId of teacherClassIds) {
        const data = statsMap.get(classId);
        if (data) {
          classes.push({
            name: data.className,
            avgScore: data.avgScore,
            studentsCount: data.studentsCount
          });
          totalScore += data.avgScore * data.studentsCount;
          totalStudents += data.studentsCount;
          totalTasks += data.completedTasksCount || 0;
        } else {
          const classDoc = await getDoc(doc(db, 'classes', classId));
          const className = classDoc.exists() ? classDoc.data().name : 'Неизвестно';
          classes.push({ name: className, avgScore: 0, studentsCount: 0 });
        }
      }
    }

    classStats.value = classes.sort((a, b) => b.avgScore - a.avgScore);
    overallAvg.value = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;
    activeStudents.value = totalStudents;
    const totalPossibleTasks = totalStudents * 10;
    completionRate.value = totalPossibleTasks > 0 ? Math.min(100, Math.round((totalTasks / totalPossibleTasks) * 100)) : 0;
    egePrediction.value = overallAvg.value > 0 ? Math.min(100, Math.round(overallAvg.value * 0.9 + 10)) : 0;

    const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('status', '==', 'graded')));
    const topicErrors = new Map();
    const topicNames = new Map();

    const examIdsSet = new Set();
    submissionsSnap.docs.forEach(doc => {
      examIdsSet.add(doc.data().examId);
    });

    const examsMap = new Map();
    if (examIdsSet.size) {
      const examsSnap = await getDocs(query(collection(db, 'exams'), where('__name__', 'in', Array.from(examIdsSet))));
      examsSnap.docs.forEach(doc => {
        examsMap.set(doc.id, doc.data());
      });
    }

    for (const subDoc of submissionsSnap.docs) {
      const submission = subDoc.data();
      const exam = examsMap.get(submission.examId);
      if (!exam) continue;

      const questions = exam.questions || [];
      for (const q of questions) {
        if (q.type === 'choice' || q.type === 'match' || q.type === 'short') {
          const topicId = q.topicId || 'unknown';
          if (!topicErrors.has(topicId)) {
            topicErrors.set(topicId, { total: 0, errors: 0 });
            topicNames.set(topicId, q.topicName || topicId);
          }
          const stats = topicErrors.get(topicId);
          stats.total++;
          const userAnswer = submission.answers?.[q.id];
          let isCorrect = false;
          if (q.type === 'choice') {
            if (q.isMultiple) {
              const user = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
              const correct = Array.isArray(q.correct) ? [...q.correct].sort() : [];
              isCorrect = JSON.stringify(user) === JSON.stringify(correct);
            } else {
              isCorrect = userAnswer === q.correct;
            }
          } else if (q.type === 'match') {
            const correctMap = {};
            q.correctMapping?.forEach(m => { correctMap[m.right] = m.left; });
            let correctCount = 0;
            let total = Object.keys(userAnswer || {}).length;
            Object.entries(userAnswer || {}).forEach(([right, left]) => {
              if (correctMap[right] === left) correctCount++;
            });
            isCorrect = correctCount === total && total === (q.correctMapping?.length || 0);
          } else if (q.type === 'short') {
            isCorrect = userAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
          }
          if (!isCorrect) stats.errors++;
        }
      }
    }

    const weakList = [];
    for (const [topicId, stats] of topicErrors.entries()) {
      const errorRate = stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0;
      weakList.push({ topicId, topicName: topicNames.get(topicId), errorRate });
    }
    weakTopics.value = weakList.sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);

    const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('classId', 'in', teacherClassIds)));
    const predictions = [];
    for (const studentDoc of studentsSnap.docs) {
      const student = studentDoc.data();
      const studentSubsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', studentDoc.id), where('status', '==', 'graded')));
      let totalScoreStudent = 0, count = 0, totalTime = 0, timeCount = 0;
      studentSubsSnap.docs.forEach(sub => {
        totalScoreStudent += sub.data().teacherGrade || 0;
        count++;
        if (sub.data().timeSpentSeconds) {
          totalTime += sub.data().timeSpentSeconds;
          timeCount++;
        }
      });
      const currentAvg = count > 0 ? Math.round(totalScoreStudent / count) : 0;
      const predictedScore = count > 0 ? Math.min(100, Math.round(currentAvg * 0.9 + 10)) : 0;
      const avgTime = timeCount > 0 ? Math.round(totalTime / timeCount) : 0;
      predictions.push({
        id: studentDoc.id,
        login: student.login,
        displayName: student.displayName,
        className: student.className,
        currentAvg,
        predictedScore,
        submissionsCount: count,
        avgTimeSpent: avgTime
      });
    }
    studentPredictions.value = predictions.sort((a, b) => b.predictedScore - a.predictedScore).slice(0, 10);

    await loadChartData();

    setCachedData('teacher_stats', {
      overallAvg: overallAvg.value,
      completionRate: completionRate.value,
      activeStudents: activeStudents.value,
      egePrediction: egePrediction.value,
      classStats: classStats.value,
      weakTopics: weakTopics.value,
      studentPredictions: studentPredictions.value
    });

  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadDashboard = () => {
  const cached = getCachedData('teacher_stats');
  if (cached) {
    overallAvg.value = cached.overallAvg;
    completionRate.value = cached.completionRate;
    activeStudents.value = cached.activeStudents;
    egePrediction.value = cached.egePrediction;
    classStats.value = cached.classStats;
    weakTopics.value = cached.weakTopics;
    studentPredictions.value = cached.studentPredictions;
  }
  refreshStats();
};

const refreshStats = async () => {
  refreshing.value = true;
  try {
    await loadStats();
  } catch (error) {
    console.error('Ошибка обновления:', error);
  } finally {
    refreshing.value = false;
  }
};

watch(chartCanvas, (newVal) => {
  if (newVal) {
    initChart();
  }
});

onMounted(loadDashboard);
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.stats-view {
  max-width: 1400px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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
.btn-refresh {
  padding: 0.5rem 1.2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-refresh:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ========== УСПЕВАЕМОСТЬ ПО КЛАССАМ ========== */
.classes-stats-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.classes-stats-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.classes-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
.class-stat-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
}
.class-stat-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}
.class-stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.5rem;
}
.class-stat-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.class-stat-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.3s;
}
.class-stat-card p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}

/* ========== СЛАБЫЕ МЕСТА ========== */
.weak-spots-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.weak-spots-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.weak-spots-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.weak-spot-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
}
.weak-spot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.weak-spot-name {
  font-weight: 600;
  color: var(--secondary);
}
.weak-spot-error-rate {
  font-size: 0.85rem;
  color: var(--danger);
}
.weak-spot-bar {
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.weak-spot-fill {
  height: 100%;
  background: var(--danger);
  border-radius: 3px;
  transition: width 0.3s;
}
.weak-spot-recommendation {
  margin: 0;
  font-size: 0.8rem;
  color: var(--primary);
}

/* ========== ПРОГНОЗЫ ========== */
.predictions-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--gray-200);
}
.predictions-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
}
.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.prediction-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.prediction-student {
  flex: 1;
}
.student-name {
  font-weight: 600;
  color: var(--secondary);
  display: block;
}
.student-class {
  font-size: 0.7rem;
  color: var(--gray-500);
}
.prediction-score {
  min-width: 240px;
}
.current-score {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-right: 0.5rem;
}
.predicted-score {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
}
.time-spent {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-left: 0.5rem;
}
.prediction-bar {
  width: 120px;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
}
.prediction-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s;
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .stat-card,
body.dark-theme .chart-section,
body.dark-theme .classes-stats-section,
body.dark-theme .weak-spots-section,
body.dark-theme .predictions-section {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .class-stat-card,
body.dark-theme .weak-spot-card,
body.dark-theme .prediction-card {
  background: var(--gray-700);
}
body.dark-theme .stat-card h3,
body.dark-theme .chart-section h2,
body.dark-theme .classes-stats-section h2,
body.dark-theme .weak-spots-section h2,
body.dark-theme .predictions-section h2 {
  color: #ffffff;
}
body.dark-theme .class-stat-card h3,
body.dark-theme .weak-spot-name,
body.dark-theme .student-name {
  color: #ffffff;
}
body.dark-theme .stat-info p,
body.dark-theme .class-stat-card p,
body.dark-theme .student-class,
body.dark-theme .current-score,
body.dark-theme .time-spent {
  color: var(--gray-400);
}
</style>