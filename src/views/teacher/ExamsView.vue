<template>
  <TeacherLayout>
    <div class="exams-view">
      <div class="page-header">
        <h1>Материалы</h1>
        <p class="subtitle">Экзамены и домашние задания</p>
      </div>

      <div class="exams-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'exams' }" @click="activeTab = 'exams'">
          📝 Экзамены ({{ exams.length }})
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'homework' }" @click="activeTab = 'homework'">
          🏠 Домашние задания ({{ homeworks.length }})
        </button>
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label>Класс</label>
          <CustomSelect v-model="filters.classId" :options="classFilterOptions" placeholder="Все классы" />
        </div>
        <div class="filter-item">
          <label>Статус</label>
          <CustomSelect v-model="filters.status" :options="statusOptions" placeholder="Все" />
        </div>
        <div class="filter-item">
          <label>Сортировка</label>
          <div class="sort-buttons">
            <button @click="sortBy = 'date'; sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="sort-btn" :class="{ active: sortBy === 'date' }">
              Дата {{ sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </button>
            <button @click="sortBy = 'title'; sortOrder = 'asc'" class="sort-btn" :class="{ active: sortBy === 'title' }">
              Название
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredItems.length > 0" class="items-list">
        <div v-for="item in filteredItems" :key="item.id" class="item-card">
          <div class="item-header">
            <h3>{{ item.title }}</h3>
            <span class="item-type" :class="item.type">{{ item.type === 'exam' ? 'Экзамен' : 'ДЗ' }}</span>
          </div>
          <div class="item-meta">
            <span>📋 {{ item.questions?.length || 0 }} вопросов</span>
            <span>📅 {{ formatDate(item.createdAt) }}</span>
            <span v-if="item.deadline" class="deadline-badge">
              ⏰ до {{ formatDateTime(item.deadline) }}
              <span v-if="isArchived(item)" class="archived-badge">Архив</span>
            </span>
            <span v-if="item.className" class="class-badge">{{ item.className }}</span>
            <span v-if="item.published" class="published-badge">✅ Опубликован</span>
            <span v-else class="draft-badge">📄 Черновик</span>
          </div>
          <div class="item-actions">
            <button v-if="!item.published && !isArchived(item)" @click="openPublishModal(item)" class="btn-publish">
              Опубликовать
            </button>
            <button v-if="isArchived(item)" @click="duplicateItem(item)" class="btn-duplicate">
              Дублировать
            </button>
            <button @click="editItem(item.id)" class="icon-btn" title="Редактировать">✏️</button>
            <button @click="openDeleteModal(item)" class="icon-btn danger" title="Удалить">🗑️</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Нет заданий</h3>
        <p>Создайте новое задание</p>
      </div>

      <div class="add-item-section">
        <button class="btn-add" @click="createExam">Создать экзамен</button>
        <button class="btn-add" @click="createHomework">Создать домашнее задание</button>
      </div>

      <!-- Модалки -->
      <div v-if="showPublishModal" class="modal" @click.self="closePublishModal">
        <div class="modal-content">
          <h2>Опубликовать задание</h2>
          <div class="publish-type">
            <label class="radio-label"><input type="radio" v-model="publishType" value="class" /> Для класса</label>
            <label class="radio-label"><input type="radio" v-model="publishType" value="student" /> Для ученика</label>
          </div>
          <div v-if="publishType === 'class'">
            <CustomSelect v-model="selectedClassId" :options="classOptions" placeholder="Выберите класс" />
          </div>
          <div v-if="publishType === 'student'">
            <CustomSelect v-model="selectedStudentClassId" :options="classOptions" placeholder="Класс" />
            <CustomSelect v-if="selectedStudentClassId" v-model="selectedStudentId" :options="studentsInClass" placeholder="Ученик" />
          </div>
          <div class="modal-actions">
            <button @click="confirmPublish" class="btn-primary">Опубликовать</button>
            <button @click="closePublishModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
        <div class="modal-content delete-modal">
          <h2>Удалить задание?</h2>
          <p>Вы уверены, что хотите удалить "{{ itemToDelete?.title }}"?</p>
          <div class="modal-actions">
            <button @click="confirmDelete" class="btn-danger">Удалить</button>
            <button @click="closeDeleteModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toast.visible = false">×</button>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/services/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';

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

const router = useRouter();
const activeTab = ref('exams');
const allItems = ref([]);
const classes = ref([]);
const allStudents = ref([]);
const showPublishModal = ref(false);
const showDeleteModal = ref(false);
const publishingItem = ref(null);
const itemToDelete = ref(null);
const publishType = ref('class');
const selectedClassId = ref('');
const selectedStudentClassId = ref('');
const selectedStudentId = ref('');
const filters = ref({ classId: 'all', status: 'all' });
const sortBy = ref('date');
const sortOrder = ref('desc');
const toast = ref({ visible: false, type: 'success', message: '' });

const showToast = (type, message) => {
  toast.value = { visible: true, type, message };
  setTimeout(() => toast.value.visible = false, 3000);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('ru-RU');
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const [date, time] = dateTimeStr.split(' ');
  if (!time) return date;
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year} ${time}`;
};

const isArchived = (item) => {
  if (!item.deadline) return false;
  const deadlineDate = new Date(item.deadline.replace(' ', 'T') + ':00');
  return deadlineDate < new Date();
};

const exams = computed(() => allItems.value.filter(i => i.type === 'exam'));
const homeworks = computed(() => allItems.value.filter(i => i.type === 'homework'));
const currentItems = computed(() => activeTab.value === 'exams' ? exams.value : homeworks.value);

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }];
  const uniqueClasses = new Set();
  currentItems.value.forEach(i => i.className && uniqueClasses.add(i.className));
  Array.from(uniqueClasses).sort().forEach(c => options.push({ value: c, label: c }));
  return options;
});

const statusOptions = [
  { value: 'all', label: 'Все' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'draft', label: 'Черновики' },
  { value: 'archived', label: 'Архивные' }
];

const filteredItems = computed(() => {
  let result = [...currentItems.value];
  if (filters.value.classId !== 'all') {
    result = result.filter(i => i.className === filters.value.classId);
  }
  if (filters.value.status !== 'all') {
    if (filters.value.status === 'published') result = result.filter(i => i.published);
    else if (filters.value.status === 'draft') result = result.filter(i => !i.published && !isArchived(i));
    else if (filters.value.status === 'archived') result = result.filter(i => isArchived(i));
  }
  result.sort((a, b) => {
    if (sortBy.value === 'date') {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  return result;
});

const classOptions = computed(() => classes.value.map(c => ({ value: c.id, label: c.name })));
const studentsInClass = computed(() => {
  const cls = classes.value.find(c => c.id === selectedStudentClassId.value);
  return cls?.students.map(s => ({ value: s.id, label: s.displayName || s.login })) || [];
});

const loadData = async () => {
  try {
    const classesSnap = await getDocs(collection(db, 'classes'));
    const usersSnap = await getDocs(collection(db, 'users'));
    allStudents.value = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'student');
    const classMap = new Map();
    classesSnap.docs.forEach(doc => {
      const data = doc.data();
      classMap.set(doc.id, { id: doc.id, name: data.name, students: [] });
    });
    allStudents.value.forEach(s => {
      if (s.classId && classMap.has(s.classId)) {
        classMap.get(s.classId).students.push(s);
      }
    });
    classes.value = Array.from(classMap.values());

    const itemsSnap = await getDocs(collection(db, 'exams'));
    allItems.value = itemsSnap.docs.map(doc => {
      const data = doc.data();
      let className = null;
      if (data.classId) {
        const found = classes.value.find(c => c.id === data.classId);
        if (found) className = found.name;
      }
      return { id: doc.id, ...data, className };
    }).sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

    setCachedData('teacher_exams', allItems.value);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const loadDashboard = () => {
  const cached = getCachedData('teacher_exams');
  if (cached) {
    allItems.value = cached;
  }
  loadData();
};

const createExam = () => router.push('/teacher/exams/create?type=exam');
const createHomework = () => router.push('/teacher/exams/create?type=homework');
const editItem = (id) => router.push(`/teacher/exams/${id}`);

const duplicateItem = async (item) => {
  try {
    const { id, published, createdAt, updatedAt, ...rest } = item;
    const newTitle = `${item.title} (копия)`;
    await addDoc(collection(db, 'exams'), { ...rest, title: newTitle, published: false, createdAt: new Date() });
    showToast('success', 'Задание продублировано');
    loadData();
  } catch (error) {
    showToast('error', 'Ошибка дублирования');
  }
};

const openPublishModal = (item) => {
  publishingItem.value = item;
  publishType.value = 'class';
  selectedClassId.value = '';
  selectedStudentClassId.value = '';
  selectedStudentId.value = '';
  showPublishModal.value = true;
};
const closePublishModal = () => { showPublishModal.value = false; publishingItem.value = null; };
const confirmPublish = async () => {
  if (!publishingItem.value) return;
  const publishData = { published: true, publishedAt: new Date(), publishedForType: publishType.value };
  if (publishType.value === 'class') {
    const cls = classes.value.find(c => c.id === selectedClassId.value);
    publishData.publishedForClassId = selectedClassId.value;
    publishData.publishedForClassName = cls?.name;
  } else {
    const student = allStudents.value.find(s => s.id === selectedStudentId.value);
    publishData.publishedForStudentId = selectedStudentId.value;
    publishData.publishedForStudentName = student?.displayName || student?.login;
  }
  await updateDoc(doc(db, 'exams', publishingItem.value.id), publishData);
  showToast('success', 'Задание опубликовано');
  closePublishModal();
  loadData();
};

const openDeleteModal = (item) => { itemToDelete.value = item; showDeleteModal.value = true; };
const closeDeleteModal = () => { showDeleteModal.value = false; itemToDelete.value = null; };
const confirmDelete = async () => {
  await deleteDoc(doc(db, 'exams', itemToDelete.value.id));
  showToast('success', 'Задание удалено');
  closeDeleteModal();
  loadData();
};

onMounted(loadDashboard);
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.exams-view {
  max-width: 1200px;
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
.exams-tabs {
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

/* ========== ФИЛЬТРЫ ========== */
.filters-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-sm);
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}
.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sort-buttons {
  display: flex;
  gap: 0.5rem;
}
.sort-btn {
  padding: 0.4rem 0.8rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.sort-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* ========== КАРТОЧКИ ЗАДАНИЙ ========== */
.items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.item-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}
.item-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.item-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--secondary);
}
.item-type {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.item-type.exam {
  background: #e67e22;
  color: white;
}
.item-type.homework {
  background: #10b981;
  color: white;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-bottom: 1rem;
}
.deadline-badge {
  color: var(--warning);
}
.archived-badge {
  background: var(--gray-200);
  padding: 0.1rem 0.4rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
  font-size: 0.7rem;
  color: var(--gray-600);
}
.class-badge {
  background: var(--gray-100);
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
}
.published-badge {
  color: var(--success);
}
.draft-badge {
  color: var(--gray-400);
}

/* ========== КНОПКИ ДЕЙСТВИЙ ========== */
.item-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-200);
  padding-top: 0.75rem;
}
.btn-publish,
.btn-duplicate {
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.75rem;
  border: none;
  transition: all 0.2s;
}
.btn-publish {
  background: var(--success);
  color: white;
}
.btn-duplicate {
  background: var(--info);
  color: white;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: var(--gray-100);
}
.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.empty-state h3 {
  margin: 0 0 0.5rem;
  color: var(--secondary);
}
.empty-state p {
  color: var(--gray-500);
}

/* ========== КНОПКА ДОБАВЛЕНИЯ ========== */
.add-item-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}
.btn-add {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.7rem 2rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-add:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
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
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
}
.publish-type {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}
.btn-danger {
  background: var(--danger);
  color: white;
}

/* ========== ТОСТ ========== */
.custom-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
.custom-toast.success {
  border-left: 4px solid var(--success);
}
.custom-toast.error {
  border-left: 4px solid var(--danger);
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 0.5rem;
}
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .filters-row,
body.dark-theme .item-card,
body.dark-theme .empty-state,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-800);
}
body.dark-theme .item-header h3,
body.dark-theme .modal-content h2 {
  color: #ffffff;
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
</style>