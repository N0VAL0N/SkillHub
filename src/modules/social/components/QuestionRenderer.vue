<template>
  <div class="question-renderer">
    <!-- Выбор ответа (цифры) -->
    <div v-if="question.type === 'choice'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание {{ question.ege_num }}</span>
      </div>
      <div class="question-text">{{ question.text }}</div>
      
      <!-- График/диаграмма для задания 9 -->
      <div v-if="question.data" class="chart-container">
        <div v-if="question.data.type === 'table'" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="col in question.data.columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in question.data.rows" :key="idx">
                <td class="row-label">{{ row }}</td>
                <td v-for="(val, colIdx) in question.data.values[idx]" :key="colIdx" class="data-cell">
                  {{ val }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="question.data.type !== 'double_line' && question.data.type !== 'grouped_bar'">
          <ChartRenderer
            :type="question.data.type"
            :labels="question.data.labels"
            :datasets="getChartDatasets(question.data)"
          />
        </div>
        <div v-else-if="question.data.type === 'double_line'">
          <ChartRenderer type="line" :chart-data="question.data" />
        </div>
        <div v-else-if="question.data.type === 'grouped_bar'">
          <ChartRenderer
            type="bar"
            :labels="question.data.labels"
            :datasets="getGroupedBarDatasets(question.data)"
          />
        </div>
      </div>
      
      <div class="choice-options-list">
        <div v-for="(opt, idx) in question.options" :key="idx" class="choice-option">
          <span class="option-number">{{ idx + 1 }}.</span>
          <span class="option-text">{{ opt }}</span>
        </div>
      </div>
      
      <div class="answer-input-wrapper">
        <label>Ответ:</label>
        <input
          type="text"
          :value="choiceInputValue"
          @input="updateChoiceInput"
          placeholder="Введите номера ответов (например: 1,3,5 или 135)"
          class="short-input"
        />
        <div v-if="choiceInputError" class="input-error">{{ choiceInputError }}</div>
        <div v-if="question.isMultiple" class="input-hint">Для множественного выбора укажите цифры через запятую или слитно</div>
      </div>
    </div>

    <!-- СООТВЕТСТВИЕ (3,6,13,15) -->
    <div v-else-if="question.type === 'match'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание {{ question.ege_num }}</span>
      </div>
      <div class="question-text">{{ question.text }}</div>
      
      <div class="match-layout">
        <div class="match-left-column">
          <div class="match-left-header">ПОЗИЦИИ</div>
          <div v-for="(leftItem, index) in question.leftItems" :key="index" class="match-left-row">
            <span class="match-letter">{{ getLetter(index) }}.</span>
            <span class="match-term">{{ leftItem }}</span>
          </div>
        </div>
        
        <div class="match-right-column">
          <div class="match-right-header">ВАРИАНТЫ ОТВЕТОВ</div>
          <div v-for="(option, idx) in question.optionsList" :key="idx" class="match-right-row">
            <span class="match-number">{{ idx + 1 }}.</span>
            <span class="match-definition">{{ option }}</span>
          </div>
        </div>
      </div>
      
      <div class="match-answer-area">
        <div class="match-answer-label">Ответ:</div>
        <div class="match-answer-inputs">
          <div v-for="(_, idx) in question.leftItems" :key="idx" class="match-answer-field">
            <span class="answer-letter">{{ getLetter(idx) }}</span>
            <input 
              type="text" 
              :value="matchAnswerSequence[idx] || ''"
              @input="updateMatchAnswerSequence(idx, $event.target.value)"
              placeholder="___"
              class="match-digit-input"
              maxlength="1"
            />
          </div>
        </div>
        <div class="match-answer-hint">Введите цифры в указанном порядке (например: 31232)</div>
      </div>
    </div>

    <!-- Короткий ответ -->
    <div v-else-if="question.type === 'short'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание {{ question.ege_num }}</span>
      </div>
      <div class="question-text">{{ question.text }}</div>
      <input 
        type="text" 
        v-model="shortModel" 
        placeholder="Введите ответ..." 
        class="short-input"
      />
    </div>

    <!-- График спроса/предложения (21) -->
    <div v-else-if="question.type === 'graph_analysis'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание 21</span>
      </div>
      <div class="question-text">{{ question.title }}</div>
      <div v-if="question.data && question.data.datasets" class="chart-container">
        <ChartRenderer :chart-data="question.data" type="line" />
      </div>
      <div v-else-if="question.data && question.data.scenario" class="graph-description">
        <p><strong>Описание графика:</strong></p>
        <p>{{ question.data.scenario }}</p>
        <p v-if="question.data.image_description">{{ question.data.image_description }}</p>
      </div>
      <div v-for="(q, idx) in question.questions" :key="idx" class="question-item">
        <p class="question-text">{{ q }}</p>
        <input 
          type="text" 
          :value="graphAnswers[idx] || ''"
          @input="updateGraphAnswer(idx, $event.target.value)"
          placeholder="Введите ответ..." 
          class="short-input"
        />
      </div>
    </div>

    <!-- Задача (22) -->
    <div v-else-if="question.type === 'task'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание 22</span>
      </div>
      <div class="question-text">{{ question.title }}</div>
      <div class="task-content">
        <p><strong>Ситуация:</strong> {{ question.situation }}</p>
        <div v-for="(q, idx) in question.questions" :key="idx" class="question-item">
          <p class="question-text">{{ q }}</p>
          <textarea 
            :value="taskAnswers[idx] || ''"
            @input="updateTaskAnswer(idx, $event.target.value)"
            rows="3" 
            placeholder="Введите ответ..." 
            class="essay-textarea"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Правовая задача (23) -->
    <div v-else-if="question.type === 'law_task'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание 23</span>
      </div>
      <div class="question-text">{{ question.title }}</div>
      <div class="task-content">
        <p><strong>Вопрос:</strong> {{ question.question }}</p>
        <textarea 
          v-model="lawTaskAnswer"
          rows="4" 
          placeholder="Введите ответ со ссылкой на Конституцию..." 
          class="essay-textarea"
          @input="updateLawTaskAnswer"
        ></textarea>
      </div>
    </div>

    <!-- План (24) -->
    <div v-else-if="question.type === 'plan'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание 24</span>
      </div>
      <div class="question-text">{{ question.title }}</div>
      <textarea 
        v-model="planAnswer"
        rows="6" 
        placeholder="Составьте сложный план..." 
        class="essay-textarea"
        @input="updatePlanAnswer"
      ></textarea>
    </div>

    <!-- Эссе (25) -->
    <div v-else-if="question.type === 'essay'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание 25</span>
      </div>
      <div class="question-text">{{ question.prompt || question.text }}</div>
      <textarea 
        v-model="essayAnswer"
        rows="6" 
        placeholder="Введите эссе..." 
        class="essay-textarea"
        @input="updateEssayAnswer"
      ></textarea>
      <div v-if="allowAttachments" class="file-attach-section">
        <div class="file-attach-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 22 8.00502 22C6.41281 22 4.88584 21.3658 3.76002 20.24C2.6342 19.1142 2 17.5872 2 15.995C2 14.4028 2.6342 12.8758 3.76002 11.75L12.33 3.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 8L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Прикрепить изображение (фото рукописного ответа)</span>
        </div>
        <FileUploader 
          v-model="uploadedFile"
          @clear="clearFile"
          :max-size="5 * 1024 * 1024"
        />
        <div class="attach-hint">
          <small>Вы можете написать ответ текстом или прикрепить фото. Если прикрепляете фото, текстовый ответ можно не заполнять.</small>
        </div>
      </div>
    </div>

    <!-- Работа с текстом (17-20) -->
    <div v-else-if="question.type === 'text_analysis'">
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание {{ question.ege_num }}</span>
      </div>
      
      <div class="text-analysis-header">
        <button 
          @click="toggleTextContent(question.ege_num)" 
          class="toggle-text-btn"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 12H20M12 4V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ showTextForQuestion[question.ege_num] ? '📖 Скрыть текст' : '📖 Показать текст' }}
        </button>
      </div>
      
      <div v-if="showTextForQuestion[question.ege_num]" class="text-content">
        <p>{{ question.content }}</p>
      </div>
      
      <div class="question-text">{{ question.text }}</div>
      
      <textarea 
        :value="textAnswers[question.ege_num]"
        @input="updateTextAnswer(question.ege_num, $event.target.value)"
        rows="5" 
        :placeholder="`Введите ответ на задание ${question.ege_num}...`" 
        class="essay-textarea"
      ></textarea>
    </div>

    <!-- Fallback -->
    <div v-else>
      <div class="question-badge-wrapper">
        <span class="question-badge">Задание</span>
      </div>
      <div class="question-text">{{ displayText }}</div>
      <textarea 
        :value="fallbackAnswer"
        @input="updateFallbackAnswer"
        rows="6" 
        placeholder="Введите развёрнутый ответ..." 
        class="essay-textarea"
      ></textarea>
      <div v-if="allowAttachments" class="file-attach-section">
        <div class="file-attach-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 22 8.00502 22C6.41281 22 4.88584 21.3658 3.76002 20.24C2.6342 19.1142 2 17.5872 2 15.995C2 14.4028 2.6342 12.8758 3.76002 11.75L12.33 3.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 8L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Прикрепить изображение (фото рукописного ответа)</span>
        </div>
        <FileUploader 
          v-model="uploadedFile"
          @clear="clearFile"
          :max-size="5 * 1024 * 1024"
        />
        <div class="attach-hint">
          <small>Вы можете написать ответ текстом или прикрепить фото. Если прикрепляете фото, текстовый ответ можно не заполнять.</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FileUploader from '@shared/components/FileUploader.vue'
import ChartRenderer from './ChartRenderer.vue'

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [String, Array, Object, Number], default: null },
  allowAttachments: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'fileAttached'])

const getChartDatasets = (data) => {
  if (data.type === 'double_line') return []
  if (data.type === 'grouped_bar') return []
  if (data.type === 'line') return [{ data: data.values || [], label: 'Значения' }]
  return [{ data: data.values || [], label: 'Значения' }]
}

const getGroupedBarDatasets = (data) => {
  const datasets = []
  if (data.values_2020 !== undefined) datasets.push({ label: data.label1 || '2020', data: data.values_2020 })
  if (data.values_2025 !== undefined) datasets.push({ label: data.label2 || '2025', data: data.values_2025 })
  return datasets
}

// ========== CHOICE ==========
const choiceInputValue = ref('')
const choiceInputError = ref('')

const normalizeChoiceInput = (input) => {
  if (!input) return []
  const digits = input.replace(/[^\d]/g, '')
  if (!digits) return []
  const indices = [...new Set(digits.split('').map(d => parseInt(d) - 1))]
  return indices.filter(i => i >= 0 && i < props.question.options?.length).sort((a,b) => a-b)
}

const updateChoiceInput = (e) => {
  const raw = e.target.value
  choiceInputValue.value = raw
  const parsed = normalizeChoiceInput(raw)
  
  const maxNum = props.question.options?.length
  const invalid = raw.replace(/[^\d]/g, '').split('').some(d => parseInt(d) > maxNum)
  if (invalid && raw.trim()) {
    choiceInputError.value = `Допустимые номера от 1 до ${maxNum}`
  } else {
    choiceInputError.value = ''
  }
  
  if (props.question.isMultiple) {
    emit('update:modelValue', parsed)
  } else {
    emit('update:modelValue', parsed.length > 0 ? parsed[0] : null)
  }
}

watch(() => props.modelValue, (val) => {
  if (val === undefined || val === null) {
    choiceInputValue.value = ''
    return
  }
  let indices = []
  if (props.question.isMultiple) {
    indices = Array.isArray(val) ? val : []
  } else {
    indices = typeof val === 'number' ? [val] : []
  }
  if (indices.length) {
    choiceInputValue.value = indices.map(i => i+1).join('')
  } else {
    choiceInputValue.value = ''
  }
}, { immediate: true })

// ========== SHORT ==========
const shortModel = computed({
  get: () => {
    const val = props.modelValue
    return val !== null && val !== undefined ? String(val) : ''
  },
  set: (val) => emit('update:modelValue', val)
})

// ========== FILE UPLOAD ==========
const uploadedFile = ref(null)

const getCurrentAnswerObject = () => {
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return { ...props.modelValue }
  }
  return { text: props.modelValue || '' }
}

const clearFile = () => {
  const current = getCurrentAnswerObject()
  delete current.file
  delete current.fileUrl
  emit('update:modelValue', current)
  emit('fileAttached', { file: null, questionId: props.question.id })
}

watch(uploadedFile, (newFile) => {
  if (newFile instanceof File) {
    const current = getCurrentAnswerObject()
    current.file = newFile
    emit('update:modelValue', current)
    emit('fileAttached', { file: newFile, questionId: props.question.id })
  } else if (newFile === null) {
    clearFile()
  }
}, { deep: true })

// ========== ESSAY (25) ==========
const essayAnswer = ref('')
watch(() => props.modelValue, (val) => {
  if (typeof val === 'string') {
    essayAnswer.value = val
  } else if (typeof val === 'object' && val !== null && val.text) {
    essayAnswer.value = val.text
  }
}, { immediate: true })

const updateEssayAnswer = (e) => {
  essayAnswer.value = e.target.value
  emit('update:modelValue', { text: essayAnswer.value, file: uploadedFile.value })
}

// ========== PLAN (24) ==========
const planAnswer = ref('')
watch(() => props.modelValue, (val) => {
  if (typeof val === 'string') {
    planAnswer.value = val
  }
}, { immediate: true })

const updatePlanAnswer = (e) => {
  planAnswer.value = e.target.value
  emit('update:modelValue', planAnswer.value)
}

// ========== LAW TASK (23) ==========
const lawTaskAnswer = ref('')
watch(() => props.modelValue, (val) => {
  if (typeof val === 'string') {
    lawTaskAnswer.value = val
  } else if (typeof val === 'object' && val !== null && val.text) {
    lawTaskAnswer.value = val.text
  }
}, { immediate: true })

const updateLawTaskAnswer = (e) => {
  lawTaskAnswer.value = e.target.value
  emit('update:modelValue', lawTaskAnswer.value)
}

// ========== FALLBACK ==========
const fallbackAnswer = ref('')
watch(() => props.modelValue, (val) => {
  if (typeof val === 'string') {
    fallbackAnswer.value = val
  }
}, { immediate: true })

const updateFallbackAnswer = (e) => {
  fallbackAnswer.value = e.target.value
  emit('update:modelValue', fallbackAnswer.value)
}

// ========== TEXT_ANALYSIS (17-20) ==========
const textAnswers = ref({ 17: '', 18: '', 19: '', 20: '' })
const showTextForQuestion = ref({ 17: false, 18: false, 19: false, 20: false })

watch(() => props.modelValue, (val) => {
  if (typeof val === 'string') {
    textAnswers.value = { 
      ...textAnswers.value, 
      [props.question.ege_num]: val 
    }
  } else if (typeof val === 'object' && val !== null) {
    textAnswers.value = {
      17: val[17] || '',
      18: val[18] || '',
      19: val[19] || '',
      20: val[20] || ''
    }
  }
}, { immediate: true, deep: true })

const updateTextAnswer = (num, value) => {
  textAnswers.value = { ...textAnswers.value, [num]: value }
  emit('update:modelValue', value)
}

const toggleTextContent = (num) => {
  showTextForQuestion.value = {
    ...showTextForQuestion.value,
    [num]: !showTextForQuestion.value[num]
  }
}

// ========== MATCH ==========
const leftItems = computed(() => props.question.leftItems || [])
const matchAnswerSequence = ref([])

watch(() => props.modelValue, (val) => {
  const length = leftItems.value.length
  if (Array.isArray(val) && val.length === length) {
    const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е']
    const obj = {}
    for (let i = 0; i < length; i++) {
      if (val[i] && val[i] !== '') obj[letters[i]] = val[i]
    }
    matchAnswerSequence.value = val.map(v => v || '')
    if (typeof props.modelValue !== 'object' || props.modelValue === null) {
      emit('update:modelValue', obj)
    }
  } else if (typeof val === 'string' && val.length === length) {
    const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е']
    const obj = {}
    const seq = val.split('')
    for (let i = 0; i < length; i++) {
      if (seq[i] && seq[i] !== '') obj[letters[i]] = seq[i]
    }
    matchAnswerSequence.value = seq
    emit('update:modelValue', obj)
  } else if (typeof val === 'object' && val !== null) {
    const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е']
    const seq = []
    for (let i = 0; i < length; i++) {
      const letter = letters[i]
      const digit = val[letter] || ''
      seq.push(digit)
    }
    matchAnswerSequence.value = seq
  } else {
    matchAnswerSequence.value = new Array(length).fill('')
  }
}, { immediate: true, deep: true })

const updateMatchAnswerSequence = (index, value) => {
  const newSeq = [...matchAnswerSequence.value]
  const lastChar = value.slice(-1)
  if (lastChar >= '1' && lastChar <= '9') {
    newSeq[index] = lastChar
  } else if (lastChar === '') {
    newSeq[index] = ''
  }
  matchAnswerSequence.value = newSeq
  
  const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е']
  const obj = {}
  for (let i = 0; i < newSeq.length; i++) {
    if (newSeq[i] && newSeq[i] !== '') obj[letters[i]] = newSeq[i]
  }
  emit('update:modelValue', obj)
}

const getLetter = (index) => String.fromCharCode(65 + index)

// ========== GRAPH (21) ==========
const graphAnswers = ref({})
watch(() => props.modelValue, (val) => {
  if (typeof val === 'object' && val !== null) {
    graphAnswers.value = val
  } else {
    graphAnswers.value = {}
  }
}, { immediate: true })

const updateGraphAnswer = (index, value) => {
  const newAnswers = { ...graphAnswers.value }
  newAnswers[index] = value
  graphAnswers.value = newAnswers
  emit('update:modelValue', newAnswers)
}

// ========== TASK (22) ==========
const taskAnswers = ref({})
watch(() => props.modelValue, (val) => {
  if (typeof val === 'object' && val !== null) {
    taskAnswers.value = val
  } else {
    taskAnswers.value = {}
  }
}, { immediate: true })

const updateTaskAnswer = (index, value) => {
  const newAnswers = { ...taskAnswers.value }
  newAnswers[index] = value
  taskAnswers.value = newAnswers
  emit('update:modelValue', newAnswers)
}

const displayText = computed(() => {
  return props.question.text || props.question.prompt || props.question.title || ''
})
</script>

<style scoped>
.question-renderer {
  margin-bottom: 1rem;
}

.question-text {
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--secondary);
}

.question-badge-wrapper {
  margin-bottom: 0.75rem;
}
.question-badge {
  display: inline-block;
  background: var(--primary);
  color: white;
  font-weight: bold;
  padding: 0.2rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
}

.choice-options-list {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.choice-option {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0;
}
.option-number {
  font-weight: 600;
  min-width: 28px;
  color: var(--primary);
}
.option-text {
  flex: 1;
}
.answer-input-wrapper {
  margin-top: 1rem;
}
.answer-input-wrapper label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.input-hint {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: var(--gray-500);
}
.input-error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--danger);
}

.short-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 1rem;
  resize: none;
}
.short-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230,126,34,0.1);
}

.essay-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
}
.essay-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230,126,34,0.1);
}

.table-container {
  margin: 1rem 0;
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-200);
  text-align: center;
}
.data-table th {
  background: var(--gray-100);
  font-weight: 600;
  color: var(--secondary);
}
.data-table .row-label {
  background: var(--gray-50);
  font-weight: 500;
  text-align: left;
}
.data-table .data-cell {
  font-weight: 500;
  color: var(--primary);
}

.match-layout {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.match-left-column,
.match-right-column {
  flex: 1;
  min-width: 280px;
}
.match-left-header,
.match-right-header {
  font-weight: 700;
  padding: 0.75rem;
  background: var(--gray-100);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
  color: var(--secondary);
  border-bottom: 2px solid var(--primary);
}
.match-left-row,
.match-right-row {
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  gap: 0.75rem;
}
.match-letter,
.match-number {
  font-weight: 700;
  min-width: 32px;
  color: var(--primary);
}
.match-term,
.match-definition {
  flex: 1;
  color: var(--gray-700);
  line-height: 1.4;
}
.match-answer-area {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
}
.match-answer-label {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--secondary);
}
.match-answer-inputs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.match-answer-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.answer-letter {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
}
.match-digit-input {
  width: 48px;
  height: 48px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  border: 2px solid var(--gray-300);
  border-radius: 0.5rem;
  background: white;
  transition: all 0.2s;
}
.match-digit-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230,126,34,0.2);
}
.match-answer-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-align: center;
  margin-top: 0.5rem;
}

.file-attach-section {
  margin-top: 1rem;
}
.file-attach-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}
.attach-hint {
  margin-top: 0.5rem;
  color: var(--gray-400);
  font-size: 0.7rem;
}

.text-content {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.text-analysis-header {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: flex-start;
}

.chart-container {
  margin: 1rem 0;
  background: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.question-item {
  margin-bottom: 1rem;
}
.task-content {
  background: var(--gray-50);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-top: 0.5rem;
}
.graph-description {
  background: var(--gray-50);
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.toggle-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-text-btn:hover {
  background: var(--gray-200);
}

body.dark-theme .match-left-item,
body.dark-theme .text-content,
body.dark-theme .task-content,
body.dark-theme .graph-description {
  background: var(--gray-700);
}
body.dark-theme .short-input,
body.dark-theme .essay-textarea {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-200);
}
body.dark-theme .question-text {
  color: #ffffff !important;
}
body.dark-theme .option-number {
  color: var(--primary);
}
body.dark-theme .option-text {
  color: var(--gray-300);
}
body.dark-theme .input-hint {
  color: var(--gray-500);
}
body.dark-theme .chart-container {
  background: var(--gray-800);
}
body.dark-theme .match-layout {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .match-left-header,
body.dark-theme .match-right-header {
  background: var(--gray-700);
  color: #ffffff;
}
body.dark-theme .match-left-row,
body.dark-theme .match-right-row {
  border-bottom-color: var(--gray-700);
}
body.dark-theme .match-term,
body.dark-theme .match-definition {
  color: var(--gray-300);
}
body.dark-theme .match-answer-area {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .match-digit-input {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}
body.dark-theme .data-table {
  background: var(--gray-800);
}
body.dark-theme .data-table th,
body.dark-theme .data-table td {
  border-color: var(--gray-700);
}
body.dark-theme .data-table th {
  background: var(--gray-700);
  color: #ffffff;
}
body.dark-theme .data-table .row-label {
  background: var(--gray-800);
  color: var(--gray-300);
}
body.dark-theme .data-table .data-cell {
  color: var(--primary);
}
body.dark-theme .toggle-text-btn {
  background: var(--gray-700);
  border-color: var(--gray-600);
  color: var(--gray-300);
}
body.dark-theme .toggle-text-btn:hover {
  background: var(--gray-600);
}
</style>