<template>
  <div class="chart-renderer">
    <canvas ref="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (val) => ['bar', 'pie', 'line', 'double_line'].includes(val)
  },
  labels: {
    type: Array,
    required: true
  },
  datasets: {
    type: Array,
    required: true,
    validator: (val) => val.length >= 1 && val.length <= 2
  },
  width: {
    type: Number,
    default: 600
  },
  height: {
    type: Number,
    default: 400
  }
})

const canvas = ref(null)
let chartInstance = null

const generateColors = (count) => {
  const baseColors = [
    'rgba(230,126,34,0.8)',
    'rgba(52,152,219,0.8)',
    'rgba(46,204,113,0.8)',
    'rgba(231,76,60,0.8)',
    'rgba(241,196,15,0.8)',
    'rgba(155,89,182,0.8)'
  ]
  const colors = []
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }
  return colors
}

const renderChart = () => {
  if (!canvas.value) return
  if (!props.labels.length || !props.datasets.length) return
  if (chartInstance) chartInstance.destroy()

  const ctx = canvas.value.getContext('2d')
  const isPie = props.type === 'pie'
  const isLine = props.type === 'line' || props.type === 'double_line'
  const chartType = isPie ? 'pie' : (isLine ? 'line' : 'bar')

  const config = {
    type: chartType,
    data: {
      labels: props.labels,
      datasets: props.datasets.map((ds, idx) => ({
        label: ds.label || (idx === 0 ? 'Значения' : 'Значения 2'),
        data: ds.data,
        backgroundColor: isPie ? generateColors(props.labels.length) : (ds.backgroundColor || 'rgba(230,126,34,0.6)'),
        borderColor: ds.borderColor || 'rgba(230,126,34,1)',
        borderWidth: 1,
        tension: 0.3,
        fill: isLine ? false : undefined,
        pointRadius: isLine ? 3 : undefined
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { enabled: true }
      },
      scales: !isPie ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Значения' }
        },
        x: {
          title: { display: true, text: 'Категории' }
        }
      } : {}
    }
  }

  chartInstance = new Chart(ctx, config)
}

onMounted(() => {
  nextTick(() => renderChart())
})

watch(() => [props.type, props.labels, props.datasets], () => {
  nextTick(() => renderChart())
}, { deep: true })
</script>

<style scoped>
.chart-renderer {
  width: 100%;
  min-height: 300px;
  position: relative;
  margin: 1rem 0;
}
</style>