<template>
  <StudentLayout>
    <div class="pack-edit">
      <div class="page-header">
        <button class="back-btn" @click="goBack">← Назад</button>
        <h1>{{ packId && packId !== 'new' ? 'Редактирование пака' : 'Создание пака' }}</h1>
      </div>

      <div class="edit-form">
        <div class="form-group">
          <label>Название пака</label>
          <input v-model="packName" type="text" placeholder="Введите название" />
        </div>

        <div class="form-group">
          <label>Уровни</label>
          <div class="level-buttons">
            <button
              v-for="level in allLevels"
              :key="level"
              class="level-btn"
              :class="{ active: selectedLevels.includes(level) }"
              @click="toggleLevel(level)"
            >
              {{ level }}
            </button>
          </div>
          <p class="hint">Уровни определяются автоматически при добавлении слов</p>
        </div>

        <div class="cards-section">
          <div class="cards-header">
            <h3>Карточки в паке ({{ cards.length }})</h3>
            <button class="btn-outline small" @click="openWordSelector">📚 Добавить из библиотеки</button>
          </div>
          <div class="cards-list">
            <div v-for="(card, idx) in cards" :key="card.id || idx" class="card-item">
              <div class="card-content">
                <span class="card-word">{{ card.front }}</span>
                <span class="card-arrow">→</span>
                <span class="card-translation">{{ card.back }}</span>
                <span class="card-level" v-if="card.level">({{ card.level }})</span>
              </div>
              <button class="remove-btn" @click="removeCard(idx)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7H20M10 11V16M14 11V16M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="cards.length === 0" class="empty-cards">
            <p>Нет карточек. Нажмите «Добавить из библиотеки».</p>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" @click="savePack">Сохранить</button>
          <button class="btn-outline" @click="goBack">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Модалка выбора слов -->
    <div v-if="showWordSelector" class="modal-overlay" @click.self="showWordSelector = false">
      <div class="modal word-selector-modal">
        <div class="modal-header">
          <h3>Выберите слова из библиотеки</h3>
          <button class="close-btn custom-close" @click="showWordSelector = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="content-type-selector">
            <span class="type-label">Тип контента:</span>
            <div class="type-buttons">
              <button
                v-for="type in contentTypes"
                :key="type.id"
                class="type-btn"
                :class="{ active: selectorContentType === type.id }"
                @click="selectorContentType = type.id"
              >
                {{ type.icon }} {{ type.name }}
              </button>
            </div>
          </div>

          <div class="level-filters">
            <span class="filter-label">Уровни:</span>
            <div class="level-buttons small">
              <button
                v-for="level in allLevels"
                :key="level"
                class="level-btn"
                :class="{ active: selectorLevels.includes(level) }"
                @click="toggleSelectorLevel(level)"
              >
                {{ level }}
              </button>
              <button class="level-btn all-btn" @click="selectAllSelectorLevels">Все</button>
              <button class="level-btn reset-btn" @click="resetSelectorLevels">Сбросить</button>
            </div>
          </div>

          <div class="search-bar">
            <input v-model="selectorSearch" type="text" :placeholder="searchPlaceholder" class="search-input" />
          </div>

          <div class="items-grid">
            <div
              v-for="item in filteredSelectorItems"
              :key="item.id"
              class="item-card"
              :class="{ selected: isItemSelected(item) }"
              @click="toggleItemSelection(item)"
            >
              <div class="item-title">{{ getItemTitle(item) }}</div>
              <div class="item-details">{{ getItemDetails(item) }}</div>
              <div class="item-level">{{ item.level }}</div>
            </div>
            <div v-if="filteredSelectorItems.length === 0" class="empty-state">Ничего не найдено</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="addSelectedItemsToPack">Добавить выбранные ({{ selectedItems.length }})</button>
          <button class="btn-outline" @click="showWordSelector = false">Отмена</button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import StudentLayout from '@core/layouts/StudentLayout.vue';
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useAppStore } from '@core/stores/appStore';
import vocabularyData from '../data/vocabulary.json';
import grammarData from '../data/grammar.json';
import irregularVerbs from '../data/irregular_verbs.json';
import phrasalVerbs from '../data/phrasal_verbs.json';
import idiomsData from '../data/idioms.json';
import collocationsData from '../data/collocations.json';

const router = useRouter();
const route = useRoute();
const packStore = useEnglishPackStore();
const progressFirestore = useEnglishProgressFirestore();
const appStore = useAppStore();

const packId = route.params.id;
const packName = ref('');
const selectedLevels = ref([]);
const cards = ref([]);

const showWordSelector = ref(false);
const selectorContentType = ref('vocabulary');
const selectorLevels = ref(['A0', 'A1', 'A2', 'B1', 'B2']);
const selectorSearch = ref('');
const selectedItems = ref([]);

const allLevels = ['A0', 'A1', 'A2', 'B1', 'B2'];

const contentTypes = [
  { id: 'vocabulary', name: 'Словарь', icon: '📖', data: vocabularyData, levelKey: 'level' },
  { id: 'grammar', name: 'Грамматика', icon: '📐', data: grammarData, levelKey: 'level' },
  { id: 'irregular', name: 'Неправ. глаголы', icon: '🔄', data: irregularVerbs, levelKey: 'level' },
  { id: 'phrasal', name: 'Фраз. глаголы', icon: '🔗', data: phrasalVerbs, levelKey: 'level' },
  { id: 'idioms', name: 'Идиомы', icon: '💡', data: idiomsData, levelKey: 'level' },
  { id: 'collocations', name: 'Коллокации', icon: '🤝', data: collocationsData, levelKey: 'level' }
];

function getItemTitle(item) {
  switch (selectorContentType.value) {
    case 'vocabulary': return item.word;
    case 'grammar': return item.title;
    case 'irregular': return item.base;
    case 'phrasal': return item.verb;
    case 'idioms': return item.expression;
    case 'collocations': return item.collocation;
    default: return '';
  }
}

function getItemDetails(item) {
  switch (selectorContentType.value) {
    case 'vocabulary': return item.translation;
    case 'grammar': return item.theory?.slice(0, 80) + '...';
    case 'irregular': return `${item.past_simple} → ${item.past_participle}`;
    case 'phrasal': return item.translation;
    case 'idioms': return item.translation;
    case 'collocations': return item.translation;
    default: return '';
  }
}

function getItemLevel(item) {
  switch (selectorContentType.value) {
    case 'vocabulary': return item.level;
    case 'grammar': return item.level;
    case 'irregular': return item.level;
    case 'phrasal': return item.level;
    case 'idioms': return item.level;
    case 'collocations': return item.level;
    default: return 'A0';
  }
}

const filteredSelectorItems = computed(() => {
  const contentType = contentTypes.find(c => c.id === selectorContentType.value);
  let result = contentType?.data.filter(item => selectorLevels.value.includes(item.level)) || [];
  if (selectorSearch.value) {
    const q = selectorSearch.value.toLowerCase();
    result = result.filter(item => getItemTitle(item).toLowerCase().includes(q));
  }
  return result;
});

const searchPlaceholder = computed(() => {
  const placeholders = {
    vocabulary: 'Поиск по слову...',
    grammar: 'Поиск по теме...',
    irregular: 'Поиск по глаголу...',
    phrasal: 'Поиск по фраз. глаголу...',
    idioms: 'Поиск по идиоме...',
    collocations: 'Поиск по коллокации...'
  };
  return placeholders[selectorContentType.value] || 'Поиск...';
});

function updateLevelsFromCards() {
  const allLevelsFromCards = [...new Set(cards.value.map(c => c.level).filter(l => l))];
  selectedLevels.value = [...new Set([...selectedLevels.value, ...allLevelsFromCards])];
}

onMounted(async () => {
  await progressFirestore.loadProgress();
  await packStore.loadPacks();
  
  if (packId && packId !== 'new') {
    const pack = packStore.packs.find(p => p.id === packId);
    if (pack) {
      packName.value = pack.name;
      selectedLevels.value = pack.level ? [pack.level] : [];
      cards.value = (pack.cards || []).map(c => ({ 
        id: c.id, 
        front: c.front, 
        back: c.back, 
        level: c.level || pack.level || '' 
      }));
      if (selectedLevels.value.length === 0) {
        updateLevelsFromCards();
      }
    }
  }
});

function toggleLevel(level) {
  if (selectedLevels.value.includes(level)) {
    selectedLevels.value = selectedLevels.value.filter(l => l !== level);
  } else {
    selectedLevels.value.push(level);
  }
}

function toggleSelectorLevel(level) {
  if (selectorLevels.value.includes(level)) {
    selectorLevels.value = selectorLevels.value.filter(l => l !== level);
  } else {
    selectorLevels.value.push(level);
  }
}

function selectAllSelectorLevels() {
  selectorLevels.value = [...allLevels];
}

function resetSelectorLevels() {
  selectorLevels.value = [];
}

function isItemSelected(item) {
  return selectedItems.value.some(i => i.id === item.id);
}

function toggleItemSelection(item) {
  if (isItemSelected(item)) {
    selectedItems.value = selectedItems.value.filter(i => i.id !== item.id);
  } else {
    selectedItems.value.push(item);
  }
}

function openWordSelector() {
  selectedItems.value = [];
  selectorContentType.value = 'vocabulary';
  selectorLevels.value = ['A0', 'A1', 'A2', 'B1', 'B2'];
  selectorSearch.value = '';
  showWordSelector.value = true;
}

function addSelectedItemsToPack() {
  const newCards = selectedItems.value.map(item => ({
    id: Date.now().toString() + Math.random(),
    front: getItemTitle(item),
    back: getItemDetails(item).split('→')[0].trim(),
    level: getItemLevel(item)
  }));
  const existingFronts = new Set(cards.value.map(c => c.front));
  const uniqueNewCards = newCards.filter(c => !existingFronts.has(c.front));
  cards.value.push(...uniqueNewCards);
  updateLevelsFromCards();
  showWordSelector.value = false;
  appStore.showToast(`Добавлено ${uniqueNewCards.length} слов(а)`, 'success');
}

function removeCard(index) {
  cards.value.splice(index, 1);
  updateLevelsFromCards();
}

async function savePack() {
  if (!packName.value.trim()) {
    appStore.showToast('Введите название пака', 'error');
    return;
  }
  if (cards.value.length === 0) {
    appStore.showToast('Добавьте хотя бы одну карточку', 'error');
    return;
  }

  const packLevel = selectedLevels.value[0] || 'A0';

  if (packId && packId !== 'new') {
    await packStore.updatePack(packId, {
      name: packName.value,
      level: packLevel,
      cards: cards.value
    });
    appStore.showToast('Пак обновлён', 'success');
  } else {
    const newPack = await packStore.createPack({
      name: packName.value,
      level: packLevel,
      cards: cards.value
    });
    appStore.showToast('Пак создан', 'success');
  }
  router.push('/english/packs');
}

function goBack() {
  router.push('/english/packs');
}
</script>

<style scoped>
.card-level {
  font-size: 0.7rem;
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
}
.hint {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}
.pack-edit {
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--secondary);
}
.edit-form {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
}
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
}
.level-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.level-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}
.level-btn.active {
  background: var(--primary);
  color: white;
}
.all-btn {
  background: var(--gray-200);
}
.all-btn:hover {
  background: var(--primary);
  color: white;
}
.reset-btn {
  background: var(--danger);
  color: white;
}
.cards-section {
  margin-top: 1.5rem;
}
.cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.cards-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--secondary);
}
.btn-outline.small {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  border-radius: 2rem;
}
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  padding: 0.5rem;
}
.card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 0.5rem;
}
.card-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  flex-wrap: wrap;
}
.card-word {
  font-weight: 600;
  color: var(--secondary);
}
.card-arrow {
  color: var(--gray-400);
}
.card-translation {
  color: var(--gray-600);
}
.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}
.remove-btn:hover {
  transform: scale(1.1);
}
.empty-cards {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.btn-primary, .btn-outline {
  padding: 0.75rem 1.5rem;
  border-radius: 3rem;
  font-size: 1rem;
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
.word-selector-modal {
  background: white;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
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
  padding: 1rem 1.5rem;
}
.content-type-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.type-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.type-btn {
  padding: 0.3rem 0.7rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.75rem;
}
.type-btn.active {
  background: var(--primary);
  color: white;
}
.level-filters {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.level-buttons.small {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.search-bar {
  margin-bottom: 1rem;
}
.search-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  font-size: 0.9rem;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}
.item-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.item-card.selected {
  border-left: 4px solid var(--primary);
  background: var(--primary-light);
}
.item-title {
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 0.25rem;
}
.item-details {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.item-level {
  font-size: 0.7rem;
  display: inline-block;
  background: var(--gray-100);
  padding: 0.15rem 0.4rem;
  border-radius: 1rem;
  margin-top: 0.25rem;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
  grid-column: 1 / -1;
}
body.dark-theme .edit-form,
body.dark-theme .word-selector-modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .card-item {
  background: var(--gray-700);
}
body.dark-theme .card-word {
  color: white;
}
body.dark-theme .item-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .item-card.selected {
  background: rgba(230, 126, 34, 0.2);
}
body.dark-theme .item-title {
  color: white;
}
body.dark-theme .type-btn,
body.dark-theme .level-btn {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .type-btn.active,
body.dark-theme .level-btn.active {
  background: var(--primary);
  color: white;
}
</style>