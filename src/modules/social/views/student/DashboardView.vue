<template>
  <StudentLayout>
    <div class="student-dashboard">
      <div class="page-header">
        <div>
          <h1>Добро пожаловать, {{ studentLogin }}!</h1>
          <p>Продолжай подготовку к ЕГЭ по обществознанию</p>
        </div>
        <button @click="refreshData" class="btn-refresh" :disabled="refreshing">
          {{ refreshing ? 'Обновление...' : 'Обновить статистику' }}
        </button>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <h3>{{ topicsCompleted }}</h3>
            <p>Тем изучено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ tasksCompleted }}</h3>
            <p>Заданий выполнено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <h3>{{ avgScore }}%</h3>
            <p>Средний балл</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <h3>{{ streak }}</h3>
            <p>Дней подряд</p>
          </div>
        </div>
      </div>

      <!-- Информация о классе и одноклассниках -->
      <div class="class-info-section" v-if="myClass">
        <div class="class-header">
          <h2>Мой класс: {{ myClass.name }}</h2>
          <button @click="showClassmatesModal = true" class="btn-outline-primary">
            👥 Показать одноклассников
          </button>
        </div>
        <p class="class-meta">
          Учитель: {{ myClass.teacherName || '—' }} • Учеников: {{ myClass.studentsCount }}
        </p>
      </div>

      <!-- Модалка со списком одноклассников -->
      <div v-if="showClassmatesModal" class="modal" @click.self="showClassmatesModal = false">
        <div class="modal-content">
          <h2>Одноклассники</h2>
          <div class="classmates-list">
            <div v-for="student in classmates" :key="student.id" class="classmate-item">
              <div class="classmate-avatar">{{ student.displayName?.charAt(0) || student.login?.charAt(0) || '?' }}</div>
              <div class="classmate-info">
                <div class="classmate-name">{{ student.displayName || student.login }}</div>
              </div>
            </div>
            <div v-if="classmates.length === 0" class="empty-classmates">
              Нет одноклассников
            </div>
          </div>
          <button @click="showClassmatesModal = false" class="btn-close">Закрыть</button>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Быстрый старт</h2>
        <div class="actions-grid">
          <router-link to="/student/theory" class="action-card">
            <span class="action-icon">📖</span>
            <h3>Теория</h3>
            <p>Повтори материалы</p>
          </router-link>
          <router-link to="/student/practice" class="action-card">
            <span class="action-icon">✍️</span>
            <h3>Задания</h3>
            <p>Тренируйся в формате ЕГЭ</p>
          </router-link>
          <router-link to="/student/cards" class="action-card">
            <span class="action-icon">🃏</span>
            <h3>Карточки</h3>
            <p>Учи термины</p>
          </router-link>
          <router-link to="/student/homework" class="action-card">
            <span class="action-icon">🏠</span>
            <h3>Домашнее задание</h3>
            <p>Проверь новое</p>
          </router-link>
        </div>
      </div>

      <div class="recent-section">
        <h2>Рекомендуемые темы</h2>
        <div class="topics-grid" v-if="recommendedTopics.length">
          <div v-for="topic in recommendedTopics" :key="topic.id" class="topic-card">
            <h3>{{ topic.title }}</h3>
            <p>{{ topic.description }}</p>
            <router-link :to="`/student/theory/${topic.id}`" class="read-more">Изучить →</router-link>
          </div>
        </div>
        <div v-else class="empty-recommendations">
          <p>Пока нет рекомендаций. Выполняйте задания, чтобы получить персональные советы.</p>
        </div>
      </div>

      <div class="recent-section" v-if="recentActivities.length">
        <h2>Последняя активность</h2>
        <div class="activity-list">
          <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
            <span class="activity-icon">{{ activity.icon }}</span>
            <div class="activity-details">
              <p class="activity-text">{{ activity.text }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { getCachedData, setCachedData } from '@core/services/storage';
import { formatRelativeTime } from '@core/utils/dateHelpers';

const studentLogin = ref('');
const topicsCompleted = ref(0);
const tasksCompleted = ref(0);
const avgScore = ref(0);
const streak = ref(0);
const recommendedTopics = ref([]);
const myClass = ref(null);
const classmates = ref([]);
const showClassmatesModal = ref(false);
const recentActivities = ref([]);
const refreshing = ref(false);
let isMounted = true;

// Функция для автоматического создания прогресса пользователя
const ensureStudentProgress = async (userId) => {
  try {
    const progressRef = doc(db, 'studentProgress', userId);
    const progressDoc = await getDoc(progressRef);
    if (!progressDoc.exists()) {
      await setDoc(progressRef, {
        studentId: userId,
        topics: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created studentProgress for user:', userId);
    }
    return true;
  } catch (error) {
    console.warn('Не удалось создать studentProgress:', error.message);
    return false;
  }
};

const getStreak = () => {
  const lastLogin = localStorage.getItem('lastLoginDate');
  const today = new Date().toDateString();
  let streakValue = parseInt(localStorage.getItem('streak') || '0');
  
  if (lastLogin !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLogin === yesterday.toDateString()) {
      streakValue++;
    } else if (!lastLogin) {
      streakValue = 1;
    } else if (lastLogin !== yesterday.toDateString() && lastLogin !== today) {
      streakValue = 1;
    }
    
    localStorage.setItem('streak', streakValue);
    localStorage.setItem('lastLoginDate', today);
  }
  
  return streakValue;
};

const refreshFromFirestore = async () => {
  const user = auth.currentUser;
  if (!user || !isMounted) return;

  try {
    // Загружаем данные пользователя
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || !isMounted) return;
    
    const userData = userDoc.data();
    studentLogin.value = userData.login || user.email;

    // Создаем запись прогресса если её нет
    await ensureStudentProgress(user.uid);

    // Загружаем класс ученика
    const classId = userData.classId;
    if (classId && isMounted) {
      try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists() && isMounted) {
          const classData = classDoc.data();
          let teacherName = '';
          if (classData.teacherId) {
            try {
              const teacherDoc = await getDoc(doc(db, 'users', classData.teacherId));
              teacherName = teacherDoc.exists() ? teacherDoc.data().login : '';
            } catch (e) {
              // Игнорируем
            }
          }

          try {
            const studentsSnap = await getDocs(
              query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'student'))
            );
            classmates.value = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          } catch (e) {
            classmates.value = [];
          }

          myClass.value = {
            id: classId,
            name: classData.name,
            teacherName,
            studentsCount: classmates.value.length
          };
        } else {
          myClass.value = null;
        }
      } catch (e) {
        myClass.value = null;
      }
    } else {
      myClass.value = null;
    }

    // Загружаем прогресс тем из studentProgress
    try {
      const progressDoc = await getDoc(doc(db, 'studentProgress', user.uid));
      if (progressDoc.exists() && isMounted) {
        const topics = progressDoc.data().topics || {};
        topicsCompleted.value = Object.values(topics).filter(t => t === 'completed').length;
      } else {
        topicsCompleted.value = 0;
      }
    } catch (e) {
      topicsCompleted.value = 0;
    }

    // Загружаем отправленные работы из submissions
    try {
      const submissionsSnap = await getDocs(
        query(collection(db, 'submissions'), where('studentId', '==', user.uid))
      );
      
      if (!isMounted) return;
      
      const gradedSubmissions = submissionsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'graded' && data.teacherGrade !== undefined;
      });
      
      tasksCompleted.value = gradedSubmissions.length;
      
      if (gradedSubmissions.length) {
        const total = gradedSubmissions.reduce((sum, doc) => sum + (doc.data().teacherGrade || 0), 0);
        avgScore.value = Math.round(total / gradedSubmissions.length);
      } else {
        avgScore.value = 0;
      }

      const allSubmissions = submissionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().submittedAt?.toDate?.() || new Date()
      }));
      
      allSubmissions.sort((a, b) => b.createdAt - a.createdAt);
      const recent = allSubmissions.slice(0, 5);
      
      recentActivities.value = recent.map(sub => ({
        id: sub.id,
        icon: sub.status === 'pending' ? '📝' : (sub.status === 'graded' ? '✅' : '❌'),
        text: sub.status === 'pending'
          ? 'Задание отправлено на проверку'
          : (sub.status === 'graded'
            ? `Задание проверено, оценка ${sub.teacherGrade}`
            : 'Задание отклонено'),
        time: formatRelativeTime(sub.createdAt)
      }));
    } catch (e) {
      tasksCompleted.value = 0;
      avgScore.value = 0;
      recentActivities.value = [];
    }

    // Рекомендованные темы (статические)
    const topicsList = [
      { id: '1.1', title: 'Биосоциальная сущность человека', description: 'Индивид, индивидуальность, личность' },
      { id: '2.4', title: 'Рыночный механизм', description: 'Спрос, предложение, равновесная цена' },
      { id: '3.5', title: 'Семья и брак', description: 'Условия заключения брака, права супругов' }
    ];
    recommendedTopics.value = topicsList;

    // Кэшируем данные
    if (isMounted) {
      setCachedData('student_dashboard', {
        studentLogin: studentLogin.value,
        topicsCompleted: topicsCompleted.value,
        tasksCompleted: tasksCompleted.value,
        avgScore: avgScore.value,
        myClass: myClass.value,
        classmates: classmates.value,
        recentActivities: recentActivities.value,
        recommendedTopics: recommendedTopics.value
      });
    }
  } catch (error) {
    console.error('Ошибка загрузки дашборда:', error);
  }
};

const loadDashboard = () => {
  const cached = getCachedData('student_dashboard');
  if (cached) {
    studentLogin.value = cached.studentLogin;
    topicsCompleted.value = cached.topicsCompleted;
    tasksCompleted.value = cached.tasksCompleted;
    avgScore.value = cached.avgScore;
    myClass.value = cached.myClass;
    classmates.value = cached.classmates;
    recentActivities.value = cached.recentActivities;
    recommendedTopics.value = cached.recommendedTopics;
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
    if (isMounted) refreshing.value = false;
  }
};

onMounted(() => {
  isMounted = true;
  streak.value = getStreak();
  loadDashboard();
});

onUnmounted(() => {
  isMounted = false;
});
</script>

<style scoped>
.student-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  transition: all 0.2s;
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

.class-info-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid var(--gray-200);
}
.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.class-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--secondary);
}
.btn-outline-primary {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-outline-primary:hover {
  background: var(--primary-light);
}
.class-meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gray-500);
}

.modal {
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
.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-content h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.classmates-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.classmate-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--gray-50);
}
.classmate-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}
.classmate-info {
  flex: 1;
}
.classmate-name {
  font-weight: 500;
  color: var(--secondary);
}
.empty-classmates {
  text-align: center;
  padding: 1rem;
  color: var(--gray-500);
}
.btn-close {
  width: 100%;
  padding: 0.6rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-close:hover {
  background: var(--secondary-dark);
}

.quick-actions {
  margin: 2rem 0;
}
.quick-actions h2 {
  margin-bottom: 1rem;
  font-size: 1.4rem;
  color: var(--secondary);
}
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.action-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}
.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}
.action-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}
.action-card h3 {
  margin: 0 0 0.5rem;
  color: var(--secondary);
}
.action-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gray-500);
}

.recent-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
  margin-bottom: 2rem;
}
.recent-section h2 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
  color: var(--secondary);
}
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.topic-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;
}
.topic-card:hover {
  background: var(--gray-100);
  transform: translateY(-2px);
}
.topic-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--secondary);
}
.topic-card p {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--gray-500);
}
.read-more {
  font-size: 0.85rem;
  color: var(--primary);
  text-decoration: none;
}
.read-more:hover {
  text-decoration: underline;
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
.empty-recommendations {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

body.dark-theme .stat-card,
body.dark-theme .class-info-section,
body.dark-theme .action-card,
body.dark-theme .recent-section,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .topic-card,
body.dark-theme .classmate-item {
  background: var(--gray-700);
}
body.dark-theme .page-header h1,
body.dark-theme .class-header h2,
body.dark-theme .quick-actions h2,
body.dark-theme .recent-section h2,
body.dark-theme .activity-text,
body.dark-theme .topic-card h3,
body.dark-theme .classmate-name {
  color: #ffffff;
}
body.dark-theme .page-header p,
body.dark-theme .class-meta,
body.dark-theme .action-card p,
body.dark-theme .topic-card p,
body.dark-theme .activity-time {
  color: var(--gray-400);
}
body.dark-theme .btn-outline-primary {
  border-color: var(--primary);
  color: var(--primary);
}
body.dark-theme .btn-outline-primary:hover {
  background: rgba(230, 126, 34, 0.2);
}
</style>