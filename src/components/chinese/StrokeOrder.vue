<template>
  <div class="stroke-order">
    <div v-if="characters.length > 0">
      <div class="characters-container" :style="{ gridTemplateColumns: `repeat(${characters.length}, 1fr)` }">
        <div
          v-for="(_, index) in characters"
          :key="index"
          :ref="(el) => setContainerRef(el, index)"
          class="stroke-canvas"
          :style="{ width: size + 'px', height: size + 'px' }"
          :class="{ 'active-char': currentIndex === index }"
        ></div>
      </div>
      <div class="stroke-controls">
        <button class="btn-outline" @click="playAll">Анимировать все</button>
      </div>
      <div class="progress-indicator" v-if="characters.length > 1">
        {{ currentIndex + 1 }} / {{ characters.length }}
      </div>
    </div>
    <div v-else class="hint-warning">Не удалось загрузить иероглифы</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import HanziWriter from 'hanzi-writer'  // ← правильный импорт для 3.x

const props = defineProps({
  character: { type: String, required: true },
  size: { type: Number, default: 200 }
})

const containerRefs = ref([])
const writers = ref([])
const currentIndex = ref(0)
const characters = computed(() => props.character.split(''))

function setContainerRef(el, index) {
  if (el && el instanceof HTMLElement) {
    containerRefs.value[index] = el
  } else {
    containerRefs.value[index] = null
  }
}

function destroyAllWriters() {
  writers.value.forEach(writer => {
    if (writer && typeof writer.destroy === 'function') writer.destroy()
  })
  writers.value = []
}

async function initWriters() {
  destroyAllWriters()
  await nextTick()

  for (let i = 0; i < characters.value.length; i++) {
    const container = containerRefs.value[i]
    if (!container) continue

    try {
      container.innerHTML = ''
      const writer = HanziWriter.create(container, characters.value[i], {
        width: props.size,
        height: props.size,
        padding: 5,
        strokeColor: '#333',
        showOutline: true,
        delayBetweenStrokes: 500,
        charDataLoader: (char, onComplete) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`)
            .then(response => response.json())
            .then(data => onComplete(data))
            .catch(() => onComplete({ strokes: [], medians: [] }))
        }
      })
      writers.value[i] = writer
    } catch (e) {
      console.error(`Failed to create writer for ${characters.value[i]}:`, e)
    }
  }
}

async function playAll() {
  for (let i = 0; i < writers.value.length; i++) {
    currentIndex.value = i
    const writer = writers.value[i]
    if (writer && typeof writer.animateCharacter === 'function') {
      await new Promise((resolve) => {
        writer.animateCharacter({ onComplete: resolve, delayBetweenStrokes: 500 })
      })
    }
  }
}

onMounted(async () => {
  await initWriters()
  setTimeout(() => playAll(), 100)
})

onUnmounted(() => destroyAllWriters())

watch(() => props.character, async () => {
  await initWriters()
  currentIndex.value = 0
  setTimeout(() => playAll(), 100)
})
</script>

<style scoped>
.stroke-order { text-align: center; }
.characters-container {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
  justify-items: center;
}
.stroke-canvas {
  margin: 0 auto;
  opacity: 0.5;
  transition: opacity 0.3s;
  background: var(--gray-100);
  border-radius: 0.75rem;
}
.stroke-canvas.active-char {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--primary);
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-outline:hover { background: var(--primary-light); }
.progress-indicator { color: var(--gray-500); font-size: 0.85rem; }
.hint-warning { color: var(--gray-500); text-align: center; padding: 1rem; }
body.dark-theme .stroke-canvas { background: var(--gray-700); }
</style>