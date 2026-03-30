<template>
  <TeacherLayout>
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Добро пожаловать, {{ teacherLogin }}!</h1>
          <p>Вот что происходит в вашей школе сегодня</p>
        </div>
        <button @click="refreshData" class="btn-refresh" :disabled="refreshing">
          {{ refreshing ? 'Обновление...' : 'Обновить статистику' }}
        </button>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ studentsCount }}</h3>
            <p>Учеников</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ pendingCount }}</h3>
            <p>На проверке</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏫</div>
          <div class="stat-info">
            <h3>{{ classesCount }}</h3>
            <p>Классов</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>{{ avgScore }}%</h3>
            <p>Средний балл</p>
          </div>
        </div>
      </div>

      <div class="recent-section">
        <h2>Последняя активность</h2>
        <div class="activity-list" v-if="recentActivities.length > 0">
          <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
            <span class="activity-icon">{{ activity.icon }}</span>
            <div class="activity-details">
              <p class="activity-text">{{ activity.text }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-activities">
          <p>Пока нет активности</p>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import TeacherLayout from '@/layouts/TeacherLayout.vue';

const teacherLogin = ref('');
const studentsCount = ref(0);
const pendingCount = ref(0);
const classesCount = ref(0);
const avgScore = ref(0);
const recentActivities = ref([]);
const refreshing = ref(false);

const CACHE_TTL = 12 * 60 * 60 * 1000;

const getCachedData = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  } catch (e) {}
  return null;
};

const setCachedData = (key, data) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'Вчера';
  return `${days} дн назад`;
};

let unsubscribePending = null;

const refreshFromFirestore = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    teacherLogin.value = userDoc.data().login || user.email;

    // Классы учителя
    const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', user.uid)));
    const teacherClassIds = classesSnap.docs.map(d => d.id);
    classesCount.value = teacherClassIds.length;

    // Ученики в классах учителя
    let studentsTotal = 0;
    if (teacherClassIds.length) {
      const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('classId', 'in', teacherClassIds)));
      studentsTotal = studentsSnap.size;
    }
    studentsCount.value = studentsTotal;

    // На проверке – уже есть подписка, не нужно повторно запрашивать
    // pendingCount обновляется через onSnapshot

    // Средний балл – один запрос к aggregatedStats
    let totalScore = 0;
    let totalStudentsCount = 0;
    if (teacherClassIds.length) {
      const statsSnap = await getDocs(query(collection(db, 'aggregatedStats'), where('__name__', 'in', teacherClassIds)));
      statsSnap.docs.forEach(doc => {
        const data = doc.data();
        totalScore += data.avgScore * data.studentsCount;
        totalStudentsCount += data.studentsCount;
      });
    }
    avgScore.value = totalStudentsCount > 0 ? Math.round(totalScore / totalStudentsCount) : 0;

    // Последняя активность (5 последних submissions учеников учителя)
    let allSubmissions = [];
    if (teacherClassIds.length) {
      const subsSnap = await getDocs(query(collection(db, 'submissions'), where('classId', 'in', teacherClassIds)));
      allSubmissions = subsSnap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().submittedAt?.toDate?.() || new Date() }))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    }
    recentActivities.value = allSubmissions.map(sub => ({
      id: sub.id,
      icon: sub.status === 'pending' ? '📝' : (sub.status === 'graded' ? '✅' : '❌'),
      text: sub.status === 'pending'
        ? `${sub.studentLogin || 'Ученик'} отправил задание на проверку`
        : (sub.status === 'graded'
          ? `${sub.studentLogin || 'Ученик'} получил оценку ${sub.teacherGrade}`
          : `${sub.studentLogin || 'Ученик'} задание отклонено`),
      time: formatRelativeTime(sub.createdAt)
    }));

    setCachedData('teacher_dashboard', {
      teacherLogin: teacherLogin.value,
      studentsCount: studentsCount.value,
      pendingCount: pendingCount.value,
      classesCount: classesCount.value,
      avgScore: avgScore.value,
      recentActivities: recentActivities.value
    });

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
};

const loadDashboard = () => {
  const cached = getCachedData('teacher_dashboard');
  if (cached) {
    teacherLogin.value = cached.teacherLogin;
    studentsCount.value = cached.studentsCount;
    pendingCount.value = cached.pendingCount;
    classesCount.value = cached.classesCount;
    avgScore.value = cached.avgScore;
    recentActivities.value = cached.recentActivities;
  }
  refreshFromFirestore().catch(console.error);
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    await refreshFromFirestore();
  } catch (error) {
    console.error('Ошибка обновления:', error);
  } finally {
    refreshing.value = false;
  }
};

onMounted(() => {
  loadDashboard();

  const submissionsRef = collection(db, 'submissions');
  const q = query(submissionsRef, where('status', '==', 'pending'));
  unsubscribePending = onSnapshot(q, (snapshot) => {
    pendingCount.value = snapshot.size;
  }, (error) => {
    console.error('Ошибка подписки на pending:', error);
  });
});

onUnmounted(() => {
  if (unsubscribePending) unsubscribePending();
});
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.dashboard {
  max-width: 1200px;
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
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: var(--secondary);
}
.page-header p {
  margin: 0;
  font-size: 1rem;
  color: var(--gray-500);
}
.btn-refresh {
  padding: 0.5rem 1.2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
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
  margin: 2rem 0;
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
  transition: transform 0.2s, box-shadow 0.2s;
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

/* ========== АКТИВНОСТЬ ========== */
.recent-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.recent-section h2 {
  margin: 0 0 1.2rem;
  font-size: 1.4rem;
  color: var(--secondary);
}
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  transition: background 0.2s;
}
.activity-item:hover {
  background: var(--gray-100);
}
.activity-icon {
  font-size: 1.5rem;
}
.activity-details {
  flex: 1;
}
.activity-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--secondary);
}
.activity-time {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.empty-activities {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .stat-card,
body.dark-theme .recent-section {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .activity-text {
  color: #ffffff;
}
body.dark-theme .activity-time {
  color: var(--gray-400);
}
</style>