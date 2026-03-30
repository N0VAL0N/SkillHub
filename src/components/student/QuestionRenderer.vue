<template>
  <div class="question-renderer">
    <!-- Вопрос с выбором ответа -->
    <div v-if="question.type === 'choice'">
      <div class="question-text">{{ question.text }}</div>
      <div v-if="question.isMultiple" class="multiple-options">
        <label v-for="(opt, idx) in question.options" :key="idx" class="option custom-checkbox-label">
          <input type="checkbox" :value="idx" v-model="choiceModel" class="custom-checkbox-input" />
          <span class="custom-checkbox"></span>
          <span class="option-text">{{ opt }}</span>
        </label>
      </div>
      <div v-else class="single-options">
        <label v-for="(opt, idx) in question.options" :key="idx" class="option custom-radio-label">
          <input type="radio" :name="`q_${question.id}`" :value="idx" v-model="choiceModel" class="custom-radio-input" />
          <span class="custom-radio"></span>
          <span class="option-text">{{ opt }}</span>
        </label>
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

    <!-- Развёрнутый ответ (эссе, работа с текстом, план) -->
    <div v-else>
      <div class="question-text">{{ displayText }}</div>
      
      <!-- Поле для текстового ответа (без растягивания) -->
      <textarea 
        v-model="essayText" 
        rows="6" 
        placeholder="Введите развёрнутый ответ..." 
        class="essay-textarea"
        :style="{ resize: 'none' }"
      ></textarea>
      
      <!-- Загрузка файлов (только для части 2) -->
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
import { ref, computed, watch } from 'vue';
import FileUploader from './FileUploader.vue';
import CustomSelect from '@/components/ui/CustomSelect.vue';

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: [String, Array, Object, Number], default: null },
  allowAttachments: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'fileAttached']);

// Для choice
const choiceModel = computed({
  get: () => {
    const val = props.modelValue;
    if (props.question.isMultiple) {
      if (Array.isArray(val)) return val;
      if (typeof val === 'number') return [val];
      if (typeof val === 'string' && !isNaN(parseInt(val))) return [parseInt(val)];
      return [];
    } else {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && !isNaN(parseInt(val))) return parseInt(val);
      return null;
    }
  },
  set: (val) => emit('update:modelValue', val)
});

// Для short
const shortModel = computed({
  get: () => {
    const val = props.modelValue;
    return val !== null && val !== undefined ? String(val) : '';
  },
  set: (val) => emit('update:modelValue', val)
});

// Для essay — храним как объект { text, file }
const essayText = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue.text || '';
    }
    return props.modelValue || '';
  },
  set: (val) => {
    const current = getCurrentAnswerObject();
    current.text = val;
    emit('update:modelValue', current);
  }
});

const uploadedFile = ref(null);

const getCurrentAnswerObject = () => {
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return { ...props.modelValue };
  }
  return { text: props.modelValue || '' };
};

const clearFile = () => {
  const current = getCurrentAnswerObject();
  delete current.file;
  delete current.fileUrl;
  emit('update:modelValue', current);
  emit('fileAttached', { file: null, questionId: props.question.id });
};

// Следим за загрузкой файла
watch(uploadedFile, (newFile) => {
  if (newFile instanceof File) {
    const current = getCurrentAnswerObject();
    current.file = newFile;
    emit('update:modelValue', current);
    emit('fileAttached', { file: newFile, questionId: props.question.id });
  } else if (newFile === null) {
    clearFile();
  }
}, { deep: true });

// Для match
const leftItems = computed(() => props.question.pairs?.map(p => p.left) || []);
const rightItems = computed(() => props.question.pairs?.map(p => p.right) || []);

const leftSelectOptions = computed(() => {
  const options = [{ value: '', label: '— выберите —' }];
  leftItems.value.forEach(left => {
    options.push({ value: left, label: left });
  });
  return options;
});

const matchAnswers = computed({
  get: () => {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return props.modelValue;
    }
    return {};
  },
  set: (val) => emit('update:modelValue', val)
});

const updateMatchAnswer = (right, left) => {
  const newAnswers = { ...matchAnswers.value };
  if (left === '' || left === null || left === undefined) {
    delete newAnswers[right];
  } else {
    newAnswers[right] = left;
  }
  emit('update:modelValue', newAnswers);
};

const getLetter = (index) => String.fromCharCode(65 + index);

const displayText = computed(() => {
  return props.question.text || props.question.prompt || props.question.title || '';
});
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

.multiple-options, .single-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Кастомные чекбоксы */
.option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
  position: relative;
}

.option:hover {
  background: var(--gray-100);
}

.custom-checkbox-input,
.custom-radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-400);
  border-radius: 4px;
  background: white;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.custom-checkbox-label:hover .custom-checkbox {
  border-color: var(--primary);
}

.custom-checkbox-input:checked + .custom-checkbox {
  background: var(--primary);
  border-color: var(--primary);
  position: relative;
}

.custom-checkbox-input:checked + .custom-checkbox::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* Кастомные радио */
.custom-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-400);
  border-radius: 50%;
  background: white;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 0.1rem;
  position: relative;
}

.custom-radio-label:hover .custom-radio {
  border-color: var(--primary);
}

.custom-radio-input:checked + .custom-radio {
  border-color: var(--primary);
}

.custom-radio-input:checked + .custom-radio::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--primary);
  border-radius: 50%;
}

.option-text {
  flex: 1;
  line-height: 1.4;
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

.short-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.short-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}

.essay-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
  transition: all 0.2s;
}

.essay-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
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

body.dark-theme .option:hover {
  background: var(--gray-700);
}

body.dark-theme .match-left-item {
  background: var(--gray-700);
}

body.dark-theme .short-input,
body.dark-theme .essay-textarea {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: var(--gray-200);
}

body.dark-theme .custom-checkbox,
body.dark-theme .custom-radio {
  background: var(--gray-200);
  border-color: var(--gray-500);
}

body.dark-theme .custom-checkbox-input:checked + .custom-checkbox {
  background: var(--primary);
  border-color: var(--primary);
}

body.dark-theme .custom-radio-input:checked + .custom-radio {
  border-color: var(--primary);
}

body.dark-theme .custom-radio-input:checked + .custom-radio::after {
  background: var(--primary);
}
/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .question-renderer .question-text,
body.dark-theme .question-renderer .option-text,
body.dark-theme .question-renderer .match-left-item,
body.dark-theme .question-renderer .match-right-item span,
body.dark-theme .question-renderer .short-input,
body.dark-theme .question-renderer .essay-textarea,
body.dark-theme .question-renderer .custom-checkbox .option-text,
body.dark-theme .question-renderer .custom-radio .option-text {
  color: #ffffff !important;
}

body.dark-theme .question-renderer .short-input,
body.dark-theme .question-renderer .essay-textarea {
  background: var(--gray-700);
  border-color: var(--gray-600);
}

body.dark-theme .question-renderer .custom-checkbox .custom-checkbox,
body.dark-theme .question-renderer .custom-radio .custom-radio {
  background: var(--gray-700);
  border-color: var(--gray-500);
}
</style>