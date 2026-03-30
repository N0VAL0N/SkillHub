<template>
  <TeacherLayout>
    <div class="classes-view">
      <div class="page-header">
        <h1>Классы</h1>
        <button @click="loadClasses" class="btn-refresh" :disabled="loading">
          {{ loading ? 'Обновление...' : 'Обновить' }}
        </button>
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
              <button @click.stop="removeStudentFromClass(cls, student.id)" class="remove-student" title="Убрать из класса">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
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

      <!-- Модалка создания/редактирования -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>{{ editingClass ? 'Редактировать класс' : 'Создать класс' }}</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Название класса (цифра + буква)</label>
              <div class="class-selectors">
                <div class="selector-group">
                  <CustomSelect v-model="selectedNumber" :options="numberOptions" placeholder="Номер" />
                </div>
                <div class="selector-group">
                  <CustomSelect v-model="selectedLetter" :options="letterOptions" placeholder="Буква" />
                </div>
              </div>
            </div>

            <!-- Список учеников класса -->
            <div v-if="editingClass" class="students-in-class">
              <label>Ученики класса</label>
              <div class="students-list">
                <div v-for="student in editingClass.students" :key="student.id" class="student-chip">
                  {{ student.displayName || student.login }}
                  <button @click="removeStudentFromClass(editingClass, student.id)" class="remove-student" title="Убрать">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
                <div v-if="editingClass.students.length === 0" class="empty-students">Нет учеников</div>
              </div>
              <button @click="openAddStudentModal(editingClass)" class="btn-outline-small mt-1">+ Добавить ученика</button>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveClass" class="btn-primary">Сохранить</button>
            <button @click="closeModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка добавления ученика -->
      <div v-if="showAddStudentModal" class="modal" @click.self="closeAddStudentModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Добавить ученика в класс {{ selectedClassForStudent?.name }}</h2>
            <button class="modal-close" @click="closeAddStudentModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Выберите ученика</label>
              <CustomSelect
                v-model="selectedStudentId"
                :options="availableStudentsOptions"
                placeholder="Выберите ученика"
              />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="addStudentToClass" class="btn-primary">Добавить</button>
            <button @click="closeAddStudentModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка удаления -->
      <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
        <div class="modal-content delete-modal">
          <div class="delete-icon">⚠️</div>
          <h2>Подтверждение удаления</h2>
          <p>Удалить класс <strong>{{ classToDelete?.name }}</strong>?</p>
          <p class="delete-warning">Ученики будут перемещены в категорию "Без класса".</p>
          <div class="modal-actions">
            <button @click="confirmDelete" class="btn-danger">Удалить</button>
            <button @click="closeDeleteModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Тост -->
      <div v-if="toast.visible" class="custom-toast" :class="toast.type">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
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
import { ref, computed, onMounted } from 'vue'
import { db, auth } from '@core/services/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, query, where } from 'firebase/firestore'
import TeacherLayout from '@core/layouts/TeacherLayout.vue'
import CustomSelect from '@shared/components/CustomSelect.vue'

const classes = ref([])
const students = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showAddStudentModal = ref(false)
const editingClass = ref(null)
const classToDelete = ref(null)
const selectedClassForStudent = ref(null)
const selectedStudentId = ref('')
const selectedNumber = ref('')
const selectedLetter = ref('')
const selectedClassFilter = ref('all')
const sortBy = ref('name')
const sortOrder = ref('asc')

const numberOptions = [
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' }
]
const letterOptions = [
  { value: 'А', label: 'А' }, { value: 'Б', label: 'Б' }, { value: 'В', label: 'В' },
  { value: 'Г', label: 'Г' }, { value: 'Д', label: 'Д' }, { value: 'Е', label: 'Е' },
  { value: 'И', label: 'И' }, { value: 'С', label: 'С' }, { value: 'Т', label: 'Т' },
  { value: 'Ф', label: 'Ф' }
]

const toast = ref({ visible: false, type: 'success', title: '', message: '' })

const showToast = (type, title, message) => {
  toast.value = { visible: true, type, title, message }
  setTimeout(() => (toast.value.visible = false), 3000)
}

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }]
  classes.value.forEach(cls => options.push({ value: cls.id, label: cls.name }))
  return options
})

const sortOptions = [
  { value: 'name', label: 'По названию' },
  { value: 'students', label: 'По количеству учеников' }
]

const totalStudents = computed(() => classes.value.reduce((sum, cls) => sum + cls.students.length, 0))

const filteredAndSortedClasses = computed(() => {
  let result = [...classes.value]
  if (selectedClassFilter.value !== 'all') {
    result = result.filter(c => c.id === selectedClassFilter.value)
  }
  result.sort((a, b) => {
    let valA, valB
    if (sortBy.value === 'name') {
      valA = a.name
      valB = b.name
    } else {
      valA = a.students.length
      valB = b.students.length
    }
    return sortOrder.value === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
  })
  return result
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const availableStudentsOptions = computed(() => {
  const currentIds = selectedClassForStudent.value?.students.map(s => s.id) || []
  return students.value
    .filter(s => !currentIds.includes(s.id))
    .map(s => ({ value: s.id, label: s.displayName || s.login || s.email }))
})

const loadClasses = async () => {
  loading.value = true
  const user = auth.currentUser
  if (!user) return

  try {
    // 1. Все ученики
    const usersSnap = await getDocs(collection(db, 'users'))
    students.value = usersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.role === 'student')

    // 2. Классы текущего учителя
    const classesSnap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', user.uid)))
    const classesMap = new Map()

    classesSnap.docs.forEach(doc => {
      const data = doc.data()
      classesMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        teacherId: data.teacherId,
        students: []
      })
    })

    // 3. Распределяем учеников
    students.value.forEach(s => {
      const classId = s.classId
      if (classId && classesMap.has(classId)) {
        classesMap.get(classId).students.push(s)
      }
    })

    classes.value = Array.from(classesMap.values())
  } catch (error) {
    console.error('Ошибка загрузки классов:', error)
    showToast('error', 'Ошибка', 'Не удалось загрузить классы')
  } finally {
    loading.value = false
  }
}

const updateAggregatedStats = async (classId, className) => {
  if (!classId) return
  try {
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'student')))
    const studentIds = studentsSnap.docs.map(d => d.id)
    const studentsCount = studentIds.length

    let totalScore = 0
    let totalSubmissions = 0
    const studentScores = []

    for (const studentId of studentIds) {
      const subsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', studentId), where('status', '==', 'graded')))
      let studentTotal = 0
      let studentCount = 0
      subsSnap.docs.forEach(sub => {
        studentTotal += sub.data().teacherGrade || 0
        studentCount++
      })
      if (studentCount > 0) {
        const avg = Math.round(studentTotal / studentCount)
        studentScores.push({ studentId, avgScore: avg, submissionsCount: studentCount })
        totalScore += studentTotal
        totalSubmissions += studentCount
      }
    }

    const avgClassScore = totalSubmissions > 0 ? Math.round(totalScore / totalSubmissions) : 0

    await setDoc(doc(db, 'aggregatedStats', classId), {
      className: className,
      studentsCount: studentsCount,
      avgScore: avgClassScore,
      completedTasksCount: totalSubmissions,
      studentScores: studentScores,
      updatedAt: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('Ошибка обновления статистики:', error)
  }
}

const removeStudentFromClass = async (cls, studentId) => {
  if (confirm(`Убрать ученика из класса ${cls.name}?`)) {
    try {
      await updateDoc(doc(db, 'users', studentId), { className: null, classId: null })
      showToast('success', 'Успешно', 'Ученик удалён из класса')
      await loadClasses()
    } catch (error) {
      showToast('error', 'Ошибка', 'Не удалось удалить ученика')
    }
  }
}

const openAddModal = () => {
  editingClass.value = null
  selectedNumber.value = ''
  selectedLetter.value = ''
  showModal.value = true
}

const openEditModal = (cls) => {
  editingClass.value = cls
  const match = cls.name.match(/^(\d+)([А-Я])$/)
  if (match) {
    selectedNumber.value = match[1]
    selectedLetter.value = match[2]
  } else {
    selectedNumber.value = ''
    selectedLetter.value = ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingClass.value = null
}

const openAddStudentModal = (cls) => {
  selectedClassForStudent.value = cls
  selectedStudentId.value = ''
  showAddStudentModal.value = true
}

const closeAddStudentModal = () => {
  showAddStudentModal.value = false
  selectedClassForStudent.value = null
  selectedStudentId.value = ''
}

const addStudentToClass = async () => {
  if (!selectedStudentId.value || !selectedClassForStudent.value) {
    showToast('error', 'Ошибка', 'Выберите ученика')
    return
  }
  try {
    const classId = selectedClassForStudent.value.id
    const className = selectedClassForStudent.value.name
    await updateDoc(doc(db, 'users', selectedStudentId.value), { className, classId })
    await updateAggregatedStats(classId, className)
    showToast('success', 'Успешно', 'Ученик добавлен в класс')
    closeAddStudentModal()
    await loadClasses()
  } catch (error) {
    showToast('error', 'Ошибка', 'Не удалось добавить ученика')
  }
}

const openDeleteModal = (cls) => {
  classToDelete.value = cls
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  classToDelete.value = null
}

const confirmDelete = async () => {
  if (!classToDelete.value) return
  try {
    for (const student of classToDelete.value.students) {
      await updateDoc(doc(db, 'users', student.id), { className: '', classId: null })
    }
    await deleteDoc(doc(db, 'classes', classToDelete.value.id))
    showToast('success', 'Успешно', `Класс ${classToDelete.value.name} удалён`)
    closeDeleteModal()
    await loadClasses()
  } catch (error) {
    showToast('error', 'Ошибка', 'Не удалось удалить класс')
  }
}

const saveClass = async () => {
  const user = auth.currentUser
  if (!user) return

  if (!selectedNumber.value || !selectedLetter.value) {
    showToast('error', 'Ошибка', 'Выберите номер и букву')
    return
  }
  const fullName = `${selectedNumber.value}${selectedLetter.value}`
  try {
    if (editingClass.value) {
      for (const student of editingClass.value.students) {
        await updateDoc(doc(db, 'users', student.id), { className: fullName, classId: editingClass.value.id })
      }
      await updateDoc(doc(db, 'classes', editingClass.value.id), { name: fullName, updatedAt: new Date() })
      await updateAggregatedStats(editingClass.value.id, fullName)
      showToast('success', 'Успешно', `Класс ${fullName} обновлён`)
    } else {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: fullName,
        teacherId: user.uid,
        createdAt: new Date()
      })
      await updateAggregatedStats(docRef.id, fullName)
      showToast('success', 'Успешно', `Класс ${fullName} создан`)
    }
    closeModal()
    await loadClasses()
  } catch (error) {
    showToast('error', 'Ошибка', 'Не удалось сохранить класс')
  }
}

onMounted(() => loadClasses())
</script>

<style scoped>
.classes-view {
  max-width: 1200px;
  margin: 0 auto;
}
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
.btn-refresh {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-refresh:disabled {
  opacity: 0.5;
}
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
.filters-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
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
}
.sort-order-btn {
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
}
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
}
.class-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
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
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.student-chip.more {
  background: var(--gray-200);
}
.remove-student {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  color: var(--gray-500);
}
.remove-student:hover {
  color: var(--danger);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
  border-radius: 1.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 60%;
}
.modal-large {
  max-width: 700px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h2 {
  margin: 0;
  color: var(--secondary);
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.modal-body {
  margin-bottom: 1rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.class-selectors {
  display: flex;
  gap: 1rem;
}
.selector-group {
  flex: 1;
}
.students-in-class {
  margin-top: 1rem;
}
.students-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.btn-outline-small {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.8rem;
}
.mt-1 {
  margin-top: 0.5rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn-primary, .btn-secondary, .btn-danger {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-secondary {
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  color: var(--gray-700);
}
.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
}
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
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
.custom-toast.success {
  border-left: 4px solid var(--success);
}
.custom-toast.error {
  border-left: 4px solid var(--danger);
}
.toast-icon svg {
  display: block;
}
.toast-content {
  flex: 1;
}
.toast-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.toast-message {
  font-size: 0.8rem;
  color: var(--gray-600);
}
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--gray-400);
}
body.dark-theme .stat-badge,
body.dark-theme .filters-row,
body.dark-theme .class-card,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .class-header h3 {
  color: white;
}
body.dark-theme .student-chip {
  background: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
</style>