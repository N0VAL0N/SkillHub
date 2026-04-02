<!-- src/modules/social/components/ChartRenderer.vue -->
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
    required: false,
    default: 'line'
  },
  labels: {
    type: Array,
    default: () => []
  },
  datasets: {
    type: Array,
    default: () => []
  },
  chartData: {
    type: Object,
    default: null
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

// Нормализация данных для double_line
const normalizeDoubleLineData = (data) => {
  // Браки и разводы (task9_021)
  if (data.marriages !== undefined && data.divorces !== undefined) {
    return {
      labels: data.labels || [],
      datasets: [
        {
          label: 'Браки',
          data: data.marriages,
          borderColor: 'rgba(230,126,34,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(230,126,34,1)'
        },
        {
          label: 'Разводы',
          data: data.divorces,
          borderColor: 'rgba(52,152,219,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(52,152,219,1)'
        }
      ]
    }
  }
  
  // Экспорт и импорт (task9_027)
  if (data.export !== undefined && data.import !== undefined) {
    return {
      labels: data.labels || [],
      datasets: [
        {
          label: 'Экспорт',
          data: data.export,
          borderColor: 'rgba(230,126,34,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3
        },
        {
          label: 'Импорт',
          data: data.import,
          borderColor: 'rgba(52,152,219,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3
        }
      ]
    }
  }
  
  // Значения 1 и 2
  if (data.values1 !== undefined && data.values2 !== undefined) {
    return {
      labels: data.labels || [],
      datasets: [
        {
          label: data.label1 || 'Показатель 1',
          data: data.values1,
          borderColor: 'rgba(230,126,34,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3
        },
        {
          label: data.label2 || 'Показатель 2',
          data: data.values2,
          borderColor: 'rgba(52,152,219,1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 3
        }
      ]
    }
  }
  
  // Стандартные datasets
  if (data.datasets && Array.isArray(data.datasets)) {
    return {
      labels: data.labels || [],
      datasets: data.datasets.map((ds, idx) => ({
        ...ds,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3
      }))
    }
  }
  
  return null
}

// Отрисовка для задания 21 (точки x, y) или double_line
const renderFromChartData = () => {
  if (!canvas.value) return
  if (!props.chartData) return

  let chartConfig = null
  
  // Если есть точки x,y (задание 21)
  if (props.chartData.datasets && Array.isArray(props.chartData.datasets) && props.chartData.datasets.length) {
    const firstDataset = props.chartData.datasets[0]
    if (firstDataset.data && firstDataset.data[0] && firstDataset.data[0].x !== undefined) {
      chartConfig = {
        type: 'line',
        data: {
          datasets: props.chartData.datasets.map(ds => ({
            ...ds,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: (${context.parsed.x}, ${context.parsed.y})`
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Цена (P)' },
              ticks: { stepSize: 10 }
            },
            y: {
              type: 'linear',
              title: { display: true, text: 'Количество (Q)' },
              beginAtZero: true,
              ticks: { stepSize: 20 }
            }
          }
        }
      }
    }
  }
  
  // Если это double_line с полями marriages/divorces, export/import и т.д.
  if (!chartConfig) {
    const normalized = normalizeDoubleLineData(props.chartData)
    if (normalized && normalized.datasets && normalized.datasets.length) {
      chartConfig = {
        type: 'line',
        data: {
          labels: normalized.labels,
          datasets: normalized.datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: { enabled: true }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Количество' },
              ticks: { stepSize: Math.ceil(Math.max(...normalized.datasets.flatMap(d => d.data)) / 10) || 50 }
            },
            x: {
              title: { display: true, text: 'Годы' },
              ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
            }
          }
        }
      }
    }
  }
  
  if (chartConfig) {
    if (chartInstance) chartInstance.destroy()
    const ctx = canvas.value.getContext('2d')
    chartInstance = new Chart(ctx, chartConfig)
  }
}

// Отрисовка для bar/pie/line
const renderChart = () => {
  if (!canvas.value) return

  // Если передан chartData (задание 21 или double_line)
  if (props.chartData && (props.chartData.datasets || props.chartData.marriages || props.chartData.export)) {
    renderFromChartData()
    return
  }

  // Стандартный формат (bar/pie/line)
  if (!props.labels || !props.labels.length) {
    console.warn('ChartRenderer: no labels provided')
    return
  }
  if (!props.datasets || !props.datasets.length) {
    console.warn('ChartRenderer: no datasets provided')
    return
  }

  if (chartInstance) chartInstance.destroy()

  const ctx = canvas.value.getContext('2d')
  const isPie = props.type === 'pie'
  const isLine = props.type === 'line'
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
          title: { display: true, text: 'Значения' },
          ticks: { stepSize: 20 }
        },
        x: {
          title: { display: true, text: 'Категории' },
          ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
        }
      } : {}
    }
  }

  chartInstance = new Chart(ctx, config)
}

watch(() => [props.type, props.labels, props.datasets, props.chartData], () => {
  nextTick(() => renderChart())
}, { deep: true })

onMounted(() => {
  nextTick(() => renderChart())
})
</script>

<style scoped>
.chart-renderer {
  width: 100%;
  min-height: 300px;
  position: relative;
  margin: 1rem 0;
}
</style>