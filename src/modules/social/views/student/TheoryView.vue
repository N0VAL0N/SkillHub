<template>
  <StudentLayout>
    <div class="theory-view">
      <div class="page-header">
        <h1>Библиотека</h1>
        <p class="subtitle">Теория, нормативные акты и термины для подготовки к ЕГЭ</p>
      </div>

      <div class="library-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 Теория
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'normative' }"
          @click="activeTab = 'normative'"
        >
          📜 Нормативные акты
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'terms' }"
          @click="activeTab = 'terms'"
        >
          🃏 Термины
        </button>
      </div>

      <!-- Раздел: Теория -->
      <div v-if="activeTab === 'theory'" class="library-content">
        <div class="block-selector">
          <button 
            v-for="block in theoryBlocks" 
            :key="block.id"
            class="block-btn"
            :class="{ active: selectedTheoryBlock === block.id }"
            @click="selectedTheoryBlock = block.id"
          >
            {{ block.name }}
          </button>
        </div>

        <div class="theory-list">
          <div 
            v-for="lesson in filteredTheory" 
            :key="lesson.topic_id" 
            class="theory-card"
            :class="{ 
              completed: topicStatus[lesson.topic_id] === 'completed',
              inProgress: topicStatus[lesson.topic_id] === 'in_progress'
            }"
            @click="openTheoryModal(lesson)"
          >
            <div class="theory-card-header">
              <h3>{{ lesson.title }}</h3>
              <div class="status-badge" :class="topicStatus[lesson.topic_id] || 'not_started'">
                {{ getStatusText(topicStatus[lesson.topic_id]) }}
              </div>
            </div>
            <p class="theory-preview">{{ lesson.explanation.slice(0, 150) }}...</p>
            <div class="theory-actions" @click.stop>
              <button 
                v-if="topicStatus[lesson.topic_id] !== 'completed'"
                @click="updateTopicStatus(lesson.topic_id, 'completed')"
                class="status-btn complete"
              >
                ✓ Отметить выученным
              </button>
              <button 
                v-if="topicStatus[lesson.topic_id] === 'completed'"
                @click="updateTopicStatus(lesson.topic_id, 'not_started')"
                class="status-btn reset"
              >
                ↺ Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Раздел: Нормативные акты -->
      <div v-if="activeTab === 'normative'" class="library-content">
        <div class="block-selector">
          <button 
            v-for="block in normativeBlocks" 
            :key="block.id"
            class="block-btn"
            :class="{ active: selectedNormativeBlock === block.id }"
            @click="selectedNormativeBlock = block.id"
          >
            {{ block.name }}
          </button>
        </div>

        <div class="acts-list">
          <div 
            v-for="act in filteredActs" 
            :key="act.code" 
            class="act-card"
            @click="openActModal(act)"
          >
            <h3>{{ act.name }}</h3>
            <p class="act-preview">{{ act.full_text.slice(0, 200) }}...</p>
          </div>
        </div>
      </div>

      <!-- Раздел: Термины -->
      <div v-if="activeTab === 'terms'" class="library-content">
        <div class="block-selector">
          <button 
            v-for="block in topicsBlocks" 
            :key="block.id"
            class="block-btn"
            :class="{ active: selectedTermsBlock === block.id }"
            @click="selectedTermsBlock = block.id"
          >
            {{ block.name }}
          </button>
        </div>

        <div class="terms-grid">
          <div 
            v-for="topic in filteredTopics" 
            :key="topic.topic_id" 
            class="terms-topic"
          >
            <h3>{{ topic.name }}</h3>
            <div class="terms-list">
              <div 
                v-for="def in topic.definitions" 
                :key="def.term" 
                class="term-item"
                @click="openTermModal(def, topic.name)"
              >
                <strong>{{ def.term }}</strong>
                <span class="term-definition-preview">{{ def.definition.slice(0, 100) }}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалки -->
      <div v-if="selectedTheory" class="modal" @click.self="selectedTheory = null">
        <div class="modal-content modal-large">
          <h2>{{ selectedTheory.title }}</h2>
          <div class="theory-full">
            <div class="theory-explanation">
              <h4>Объяснение</h4>
              <p>{{ selectedTheory.explanation }}</p>
            </div>
            <div class="theory-examples" v-if="selectedTheory.examples?.length">
              <h4>Примеры</h4>
              <ul>
                <li v-for="(example, idx) in selectedTheory.examples" :key="idx">
                  {{ example }}
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-actions-bottom">
            <button 
              v-if="topicStatus[selectedTheory.topic_id] !== 'completed'"
              @click="updateTopicStatus(selectedTheory.topic_id, 'completed')" 
              class="btn-complete"
            >
              ✓ Отметить выученным
            </button>
            <button @click="selectedTheory = null" class="btn-close">Закрыть</button>
          </div>
        </div>
      </div>

      <div v-if="selectedAct" class="modal" @click.self="selectedAct = null">
        <div class="modal-content modal-large">
          <h2>{{ selectedAct.name }}</h2>
          <div class="act-full-text">{{ selectedAct.full_text }}</div>
          <button @click="selectedAct = null" class="btn-close">Закрыть</button>
        </div>
      </div>

      <div v-if="selectedTerm" class="modal" @click.self="selectedTerm = null">
        <div class="modal-content">
          <h2>{{ selectedTerm.term }}</h2>
          <p class="term-topic">{{ selectedTerm.topicName }}</p>
          <div class="term-full-definition">{{ selectedTerm.definition }}</div>
          <button @click="selectedTerm = null" class="btn-close">Закрыть</button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { auth, db } from '@core/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import theoryData from '@/modules/social/data/theory.json';
import normativeActsData from '@/modules/social/data/normative_acts.json';
import topicsData from '@/modules/social/data/topics.json';

const activeTab = ref('theory');

// Статусы тем
const topicStatus = ref({});

const getStatusText = (status) => {
  const texts = {
    completed: '✓ Выучено',
    in_progress: '📖 В процессе',
    not_started: '⚪ Не начато'
  };
  return texts[status] || texts.not_started;
};

const loadTopicProgress = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const progressDoc = await getDoc(doc(db, 'studentProgress', user.uid));
    if (progressDoc.exists()) {
      topicStatus.value = progressDoc.data().topics || {};
    }
  } catch (error) {
    console.error('Ошибка загрузки прогресса:', error);
  }
};

const updateTopicStatus = async (topicId, status) => {
  const user = auth.currentUser;
  if (!user) return;
  topicStatus.value = { ...topicStatus.value, [topicId]: status };
  try {
    await setDoc(doc(db, 'studentProgress', user.uid), {
      topics: topicStatus.value,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Ошибка сохранения прогресса:', error);
  }
};

// Теория
const theoryBlocks = computed(() => theoryData.blocks || []);
const selectedTheoryBlock = ref(1);
const filteredTheory = computed(() => {
  const block = theoryBlocks.value.find(b => b.id === selectedTheoryBlock.value);
  return block?.lessons || [];
});
const selectedTheory = ref(null);
const openTheoryModal = (lesson) => { selectedTheory.value = lesson; };

// Нормативные акты
const normativeBlocks = computed(() => {
  const blocks = [];
  const blockNames = { 1: 'Человек и общество', 2: 'Экономика', 3: 'Социальные отношения', 4: 'Политика', 5: 'Право' };
  for (let blockId = 1; blockId <= 5; blockId++) {
    const acts = normativeActsData.acts.filter(act => act.topic_ids?.some(topicId => topicId.startsWith(`${blockId}.`)));
    if (acts.length) blocks.push({ id: blockId, name: `Блок ${blockId}. ${blockNames[blockId]}`, acts });
  }
  return blocks;
});
const selectedNormativeBlock = ref(1);
const filteredActs = computed(() => {
  const block = normativeBlocks.value.find(b => b.id === selectedNormativeBlock.value);
  return block?.acts || [];
});
const selectedAct = ref(null);
const openActModal = (act) => { selectedAct.value = act; };

// Термины
const topicsBlocks = computed(() => topicsData.blocks || []);
const selectedTermsBlock = ref(1);
const filteredTopics = computed(() => {
  const block = topicsBlocks.value.find(b => b.id === selectedTermsBlock.value);
  return block?.topics || [];
});
const selectedTerm = ref(null);
const openTermModal = (def, topicName) => {
  selectedTerm.value = { term: def.term, definition: def.definition, topicName };
};

onMounted(() => {
  loadTopicProgress();
});
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.theory-view {
  max-width: 1400px;
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

/* ========== ТАБЫ ========== */
.library-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--gray-600);
  padding-bottom: 0.5rem;
}
.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  border-radius: 2rem;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: var(--gray-200);
  color: var(--primary);
}
.tab-btn.active {
  background: var(--primary);
  color: white;
}

/* ========== СЕЛЕКТОР БЛОКОВ ========== */
.block-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.block-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-200);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--gray-500);
}
.block-btn:hover {
  background: var(--gray-100);
}
.block-btn.active {
  background: var(--primary);
  color: white;
}

/* ========== КАРТОЧКИ ТЕОРИИ ========== */
.theory-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.25rem;
}
.theory-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.theory-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--primary-light);
}
.theory-card.completed {
  border-left: 4px solid var(--success);
}
.theory-card.in_progress {
  border-left: 4px solid var(--warning);
}
.theory-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.theory-card h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--secondary);
  flex: 1;
}
.status-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  white-space: nowrap;
}
.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.status-badge.in_progress {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}
.status-badge.not_started {
  background: var(--gray-200);
  color: var(--gray-500);
}
.theory-preview {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--gray-500);
  line-height: 1.5;
}
.theory-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
}
.status-btn {
  font-size: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.status-btn.complete {
  background: var(--success);
  color: white;
}
.status-btn.complete:hover {
  background: #0e9f6e;
}
.status-btn.reset {
  background: var(--gray-200);
  color: var(--gray-600);
}
.status-btn.reset:hover {
  background: var(--gray-300);
}

/* ========== НОРМАТИВНЫЕ АКТЫ ========== */
.acts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.act-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}
.act-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}
.act-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1.2rem;
  color: var(--secondary);
}
.act-preview {
  margin: 0;
  font-size: 0.95rem;
  color: var(--gray-500);
  line-height: 1.5;
}

/* ========== ТЕРМИНЫ ========== */
.terms-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.terms-topic {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}
.terms-topic:hover {
  box-shadow: var(--shadow-md);
}
.terms-topic h3 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
  color: var(--secondary);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary);
}
.terms-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}
.term-item {
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.term-item:hover {
  background: var(--gray-100);
  transform: translateX(4px);
}
.term-item strong {
  display: block;
  color: var(--primary);
  margin-bottom: 0.25rem;
  font-size: 1rem;
}
.term-definition-preview {
  font-size: 0.85rem;
  color: var(--gray-500);
  line-height: 1.4;
}

/* ========== МОДАЛКИ ========== */
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
  border-radius: 1.5rem;
  padding: 2rem;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-large {
  max-width: 900px;
}
.modal-content h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
  font-size: 1.5rem;
}
.term-topic {
  font-size: 0.85rem;
  color: var(--primary);
  margin-bottom: 1rem;
}
.act-full-text,
.theory-full,
.term-full-definition {
  line-height: 1.6;
  font-size: 1rem;
  color: var(--gray-700);
  white-space: pre-wrap;
}
.theory-explanation {
  margin-bottom: 1.5rem;
}
.theory-explanation h4,
.theory-examples h4 {
  color: var(--primary);
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}
.theory-examples ul {
  margin: 0;
  padding-left: 1.5rem;
}
.theory-examples li {
  margin: 0.5rem 0;
}
.modal-actions-bottom {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn-complete {
  padding: 0.6rem 1.5rem;
  background: var(--success);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  flex: 1;
}
.btn-complete:hover {
  background: #0e9f6e;
}
.btn-close {
  padding: 0.6rem 1.5rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  flex: 1;
}
.btn-close:hover {
  background: var(--secondary-dark);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .theory-card,
body.dark-theme .act-card,
body.dark-theme .terms-topic,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .theory-card h3,
body.dark-theme .act-card h3,
body.dark-theme .terms-topic h3,
body.dark-theme .modal-content h2 {
  color: #ffffff;
}
body.dark-theme .theory-preview,
body.dark-theme .act-preview,
body.dark-theme .term-definition-preview {
  color: var(--gray-500);
}
body.dark-theme .term-item {
  background: var(--gray-700);
}
body.dark-theme .term-item:hover {
  background: var(--gray-600);
}
</style>