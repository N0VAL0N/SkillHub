<template>
  <TeacherLayout>
    <div class="classes-view">
      <div class="page-header">
        <h1>Классы</h1>
      </div>

      <div class="classes-stats">
        <div class="stat-badge">
          <span class="stat-value">{{ classes.length }}</span>
          <span class="stat-label">Всего классов</span>
        </div>
        <div class="stat-badge">
          <span class="stat-value">{{ totalStudents }}</span>
          <span class="stat-label">Учеников</span>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label>Фильтр по классу:</label>
          <CustomSelect
            v-model="selectedClassFilter"
            :options="classFilterOptions"
            placeholder="Все классы"
          />
        </div>
        <div class="filter-item">
          <label>Сортировка:</label>
          <CustomSelect
            v-model="sortBy"
            :options="sortOptions"
            placeholder="По названию"
          />
        </div>
        <div class="filter-item sort-order">
          <label>Порядок:</label>
          <button @click="toggleSortOrder" class="sort-order-btn">
            {{ sortOrder === 'asc' ? '↑ По возрастанию' : '↓ По убыванию' }}
          </button>
        </div>
      </div>

      <div class="classes-grid">
        <div v-for="cls in filteredAndSortedClasses" :key="cls.id" class="class-card">
          <div class="class-header">
            <h3>{{ cls.name }}</h3>
            <span class="student-count">{{ cls.students.length }} учеников</span>
          </div>
          <div class="class-students">
            <div v-for="student in cls.students.slice(0, 5)" :key="student.id" class="student-chip">
              {{ student.displayName || student.login }}
            </div>
            <div v-if="cls.students.length > 5" class="student-chip more">
              +{{ cls.students.length - 5 }}
            </div>
            <div v-if="cls.students.length === 0" class="empty-students">
              Нет учеников
            </div>
          </div>
          <div class="class-actions">
            <button @click="openAddStudentModal(cls)" class="icon-btn" title="Добавить ученика">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button @click="openEditModal(cls)" class="icon-btn" title="Редактировать">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M15 5L19 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button @click="openDeleteModal(cls)" class="icon-btn danger" title="Удалить">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7H20M10 11V16M14 11V16M6 7L7 19C7 19.5304 7.21071 20.0391 7.58579 20.4142C7.96086 20.7893 8.46957 21 9 21H15C15.5304 21 16.0391 20.7893 16.4142 20.4142C16.7893 20.0391 17 19.5304 17 19L18 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="add-class-section">
        <button class="btn-add" @click="openAddModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Создать класс
        </button>
      </div>

      <!-- Модалка добавления ученика -->
      <div v-if="showAddStudentModal" class="modal" @click.self="closeAddStudentModal">
        <div class="modal-content">
          <h2>Добавить ученика в класс {{ selectedClassForStudent?.name }}</h2>
          <div class="form-group">
            <label>Выберите ученика</label>
            <CustomSelect
              v-model="selectedStudentId"
              :options="availableStudentsOptions"
              placeholder="Выберите ученика"
            />
          </div>
          <div class="modal-actions">
            <button @click="addStudentToClass" class="btn-primary">Добавить</button>
            <button @click="closeAddStudentModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка создания/редактирования -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <h2>{{ editingClass ? 'Редактировать класс' : 'Создать класс' }}</h2>
          <div class="class-selectors">
            <div class="selector-group">
              <label>Номер класса</label>
              <CustomSelect v-model="selectedNumber" :options="numberOptions" />
            </div>
            <div class="selector-group">
              <label>Буква</label>
              <CustomSelect v-model="selectedLetter" :options="letterOptions" />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveClass" class="btn-primary">Сохранить</button>
            <button @click="closeModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка подтверждения удаления -->
      <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
        <div class="modal-content delete-modal">
          <div class="delete-icon">⚠️</div>
          <h2>Подтверждение удаления</h2>
          <p>Вы действительно хотите удалить класс <strong>{{ classToDelete?.name }}</strong>?</p>
          <p class="delete-warning">Ученики будут перемещены в категорию "Без класса". Это действие нельзя отменить.</p>
          <div class="modal-actions">
            <button @click="confirmDelete" class="btn-danger">Удалить</button>
            <button @click="closeDeleteModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Кастомный тост -->
      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="toast.visible = false">✖</button>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { db, auth } from '@/services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';

const classes = ref([]);
const students = ref([]);
const showModal = ref(false);
const showDeleteModal = ref(false);
const showAddStudentModal = ref(false);
const editingClass = ref(null);
const classToDelete = ref(null);
const selectedClassForStudent = ref(null);
const selectedStudentId = ref('');
const selectedNumber = ref('');
const selectedLetter = ref('');
const selectedClassFilter = ref('all');
const sortBy = ref('name');
const sortOrder = ref('asc');

const numberOptions = [
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' }
];
const letterOptions = [
  { value: 'А', label: 'А' }, { value: 'Б', label: 'Б' }, { value: 'В', label: 'В' },
  { value: 'Г', label: 'Г' }, { value: 'Д', label: 'Д' }, { value: 'Е', label: 'Е' },
  { value: 'И', label: 'И' }, { value: 'С', label: 'С' }, { value: 'Т', label: 'Т' },
  { value: 'Ф', label: 'Ф' }
];

const toast = ref({
  visible: false,
  type: 'success',
  title: '',
  message: ''
});

const showToast = (type, title, message, duration = 3000) => {
  toast.value = { visible: true, type, title, message };
  setTimeout(() => {
    toast.value.visible = false;
  }, duration);
};

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }];
  classes.value.forEach(cls => {
    options.push({ value: cls.id, label: cls.name });
  });
  return options;
});

const sortOptions = [
  { value: 'name', label: 'По названию' },
  { value: 'students', label: 'По количеству учеников' }
];

const totalStudents = computed(() => {
  return classes.value.reduce((sum, cls) => sum + cls.students.length, 0);
});

const filteredAndSortedClasses = computed(() => {
  let result = [...classes.value];
  if (selectedClassFilter.value !== 'all') {
    result = result.filter(c => c.id === selectedClassFilter.value);
  }
  result.sort((a, b) => {
    let valA, valB;
    switch (sortBy.value) {
      case 'name':
        valA = a.name;
        valB = b.name;
        break;
      case 'students':
        valA = a.students.length;
        valB = b.students.length;
        break;
      default:
        valA = a.name;
        valB = b.name;
    }
    if (sortOrder.value === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
  return result;
});

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const availableStudentsOptions = computed(() => {
  const currentClassStudentsIds = selectedClassForStudent.value?.students.map(s => s.id) || [];
  return students.value
    .filter(s => !currentClassStudentsIds.includes(s.id))
    .map(s => ({ value: s.id, label: s.displayName || s.login || s.email }));
});

const updateAggregatedStats = async (classId, className) => {
  if (!classId) return;
  try {
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'student')));
    const studentIds = studentsSnap.docs.map(d => d.id);
    const studentsCount = studentIds.length;

    let totalScore = 0;
    let totalSubmissions = 0;
    const studentScores = [];

    for (const studentId of studentIds) {
      const subsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', studentId), where('status', '==', 'graded')));
      let studentTotal = 0;
      let studentCount = 0;
      subsSnap.docs.forEach(sub => {
        studentTotal += sub.data().teacherGrade || 0;
        studentCount++;
      });
      if (studentCount > 0) {
        const avg = Math.round(studentTotal / studentCount);
        studentScores.push({ studentId, avgScore: avg, submissionsCount: studentCount });
        totalScore += studentTotal;
        totalSubmissions += studentCount;
      }
    }

    const avgClassScore = totalSubmissions > 0 ? Math.round(totalScore / totalSubmissions) : 0;

    await setDoc(doc(db, 'aggregatedStats', classId), {
      className: className,
      studentsCount: studentsCount,
      avgScore: avgClassScore,
      completedTasksCount: totalSubmissions,
      studentScores: studentScores,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Ошибка обновления статистики:', error);
  }
};

const loadClasses = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    students.value = usersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.role === 'student');

    const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', user.uid)));
    const classesMap = new Map();

    classesSnap.docs.forEach(doc => {
      const data = doc.data();
      classesMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        teacherId: data.teacherId,
        createdAt: data.createdAt,
        students: []
      });
    });

    students.value.forEach(s => {
      const classId = s.classId;
      if (classId && classesMap.has(classId)) {
        classesMap.get(classId).students.push(s);
      }
    });

    classes.value = Array.from(classesMap.values());
  } catch (error) {
    console.error('Ошибка загрузки классов:', error);
  }
};

const openAddModal = () => {
  editingClass.value = null;
  selectedNumber.value = '';
  selectedLetter.value = '';
  showModal.value = true;
};

const openEditModal = (cls) => {
  editingClass.value = cls;
  const match = cls.name.match(/^(\d+)([А-Я])$/);
  if (match) {
    selectedNumber.value = match[1];
    selectedLetter.value = match[2];
  } else {
    selectedNumber.value = '';
    selectedLetter.value = '';
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingClass.value = null;
  selectedNumber.value = '';
  selectedLetter.value = '';
};

const openAddStudentModal = (cls) => {
  selectedClassForStudent.value = cls;
  selectedStudentId.value = '';
  showAddStudentModal.value = true;
};

const closeAddStudentModal = () => {
  showAddStudentModal.value = false;
  selectedClassForStudent.value = null;
  selectedStudentId.value = '';
};

const addStudentToClass = async () => {
  if (!selectedStudentId.value || !selectedClassForStudent.value) {
    showToast('error', 'Ошибка', 'Выберите ученика');
    return;
  }
  try {
    const classId = selectedClassForStudent.value.id;
    const className = selectedClassForStudent.value.name;

    await updateDoc(doc(db, 'users', selectedStudentId.value), {
      className: className,
      classId: classId
    });

    await updateAggregatedStats(classId, className);

    showToast('success', 'Успешно', 'Ученик добавлен в класс');
    closeAddStudentModal();
    loadClasses();
  } catch (error) {
    console.error('Ошибка добавления ученика:', error);
    showToast('error', 'Ошибка', 'Не удалось добавить ученика');
  }
};

const openDeleteModal = (cls) => {
  classToDelete.value = cls;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  classToDelete.value = null;
};

const confirmDelete = async () => {
  if (!classToDelete.value) return;
  try {
    const studentsInClass = classToDelete.value.students;
    for (const student of studentsInClass) {
      await updateDoc(doc(db, 'users', student.id), {
        className: '',
        classId: null
      });
    }
    await deleteDoc(doc(db, 'classes', classToDelete.value.id));
    showToast('success', 'Успешно', `Класс ${classToDelete.value.name} удалён`);
    closeDeleteModal();
    loadClasses();
  } catch (error) {
    console.error('Ошибка удаления класса:', error);
    showToast('error', 'Ошибка', 'Не удалось удалить класс');
  }
};

const saveClass = async () => {
  const user = auth.currentUser;
  if (!user) return;

  if (!selectedNumber.value || !selectedLetter.value) {
    showToast('error', 'Ошибка', 'Выберите номер и букву класса');
    return;
  }
  const fullName = `${selectedNumber.value}${selectedLetter.value}`;
  try {
    if (editingClass.value) {
      const studentsInClass = editingClass.value.students;
      for (const student of studentsInClass) {
        await updateDoc(doc(db, 'users', student.id), {
          className: fullName,
          classId: editingClass.value.id
        });
      }
      await updateDoc(doc(db, 'classes', editingClass.value.id), {
        name: fullName,
        updatedAt: new Date()
      });
      await updateAggregatedStats(editingClass.value.id, fullName);
      showToast('success', 'Успешно', `Класс ${fullName} обновлён`);
    } else {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: fullName,
        teacherId: user.uid,
        createdAt: new Date()
      });
      await updateAggregatedStats(docRef.id, fullName);
      showToast('success', 'Успешно', `Класс ${fullName} создан`);
    }
    closeModal();
    loadClasses();
  } catch (error) {
    console.error('Ошибка сохранения класса:', error);
    showToast('error', 'Ошибка', 'Не удалось сохранить класс');
  }
};

onMounted(() => loadClasses());
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.classes-view {
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--secondary);
}

/* ========== СТАТИСТИКА ========== */
.classes-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-badge {
  background: white;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  text-align: center;
  min-width: 130px;
  box-shadow: var(--shadow);
}
.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  display: block;
}
.stat-label {
  font-size: 0.85rem;
  color: var(--gray-500);
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
  min-width: 180px;
}
.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sort-order-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-700);
  transition: all 0.2s;
}
.sort-order-btn:hover {
  background: var(--gray-200);
  border-color: var(--primary);
  color: var(--primary);
}

/* ========== СЕТКА КЛАССОВ ========== */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.class-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.class-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--primary-light);
}
.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.class-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--secondary);
}
.student-count {
  font-size: 0.8rem;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}
.class-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 2.5rem;
}
.student-chip {
  background: var(--gray-100);
  padding: 0.3rem 0.7rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  color: var(--gray-700);
}
.student-chip.more {
  background: var(--gray-200);
}
.empty-students {
  font-size: 0.8rem;
  color: var(--gray-400);
  font-style: italic;
}
.class-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-200);
  padding-top: 1rem;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn svg {
  display: block;
}
.icon-btn:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

/* ========== КНОПКА ДОБАВЛЕНИЯ ========== */
.add-class-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.btn-add {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.7rem 2rem;
  border-radius: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  border-radius: 1.5rem;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
}
.delete-modal {
  text-align: center;
}
.delete-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.delete-warning {
  font-size: 0.8rem;
  color: var(--danger);
  margin-top: 0.5rem;
}
.modal-content h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--gray-600);
}
.class-selectors {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.selector-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.selector-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-600);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-primary,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover {
  background: var(--primary-dark);
}
.btn-danger {
  background: var(--danger);
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
}
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}
.btn-secondary:hover {
  background: var(--gray-200);
}

/* ========== ТОСТ ========== */
.custom-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 380px;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
.custom-toast.success {
  border-left: 4px solid var(--success);
}
.custom-toast.success .toast-icon {
  color: var(--success);
}
.custom-toast.error {
  border-left: 4px solid var(--danger);
}
.custom-toast.error .toast-icon {
  color: var(--danger);
}
.toast-icon {
  flex-shrink: 0;
  padding-top: 2px;
}
.toast-content {
  flex: 1;
}
.toast-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}
.toast-message {
  font-size: 0.8125rem;
  color: var(--gray-600);
  line-height: 1.4;
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--gray-400);
  transition: color 0.2s;
}
.toast-close:hover {
  color: var(--gray-600);
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
body.dark-theme .stat-badge,
body.dark-theme .filters-row,
body.dark-theme .class-card,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .stat-value {
  color: var(--primary);
}
body.dark-theme .class-header h3 {
  color: var(--gray-200);
}
body.dark-theme .student-chip {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
</style>