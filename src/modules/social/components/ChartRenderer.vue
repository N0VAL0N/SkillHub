<template>
  <div class="chart-renderer">
    <div v-if="hasError" class="chart-fallback">
      <div class="fallback-icon">📊</div>
      <p>Не удалось отобразить график</p>
      <button @click="retryRender" class="retry-btn">Повторить</button>
    </div>
    <canvas v-else ref="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  type: {
    type: String,
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
const hasError = ref(false)

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

const normalizeDoubleLineData = (data) => {
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

const renderFromChartData = () => {
  if (!canvas.value) return
  if (!props.chartData) return

  let chartConfig = null
  
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
    try {
      if (chartInstance) chartInstance.destroy()
      const ctx = canvas.value.getContext('2d')
      chartInstance = new Chart(ctx, chartConfig)
      hasError.value = false
    } catch (err) {
      console.error('Chart error:', err)
      hasError.value = true
    }
  } else {
    hasError.value = true
  }
}

const renderChart = () => {
  if (!canvas.value) return

  if (props.chartData && (props.chartData.datasets || props.chartData.marriages || props.chartData.export)) {
    renderFromChartData()
    return
  }

  if (!props.labels || !props.labels.length) {
    console.warn('ChartRenderer: no labels provided')
    hasError.value = true
    return
  }
  if (!props.datasets || !props.datasets.length) {
    console.warn('ChartRenderer: no datasets provided')
    hasError.value = true
    return
  }

  try {
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
    hasError.value = false
  } catch (err) {
    console.error('Chart error:', err)
    hasError.value = true
  }
}

const retryRender = () => {
  hasError.value = false
  nextTick(() => renderChart())
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
.chart-fallback {
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border-radius: 0.5rem;
  color: var(--gray-500);
  gap: 0.5rem;
}
.fallback-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.retry-btn {
  margin-top: 0.5rem;
  padding: 0.3rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.75rem;
}
body.dark-theme .chart-fallback {
  background: var(--gray-800);
  color: var(--gray-400);
}
</style>