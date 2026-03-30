<template>
  <div class="circle-progress" :style="{ width: size + 'px', height: size + 'px' }">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="8" />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="var(--primary)"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <div class="icon" v-if="icon">
      <img :src="icon" alt="icon" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, required: true, default: 0 },
  size: { type: Number, default: 80 },
  icon: { type: String, default: null }
})

const circumference = 2 * Math.PI * 45
const dashOffset = computed(() => circumference - (props.progress / 100) * circumference)
</script>

<style scoped>
.circle-progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: 100%;
  height: 100%;
}
.icon {
  position: absolute;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.icon img {
  width: 60%;
  height: 60%;
  object-fit: contain;
}
body.dark-theme .icon {
  background: var(--gray-800);
}
</style>