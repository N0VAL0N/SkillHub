<template>
  <div class="quantity-selector">
    <button class="qty-btn" @click="decrement" :disabled="value <= 0 || disabled">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <span class="qty-value">{{ value }}</span>
    <button class="qty-btn" @click="increment" :disabled="value >= max || disabled">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  disabled: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const increment = () => {
  if (value.value < props.max && !props.disabled) {
    value.value++;
  }
};

const decrement = () => {
  if (value.value > 0 && !props.disabled) {
    value.value--;
  }
};
</script>

<style scoped>
.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.qty-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.qty-btn:hover:not(:disabled) {
  background: var(--gray-100);
  border-color: var(--primary);
}
.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.qty-value {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}
</style>