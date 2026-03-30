<template>
  <TeacherLayout>
    <div class="library-view">
      <div class="page-header">
        <h1>Библиотека</h1>
        <p class="subtitle">Учебные материалы для подготовки к ЕГЭ</p>
      </div>

      <!-- Табы -->
      <div class="library-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'normative' }"
          @click="activeTab = 'normative'"
        >
          📜 Нормативные акты
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'theory' }"
          @click="activeTab = 'theory'"
        >
          📖 Теория
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'terms' }"
          @click="activeTab = 'terms'"
        >
          🃏 Термины
        </button>
      </div>

      <!-- Раздел: Нормативные акты -->
      <div v-if="activeTab === 'normative'" class="library-content" :style="{ fontSize: fontSize + 'px' }">
        <div class="block-selector">
          <button 
            v-for="block in normativeBlocks" 
            :key="block.id"
            class="block-btn"
            :class="{ active: selectedBlock === block.id }"
            @click="selectedBlock = block.id"
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

        <div v-if="selectedAct" class="modal" @click.self="selectedAct = null">
          <div class="modal-content modal-large" :style="{ fontSize: fontSize + 'px' }">
            <h2>{{ selectedAct.name }}</h2>
            <div class="act-full-text">
              {{ selectedAct.full_text }}
            </div>
            <button @click="selectedAct = null" class="btn-close">Закрыть</button>
          </div>
        </div>
      </div>

      <!-- Раздел: Теория -->
      <div v-if="activeTab === 'theory'" class="library-content" :style="{ fontSize: fontSize + 'px' }">
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
            @click="openTheoryModal(lesson)"
          >
            <h3>{{ lesson.title }}</h3>
            <p class="theory-preview">{{ lesson.explanation.slice(0, 150) }}...</p>
            <div class="theory-examples-preview" v-if="lesson.examples?.length">
              <span class="examples-badge">{{ lesson.examples.length }} примера</span>
            </div>
          </div>
        </div>

        <div v-if="selectedTheory" class="modal" @click.self="selectedTheory = null">
          <div class="modal-content modal-large" :style="{ fontSize: fontSize + 'px' }">
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
            <button @click="selectedTheory = null" class="btn-close">Закрыть</button>
          </div>
        </div>
      </div>

      <!-- Раздел: Термины -->
      <div v-if="activeTab === 'terms'" class="library-content" :style="{ fontSize: fontSize + 'px' }">
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

        <div v-if="selectedTerm" class="modal" @click.self="selectedTerm = null">
          <div class="modal-content" :style="{ fontSize: fontSize + 'px' }">
            <h2>{{ selectedTerm.term }}</h2>
            <p class="term-topic">{{ selectedTerm.topicName }}</p>
            <div class="term-full-definition">
              {{ selectedTerm.definition }}
            </div>
            <button @click="selectedTerm = null" class="btn-close">Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import normativeActsData from '@/data/normative_acts.json';
import theoryData from '@/data/theory.json';
import topicsData from '@/data/topics.json';

// Настройки шрифта
const fontSize = ref(parseInt(localStorage.getItem('libraryFontSize') || '16'));
const showSettings = ref(false);

const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value++;
    localStorage.setItem('libraryFontSize', fontSize.value);
  }
};

const decreaseFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value--;
    localStorage.setItem('libraryFontSize', fontSize.value);
  }
};

// Активная вкладка
const activeTab = ref('normative');

// === Нормативные акты ===
const normativeBlocks = computed(() => {
  const blocks = [];
  const blockNames = {
    1: 'Человек и общество',
    2: 'Экономика',
    3: 'Социальные отношения',
    4: 'Политика',
    5: 'Право'
  };
  for (let blockId = 1; blockId <= 5; blockId++) {
    const acts = normativeActsData.acts.filter(act => {
      return act.topic_ids?.some(topicId => topicId.startsWith(`${blockId}.`));
    });
    if (acts.length > 0) {
      blocks.push({
        id: blockId,
        name: `Блок ${blockId}. ${blockNames[blockId]}`,
        acts: acts
      });
    }
  }
  return blocks;
});

const selectedBlock = ref(1);
const filteredActs = computed(() => {
  const block = normativeBlocks.value.find(b => b.id === selectedBlock.value);
  return block?.acts || [];
});

const selectedAct = ref(null);
const openActModal = (act) => {
  selectedAct.value = act;
};

// === Теория ===
const theoryBlocks = computed(() => {
  return theoryData.blocks || [];
});

const selectedTheoryBlock = ref(1);
const filteredTheory = computed(() => {
  const block = theoryBlocks.value.find(b => b.id === selectedTheoryBlock.value);
  return block?.lessons || [];
});

const selectedTheory = ref(null);
const openTheoryModal = (lesson) => {
  selectedTheory.value = lesson;
};

// === Термины ===
const topicsBlocks = computed(() => {
  return topicsData.blocks || [];
});

const selectedTermsBlock = ref(1);
const filteredTopics = computed(() => {
  const block = topicsBlocks.value.find(b => b.id === selectedTermsBlock.value);
  return block?.topics || [];
});

const selectedTerm = ref(null);
const openTermModal = (def, topicName) => {
  selectedTerm.value = {
    term: def.term,
    definition: def.definition,
    topicName: topicName
  };
};
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.library-view {
  max-width: 1400px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.settings-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.settings-btn:hover {
  background: var(--gray-200);
}
.settings-btn svg {
  transition: transform 0.2s;
}
.settings-btn:hover svg {
  transform: rotate(30deg);
}

/* ========== ТАБЫ ========== */
.library-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--gray-200);
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
  background: var(--gray-100);
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
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--gray-700);
}
.block-btn:hover {
  background: var(--gray-200);
}
.block-btn.active {
  background: var(--primary);
  color: white;
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

/* ========== ТЕОРИЯ ========== */
.theory-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}
.theory-card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
}
.theory-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}
.theory-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1.2rem;
  color: var(--secondary);
}
.theory-preview {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: var(--gray-500);
  line-height: 1.5;
}
.examples-badge {
  font-size: 0.75rem;
  color: var(--primary);
  background: var(--primary-light);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  display: inline-block;
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
.btn-close {
  margin-top: 1.5rem;
  padding: 0.6rem 1.5rem;
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

/* ========== НАСТРОЙКИ ШРИФТА ========== */
.settings-option {
  margin-bottom: 1rem;
}
.settings-option label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.font-size-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.font-size-controls button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.2s;
}
.font-size-controls button:hover:not(:disabled) {
  background: var(--gray-100);
}
.font-size-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.font-size-controls span {
  min-width: 50px;
  text-align: center;
  font-size: 1rem;
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .act-card,
body.dark-theme .theory-card,
body.dark-theme .terms-topic,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-500);
}
body.dark-theme .act-card h3,
body.dark-theme .theory-card h3,
body.dark-theme .terms-topic h3,
body.dark-theme .modal-content h2 {
  color: #ffffff;
}
body.dark-theme .act-preview,
body.dark-theme .theory-preview,
body.dark-theme .term-definition-preview {
  color: var(--gray-500);
}
body.dark-theme .term-item {
  background: var(--gray-900);
}
body.dark-theme .term-item:hover {
  background: var(--gray-600);
}
body.dark-theme .block-btn {
  background: var(--gray-700);
  color: var(--gray-500);
  border: 1px solid var(--gray-600);
}
body.dark-theme .block-btn:hover {
  background: var(--gray-600);
  color: #ffffff;
}
body.dark-theme .block-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
</style>