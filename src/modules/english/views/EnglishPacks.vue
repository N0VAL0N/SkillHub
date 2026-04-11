<template>
  <StudentLayout>
    <div class="packs-view">
      <div class="page-header">
        <div>
          <h1>Мои паки</h1>
          <p class="subtitle">Коллекции карточек для изучения английских слов</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline refresh-btn" @click="refreshAllData" :disabled="refreshing">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4V10H17M1 20V14H7"/>
              <path d="M3.51 9C4.85 5.18 8.5 2.5 13 2.5C18.5 2.5 22.5 6.5 22.5 12"/>
              <path d="M20.49 15C19.15 18.82 15.5 21.5 11 21.5C5.5 21.5 1.5 17.5 1.5 12"/>
            </svg>
            Обновить
          </button>
          <button class="btn-primary create-btn" @click="createNewPack">+ Создать пак</button>
        </div>
      </div>

      <!-- Фильтры и сортировка -->
      <div class="filters-bar">
        <div class="search-bar">
          <input v-model="searchQuery" type="text" placeholder="Поиск паков..." class="search-input" />
        </div>
        <div class="sort-controls">
          <button v-for="sort in sortOptions" :key="sort.value" class="sort-btn" :class="{ active: sortBy === sort.value }" @click="setSort(sort.value)">
            {{ sort.label }}
            <span v-if="sortBy === sort.value" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
          </button>
          <button class="filter-btn" @click="showFilterModal = true">🔍 Фильтр</button>
        </div>
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="filteredAndSortedPacks.length === 0" class="empty-state">
        <div class="empty-icon">🃏</div>
        <p>У вас пока нет паков</p>
        <button class="btn-primary create-btn large" @click="createNewPack">Создать первый пак</button>
      </div>
      <div v-else class="packs-grid">
        <div v-for="pack in filteredAndSortedPacks" :key="pack.id" class="pack-card" @click="openPackMenu(pack)">
          <div class="pack-cover">
            <span class="pack-initial">{{ pack.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="pack-info">
            <h3>{{ pack.name }}</h3>
            <p>{{ pack.cards?.length || 0 }} карточек</p>
            <div class="pack-levels" v-if="pack.level">
              <span class="level-badge">{{ pack.level }}</span>
            </div>
            <p class="pack-stats">
              📊 Выучено: {{ getLearnedCount(pack) }} / {{ pack.cards?.length || 0 }}
            </p>
            <div class="progress-bar small" v-if="pack.cards?.length">
              <div class="progress-fill" :style="{ width: getLearnedPercent(pack) + '%' }"></div>
            </div>
          </div>
          <button class="pack-menu-btn" @click.stop="openPackMenu(pack)">⋯</button>
        </div>
      </div>

      <!-- Модалка фильтрации -->
      <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
        <div class="modal filter-modal">
          <div class="modal-header">
            <h3>🔍 Фильтр паков</h3>
            <button class="close-btn custom-close" @click="showFilterModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="filter-section">
              <div class="filter-title">📚 Уровни</div>
              <div class="level-buttons">
                <button v-for="level in allLevels" :key="level" class="filter-level-btn" :class="{ active: filterLevels.includes(level) }" @click="toggleFilterLevel(level)">
                  {{ level }}
                </button>
              </div>
            </div>
            <div class="filter-section">
              <div class="filter-title">📊 Статус изучения</div>
              <div class="status-buttons">
                <button class="status-btn" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">Все</button>
                <button class="status-btn" :class="{ active: filterStatus === 'hasUnlearned' }" @click="filterStatus = 'hasUnlearned'">Есть невыученные</button>
                <button class="status-btn" :class="{ active: filterStatus === 'fullyLearned' }" @click="filterStatus = 'fullyLearned'">Полностью выучен</button>
              </div>
            </div>
            <div class="filter-actions">
              <button class="btn-primary" @click="applyFilters">Применить</button>
              <button class="btn-outline" @click="resetFilters">Сбросить все</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалка меню пака -->
      <div v-if="selectedPack" class="modal-overlay" @click.self="closePackMenu">
        <div class="modal pack-modal">
          <div class="modal-header">
            <h3>{{ selectedPack.name }}</h3>
            <button class="close-btn custom-close" @click="closePackMenu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <button class="action-btn" @click="studyPack(selectedPack.id, 'all')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6V12L15 15M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
              </svg>
              Учить все слова
            </button>
            <button class="action-btn" @click="studyPack(selectedPack.id, 'unlearned')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12H15M12 9V15M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
              </svg>
              Учить только невыученные
            </button>
            <button class="action-btn" @click="editPack(selectedPack.id)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
              </svg>
              Редактировать
            </button>
            <button class="action-btn danger" @click="confirmDelete(selectedPack)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7H20M10 11V16M14 11V16M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"/>
              </svg>
              Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Модалка подтверждения удаления -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal delete-modal">
          <h3>Удалить пак?</h3>
          <p>Вы уверены, что хотите удалить пак «{{ packToDelete?.name }}»?</p>
          <div class="modal-actions">
            <button class="btn-outline" @click="showDeleteConfirm = false">Отмена</button>
            <button class="btn-danger" @click="deletePack">Удалить</button>
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
import { useEnglishPackStore } from '../stores/englishPackStore';
import { useEnglishProgressFirestore } from '../stores/englishProgressFirestore';
import { useAppStore } from '@core/stores/appStore';

const router = useRouter();
const packStore = useEnglishPackStore();
const progressFirestore = useEnglishProgressFirestore();
const appStore = useAppStore();

const searchQuery = ref('');
const loading = ref(false);
const refreshing = ref(false);
const sortBy = ref('name');
const sortOrder = ref('asc');
const showFilterModal = ref(false);
const filterLevels = ref([]);
const filterStatus = ref('all');
const selectedPack = ref(null);
const showDeleteConfirm = ref(false);
const packToDelete = ref(null);

const allLevels = ['A0', 'A1', 'A2', 'B1', 'B2'];
const sortOptions = [
  { value: 'name', label: 'По названию' },
  { value: 'cardCount', label: 'По количеству' },
  { value: 'learnedPercent', label: 'По прогрессу' }
];

onMounted(async () => {
  await loadPacks();
  await progressFirestore.loadProgress();
});

async function loadPacks() {
  loading.value = true;
  await packStore.loadPacks();
  loading.value = false;
}

// Синхронизация выученных слов с паками
async function syncLearnedWordsToPacks() {
  const learnedWordsSet = new Set(progressFirestore.learnedWords);
  let syncedCount = 0;
  
  for (const pack of packStore.packs) {
    // Находим ID карточек, у которых wordId есть в learnedWords
    const learnedCardIds = pack.cards
      .filter(card => card.wordId && learnedWordsSet.has(card.wordId))
      .map(card => card.id);
    
    const currentProgress = progressFirestore.getPackProgress(pack.id);
    const currentLearned = currentProgress.learnedCardIds || [];
    
    // Проверяем, нужно ли обновлять
    const needsUpdate = learnedCardIds.length !== currentLearned.length ||
      !learnedCardIds.every(id => currentLearned.includes(id));
    
    if (needsUpdate && learnedCardIds.length > 0) {
      await progressFirestore.updatePackProgress(pack.id, learnedCardIds);
      syncedCount++;
      console.log(`[Sync] Пак "${pack.name}": обновлено ${learnedCardIds.length} выученных слов`);
    }
  }
  
  return syncedCount;
}

async function refreshAllData() {
  refreshing.value = true;
  appStore.showToast('Обновление данных...', 'info');
  try {
    // 1. Отправляем очередь в Firestore
    const { flushQueue } = await import('@/modules/english/services/syncService');
    await flushQueue();
    
    // 2. Обновляем прогресс из Firestore
    await progressFirestore.refresh();
    
    // 3. Обновляем паки из Firestore
    await packStore.refreshPacks();
    
    // 4. Синхронизируем выученные слова с паками
    const syncedCount = await syncLearnedWordsToPacks();
    
    // 5. Перезагружаем отображение
    await packStore.refreshPacks();
    
    appStore.showToast(`Данные обновлены${syncedCount > 0 ? `, синхронизировано ${syncedCount} паков` : ''}`, 'success');
  } catch (err) {
    console.error('Ошибка обновления:', err);
    appStore.showToast('Ошибка обновления данных', 'error');
  } finally {
    refreshing.value = false;
  }
}

function getLearnedCount(pack) {
  const progress = progressFirestore.getPackProgress(pack.id);
  return progress.learnedCardIds?.length || 0;
}

function getLearnedPercent(pack) {
  if (!pack.cards?.length) return 0;
  return Math.round((getLearnedCount(pack) / pack.cards.length) * 100);
}

const filteredAndSortedPacks = computed(() => {
  let result = packStore.packs;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q));
  }

  if (filterLevels.value.length > 0) {
    result = result.filter(p => filterLevels.value.includes(p.level));
  }

  if (filterStatus.value === 'hasUnlearned') {
    result = result.filter(p => getLearnedCount(p) < (p.cards?.length || 0));
  } else if (filterStatus.value === 'fullyLearned') {
    result = result.filter(p => getLearnedCount(p) === (p.cards?.length || 0) && (p.cards?.length || 0) > 0);
  }

  result = [...result].sort((a, b) => {
    let valA, valB;
    if (sortBy.value === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy.value === 'cardCount') {
      valA = a.cards?.length || 0;
      valB = b.cards?.length || 0;
    } else if (sortBy.value === 'learnedPercent') {
      valA = getLearnedPercent(a);
      valB = getLearnedPercent(b);
    }
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
});

function setSort(value) {
  if (sortBy.value === value) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = value;
    sortOrder.value = 'asc';
  }
}

function toggleFilterLevel(level) {
  if (filterLevels.value.includes(level)) {
    filterLevels.value = filterLevels.value.filter(l => l !== level);
  } else {
    filterLevels.value.push(level);
  }
}

function applyFilters() {
  showFilterModal.value = false;
}

function resetFilters() {
  filterLevels.value = [];
  filterStatus.value = 'all';
  searchQuery.value = '';
  showFilterModal.value = false;
}

function createNewPack() {
  router.push('/english/pack/new');
}

function openPackMenu(pack) {
  selectedPack.value = pack;
}

function closePackMenu() {
  selectedPack.value = null;
}

function studyPack(packId, mode) {
  selectedPack.value = null;
  router.push(`/english/pack/${packId}/study?mode=${mode}`);
}

function editPack(packId) {
  selectedPack.value = null;
  router.push(`/english/pack/${packId}/edit`);
}

function confirmDelete(pack) {
  packToDelete.value = pack;
  showDeleteConfirm.value = true;
  selectedPack.value = null;
}

async function deletePack() {
  if (packToDelete.value) {
    await packStore.deletePack(packToDelete.value.id);
    showDeleteConfirm.value = false;
    packToDelete.value = null;
    await loadPacks();
  }
}
</script>

<style scoped>
/* стили как в предыдущей версии */
.packs-view {
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-header h1 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--secondary);
}
.subtitle {
  margin: 0;
  color: var(--gray-500);
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--primary);
  color: var(--primary);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: wheat;
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
.create-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.create-btn.large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}
.create-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.search-bar {
  flex: 1;
  min-width: 200px;
}
.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  font-size: 1rem;
}
.sort-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.sort-btn {
  background: var(--gray-100);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.sort-btn.active {
  background: var(--primary);
  color: white;
}
.sort-arrow {
  margin-left: 0.25rem;
}
.filter-btn {
  background: var(--gray-200);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  cursor: pointer;
}
.packs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.pack-card {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.pack-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.pack-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.pack-initial {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}
.pack-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: var(--secondary);
}
.pack-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-500);
}
.level-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 1rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}
.pack-levels {
  margin-top: 0.25rem;
}
.pack-stats {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}
.progress-bar.small {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}
.progress-bar.small .progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s;
}
.pack-menu-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.pack-menu-btn:hover {
  background: rgba(0, 0, 0, 0.7);
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
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.filter-modal {
  max-width: 450px;
}
.pack-modal {
  max-width: 350px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
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
.filter-section {
  margin-bottom: 1.5rem;
}
.filter-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.level-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-level-btn {
  padding: 0.4rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}
.filter-level-btn.active {
  background: var(--primary);
  color: white;
}
.status-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.status-btn {
  padding: 0.4rem 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}
.status-btn.active {
  background: var(--primary);
  color: white;
}
.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--gray-50);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}
.action-btn svg {
  flex-shrink: 0;
}
.action-btn:hover {
  background: var(--gray-100);
}
.action-btn.danger {
  color: var(--danger);
}
.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
.btn-primary, .btn-outline, .btn-danger {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
}
.btn-danger {
  background: var(--danger);
  color: white;
}
.loading, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
body.dark-theme .pack-card,
body.dark-theme .modal {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .pack-info h3 {
  color: white;
}
body.dark-theme .action-btn {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .action-btn:hover {
  background: var(--gray-600);
}
body.dark-theme .sort-btn,
body.dark-theme .filter-btn,
body.dark-theme .filter-level-btn,
body.dark-theme .status-btn {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .sort-btn.active,
body.dark-theme .filter-level-btn.active,
body.dark-theme .status-btn.active {
  background: var(--primary);
  color: white;
}
body.dark-theme .search-input {
  background: var(--gray-800);
  border-color: var(--gray-700);
  color: white;
}
</style>