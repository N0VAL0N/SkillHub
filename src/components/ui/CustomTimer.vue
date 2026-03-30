<template>
  <div class="custom-timer" :class="{ expired: expired, warning: warning }">
    <div class="timer-icon">⏱️</div>
    <div class="timer-display">
      <span class="timer-label">{{ label }}</span>
      <span class="timer-value">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialSeconds: { type: Number, default: 0 },
  label: { type: String, default: 'Осталось:' },
  autoStart: { type: Boolean, default: true },
  storageKey: { type: String, default: null }
});

const emit = defineEmits(['expired', 'tick']);

const secondsLeft = ref(props.initialSeconds);
const expired = ref(false);
const warning = ref(false);
let timerInterval = null;

const formattedTime = computed(() => {
  const hours = Math.floor(secondsLeft.value / 3600);
  const minutes = Math.floor((secondsLeft.value % 3600) / 60);
  const seconds = secondsLeft.value % 60;
  if (hours > 0) return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const loadFromStorage = () => {
  if (!props.storageKey) return false;
  const saved = localStorage.getItem(props.storageKey);
  if (saved) {
    try {
      const { remaining, expiresAt, startedAt } = JSON.parse(saved);
      if (expiresAt > Date.now()) { secondsLeft.value = remaining; return true; }
      localStorage.removeItem(props.storageKey);
    } catch(e) {}
  }
  return false;
};

const saveToStorage = () => {
  if (!props.storageKey) return;
  localStorage.setItem(props.storageKey, JSON.stringify({ remaining: secondsLeft.value, expiresAt: Date.now() + secondsLeft.value * 1000, startedAt: Date.now() }));
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--;
      emit('tick', secondsLeft.value);
      saveToStorage();
      if (secondsLeft.value <= 300 && secondsLeft.value > 0) warning.value = true;
      if (secondsLeft.value === 0) { expired.value = true; warning.value = false; emit('expired'); stopTimer(); localStorage.removeItem(props.storageKey); }
    }
  }, 1000);
};

const stopTimer = () => { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } };
const resetTimer = (newSeconds) => { secondsLeft.value = newSeconds; expired.value = false; warning.value = false; stopTimer(); if (props.autoStart && secondsLeft.value > 0) startTimer(); saveToStorage(); };
const getElapsedSeconds = () => {
  if (!props.storageKey) return 0;
  const saved = localStorage.getItem(props.storageKey);
  if (saved) { try { const { startedAt } = JSON.parse(saved); if (startedAt) return Math.floor((Date.now() - startedAt) / 1000); } catch(e) {} }
  return 0;
};

onMounted(() => { const hasSaved = loadFromStorage(); if (hasSaved && secondsLeft.value > 0) { if (props.autoStart) startTimer(); } else if (props.initialSeconds > 0 && props.autoStart) startTimer(); });
onUnmounted(() => stopTimer());

defineExpose({ resetTimer, stopTimer, startTimer, getRemaining: () => secondsLeft.value, getElapsed: getElapsedSeconds, isExpired: () => expired.value });
</script>

<style scoped>
.custom-timer { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--gray-100); padding: 0.5rem 1rem; border-radius: 2rem; font-family: monospace; font-size: 1rem; font-weight: 600; border: 1px solid var(--gray-200); }
.custom-timer.expired { background: rgba(239,68,68,0.1); border-color: var(--danger); color: var(--danger); }
.custom-timer.warning { background: rgba(245,158,11,0.2); border-color: var(--warning); color: var(--warning); animation: pulse 1s infinite; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
.timer-icon { font-size: 1.2rem; }
.timer-display { display: flex; align-items: baseline; gap: 0.5rem; }
.timer-label { font-size: 0.75rem; font-weight: normal; color: var(--gray-500); }
.timer-value { font-weight: 700; letter-spacing: 0.5px; }
body.dark-theme .custom-timer { background: var(--gray-700); border-color: var(--gray-600); }
</style>