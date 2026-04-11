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
            <h3>{{ practiceStats.total }}</h3>
            <p>Упражнений</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <h3>{{ practiceAccuracy }}%</h3>
            <p>Точность</p>
          </div>
        </div>
      </div>

      <div class="level-progress-section">
        <h2>Прогресс по уровням</h2>
        <div class="level-progress">
          <div v-for="(level, idx) in levels" :key="level" class="level-progress-item">
            <span class="level-name">{{ level }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getLevelProgress(level) + '%' }"></div>
            </div>
            <span class="level-percent">{{ getLevelProgress(level) }}%</span>
            <button 
              v-if="idx > 0 && !isLevelCompleted(level)" 
              class="level-exam-btn" 
              @click="openExamModal(levels[idx-1])"
            >
              🎓 Сдать экзамен на {{ levels[idx-1] }}
            </button>
            <span v-if="isLevelCompleted(level)" class="level-completed">✅ Открыт</span>
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

      <!-- Модалка экзамена -->
      <div v-if="examModalOpen" class="modal-overlay" @click.self="examModalOpen = false">
        <div class="modal exam-modal">
          <div class="modal-header">
            <h3>🎓 Экзамен на уровень {{ examLevel }}</h3>
            <button class="close-btn custom-close" @click="examModalOpen = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="exam-info">
              <div class="exam-icon">📝</div>
              <p class="exam-description">
                Экзамен проверит ваши знания по уровню <strong>{{ examLevel }}</strong>.
                Для успешной сдачи необходимо набрать <strong>70%</strong> правильных ответов.
              </p>
              <div class="exam-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ examTotalQuestions }}</span>
                  <span class="stat-label">вопросов</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">45</span>
                  <span class="stat-label">минут</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">70%</span>
                  <span class="stat-label">для сдачи</span>
                </div>
              </div>
            </div>
            <div class="exam-warning">
              <span class="warning-icon">⚠️</span>
              <span>После сдачи экзамена уровень {{ examLevel }} будет считаться пройденным, и откроется следующий уровень</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="startExam">Начать экзамен</button>
            <button class="btn-outline" @click="examModalOpen = false">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка результатов -->
      <div v-if="examResultModal" class="modal-overlay" @click.self="examResultModal = false">
        <div class="modal exam-result-modal">
          <div class="modal-header">
            <h3>Результаты экзамена</h3>
            <button class="close-btn custom-close" @click="examResultModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="exam-result-icon" :class="{ passed: examResultPassed }">
              {{ examResultPassed ? '🎉' : '😢' }}
            </div>
            <h2>{{ examResultPassed ? 'Поздравляем!' : 'К сожалению...' }}</h2>
            <p class="exam-result-score">Ваш результат: <strong>{{ examResultScore }}%</strong> ({{ examResultCorrect }} из {{ examResultTotal }})</p>
            <p v-if="examResultPassed">Уровень {{ examResultLevel }} успешно пройден! Теперь вам доступен следующий уровень.</p>
            <p v-else>Для прохождения уровня {{ examResultLevel }} нужно набрать 70%. Попробуйте ещё раз после подготовки.</p>
            <div class="modal-actions">
              <button class="btn-primary" @click="examResultModal = false">Закрыть</button>
              <button v-if="!examResultPassed" class="btn-outline" @click="retryExam">Попробовать снова</button>
            </div>
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
import { useAppStore } from '@core/stores/appStore';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';
import irregularVerbs from '../data/irregular_verbs.json';
import phrasalVerbs from '../data/phrasal_verbs.json';

const router = useRouter();
const progressFirestore = useEnglishProgressFirestore();
const packStore = useEnglishPackStore();
const appStore = useAppStore();

const studentDisplayName = ref('Ученик');
const currentLevel = ref('A0');
const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const wordsByLevel = ref({});
const examModalOpen = ref(false);
const examLevel = ref('');
const examResultModal = ref(false);
const examResultScore = ref(0);
const examResultCorrect = ref(0);
const examResultTotal = ref(0);
const examResultPassed = ref(false);
const examResultLevel = ref('');
const refreshing = ref(false);

const examQuestions = ref([]);
const examAnswers = ref([]);
const examTotalQuestions = ref(0);

async function refreshAllData() {
  refreshing.value = true;
  appStore.showToast('Обновление данных...', 'info');
  try {
    const { flushQueue } = await import('@/modules/english/services/syncService');
    await flushQueue();
    await progressFirestore.refresh();
    await packStore.refreshPacks();
    appStore.showToast('Данные обновлены', 'success');
  } catch (err) {
    console.error('Ошибка обновления:', err);
    appStore.showToast('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
}

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  
  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      studentDisplayName.value = userDoc.data().displayName || userDoc.data().login || 'Ученик';
    }
  }
  
  for (const level of levels) {
    wordsByLevel.value[level] = vocabularyData.filter(w => w.level === level).length;
  }
  const savedLevel = localStorage.getItem('englishCurrentLevel');
  if (savedLevel && levels.includes(savedLevel)) currentLevel.value = savedLevel;
});

const learnedWordsCount = computed(() => progressFirestore.learnedWords?.length || 0);
const completedLessonsCount = computed(() => progressFirestore.completedLessons?.length || 0);
const practiceStats = computed(() => ({ total: 0, correct: 0 }));
const practiceAccuracy = computed(() => 0);

function getLevelProgress(level) {
  const totalWords = wordsByLevel.value[level] || 1;
  const learnedInLevel = progressFirestore.learnedWords?.filter(wordId => {
    const word = vocabularyData.find(w => w.id === wordId);
    return word && word.level === level;
  }).length || 0;
  return Math.round((learnedInLevel / totalWords) * 100);
}

function isLevelCompleted(level) {
  const completedLevels = JSON.parse(localStorage.getItem('englishCompletedLevels') || '[]');
  return completedLevels.includes(level);
}

function getAccumulatedLevels(targetLevel) {
  const idx = levels.indexOf(targetLevel);
  return levels.slice(0, idx + 1);
}

function getMaxQuestionsPerType(targetLevel) {
  const levelIndex = levels.indexOf(targetLevel);
  const maxWords = [100, 200, 400, 800, 1600];
  const maxOthers = [30, 40, 60, 80, 100];
  return {
    words: maxWords[levelIndex],
    grammar: maxOthers[levelIndex],
    irregular: maxOthers[levelIndex],
    phrasal: maxOthers[levelIndex]
  };
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateExamQuestions(targetLevel) {
  const accumulatedLevels = getAccumulatedLevels(targetLevel);
  const maxPerType = getMaxQuestionsPerType(targetLevel);
  
  let words = [];
  let grammar = [];
  let irregular = [];
  let phrasal = [];
  
  for (const lvl of accumulatedLevels) {
    words.push(...vocabularyData.filter(w => w.level === lvl));
    grammar.push(...grammarData.filter(g => g.level === lvl));
    irregular.push(...irregularVerbs.filter(v => v.level === lvl));
    phrasal.push(...phrasalVerbs.filter(p => p.level === lvl));
  }
  
  words = [...new Map(words.map(w => [w.id, w])).values()];
  grammar = [...new Map(grammar.map(g => [g.rule_id, g])).values()];
  irregular = [...new Map(irregular.map(v => [v.id, v])).values()];
  phrasal = [...new Map(phrasal.map(p => [p.id, p])).values()];
  
  const questions = [];
  
  let wordsCount = Math.min(words.length, maxPerType.words);
  const shuffledWords = shuffleArray([...words]);
  for (let i = 0; i < wordsCount; i++) {
    const word = shuffledWords[i];
    const wrongOptions = words.filter(w => w.id !== word.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [word.translation, ...wrongOptions.map(w => w.translation)].sort(() => 0.5 - Math.random());
    questions.push({
      type: 'word',
      text: `Что означает слово "${word.word}"?`,
      options,
      correct: options.indexOf(word.translation),
      correctText: word.translation
    });
  }
  
  let grammarCount = Math.min(grammar.length, maxPerType.grammar);
  const shuffledGrammar = shuffleArray([...grammar]);
  for (let i = 0; i < grammarCount; i++) {
    const g = shuffledGrammar[i];
    const example = g.examples?.[0];
    if (example) {
      const sentenceWords = example.sentence.split(' ');
      const blankIndex = Math.floor(Math.random() * sentenceWords.length);
      const correctWord = sentenceWords[blankIndex];
      const sentenceWithBlank = sentenceWords.map((w, idx) => idx === blankIndex ? '______' : w).join(' ');
      const wrongWords = ['am', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does', 'did'].filter(w => w !== correctWord).slice(0, 3);
      const options = [correctWord, ...wrongWords].sort(() => 0.5 - Math.random());
      questions.push({
        type: 'grammar',
        text: `Заполните пропуск: ${sentenceWithBlank}`,
        options,
        correct: options.indexOf(correctWord),
        correctText: correctWord
      });
    }
  }
  
  let irregularCount = Math.min(irregular.length, maxPerType.irregular);
  const shuffledIrregular = shuffleArray([...irregular]);
  for (let i = 0; i < irregularCount; i++) {
    const v = shuffledIrregular[i];
    const wrongForms = irregular.filter(iv => iv.id !== v.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(iv => iv.past_simple);
    const options = [v.past_simple, ...wrongForms].sort(() => 0.5 - Math.random());
    questions.push({
      type: 'irregular',
      text: `Какая форма прошедшего времени (Past Simple) у глагола "${v.base}"?`,
      options,
      correct: options.indexOf(v.past_simple),
      correctText: v.past_simple
    });
  }
  
  let phrasalCount = Math.min(phrasal.length, maxPerType.phrasal);
  const shuffledPhrasal = shuffleArray([...phrasal]);
  for (let i = 0; i < phrasalCount; i++) {
    const p = shuffledPhrasal[i];
    const wrongOptions = phrasal.filter(pv => pv.id !== p.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(pv => pv.translation);
    const options = [p.translation, ...wrongOptions].sort(() => 0.5 - Math.random());
    questions.push({
      type: 'phrasal',
      text: `Что означает фразовый глагол "${p.verb}"?`,
      options,
      correct: options.indexOf(p.translation),
      correctText: p.translation
    });
  }
  
  examQuestions.value = shuffleArray(questions);
  examTotalQuestions.value = examQuestions.value.length;
  examAnswers.value = new Array(examTotalQuestions.value).fill(null);
}

function openExamModal(level) {
  examLevel.value = level;
  generateExamQuestions(level);
  examModalOpen.value = true;
}

function startExam() {
  examModalOpen.value = false;
  showExamQuestionsModal();
}

function showExamQuestionsModal() {
  const modal = document.createElement('div');
  modal.className = 'exam-questions-modal modal-overlay';
  modal.innerHTML = `
    <div class="modal exam-questions">
      <div class="modal-header">
        <h3>Экзамен на уровень ${examLevel.value}</h3>
        <button class="close-btn custom-close" id="closeExam">✕</button>
      </div>
      <div class="modal-body" id="examQuestionsBody"></div>
      <div class="modal-footer">
        <button class="btn-primary" id="submitExam">Завершить экзамен</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  const body = modal.querySelector('#examQuestionsBody');
  examQuestions.value.forEach((q, idx) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'exam-question';
    questionDiv.innerHTML = `
      <p class="question-text">${idx + 1}. ${q.text}</p>
      <div class="options" id="q-${idx}"></div>
    `;
    const optionsDiv = questionDiv.querySelector('.options');
    q.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        examAnswers.value[idx] = optIdx;
        document.querySelectorAll(`#q-${idx} .option-btn`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
      optionsDiv.appendChild(btn);
    });
    body.appendChild(questionDiv);
  });
  
  modal.querySelector('#closeExam').onclick = () => {
    modal.remove();
  };
  
  modal.querySelector('#submitExam').onclick = () => {
    let correct = 0;
    examAnswers.value.forEach((ans, idx) => {
      if (ans === examQuestions.value[idx].correct) correct++;
    });
    const score = Math.round((correct / examQuestions.value.length) * 100);
    examResultScore.value = score;
    examResultCorrect.value = correct;
    examResultTotal.value = examQuestions.value.length;
    examResultPassed.value = score >= 70;
    examResultLevel.value = examLevel.value;
    modal.remove();
    
    if (examResultPassed.value) {
      const completedLevels = JSON.parse(localStorage.getItem('englishCompletedLevels') || '[]');
      if (!completedLevels.includes(examLevel.value)) {
        completedLevels.push(examLevel.value);
        localStorage.setItem('englishCompletedLevels', JSON.stringify(completedLevels));
      }
      const currentIdx = levels.indexOf(examLevel.value);
      const nextLevel = levels[currentIdx + 1];
      currentLevel.value = nextLevel || examLevel.value;
      localStorage.setItem('englishCurrentLevel', currentLevel.value);
    }
    examResultModal.value = true;
  };
}

function retryExam() {
  examResultModal.value = false;
  generateExamQuestions(examLevel.value);
  showExamQuestionsModal();
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
.exam-questions {
  max-width: 700px;
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
.exam-question {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200);
}
.question-text {
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.option-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.option-btn.selected {
  background: var(--primary);
  color: white;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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
.exam-result-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 1rem;
}
.exam-result-score {
  font-size: 1.2rem;
  margin: 1rem 0;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
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
</style>