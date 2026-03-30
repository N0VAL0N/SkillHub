<template>
  <div class="file-uploader">
    <div 
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'has-file': hasFile }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="handleFileSelect"
      />
      
      <div v-if="!hasFile" class="upload-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 22 8.00502 22C6.41281 22 4.88584 21.3658 3.76002 20.24C2.6342 19.1142 2 17.5872 2 15.995C2 14.4028 2.6342 12.8758 3.76002 11.75L12.33 3.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 8L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="upload-text">Нажмите или перетащите изображение</p>
        <p class="upload-hint">Поддерживаются форматы: JPG, PNG, GIF, WEBP</p>
      </div>
      
      <div v-else class="upload-preview">
        <img :src="previewUrl" alt="preview" class="preview-image" />
        <div class="preview-overlay">
          <button @click.stop="clearFile" class="remove-btn" title="Удалить">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-linecap="round"/>
            </svg>
          </button>
          <button @click.stop="replaceFile" class="replace-btn" title="Заменить">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4L16 4M23 4L23 11M23 4L16 11M1 20L8 20M1 20L1 13M1 20L8 13" stroke="currentColor" stroke-linecap="round"/>
              <path d="M3 12L6 9L9 12" stroke="currentColor" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div class="file-info" v-if="hasFile">
      <div class="file-name">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9M13 2L20 9M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>{{ fileName }}</span>
      </div>
      <div class="file-size">{{ formattedSize }}</div>
    </div>
    
    <div v-if="error" class="upload-error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12M12 16H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: [File, String],
    default: null
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  acceptedTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
});

const emit = defineEmits(['update:modelValue', 'clear']);

const fileInput = ref(null);
const isDragOver = ref(false);
const currentFile = ref(null);
const previewUrl = ref('');
const error = ref('');

const hasFile = computed(() => !!currentFile.value || !!props.modelValue);
const fileName = computed(() => {
  if (currentFile.value) return currentFile.value.name;
  if (typeof props.modelValue === 'string') {
    const parts = props.modelValue.split('/');
    return parts[parts.length - 1] || 'изображение';
  }
  return '';
});

const formattedSize = computed(() => {
  if (!currentFile.value) return '';
  const bytes = currentFile.value.size;
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
});

const validateFile = (file) => {
  if (!props.acceptedTypes.includes(file.type)) {
    error.value = `Неподдерживаемый формат. Разрешены: ${props.acceptedTypes.map(t => t.split('/')[1]).join(', ')}`;
    return false;
  }
  if (file.size > props.maxSize) {
    error.value = `Файл слишком большой. Максимальный размер: ${(props.maxSize / (1024 * 1024)).toFixed(0)} МБ`;
    return false;
  }
  error.value = '';
  return true;
};

const setFile = (file) => {
  if (!validateFile(file)) return;
  
  currentFile.value = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
  
  emit('update:modelValue', file);
};

const clearFile = () => {
  currentFile.value = null;
  previewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
  emit('update:modelValue', null);
  emit('clear');
};

const replaceFile = () => {
  triggerFileInput();
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) setFile(file);
};

const handleDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file) setFile(file);
};

// Если передан URL через modelValue (при загрузке сохранённого ответа)
watch(() => props.modelValue, (newVal) => {
  if (typeof newVal === 'string' && newVal.startsWith('http')) {
    previewUrl.value = newVal;
    currentFile.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.file-uploader {
  width: 100%;
}

/* ========== ОБЛАСТЬ ЗАГРУЗКИ ========== */
.upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--gray-50);
  position: relative;
  overflow: hidden;
}
.upload-area:hover {
  border-color: var(--primary);
  background: var(--gray-100);
}
.upload-area.drag-over {
  border-color: var(--primary);
  background: var(--primary-light);
}
.upload-area.has-file {
  padding: 0;
  border-color: var(--success);
  background: var(--gray-50);
}
.hidden-input {
  display: none;
}

/* ========== ПЛЕЙСХОЛДЕР ========== */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.upload-placeholder svg {
  color: var(--gray-400);
}
.upload-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-600);
}
.upload-hint {
  margin: 0;
  font-size: 0.7rem;
  color: var(--gray-400);
}

/* ========== ПРЕДПРОСМОТР ========== */
.upload-preview {
  position: relative;
  width: 100%;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
}
.preview-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}
.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.upload-preview:hover .preview-overlay {
  opacity: 1;
}

/* ========== КНОПКИ УПРАВЛЕНИЯ ========== */
.remove-btn,
.replace-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--gray-700);
}
.remove-btn:hover {
  background: var(--danger);
  color: white;
}
.replace-btn:hover {
  background: var(--primary);
  color: white;
}

/* ========== ИНФОРМАЦИЯ О ФАЙЛЕ ========== */
.file-info {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--gray-100);
  border-radius: 0.5rem;
}
.file-name {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--gray-600);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-size {
  color: var(--gray-400);
  flex-shrink: 0;
}

/* ========== ОШИБКИ ========== */
.upload-error {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .upload-area {
  background: var(--gray-800);
  border-color: var(--gray-600);
}
body.dark-theme .upload-area:hover {
  background: var(--gray-700);
  border-color: var(--primary);
}
body.dark-theme .upload-text {
  color: var(--gray-400);
}
body.dark-theme .file-info {
  background: var(--gray-700);
}
body.dark-theme .file-name {
  color: var(--gray-300);
}
</style>