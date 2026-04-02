<template>
  <Modal :isOpen="isOpen" title="Заполните профиль" size="lg" @close="handleClose">
    <div class="migration-content">
      <div class="migration-icon">✏️</div>
      <h3>Дополните данные профиля</h3>
      <p>Для работы с платформой укажите недостающую информацию</p>
      
      <div class="missing-fields">
        <div v-for="field in missingFields" :key="field" class="field-row">
          <span class="field-icon">{{ getFieldIcon(field) }}</span>
          <span class="field-label">{{ getFieldLabel(field) }}</span>
          
          <input
            v-if="field === 'email'"
            v-model="formData.email"
            type="email"
            placeholder="Введите email"
            required
          />
          
          <input
            v-else-if="field === 'displayName'"
            v-model="formData.displayName"
            type="text"
            placeholder="Введите ваше имя"
            required
          />
        </div>
      </div>
      
      <div v-if="missingFields.includes('subjects')" class="subject-selection">
        <h4>Выберите предметы, которые изучаете</h4>
        <SubjectSelector
          v-model="formData.subjects"
          :showActions="false"
        />
      </div>
      
      <div class="migration-actions">
        <button class="btn-secondary" @click="handleSkip">Пропустить (заполню позже)</button>
        <button class="btn-primary" @click="handleSave" :disabled="!isValid">
          Сохранить
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import SubjectSelector from './SubjectSelector.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: ''
  },
  missingFields: {
    type: Array,
    default: () => []
  },
  currentData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['save', 'skip', 'close']);

const formData = ref({
  email: props.currentData.email || '',
  displayName: props.currentData.displayName || props.currentData.login || '',
  subjects: props.currentData.subjects || []
});

const isValid = computed(() => {
  if (props.missingFields.includes('email') && !formData.value.email) return false;
  if (props.missingFields.includes('email') && !formData.value.email.includes('@')) return false;
  if (props.missingFields.includes('displayName') && !formData.value.displayName) return false;
  return true;
});

const getFieldIcon = (field) => {
  const icons = {
    email: '📧',
    displayName: '👤',
    subjects: '📚'
  };
  return icons[field] || '📝';
};

const getFieldLabel = (field) => {
  const labels = {
    email: 'Email',
    displayName: 'Ваше имя',
    subjects: 'Предметы'
  };
  return labels[field] || field;
};

const handleSave = () => {
  emit('save', formData.value);
};

const handleSkip = () => {
  emit('skip');
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.migration-content {
  text-align: center;
}

.migration-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.migration-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: var(--gray-800);
}

.migration-content p {
  color: var(--gray-500);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.missing-fields {
  text-align: left;
  margin: 1.5rem 0;
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1rem;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  flex-wrap: wrap;
}

.field-row:last-child {
  border-bottom: none;
}

.field-icon {
  font-size: 1.25rem;
  width: 32px;
}

.field-label {
  width: 100px;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.field-row input {
  flex: 1;
  min-width: 180px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
}

.field-row input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}

.subject-selection {
  text-align: left;
  margin: 1.5rem 0;
}

.subject-selection h4 {
  margin: 0 0 1rem;
  color: var(--gray-700);
  font-size: 0.875rem;
  font-weight: 500;
}

.migration-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.6rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-600);
}

.btn-secondary:hover {
  background: var(--gray-100);
}

body.dark-theme .missing-fields {
  background: var(--gray-800);
}

body.dark-theme .field-label {
  color: var(--gray-300);
}

body.dark-theme .field-row input {
  background: var(--gray-800);
  border-color: var(--gray-600);
  color: white;
}

body.dark-theme .btn-secondary {
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .btn-secondary:hover {
  background: var(--gray-700);
}
</style>