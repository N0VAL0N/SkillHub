<template>
  <TeacherLayout>
    <div class="students-view">
      <div class="page-header">
        <h1>Ученики</h1>
        <button @click="loadStudents" class="btn-refresh" :disabled="loading">
          {{ loading ? 'Обновление...' : 'Обновить' }}
        </button>
      </div>

      <div class="students-stats">
        <div class="stat-badge">
          <span class="stat-value">{{ students.length }}</span>
          <span class="stat-label">Всего учеников</span>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-item">
          <label>Фильтр по классу:</label>
          <CustomSelect
            v-model="classFilter"
            :options="classFilterOptions"
            placeholder="Все классы"
          />
        </div>
        <div class="filter-item">
          <label>Сортировка:</label>
          <CustomSelect
            v-model="sortBy"
            :options="sortOptions"
            placeholder="По имени"
          />
        </div>
        <div class="filter-item sort-order">
          <label>Порядок:</label>
          <button @click="toggleSortOrder" class="sort-order-btn">
            {{ sortOrder === 'asc' ? '↑ По возрастанию' : '↓ По убыванию' }}
          </button>
        </div>
      </div>

      <div class="students-list">
        <div v-for="student in filteredAndSortedStudents" :key="student.id" class="student-card">
          <div class="student-avatar">
            {{ getDisplayName(student).charAt(0).toUpperCase() }}
          </div>
          <div class="student-info">
            <h3>{{ getDisplayName(student) }}</h3>
            <p>{{ student.email || '—' }}</p>
            <div class="student-meta">
              <span class="class-badge">{{ student.className || 'Без класса' }}</span>
              <span class="date-badge">{{ formatDate(student.createdAt) }}</span>
            </div>
          </div>
          <div class="student-actions">
            <button @click="openEditNameModal(student)" class="icon-btn" title="Редактировать имя">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M15 5L19 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button @click="openClassModal(student)" class="icon-btn" title="Переместить в класс">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <path d="M12 15V21M8 18H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button @click="openDeleteModal(student)" class="icon-btn danger" title="Удалить">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7H20M10 11V16M14 11V16M6 7L7 19C7 19.5304 7.21071 20.0391 7.58579 20.4142C7.96086 20.7893 8.46957 21 9 21H15C15.5304 21 16.0391 20.7893 16.4142 20.4142C16.7893 20.0391 17 19.5304 17 19L18 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredStudents.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Нет учеников</h3>
        <p>Добавьте первого ученика</p>
      </div>

      <div class="add-student-section">
        <button class="btn-add" @click="openAddModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Добавить ученика
        </button>
        <button class="btn-add" @click="openCreateClassModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          Создать класс
        </button>
      </div>

      <!-- Модалка редактирования имени -->
      <div v-if="showEditNameModal" class="modal" @click.self="closeEditNameModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Редактировать имя ученика</h2>
            <button class="modal-close" @click="closeEditNameModal">✕</button>
          </div>
          <div class="modal-body">
            <p class="student-login">Логин: <strong>{{ editingStudent?.login }}</strong></p>
            <div class="form-group">
              <label>Отображаемое имя (только для вас):</label>
              <input v-model="editingDisplayName" type="text" class="form-input" placeholder="Например: Иванов Иван" />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveDisplayName" class="btn-primary">Сохранить</button>
            <button @click="closeEditNameModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка добавления ученика -->
      <div v-if="showAddModal" class="modal" @click.self="closeAddModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Добавить ученика</h2>
            <button class="modal-close" @click="closeAddModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Логин</label>
              <input v-model="studentForm.login" type="text" class="form-input" placeholder="Логин" />
            </div>
            <div class="form-group">
              <label>Пароль</label>
              <input v-model="studentForm.password" type="password" class="form-input" placeholder="Пароль" />
            </div>
            <div class="form-group">
              <label>Класс (опционально)</label>
              <CustomSelect
                v-model="studentForm.className"
                :options="classSelectOptions"
                placeholder="Выберите класс"
              />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveStudent" class="btn-primary">Сохранить</button>
            <button @click="closeAddModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка для выбора класса -->
      <div v-if="showClassModal" class="modal" @click.self="closeClassModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Переместить ученика в класс</h2>
            <button class="modal-close" @click="closeClassModal">✕</button>
          </div>
          <div class="modal-body">
            <p class="student-name">{{ getDisplayName(selectedStudent) }}</p>
            <div class="form-group">
              <label>Выберите класс</label>
              <CustomSelect
                v-model="selectedClassName"
                :options="classSelectOptions"
                placeholder="Выберите класс"
              />
            </div>
          </div>
          <div class="modal-actions">
            <button @click="moveToClass" class="btn-primary">Переместить</button>
            <button @click="closeClassModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка создания класса -->
      <div v-if="showCreateClassModal" class="modal" @click.self="closeCreateClassModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Создать класс</h2>
            <button class="modal-close" @click="closeCreateClassModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="class-selectors">
              <div class="selector-group">
                <label>Номер класса</label>
                <CustomSelect v-model="newClassNumber" :options="numberOptions" placeholder="Выберите номер" />
              </div>
              <div class="selector-group">
                <label>Буква</label>
                <CustomSelect v-model="newClassLetter" :options="letterOptions" placeholder="Выберите букву" />
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="createClass" class="btn-primary">Создать</button>
            <button @click="closeCreateClassModal" class="btn-secondary">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка подтверждения удаления -->
      <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
        <div class="modal-content delete-modal">
          <div class="delete-icon">⚠️</div>
          <h2>Подтверждение удаления</h2>
          <p>Вы действительно хотите удалить ученика <strong>{{ getDisplayName(studentToDelete) }}</strong>?</p>
          <p class="delete-warning">Это действие нельзя отменить. Все данные ученика будут потеряны.</p>
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
import { auth, db } from '@core/services/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import TeacherLayout from '@core/layouts/TeacherLayout.vue'
import CustomSelect from '@shared/components/CustomSelect.vue'
import { useLocalStudentName } from '@core/composables/useLocalStudentName'
import { formatDate } from '@core/utils/dateHelpers'

const students = ref([])
const classes = ref([])
const loading = ref(false)
const showEditNameModal = ref(false)
const showAddModal = ref(false)
const showClassModal = ref(false)
const showCreateClassModal = ref(false)
const showDeleteModal = ref(false)
const editingStudent = ref(null)
const editingDisplayName = ref('')
const studentToDelete = ref(null)
const selectedStudent = ref(null)
const selectedClassName = ref('')
const studentForm = ref({ login: '', password: '', className: '' })
const classFilter = ref('all')
const sortBy = ref('displayName')
const sortOrder = ref('asc')
const teacherUid = auth.currentUser?.uid

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
const newClassNumber = ref('')
const newClassLetter = ref('')

const { getStudentName, setStudentName } = useLocalStudentName()
const toast = ref({ visible: false, type: 'success', title: '', message: '' })

const showToast = (type, title, message) => {
  toast.value = { visible: true, type, title, message }
  setTimeout(() => (toast.value.visible = false), 3000)
}

const getDisplayName = (student) => {
  if (teacherUid) {
    const localName = getStudentName(teacherUid, student.id)
    if (localName) return localName
  }
  return student.login || student.displayName || 'Без имени'
}

const classFilterOptions = computed(() => {
  const options = [{ value: 'all', label: 'Все классы' }]
  const uniqueClasses = new Set()
  students.value.forEach(s => { if (s.className) uniqueClasses.add(s.className) })
  Array.from(uniqueClasses).sort().forEach(cls => options.push({ value: cls, label: cls }))
  return options
})

const classSelectOptions = computed(() => {
  const options = [{ value: '', label: 'Без класса' }]
  classes.value.forEach(cls => options.push({ value: cls.name, label: cls.name }))
  return options
})

const sortOptions = [
  { value: 'displayName', label: 'По имени' },
  { value: 'class', label: 'По классу' },
  { value: 'date', label: 'По дате регистрации' }
]

const filteredAndSortedStudents = computed(() => {
  let result = [...students.value]
  if (classFilter.value !== 'all') {
    result = result.filter(s => s.className === classFilter.value)
  }
  result.sort((a, b) => {
    let valA, valB
    switch (sortBy.value) {
      case 'displayName':
        valA = getDisplayName(a).toLowerCase()
        valB = getDisplayName(b).toLowerCase()
        break
      case 'class':
        valA = a.className || ''
        valB = b.className || ''
        break
      case 'date':
        valA = a.createdAt?.toDate?.() || new Date(0)
        valB = b.createdAt?.toDate?.() || new Date(0)
        break
      default:
        valA = getDisplayName(a).toLowerCase()
        valB = getDisplayName(b).toLowerCase()
    }
    return sortOrder.value === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
  })
  return result
})

const filteredStudents = computed(() => filteredAndSortedStudents.value)

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const generateFakeEmail = () => `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}@egepro.local`

const loadStudents = async () => {
  loading.value = true
  try {
    const querySnapshot = await getDocs(collection(db, 'users'))
    students.value = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'student')
  } catch (error) {
    console.error('Ошибка загрузки учеников:', error)
    showToast('error', 'Ошибка', 'Не удалось загрузить учеников')
  } finally {
    loading.value = false
  }
}

const loadClasses = async () => {
  try {
    const classesSnap = await getDocs(collection(db, 'classes'))
    classes.value = classesSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }))
  } catch (error) {
    console.error('Ошибка загрузки классов:', error)
  }
}

const openEditNameModal = (student) => {
  editingStudent.value = student
  editingDisplayName.value = getDisplayName(student)
  showEditNameModal.value = true
}

const closeEditNameModal = () => {
  showEditNameModal.value = false
  editingStudent.value = null
  editingDisplayName.value = ''
}

const saveDisplayName = () => {
  if (editingStudent.value && teacherUid) {
    setStudentName(teacherUid, editingStudent.value.id, editingDisplayName.value.trim() || null)
    closeEditNameModal()
    showToast('success', 'Успешно', 'Имя сохранено')
  }
}

const openAddModal = () => {
  studentForm.value = { login: '', password: '', className: '' }
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  studentForm.value = { login: '', password: '', className: '' }
}

const openClassModal = (student) => {
  selectedStudent.value = student
  selectedClassName.value = student.className || ''
  showClassModal.value = true
}

const closeClassModal = () => {
  showClassModal.value = false
  selectedStudent.value = null
  selectedClassName.value = ''
}

const openCreateClassModal = () => {
  newClassNumber.value = ''
  newClassLetter.value = ''
  showCreateClassModal.value = true
}

const closeCreateClassModal = () => {
  showCreateClassModal.value = false
  newClassNumber.value = ''
  newClassLetter.value = ''
}

const openDeleteModal = (student) => {
  studentToDelete.value = student
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  studentToDelete.value = null
}

const confirmDelete = async () => {
  if (!studentToDelete.value) return
  try {
    await deleteDoc(doc(db, 'users', studentToDelete.value.id))
    showToast('success', 'Успешно', `Ученик удалён`)
    closeDeleteModal()
    await loadStudents()
  } catch (error) {
    console.error('Ошибка удаления:', error)
    showToast('error', 'Ошибка', 'Не удалось удалить ученика')
  }
}

const saveStudent = async () => {
  if (!studentForm.value.login.trim()) {
    showToast('error', 'Ошибка', 'Введите логин')
    return
  }
  if (studentForm.value.login.length < 3) {
    showToast('error', 'Ошибка', 'Логин должен быть не менее 3 символов')
    return
  }
  if (studentForm.value.password.length < 6) {
    showToast('error', 'Ошибка', 'Пароль должен быть не менее 6 символов')
    return
  }

  try {
    const q = query(collection(db, 'users'), where('login', '==', studentForm.value.login.trim()))
    const existing = await getDocs(q)
    if (!existing.empty) {
      showToast('error', 'Ошибка', 'Логин уже занят')
      return
    }

    const fakeEmail = generateFakeEmail()
    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, studentForm.value.password)
    const uid = userCredential.user.uid

    await addDoc(collection(db, 'users'), {
      uid,
      login: studentForm.value.login.trim(),
      role: 'student',
      className: studentForm.value.className || null,
      classId: studentForm.value.className ? classes.value.find(c => c.name === studentForm.value.className)?.id : null,
      createdAt: new Date()
    })

    showToast('success', 'Успешно', `Ученик ${studentForm.value.login} добавлен`)
    closeAddModal()
    await loadStudents()
    await loadClasses()
  } catch (error) {
    console.error('Ошибка:', error)
    showToast('error', 'Ошибка', error.message)
  }
}

const moveToClass = async () => {
  if (!selectedStudent.value) return
  try {
    const classObj = classes.value.find(c => c.name === selectedClassName.value)
    await updateDoc(doc(db, 'users', selectedStudent.value.id), {
      className: selectedClassName.value || null,
      classId: classObj?.id || null
    })
    showToast('success', 'Успешно', `Ученик перемещён в класс ${selectedClassName.value || 'без класса'}`)
    closeClassModal()
    await loadStudents()
  } catch (error) {
    console.error('Ошибка:', error)
    showToast('error', 'Ошибка', 'Не удалось переместить ученика')
  }
}

const createClass = async () => {
  if (!newClassNumber.value || !newClassLetter.value) {
    showToast('error', 'Ошибка', 'Выберите номер и букву класса')
    return
  }
  const className = `${newClassNumber.value}${newClassLetter.value}`
  const existing = classes.value.find(c => c.name === className)
  if (existing) {
    showToast('error', 'Ошибка', `Класс ${className} уже существует`)
    return
  }
  try {
    await addDoc(collection(db, 'classes'), {
      name: className,
      teacherId: teacherUid,
      createdAt: new Date()
    })
    showToast('success', 'Успешно', `Класс ${className} создан`)
    closeCreateClassModal()
    await loadClasses()
  } catch (error) {
    console.error('Ошибка:', error)
    showToast('error', 'Ошибка', 'Не удалось создать класс')
  }
}

onMounted(async () => {
  await loadStudents()
  await loadClasses()
})
</script>

<style scoped>
.students-view {
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
.students-stats {
  margin-bottom: 2rem;
}
.stat-badge {
  background: white;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  text-align: center;
  width: fit-content;
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
.students-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}
.student-card {
  background: white;
  border-radius: 1rem;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
}
.student-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.student-avatar {
  width: 52px;
  height: 52px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
}
.student-info {
  flex: 1;
}
.student-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  color: var(--secondary);
}
.student-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-500);
}
.student-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.class-badge, .date-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.7rem;
  border-radius: 1rem;
  background: var(--gray-100);
  color: var(--gray-600);
}
.student-actions {
  display: flex;
  gap: 0.5rem;
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
.add-student-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
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
  width: 90%;
  max-width: 450px;
  height: 200;
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
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
}
.class-selectors {
  display: flex;
  gap: 1rem;
}
.selector-group {
  flex: 1;
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
.modal-actions {
  display: flex;
  gap: 1rem;
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
body.dark-theme .student-card,
body.dark-theme .empty-state,
body.dark-theme .modal-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .student-info h3 {
  color: #ffffff;
}
body.dark-theme .class-badge,
body.dark-theme .date-badge {
  background: var(--gray-700);
  color: var(--gray-400);
}
body.dark-theme .custom-toast {
  background: var(--gray-800);
}
</style>