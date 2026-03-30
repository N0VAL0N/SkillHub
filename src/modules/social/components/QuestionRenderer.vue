<template>
  <div class="question-renderer">
    <!-- Вопрос с выбором ответа (ЕГЭ формат: цифры) -->
    <div v-if="question.type === 'choice'">
      <div class="question-text">{{ question.text }}</div>
      
      <!-- График/диаграмма для задания 9 -->
      <div v-if="question.data && (question.data.type === 'bar' || question.data.type === 'pie' || question.data.type === 'line' || question.data.type === 'double_line')" class="chart-container">
        <ChartRenderer
          :type="question.data.type"
          :labels="question.data.labels"
          :datasets="getChartDatasets(question.data)"
        />
      </div>
      
      <!-- Варианты с номерами -->
      <div class="choice-options-list">
        <div v-for="(opt, idx) in question.options" :key="idx" class="choice-option">
          <span class="option-number">{{ idx + 1 }}.</span>
          <span class="option-text">{{ opt }}</span>
        </div>
      </div>
      
      <!-- Поле ввода цифр -->
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

    <!-- Задание на соответствие -->
    <div v-else-if="question.type === 'match'">
      <div class="question-text">{{ question.text }}</div>
      <div class="match-container">
        <div class="match-left">
          <div v-for="left in leftItems" :key="left" class="match-left-item">
            <span class="match-letter">{{ getLetter(leftItems.indexOf(left)) }}.</span>
            <span>{{ left }}</span>
          </div>
        </div>
        <div class="match-right">
          <div v-for="(right, idx) in rightItems" :key="right" class="match-right-item">
            <span class="match-number">{{ idx + 1 }}.</span>
            <CustomSelect
              :model-value="matchAnswers[right]"
              :options="leftSelectOptions"
              :placeholder="'— выберите —'"
              @update:model-value="(val) => updateMatchAnswer(right, val)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Короткий ответ -->
    <div v-else-if="question.type === 'short'">
      <div class="question-text">{{ question.text }}</div>
      <input 
        type="text" 
        v-model="shortModel" 
        placeholder="Введите ответ..." 
        class="short-input"
      />
    </div>

    <!-- Эссе -->
    <div v-else-if="question.type === 'essay'">
      <div class="question-text">{{ question.prompt || question.text }}</div>
      <textarea 
        v-model="essayText" 
        rows="6" 
        placeholder="Введите эссе..." 
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

    <!-- Работа с текстом (17-20) -->
    <div v-else-if="question.type === 'text_analysis'">
      <div class="question-text">{{ question.text }}</div>
      <div class="text-content">
        <p>{{ question.content }}</p>
      </div>
      <div v-if="question.question" class="question-item">
        <p class="question-text">{{ question.question }}</p>
        <textarea 
          v-model="essayText" 
          rows="4" 
          placeholder="Введите ответ..." 
          class="essay-textarea"
        ></textarea>
      </div>
    </div>

    <!-- График спроса/предложения (21) -->
    <div v-else-if="question.type === 'graph_analysis'">
      <div class="question-text">{{ question.title }}</div>
      
      <div v-if="question.data && (question.data.type === 'bar' || question.data.type === 'pie' || question.data.type === 'line' || question.data.type === 'double_line')" class="chart-container">
        <ChartRenderer
          :type="question.data.type"
          :labels="question.data.labels"
          :datasets="getChartDatasets(question.data)"
        />
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

    <!-- План (24) -->
    <div v-else-if="question.type === 'plan'">
      <div class="question-text">{{ question.title }}</div>
      <textarea 
        v-model="essayText" 
        rows="6" 
        placeholder="Составьте сложный план..." 
        class="essay-textarea"
      ></textarea>
    </div>

    <!-- Задача (22) -->
    <div v-else-if="question.type === 'task'">
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
      <div class="question-text">{{ question.title }}</div>
      <div class="task-content">
        <p><strong>Вопрос:</strong> {{ question.question }}</p>
        <textarea 
          v-model="essayText" 
          rows="4" 
          placeholder="Введите ответ со ссылкой на Конституцию..." 
          class="essay-textarea"
        ></textarea>
      </div>
    </div>

    <!-- Fallback -->
    <div v-else>
      <div class="question-text">{{ displayText }}</div>
      <textarea 
        v-model="essayText" 
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
import CustomSelect from '@shared/components/CustomSelect.vue'
import ChartRenderer from './ChartRenderer.vue'

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [String, Array, Object, Number], default: null },
  allowAttachments: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'fileAttached'])

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ГРАФИКОВ ==========
const getChartDatasets = (data) => {
  if (data.type === 'double_line') {
    return [
      { label: data.label1 || 'Показатель 1', data: data.values1 || data.values || [] },
      { label: data.label2 || 'Показатель 2', data: data.values2 || [] }
    ]
  }
  return [{ data: data.values || [], label: 'Значения' }]
}

// ========== CHOICE (цифровой ввод) ==========
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

// ========== ESSAY ==========
const essayText = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue.text || ''
    }
    return props.modelValue || ''
  },
  set: (val) => {
    const current = getCurrentAnswerObject()
    current.text = val
    emit('update:modelValue', current)
  }
})

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

// ========== MATCH ==========
const leftItems = computed(() => props.question.pairs?.map(p => p.left) || [])
const rightItems = computed(() => props.question.pairs?.map(p => p.right) || [])

const leftSelectOptions = computed(() => {
  const options = [{ value: '', label: '— выберите —' }]
  leftItems.value.forEach(left => {
    options.push({ value: left, label: left })
  })
  return options
})

const matchAnswers = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val)
})

const updateMatchAnswer = (right, left) => {
  const newAnswers = { ...matchAnswers.value }
  if (left === '' || left === null || left === undefined) {
    delete newAnswers[right]
  } else {
    newAnswers[right] = left
  }
  emit('update:modelValue', newAnswers)
}

// ========== GRAPH (21) ==========
const graphAnswers = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val)
})

const updateGraphAnswer = (index, value) => {
  const newAnswers = { ...graphAnswers.value }
  newAnswers[index] = value
  emit('update:modelValue', newAnswers)
}

// ========== TASK (22) ==========
const taskAnswers = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue
    }
    return {}
  },
  set: (val) => emit('update:modelValue', val)
})

const updateTaskAnswer = (index, value) => {
  const newAnswers = { ...taskAnswers.value }
  newAnswers[index] = value
  emit('update:modelValue', newAnswers)
}

const getLetter = (index) => String.fromCharCode(65 + index)
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

.match-container {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.match-left, .match-right {
  flex: 1;
  min-width: 200px;
}
.match-left-item {
  padding: 0.75rem;
  background: var(--gray-100);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.match-letter {
  font-weight: 600;
  color: var(--primary);
  min-width: 28px;
}
.match-right-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.match-number {
  font-weight: 600;
  color: var(--primary);
  min-width: 28px;
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
</style>