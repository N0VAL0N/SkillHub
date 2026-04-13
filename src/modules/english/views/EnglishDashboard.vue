<template>
  <StudentLayout>
    <div class="english-dashboard">
      <div class="page-header">
        <div>
          <h1>Добро пожаловать в раздел английского языка, {{ studentDisplayName }}!</h1>
          <p class="subtitle">Ваш текущий уровень: {{ currentLevel }}</p>
        </div>
        <button class="refresh-btn" @click="refreshAllData" :disabled="refreshing">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4V10H17M1 20V14H7"/>
            <path d="M3.51 9C4.85 5.18 8.5 2.5 13 2.5C18.5 2.5 22.5 6.5 22.5 12"/>
            <path d="M20.49 15C19.15 18.82 15.5 21.5 11 21.5C5.5 21.5 1.5 17.5 1.5 12"/>
          </svg>
          Обновить
        </button>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <h3>{{ learnedWordsCount }}</h3>
            <p>Слов выучено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ completedLessonsCount }}</h3>
            <p>Уроков пройдено</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>{{ totalExercises }}</h3>
            <p>Упражнений</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <h3>{{ overallAccuracy }}%</h3>
            <p>Общая точность</p>
          </div>
        </div>
      </div>

      <div class="level-progress-section">
        <h2>Прогресс по уровням</h2>
        <div class="level-progress">
          <div v-for="(level, idx) in levels" :key="level" class="level-progress-item">
            <span class="level-name">{{ level }}</span>
            <div class="progress-bar" @click="openLevelStatsModal(level)">
              <div class="progress-fill" :style="{ width: getLevelProgress(level) + '%' }"></div>
            </div>
            <span class="level-percent">{{ getLevelProgress(level) }}%</span>

            <button 
              v-if="canTakeExam(level) && !isExamPassed(level)" 
              class="level-exam-btn" 
              @click="router.push(`/english/exam/${level}`)"
            >
              🎓 Сдать экзамен на {{ level }}
            </button>
            <span v-if="isExamPassed(level)" class="level-completed">✅ Экзамен сдан</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Быстрый старт</h2>
        <div class="actions-grid">
          <router-link to="/english/lessons" class="action-card">
            <span class="action-icon">📚</span>
            <h3>Уроки</h3>
            <p>Изучай новые темы</p>
          </router-link>
          <router-link to="/english/practice" class="action-card">
            <span class="action-icon">✍️</span>
            <h3>Практика</h3>
            <p>Тренируй навыки</p>
          </router-link>
          <router-link to="/english/library" class="action-card">
            <span class="action-icon">📖</span>
            <h3>Библиотека</h3>
            <p>Словарь и грамматика</p>
          </router-link>
          <router-link to="/english/packs" class="action-card">
            <span class="action-icon">🃏</span>
            <h3>Паки</h3>
            <p>Карточки для запоминания</p>
          </router-link>
        </div>
      </div>


      <!-- Добавить в шаблон, например, после quick-actions -->
      <div class="repeat-section" v-if="dueWordsCount > 0">
        <h2>🔄 Повторение слов</h2>
        <div class="repeat-card" @click="goToRepeat">
          <div class="repeat-icon">🔁</div>
          <div class="repeat-info">
            <h3>{{ dueWordsCount }} слов ждут повторения</h3>
            <p>По интервальной системе (SM-2)</p>
          </div>
          <button class="repeat-btn">Повторить →</button>
        </div>
      </div>

      <!-- Модалка статистики уровня -->
      <div v-if="levelStatsModal.open" class="modal-overlay" @click.self="levelStatsModal.open = false">
        <div class="modal stats-modal">
          <div class="modal-header">
            <h3>Уровень {{ levelStatsModal.level }}</h3>
            <button class="close-btn custom-close" @click="levelStatsModal.open = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="stats-detail">
              <div class="stats-item">
                <span class="stats-label">📖 Слова:</span>
                <span class="stats-value">{{ levelStatsModal.learnedWords }} / {{ levelStatsModal.totalWords }} ({{ levelStatsModal.wordsPercent }}%)</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">📚 Уроки:</span>
                <span class="stats-value">{{ levelStatsModal.completedLessons }} / {{ levelStatsModal.totalLessons }} ({{ levelStatsModal.lessonsPercent }}%)</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">🎯 Для открытия следующего уровня:</span>
                <span class="stats-value">Выучить {{ levelStatsModal.wordsNeeded }} слов (70% от всех слов уровня)</span>
              </div>
              <div class="stats-progress">
                <div class="progress-bar big">
                  <div class="progress-fill" :style="{ width: levelStatsModal.overallPercent + '%' }"></div>
                </div>
                <p>Общий прогресс: {{ levelStatsModal.overallPercent }}%</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="levelStatsModal.open = false">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useEnglishSm2Store } from '../stores/englishSm2Store';
import { useAppStore } from '@core/stores/appStore';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { refreshAllData } from '@core/services/globalSync';
import vocabularyData from '../data/vocabulary.json';
import lessonsData from '../data/lessons.json';

const router = useRouter();
const progressFirestore = useEnglishProgressFirestore();
const packStore = useEnglishPackStore();
const sm2Store = useEnglishSm2Store();
const appStore = useAppStore();

const studentDisplayName = ref('Ученик');
const currentLevel = ref('A0');
const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const wordsByLevel = ref({});
const lessonsByLevel = ref({});
const refreshing = ref(false);
const dueWordsCount = ref(0);

const levelStatsModal = ref({
  open: false,
  level: '',
  learnedWords: 0,
  totalWords: 0,
  completedLessons: 0,
  totalLessons: 0,
  wordsPercent: 0,
  lessonsPercent: 0,
  overallPercent: 0,
  wordsNeeded: 0
});

async function refreshAllDataLocal() {
  refreshing.value = true;
  await refreshAllData(appStore);
  refreshing.value = false;
}

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  await sm2Store.loadSm2Data();

  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      studentDisplayName.value = userDoc.data().displayName || userDoc.data().login || 'Ученик';
    }
  }

  for (const level of levels) {
    wordsByLevel.value[level] = vocabularyData.filter(w => w.level === level).length;
    lessonsByLevel.value[level] = lessonsData.lessons.filter(l => l.level === level).length;
  }
  const savedLevel = localStorage.getItem('englishCurrentLevel');
  if (savedLevel && levels.includes(savedLevel)) currentLevel.value = savedLevel;

  const learned = progressFirestore.learnedWords || [];
  dueWordsCount.value = sm2Store.getDueWords(learned).length;
});

const learnedWordsCount = computed(() => progressFirestore.learnedWords?.length || 0);
const completedLessonsCount = computed(() => progressFirestore.completedLessons?.length || 0);
const passedExams = computed(() => progressFirestore.passedExams || []);
const totalExercises = computed(() => progressFirestore.stats?.totalExercises || 0);
const correctExercises = computed(() => progressFirestore.stats?.correctExercises || 0);
const overallAccuracy = computed(() => {
  if (totalExercises.value === 0) return 0;
  return Math.round((correctExercises.value / totalExercises.value) * 100);
});

function getLevelProgress(level) {
  const totalWords = wordsByLevel.value[level] || 1;
  const learnedInLevel = progressFirestore.learnedWords?.filter(wordId => {
    const word = vocabularyData.find(w => w.id === wordId);
    return word && word.level === level;
  }).length || 0;
  const totalLessons = lessonsByLevel.value[level] || 0;
  const completedInLevel = progressFirestore.completedLessons.filter(lessonId => {
    const lessonNum = parseInt(lessonId.replace('lesson_', ''));
    const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
    return lesson && lesson.level === level;
  }).length;

  if (learnedInLevel >= totalWords * 0.7 && completedInLevel === totalLessons) {
    return 100;
  }
  const wordProgress = Math.min(100, (learnedInLevel / (totalWords * 0.7)) * 100);
  const lessonProgress = totalLessons === 0 ? 100 : (completedInLevel / totalLessons) * 100;
  return Math.round((wordProgress + lessonProgress) / 2);
}

function isExamPassed(level) {
  return passedExams.value.includes(level);
}

function canTakeExam(level) {
  const levelIndex = levels.indexOf(level);
  if (levelIndex === 0) return true;
  const prevLevel = levels[levelIndex - 1];
  return isExamPassed(prevLevel);
}

function openLevelStatsModal(level) {
  const totalWords = wordsByLevel.value[level] || 1;
  const learnedInLevel = progressFirestore.learnedWords?.filter(wordId => {
    const word = vocabularyData.find(w => w.id === wordId);
    return word && word.level === level;
  }).length || 0;
  const wordsPercent = Math.round((learnedInLevel / totalWords) * 100);

  const totalLessons = lessonsByLevel.value[level] || 0;
  const completedInLevel = progressFirestore.completedLessons.filter(lessonId => {
    const lessonNum = parseInt(lessonId.replace('lesson_', ''));
    const lesson = lessonsData.lessons.find(l => l.lesson_id === lessonNum);
    return lesson && lesson.level === level;
  }).length;
  const lessonsPercent = totalLessons === 0 ? 0 : Math.round((completedInLevel / totalLessons) * 100);

  let overallPercent = 0;
  if (learnedInLevel >= totalWords * 0.7 && completedInLevel === totalLessons) {
    overallPercent = 100;
  } else {
    const wordProgress = Math.min(100, (learnedInLevel / (totalWords * 0.7)) * 100);
    const lessonProgress = totalLessons === 0 ? 100 : (completedInLevel / totalLessons) * 100;
    overallPercent = Math.round((wordProgress + lessonProgress) / 2);
  }

  const wordsNeeded = Math.max(0, Math.ceil(totalWords * 0.7) - learnedInLevel);

  levelStatsModal.value = {
    open: true,
    level,
    learnedWords: learnedInLevel,
    totalWords,
    completedLessons: completedInLevel,
    totalLessons,
    wordsPercent,
    lessonsPercent,
    overallPercent,
    wordsNeeded
  };
}

function goToRepeat() {
  router.push('/english/repeat');
}
</script>

<style scoped>
.english-dashboard {
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
  font-size: 2rem;
  margin: 0;
  color: var(--secondary);
}
.subtitle {
  margin: 0.5rem 0 0;
  color: var(--gray-500);
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn svg {
  transition: transform 0.3s;
}
.refresh-btn:hover svg {
  transform: rotate(180deg);
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
.level-progress-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid var(--gray-200);
}
.level-progress-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
}
.level-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.level-progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.level-name {
  width: 60px;
  font-weight: 500;
}
.progress-bar {
  flex: 2;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}
.level-percent {
  width: 45px;
  font-size: 0.85rem;
}
.level-exam-btn {
  background: none;
  border: 1px solid var(--primary);
  border-radius: 2rem;
  padding: 0.2rem 0.8rem;
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--primary);
  transition: all 0.2s;
}
.level-exam-btn:hover {
  background: var(--primary);
  color: white;
}
.level-completed {
  font-size: 0.7rem;
  color: var(--success);
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--secondary);
}
.custom-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--gray-400);
  transition: all 0.2s;
}
.custom-close:hover {
  color: var(--danger);
  transform: rotate(90deg);
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.stats-modal .stats-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
}
.stats-label {
  font-weight: 500;
  color: var(--gray-700);
}
.stats-value {
  color: var(--primary);
  font-weight: 600;
}
.stats-progress {
  margin-top: 1rem;
  text-align: center;
}
.progress-bar.big {
  height: 12px;
  margin: 0.5rem 0;
}
.btn-primary, .btn-outline {
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}
body.dark-theme .stat-card,
body.dark-theme .level-progress-section,
body.dark-theme .action-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .page-header h1,
body.dark-theme .level-progress-section h2,
body.dark-theme .quick-actions h2,
body.dark-theme .action-card h3 {
  color: white;
}
body.dark-theme .stats-item {
  border-bottom-color: var(--gray-700);
}
body.dark-theme .stats-label {
  color: var(--gray-300);
}
</style>