<template>
  <StudentLayout>
  <div class="packs-view">
    <div class="page-header">
      <h1>Мои паки</h1>
      <p class="subtitle">Коллекции карточек для изучения</p>
      <button class="btn-primary create-btn" @click="createNewPack">
        + Создать пак
      </button>
    </div>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск паков..."
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="filteredPacks.length === 0" class="empty-state">
      <div class="empty-icon">🃏</div>
      <p>У вас пока нет паков</p>
      <button class="btn-primary" @click="createNewPack">Создать первый пак</button>
    </div>
    <div v-else class="packs-grid">
      <div
        v-for="pack in filteredPacks"
        :key="pack.id"
        class="pack-card"
        @click="openPackMenu(pack)"
      >
        <div class="pack-cover" :style="{ backgroundColor: pack.coverImage ? 'transparent' : 'var(--primary)' }">
          <img v-if="pack.coverImage" :src="pack.coverImage" alt="cover" />
          <span v-else class="pack-initial">{{ pack.name.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="pack-info">
          <h3>{{ pack.name }}</h3>
          <p>{{ pack.cardCount }} карточек</p>
          <p v-if="pack.level" class="pack-level">
            HSK {{ Array.isArray(pack.level) ? pack.level.join(', ') : pack.level }}
          </p>
        </div>
        <button class="pack-menu-btn" @click.stop="openPackMenu(pack)">⋯</button>
      </div>
    </div>

    <!-- Модалка действий с паком -->
    <div v-if="selectedPack" class="modal-overlay" @click.self="selectedPack = null">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedPack.name }}</h3>
          <button class="close-btn" @click="selectedPack = null">✕</button>
        </div>
        <div class="modal-body">
          <button class="action-btn" @click="studyPack(selectedPack.id)">
            📖 Учить
          </button>
          <button class="action-btn" @click="editPack(selectedPack.id)">
            ✏️ Редактировать
          </button>
          <button class="action-btn danger" @click="confirmDelete(selectedPack)">
            🗑️ Удалить
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StudentLayout from '@core/layouts/StudentLayout.vue'
import { useChinesePackStore } from '@modules/chinese/stores/chinesePackStore'

const router = useRouter()
const packStore = useChinesePackStore()

const searchQuery = ref('')
const loading = ref(false)
const selectedPack = ref(null)
const showDeleteConfirm = ref(false)
const packToDelete = ref(null)

onMounted(async () => {
  await loadPacks()
})

async function loadPacks() {
  loading.value = true
  await packStore.loadPacks()
  loading.value = false
}

const filteredPacks = computed(() => {
  let result = packStore.packs
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(q))
  }
  return result
})

function createNewPack() {
  router.push('/chinese/pack/new')
}

function openPackMenu(pack) {
  selectedPack.value = pack
}

function studyPack(packId) {
  selectedPack.value = null
  router.push(`/chinese/pack/${packId}/study`)
}

function editPack(packId) {
  selectedPack.value = null
  router.push(`/chinese/pack/${packId}/edit`)
}

function confirmDelete(pack) {
  packToDelete.value = pack
  showDeleteConfirm.value = true
  selectedPack.value = null
}

async function deletePack() {
  if (packToDelete.value) {
    await packStore.deletePack(packToDelete.value.id)
    showDeleteConfirm.value = false
    packToDelete.value = null
    await loadPacks()
  }
}
</script>

<style scoped>
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
.create-btn {
  padding: 0.5rem 1rem;
}
.search-bar {
  margin-bottom: 1.5rem;
}
.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  font-size: 1rem;
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
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  overflow: hidden;
}
.pack-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.pack-level {
  color: var(--primary);
  margin-top: 0.25rem;
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
}
.modal-overlay {
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
.modal {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 320px;
  width: 90%;
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
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.action-btn {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  background: var(--gray-50);
  border: none;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
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
.delete-modal {
  text-align: center;
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
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
}
body.dark-theme .action-btn:hover {
  background: var(--gray-600);
}
</style>