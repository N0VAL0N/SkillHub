<template>
  <div class="character-drawing">
    <div class="drawing-header" v-if="word">
      <div class="target-char">{{ word.simplified }}</div>
      <div class="target-pinyin">{{ word.pinyin }}</div>
      <div class="target-translation">{{ word.translations?.ru || word.translations }}</div>
    </div>
    <div class="drawing-container">
      <div class="canvases-column">
        <div
          v-for="(_, index) in characters"
          :key="index"
          :ref="(el) => setCanvasRef(el, index)"
          class="drawing-canvas"
          :class="{ active: activeIndex === index, inactive: activeIndex !== index }"
          :style="{ width: size + 'px', height: size + 'px' }"
        ></div>
      </div>
      <div v-if="result" class="feedback" :class="{ correct: result.passed }">
        {{ result.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import HanziWriter from 'hanzi-writer'

const props = defineProps({
  word: { type: Object, required: true },
  size: { type: Number, default: 280 },
  usedHint: { type: Boolean, default: false }
})

const emit = defineEmits(['complete'])

const size = props.size
const characters = props.word.simplified.split('').filter(c => c.trim())
const totalChars = characters.length

const canvasRefs = ref([])
const writers = ref([])
const activeIndex = ref(0)
let totalMistakes = 0
let usedHint = props.usedHint || false
const result = ref(null)

function setCanvasRef(el, index) {
  if (el) canvasRefs.value[index] = el
  else canvasRefs.value[index] = null
}

async function initWriters() {
  destroyAllWriters()
  writers.value = []

  for (let i = 0; i < characters.length; i++) {
    const container = canvasRefs.value[i]
    if (!container) continue
    try {
      container.innerHTML = ''
      const writer = HanziWriter.create(container, characters[i], {
        width: size,
        height: size,
        padding: 5,
        strokeColor: '#333',
        showOutline: true,
        delayBetweenStrokes: 500,
        charDataLoader: (char, onComplete) => {
          fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`)
            .then(response => {
              if (!response.ok) throw new Error('Failed to load character data')
              return response.json()
            })
            .then(data => onComplete(data))
            .catch(error => {
              console.warn(`Failed to load data for ${char}, using fallback`, error)
              onComplete({ strokes: [], medians: [] })
            })
        }
      })
      writers.value[i] = writer
    } catch (e) {
      console.error(`Ошибка создания writer для "${characters[i]}":`, e)
    }
  }
}

function startCurrent() {
  if (activeIndex.value >= totalChars) {
    let quality = 5
    if (totalMistakes === 0 && !usedHint) quality = 5
    else if (totalMistakes === 1) quality = 4
    else if (totalMistakes <= 3) quality = 3
    else if (totalMistakes <= 5) quality = 2
    else quality = 1

    const passed = quality >= 3
    result.value = {
      passed,
      message: passed ? '✅ Правильно!' : `❌ Ошибок: ${totalMistakes}`
    }
    emit('complete', { passed, mistakes: totalMistakes, quality })
    return
  }

  const writer = writers.value[activeIndex.value]
  if (!writer) {
    activeIndex.value++
    startCurrent()
    return
  }

  writer.quiz({
    onMistake: () => totalMistakes++,
    onComplete: () => {
      activeIndex.value++
      setTimeout(() => startCurrent(), 300)
    }
  })
}

function destroyAllWriters() {
  writers.value.forEach(w => w?.destroy?.())
  writers.value = []
}

function reset() {
  destroyAllWriters()
  activeIndex.value = 0
  totalMistakes = 0
  usedHint = props.usedHint || false
  result.value = null
  nextTick(() => {
    initWriters().then(startCurrent)
  })
}

onMounted(reset)
onUnmounted(destroyAllWriters)
watch(() => props.word, reset)
watch(() => props.usedHint, (val) => { usedHint = val || false })
</script>

<style scoped>
.character-drawing {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.drawing-header {
  text-align: center;
  margin-bottom: 1rem;
}
.target-char {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--secondary);
}
.target-pinyin {
  font-size: 1rem;
  color: var(--gray-500);
}
.target-translation {
  font-size: 1rem;
  color: var(--primary);
}
.drawing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.canvases-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.drawing-canvas {
  background: var(--gray-100);
  border-radius: 1rem;
  transition: opacity 0.3s;
}
.drawing-canvas.active {
  opacity: 1;
  pointer-events: auto;
}
.drawing-canvas.inactive {
  opacity: 0.5;
  pointer-events: none;
}
.feedback {
  margin-top: 1rem;
  font-size: 1rem;
}
.feedback.correct {
  color: var(--success);
}
body.dark-theme .drawing-canvas {
  background: var(--gray-700);
}
body.dark-theme .target-char {
  color: white;
}
</style>