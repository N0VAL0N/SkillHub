<template>
  <TeacherLayout>
    <div class="exam-editor">
      <div class="page-header">
        <h1>{{ isEditing ? 'Редактировать' : 'Создать' }} {{ mode === 'exam' ? 'экзамен' : 'домашнее задание' }}</h1>
        <button @click="goBack" class="btn-back">Назад</button>
      </div>

      <div class="mode-switch">
        <button class="mode-btn" :class="{ active: mode === 'exam' }" @click="switchMode('exam')">Экзамен</button>
        <button class="mode-btn" :class="{ active: mode === 'homework' }" @click="switchMode('homework')">Домашнее задание</button>
      </div>

      <div v-if="mode === 'exam'" class="exam-form">
        <div class="form-group">
          <label>Название</label>
          <input v-model="exam.title" placeholder="Например: Итоговый экзамен по блоку 1" class="form-input" />
        </div>
        <div class="form-group">
          <label>Класс (для кого) — опционально</label>
          <CustomSelect v-model="exam.classId" :options="classOptions" placeholder="Выберите класс" />
        </div>
        <div class="form-group">
          <label>Блок</label>
          <CustomSelect v-model="exam.blockId" :options="blockOptions" placeholder="Выберите блок" />
        </div>
        <div class="form-group">
          <label>Срок сдачи (опционально)</label>
          <DatePicker v-model="exam.deadline" placeholder="Выберите дату и время" />
        </div>

        <div class="form-group timer-settings-group">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.enableTimer" />
            <span class="checkmark"></span>
            Ограничить время выполнения (экзамен)
          </label>
          <div v-if="exam.enableTimer" class="timer-select">
            <CustomSelect
              v-model="exam.timerMinutes"
              :options="timerOptions"
              placeholder="Выберите время"
            />
          </div>
        </div>

        <div class="section-title">Часть 2 (развёрнутый ответ)</div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.text.enabled" />
            <span class="checkmark"></span>
            Работа с текстом (17-20)
          </label>
          <div v-if="exam.part2.text.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.text.value" :options="textOptions" placeholder="Выберите текст" />
          </div>
        </div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.graph.enabled" />
            <span class="checkmark"></span>
            График спроса/предложения (21)
          </label>
          <div v-if="exam.part2.graph.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.graph.value" :options="graphOptions" placeholder="Выберите график" />
          </div>
        </div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.task.enabled" />
            <span class="checkmark"></span>
            Задача (22)
          </label>
          <div v-if="exam.part2.task.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.task.value" :options="taskOptions" placeholder="Выберите задачу" />
          </div>
        </div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.lawTask.enabled" />
            <span class="checkmark"></span>
            Правовая задача (23)
          </label>
          <div v-if="exam.part2.lawTask.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.lawTask.value" :options="lawTaskOptions" placeholder="Выберите ситуацию" />
          </div>
        </div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.plan.enabled" />
            <span class="checkmark"></span>
            План (24)
          </label>
          <div v-if="exam.part2.plan.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.plan.value" :options="planOptions" placeholder="Выберите тему" />
          </div>
        </div>

        <div class="part2-item">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="exam.part2.essay.enabled" />
            <span class="checkmark"></span>
            Эссе (25)
          </label>
          <div v-if="exam.part2.essay.enabled" class="part2-select">
            <CustomSelect v-model="exam.part2.essay.value" :options="essayOptions" placeholder="Выберите тему" />
          </div>
        </div>

        <div class="action-buttons">
          <button @click="generateExam" class="btn-generate">Сгенерировать экзамен</button>
          <button @click="regenerateExam" class="btn-generate" :disabled="!generatedExam">Сгенерировать заново</button>
        </div>
      </div>

      <div v-if="mode === 'homework'" class="homework-form">
        <!-- ... домашнее задание без изменений ... -->
      </div>

      <div v-if="currentQuestions.length" class="questions-preview">
        <div class="preview-header">
          <h2>Предпросмотр заданий ({{ currentQuestions.length }})</h2>
          <button @click="clearQuestions" class="btn-outline-primary small">Очистить</button>
        </div>
        <div v-for="(q, idx) in currentQuestions" :key="q.id" class="question-card">
          <div class="question-header">
            <div class="question-number">
              <span class="number-badge">{{ idx + 1 }}</span>
              <span class="question-type">{{ getTypeLabel(q.type) }}</span>
              <span v-if="q.ege_num" class="ege-num">№{{ q.ege_num }}</span>
            </div>
            <div class="question-actions">
              <button @click="openPreview(q)" class="icon-btn" title="Предпросмотр">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </button>
              <button @click="removeQuestion(idx)" class="icon-btn danger" title="Удалить">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7H20M10 11V16M14 11V16M6 7L7 19C7 19.5304 7.21071 20.0391 7.58579 20.4142C7.96086 20.7893 8.46957 21 9 21H15C15.5304 21 16.0391 20.7893 16.4142 20.4142C16.7893 20.0391 17 19.5304 17 19L18 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="question-text"><strong>Текст:</strong> {{ q.text || q.title || q.situation || q.prompt || q.question }}</div>
          <div v-if="q.type === 'choice' && q.data" class="details">
            <div><strong>Тип диаграммы:</strong> {{ q.data.type }}</div>
          </div>
          <div v-if="q.type === 'graph_analysis' && q.data" class="details">
            <div><strong>График:</strong> {{ q.title }}</div>
          </div>
        </div>
        <div class="add-question-section">
          <button @click="openAddQuestionModal" class="btn-outline-primary">➕ Добавить задание вручную</button>
        </div>
      </div>

      <div v-else class="empty-preview">
        <div class="empty-icon">📋</div>
        <p>Здесь появятся сгенерированные задания. Нажмите кнопку «Сгенерировать».</p>
      </div>

      <div class="form-actions">
        <button @click="saveExam" class="btn-primary">Сохранить задание</button>
        <button @click="goBack" class="btn-secondary">Отмена</button>
      </div>
    </div>

    <!-- Модалка предпросмотра -->
    <div v-if="previewQuestion" class="modal" @click.self="closePreview">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>Предпросмотр задания</h2>
          <button class="modal-close" @click="closePreview">✕</button>
        </div>
        <div class="modal-body">
          <QuestionRenderer
            :question="previewQuestion"
            :allowAttachments="false"
          />
        </div>
        <div class="modal-actions">
          <button @click="closePreview" class="btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Модалка для ручного добавления -->
    <div v-if="showAddModal" class="modal" @click.self="showAddModal = false">
      <div class="modal-content">
        <h2>Добавить задание вручную</h2>
        <div class="form-group">
          <label>Тип задания</label>
          <select v-model="manualQuestion.type" class="form-input">
            <option value="choice">Выбор ответа (choice)</option>
            <option value="match">Соответствие (match)</option>
            <option value="short">Короткий ответ (short)</option>
            <option value="essay">Эссе</option>
            <option value="plan">План</option>
            <option value="text_analysis">Работа с текстом</option>
            <option value="graph_analysis">График (21)</option>
            <option value="task">Задача (22)</option>
            <option value="law_task">Правовая задача (23)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Тема</label>
          <CustomSelect v-model="manualQuestion.topicId" :options="topicOptions" placeholder="Выберите тему" />
        </div>
        <div class="modal-actions">
          <button @click="addManualQuestion" class="btn-primary">Добавить</button>
          <button @click="showAddModal = false" class="btn-secondary">Отмена</button>
        </div>
      </div>
    </div>

    <div v-if="toast.visible" class="custom-toast" :class="toast.type">
      <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" @click="toast.visible = false">×</button>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db, auth } from '@core/services/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore'
import TeacherLayout from '@core/layouts/TeacherLayout.vue'
import CustomSelect from '@shared/components/CustomSelect.vue'
import DatePicker from '@shared/components/DatePicker.vue'
import QuantitySelector from '@shared/components/QuantitySelector.vue'
import QuestionRenderer from '@/modules/social/components/QuestionRenderer.vue'
import { useQuestionGenerator } from '@/modules/social/stores/questionGenerator'

const router = useRouter()
const route = useRoute()
const questionGenerator = useQuestionGenerator()

const isEditing = ref(false)
const examId = ref(null)
const mode = ref(route.query.type === 'homework' ? 'homework' : 'exam')

const classOptions = ref([])
const blockOptions = [
  { value: 1, label: 'Блок 1. Человек и общество' },
  { value: 2, label: 'Блок 2. Экономика' },
  { value: 3, label: 'Блок 3. Социальные отношения' },
  { value: 4, label: 'Блок 4. Политика' },
  { value: 5, label: 'Блок 5. Право' },
  { value: 'all', label: 'Реальный ЕГЭ (все блоки)' }
]
const timerOptions = [
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
  { value: 180, label: '3 часа' },
  { value: 210, label: '3.5 часа (ЕГЭ)' }
]
const topicOptions = ref([])
const textOptions = ref([])
const planOptions = ref([])
const essayOptions = ref([])
const taskOptions = ref([])
const lawTaskOptions = ref([])
const graphOptions = ref([])

const exam = ref({
  title: '',
  classId: '',
  blockId: 1,
  deadline: null,
  enableTimer: false,
  timerMinutes: 210,
  part2: {
    text: { enabled: false, value: '' },
    plan: { enabled: false, value: '' },
    task: { enabled: false, value: '' },
    lawTask: { enabled: false, value: '' },
    essay: { enabled: false, value: '' },
    graph: { enabled: false, value: '' }
  }
})

const homework = ref({
  title: '',
  classId: '',
  topicId: '',
  deadline: null,
  types: {
    choice: { enabled: true, count: 2 },
    match: { enabled: true, count: 1 },
    short: { enabled: true, count: 1 },
    essay: { enabled: true, count: 1, topicId: '' }
  }
})

const currentQuestions = ref([])
const generatedExam = ref(null)
const generatedHomework = ref(null)
const previewQuestion = ref(null)
const showAddModal = ref(false)
const manualQuestion = ref({ type: 'choice', topicId: '' })
const toast = ref({ visible: false, type: 'success', message: '' })

const showToast = (type, message) => {
  toast.value = { visible: true, type, message }
  setTimeout(() => toast.value.visible = false, 3000)
}

const getTypeLabel = (type) => {
  const labels = {
    choice: 'Выбор ответа',
    match: 'Соответствие',
    short: 'Короткий ответ',
    essay: 'Эссе',
    text_analysis: 'Работа с текстом',
    plan: 'План',
    task: 'Задача',
    law_task: 'Правовая задача',
    graph_analysis: 'График'
  }
  return labels[type] || type
}

const loadClasses = async () => {
  try {
    const classesSnap = await getDocs(collection(db, 'classes'))
    classOptions.value = classesSnap.docs.map(doc => ({ value: doc.id, label: doc.data().name }))
  } catch (error) {
    console.error('Ошибка загрузки классов:', error)
  }
}

const loadDynamicOptions = () => {
  if (questionGenerator.topicsMap) {
    topicOptions.value = Array.from(questionGenerator.topicsMap.values()).map(t => ({ value: t.topic_id, label: t.name }))
  }
  textOptions.value = questionGenerator.getTextsList(exam.value.blockId === 'all' ? null : exam.value.blockId)
  planOptions.value = questionGenerator.getPlanTopicsList(exam.value.blockId === 'all' ? null : exam.value.blockId)
  essayOptions.value = questionGenerator.getEssayTopicsList(exam.value.blockId === 'all' ? null : exam.value.blockId)
  taskOptions.value = questionGenerator.getTasksList(exam.value.blockId === 'all' ? null : exam.value.blockId)
  lawTaskOptions.value = questionGenerator.getLawTasksList()
  graphOptions.value = (questionGenerator.staticTasks21 || []).map(g => ({ value: g.id, label: g.title }))
}

watch(() => exam.value.blockId, () => {
  loadDynamicOptions()
})

const switchMode = (newMode) => {
  mode.value = newMode
  currentQuestions.value = []
  generatedExam.value = null
  generatedHomework.value = null
  if (newMode === 'exam') loadDynamicOptions()
}

const generateExam = () => {
  const generated = questionGenerator.generateFullExam(
    exam.value.blockId,
    exam.value.title || null,
    exam.value.classId || null,
    exam.value.deadline || null,
    exam.value.part2
  )
  if (generated) {
    generatedExam.value = generated
    currentQuestions.value = [...generated.questions]
    if (!exam.value.title) exam.value.title = generated.title
    showToast('success', 'Экзамен сгенерирован')
  } else {
    showToast('error', 'Не удалось сгенерировать экзамен')
  }
}

const regenerateExam = () => {
  generateExam()
}

const generateHomework = () => {
  if (!homework.value.topicId) {
    showToast('error', 'Выберите тему')
    return
  }
  const types = {
    choice: homework.value.types.choice.enabled ? homework.value.types.choice.count : 0,
    match: homework.value.types.match.enabled ? homework.value.types.match.count : 0,
    short: homework.value.types.short.enabled ? homework.value.types.short.count : 0,
    essay: homework.value.types.essay.enabled ? homework.value.types.essay.count : 0,
    essayTopicId: homework.value.types.essay.enabled ? homework.value.types.essay.topicId : null
  }
  const generated = questionGenerator.generateHomework(
    homework.value.topicId,
    homework.value.title || null,
    homework.value.classId || null,
    types,
    homework.value.deadline || null
  )
  if (generated) {
    generatedHomework.value = generated
    currentQuestions.value = [...generated.questions]
    if (!homework.value.title) homework.value.title = generated.title
    showToast('success', 'Домашнее задание сгенерировано')
  } else {
    showToast('error', 'Не удалось сгенерировать домашнее задание')
  }
}

const regenerateHomework = () => {
  generateHomework()
}

const clearQuestions = () => {
  if (confirm('Очистить все вопросы?')) {
    currentQuestions.value = []
    generatedExam.value = null
    generatedHomework.value = null
    showToast('info', 'Все вопросы удалены')
  }
}

const removeQuestion = (idx) => {
  if (confirm('Удалить этот вопрос?')) {
    currentQuestions.value.splice(idx, 1)
    showToast('info', 'Вопрос удалён')
  }
}

const openPreview = (question) => {
  previewQuestion.value = question
}

const closePreview = () => {
  previewQuestion.value = null
}

const openAddQuestionModal = () => {
  manualQuestion.value = { type: 'choice', topicId: '' }
  showAddModal.value = true
}

const addManualQuestion = () => {
  const { type, topicId } = manualQuestion.value
  let newQuestion = null

  if (type === 'choice' && topicId) {
    newQuestion = questionGenerator.generateTask2(topicId, 2)
  } else if (type === 'match' && topicId) {
    newQuestion = questionGenerator.generateMatch(3, topicId)
  } else if (type === 'short' && topicId) {
    newQuestion = questionGenerator.generateShort(topicId, 3)
  } else if (type === 'essay') {
    const randomTopic = questionGenerator.getRandomEssayTopic()
    if (randomTopic) newQuestion = randomTopic
  } else if (type === 'plan') {
    const topics = questionGenerator.getPlanTopicsList()
    if (topics.length) {
      newQuestion = questionGenerator.getPlanTopicById(topics[0].value)
    }
  } else if (type === 'text_analysis') {
    const texts = questionGenerator.getTextsList()
    if (texts.length) {
      newQuestion = questionGenerator.getTextById(texts[0].value)
    }
  } else if (type === 'graph_analysis') {
    const graphs = questionGenerator.staticTasks21 || []
    if (graphs.length) {
      newQuestion = graphs[0]
    }
  } else if (type === 'task') {
    const tasks = questionGenerator.tasks || []
    if (tasks.length) {
      newQuestion = tasks[0]
    }
  } else if (type === 'law_task') {
    const lawTasks = questionGenerator.lawTasks || []
    if (lawTasks.length) {
      newQuestion = lawTasks[0]
    }
  }

  if (newQuestion) {
    currentQuestions.value.push(newQuestion)
    showAddModal.value = false
    showToast('success', 'Задание добавлено')
  } else {
    showToast('error', 'Не удалось создать задание')
  }
}

const loadExam = async () => {
  try {
    const examDoc = await getDoc(doc(db, 'exams', examId.value))
    if (examDoc.exists()) {
      const data = examDoc.data()
      if (data.type === 'exam') {
        mode.value = 'exam'
        exam.value.title = data.title || ''
        exam.value.classId = data.classId || ''
        exam.value.blockId = data.blockId || 1
        exam.value.deadline = data.deadline || null
        exam.value.enableTimer = data.enableTimer === true
        exam.value.timerMinutes = data.timerMinutes || 210
        currentQuestions.value = [...(data.questions || [])]

        exam.value.part2 = {
          text: { enabled: false, value: '' },
          plan: { enabled: false, value: '' },
          task: { enabled: false, value: '' },
          lawTask: { enabled: false, value: '' },
          essay: { enabled: false, value: '' },
          graph: { enabled: false, value: '' }
        }

        if (data.questions) {
          const textQ = data.questions.find(q => q.type === 'text_analysis')
          if (textQ && textQ.title) {
            const found = textOptions.value.find(t => t.label === textQ.title)
            if (found) exam.value.part2.text = { enabled: true, value: found.value }
          }
          const planQ = data.questions.find(q => q.type === 'plan')
          if (planQ && planQ.title) {
            const found = planOptions.value.find(p => p.label === planQ.title)
            if (found) exam.value.part2.plan = { enabled: true, value: found.value }
          }
          const taskQ = data.questions.find(q => q.type === 'task')
          if (taskQ && taskQ.title) {
            const found = taskOptions.value.find(t => t.label === taskQ.title)
            if (found) exam.value.part2.task = { enabled: true, value: found.value }
          }
          const lawTaskQ = data.questions.find(q => q.type === 'law_task')
          if (lawTaskQ && lawTaskQ.title) {
            const found = lawTaskOptions.value.find(l => l.label === lawTaskQ.title)
            if (found) exam.value.part2.lawTask = { enabled: true, value: found.value }
          }
          const essayQ = data.questions.find(q => q.type === 'essay')
          if (essayQ && essayQ.title) {
            const found = essayOptions.value.find(e => e.label === essayQ.title)
            if (found) exam.value.part2.essay = { enabled: true, value: found.value }
          }
          const graphQ = data.questions.find(q => q.type === 'graph_analysis')
          if (graphQ && graphQ.title) {
            const found = graphOptions.value.find(g => g.label === graphQ.title)
            if (found) exam.value.part2.graph = { enabled: true, value: found.value }
          }
        }
      } else {
        mode.value = 'homework'
        homework.value.title = data.title || ''
        homework.value.classId = data.classId || ''
        homework.value.topicId = data.topicId || ''
        homework.value.deadline = data.deadline || null
        currentQuestions.value = [...(data.questions || [])]

        homework.value.types = {
          choice: { enabled: false, count: 0 },
          match: { enabled: false, count: 0 },
          short: { enabled: false, count: 0 },
          essay: { enabled: false, count: 0, topicId: '' }
        }

        if (data.questions) {
          const choiceCount = data.questions.filter(q => q.type === 'choice').length
          const matchCount = data.questions.filter(q => q.type === 'match').length
          const shortCount = data.questions.filter(q => q.type === 'short').length
          const essayQ = data.questions.find(q => q.type === 'essay')
          homework.value.types.choice = { enabled: choiceCount > 0, count: choiceCount }
          homework.value.types.match = { enabled: matchCount > 0, count: matchCount }
          homework.value.types.short = { enabled: shortCount > 0, count: shortCount }
          homework.value.types.essay = {
            enabled: essayQ !== undefined,
            count: essayQ ? 1 : 0,
            topicId: essayQ?.topicId || ''
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error)
    showToast('error', 'Не удалось загрузить задание')
  }
}

const saveExam = async () => {
  if (currentQuestions.value.length === 0) {
    showToast('error', 'Нет заданий для сохранения')
    return
  }
  const user = auth.currentUser
  if (!user) {
    showToast('error', 'Вы не авторизованы')
    return
  }

  const baseData = {
    title: (mode.value === 'exam' ? exam.value.title : homework.value.title) || 'Без названия',
    type: mode.value,
    questions: currentQuestions.value,
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user.uid
  }

  if (mode.value === 'exam' && exam.value.classId) {
    baseData.classId = exam.value.classId
  }
  if (mode.value === 'homework' && homework.value.classId) {
    baseData.classId = homework.value.classId
  }
  if (mode.value === 'exam' && exam.value.deadline) {
    baseData.deadline = exam.value.deadline
  }
  if (mode.value === 'homework' && homework.value.deadline) {
    baseData.deadline = homework.value.deadline
  }
  if (mode.value === 'exam') {
    baseData.blockId = exam.value.blockId
    baseData.enableTimer = exam.value.enableTimer === true
    baseData.timerMinutes = exam.value.enableTimer ? exam.value.timerMinutes : null
  } else if (homework.value.topicId) {
    baseData.topicId = homework.value.topicId
  }

  Object.keys(baseData).forEach(key => {
    if (baseData[key] === undefined || baseData[key] === null) {
      delete baseData[key]
    }
  })

  try {
    if (isEditing.value && examId.value) {
      await updateDoc(doc(db, 'exams', examId.value), baseData)
      showToast('success', 'Задание обновлено')
    } else {
      await addDoc(collection(db, 'exams'), baseData)
      showToast('success', 'Задание создано')
    }
    router.push('/teacher/exams')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    showToast('error', error.message || 'Не удалось сохранить задание')
  }
}

const goBack = () => {
  router.push('/teacher/exams')
}

onMounted(async () => {
  await loadClasses()
  questionGenerator.initialize()
  loadDynamicOptions()
  if (route.params.id) {
    isEditing.value = true
    examId.value = route.params.id
    await loadExam()
  }
})
</script>

<style scoped>
/* ========== ОСНОВНЫЕ СТИЛИ ========== */
.exam-editor { max-width: 1000px; margin: 0 auto; }

/* ========== ШАПКА ========== */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.page-header h1 { font-size: 1.8rem; margin: 0; color: var(--secondary); }
.btn-back { background: var(--primary); color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.btn-back:hover { background: var(--primary-dark); transform: translateY(-1px); }

/* ========== ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ ========== */
.mode-switch { display: flex; gap: 1rem; margin-bottom: 2rem; }
.mode-btn { flex: 1; padding: 0.75rem; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.mode-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

/* ========== ФОРМЫ ========== */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--gray-700); }
.form-input { width: 100%; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; transition: all 0.2s; }
.form-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px rgba(230,126,34,0.1); }

.timer-settings-group { border-top: 1px solid var(--gray-200); padding-top: 1rem; margin-top: 1rem; }
.timer-select { margin-top: 0.5rem; margin-left: 1.5rem; }

.section-title { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 1rem; color: var(--secondary); padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary); }
.part2-item { margin-bottom: 1rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.75rem; }
.part2-select { margin-top: 0.5rem; margin-left: 28px; }

.custom-checkbox { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; position: relative; padding-left: 28px; user-select: none; }
.custom-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
.checkmark { position: absolute; left: 0; height: 18px; width: 18px; background-color: #fff; border: 1px solid var(--gray-400); border-radius: 3px; transition: all 0.2s; }
.custom-checkbox:hover input ~ .checkmark { background-color: var(--gray-100); }
.custom-checkbox input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
.checkmark:after { content: ""; position: absolute; display: none; }
.custom-checkbox input:checked ~ .checkmark:after { display: block; left: 5px; top: 2px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

.homework-types { margin: 1rem 0; }
.type-item { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.type-item label { cursor: pointer; flex: 1; }
.essay-topic-select { width: 100%; margin-top: 0.5rem; }

.action-buttons { display: flex; gap: 1rem; margin: 1rem 0; }
.btn-generate { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.btn-generate:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
.btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

.questions-preview { margin-top: 2rem; border-top: 1px solid var(--gray-200); padding-top: 1rem; }
.preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.preview-header h2 { margin: 0; font-size: 1.3rem; color: var(--secondary); }
.question-card { background: var(--gray-50); border-radius: 0.75rem; padding: 1rem; margin-bottom: 1rem; transition: all 0.2s; }
.question-card:hover { box-shadow: var(--shadow); }
.question-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.question-number { display: flex; gap: 0.5rem; align-items: center; }
.number-badge { width: 28px; height: 28px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
.question-type { background: var(--gray-200); padding: 0.2rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; color: var(--gray-600); }
.ege-num { background: var(--primary-light); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; }
.icon-btn { background: none; border: none; cursor: pointer; padding: 0.3rem; border-radius: 0.3rem; transition: all 0.2s; color: var(--gray-500); }
.icon-btn:hover { background: var(--gray-200); }
.icon-btn.danger { color: var(--danger); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.1); }
.question-text { margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--gray-700); }
.details { margin-top: 0.5rem; font-size: 0.85rem; background: white; padding: 0.5rem; border-radius: 0.5rem; }
.add-question-section { text-align: center; margin-top: 1rem; }
.btn-outline-primary { background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-primary:hover { background: var(--primary-light); }
.btn-outline-primary.small { padding: 0.3rem 0.8rem; font-size: 0.8rem; }

.empty-preview { text-align: center; padding: 2rem; color: var(--gray-500); background: var(--gray-50); border-radius: 1rem; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

.form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); }
.btn-primary, .btn-secondary { padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
.btn-secondary { background: var(--gray-100); border: 1px solid var(--gray-200); color: var(--gray-700); }
.btn-secondary:hover { background: var(--gray-200); }

.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 1rem; padding: 2rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; }
.modal-large { max-width: 800px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h2 { margin: 0; color: var(--secondary); }
.modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
.modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }

.custom-toast { position: fixed; bottom: 20px; right: 20px; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: white; border-radius: 0.5rem; box-shadow: var(--shadow-lg); z-index: 1000; animation: slideInRight 0.3s ease; }
.custom-toast.success { border-left: 4px solid var(--success); }
.custom-toast.error { border-left: 4px solid var(--danger); }
.toast-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: 0.5rem; }
@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Тёмная тема */
body.dark-theme .form-input { background: var(--gray-800); border-color: var(--gray-600); color: var(--gray-200); }
body.dark-theme .form-group label { color: var(--gray-300); }
body.dark-theme .question-card { background: var(--gray-700); }
body.dark-theme .question-text { color: var(--gray-300); }
body.dark-theme .details { background: var(--gray-800); }
body.dark-theme .empty-preview { background: var(--gray-700); }
body.dark-theme .modal-content { background: var(--gray-800); border: 1px solid var(--gray-700); }
body.dark-theme .custom-toast { background: var(--gray-800); }
</style>