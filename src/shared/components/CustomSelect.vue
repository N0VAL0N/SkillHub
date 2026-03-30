<template>
  <div class="custom-select" :class="{ open: isOpen, disabled: disabled }">
    <div 
      class="select-trigger" 
      @click="toggleOpen"
      :class="{ 'has-value': modelValue && modelValue !== '' }"
    >
      <span class="select-value">
        <span v-if="selectedIcon" class="select-icon">{{ selectedIcon }}</span>
        {{ selectedLabel || placeholder }}
      </span>
      <svg 
        class="select-arrow" 
        :class="{ rotated: isOpen }"
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none"
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    
    <transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <div 
          v-for="option in options" 
          :key="option.value"
          class="select-option"
          :class="{ selected: modelValue === option.value }"
          @click="selectOption(option)"
        >
          <span v-if="option.icon" class="option-icon">{{ option.icon }}</span>
          <span>{{ option.label }}</span>
          <svg v-if="modelValue === option.value" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array,
    required: true,
    validator: (value) => value.every(opt => 'value' in opt && 'label' in opt)
  },
  placeholder: {
    type: String,
    default: 'Выберите...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue);
});

const selectedLabel = computed(() => selectedOption.value?.label || null);
const selectedIcon = computed(() => selectedOption.value?.icon || null);

const toggleOpen = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

const selectOption = (option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (!event.target.closest('.custom-select')) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  font-size: 0.875rem;
}
.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
}
.custom-select.open .select-trigger {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}
.select-trigger:hover {
  border-color: var(--gray-300);
}
.select-value {
  color: var(--gray-700);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.select-icon {
  font-size: 1rem;
}
.select-trigger.has-value .select-value {
  color: var(--gray-900);
  font-weight: 500;
}
.select-arrow {
  color: var(--gray-400);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.select-arrow.rotated {
  transform: rotate(180deg);
}
.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  max-height: 250px;
  overflow-y: auto;
}
.select-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--gray-700);
}
.option-icon {
  font-size: 1rem;
  width: 24px;
}
.select-option:hover {
  background: var(--gray-100);
}
.select-option.selected {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}
.select-option.selected svg {
  color: var(--primary);
  margin-left: auto;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
/* тёмная тема */
body.dark-theme .select-trigger {
  background: var(--gray-800);
  border-color: var(--gray-700);
  color: var(--gray-300);
}
body.dark-theme .select-value {
  color: var(--gray-300);
}
body.dark-theme .select-trigger.has-value .select-value {
  color: var(--gray-500);
}
body.dark-theme .select-dropdown {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .select-option {
  color: var(--gray-500);
}
body.dark-theme .select-option:hover {
  background: var(--gray-700);
}
body.dark-theme .select-option.selected {
  background: rgba(230, 126, 34, 0.2);
  color: var(--primary);
}
</style>