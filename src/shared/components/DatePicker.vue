<template>
  <div class="date-time-picker">
    <div class="date-trigger" @click="toggleOpen">
      <span class="date-value">{{ displayValue || placeholder }}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>

    <transition name="dropdown">
      <div v-if="isOpen" class="date-dropdown">
        <div class="date-header">
          <button @click="prevMonth" class="month-nav">←</button>
          <span>{{ currentMonthName }} {{ currentYear }}</span>
          <button @click="nextMonth" class="month-nav">→</button>
        </div>
        <div class="weekdays">
          <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
        </div>
        <div class="days-grid">
          <button
            v-for="day in days"
            :key="day.date"
            class="day-btn"
            :class="{ empty: !day.date, selected: isSelected(day.date), today: isToday(day.date) }"
            :disabled="!day.date"
            @click="selectDate(day.date)"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="time-selector">
          <span class="time-label">Время:</span>
          <select v-model="selectedHour" class="time-select">
            <option v-for="h in 24" :key="h-1" :value="h-1">{{ String(h-1).padStart(2,'0') }}</option>
          </select>
          <span>:</span>
          <select v-model="selectedMinute" class="time-select">
            <option v-for="m in 60" :key="m-1" :value="m-1">{{ String(m-1).padStart(2,'0') }}</option>
          </select>
        </div>

        <div class="date-actions">
          <button @click="applyDateTime" class="btn-apply">Применить</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Выберите дату и время' }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const currentDate = ref(new Date())
const selectedHour = ref(0)
const selectedMinute = ref(0)

const formatDateTime = (date, hour, minute) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
}

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const [datePart, timePart] = props.modelValue.split(' ')
  if (!timePart) return datePart
  const [year, month, day] = datePart.split('-')
  return `${day}.${month}.${year} ${timePart}`
})

const currentMonthName = computed(() => currentDate.value.toLocaleDateString('ru-RU', { month: 'long' }))
const currentYear = computed(() => currentDate.value.getFullYear())

const days = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay() || 7

  const daysArray = []
  for (let i = 1; i < startWeekday; i++) daysArray.push({ day: '', date: null })
  for (let i = 1; i <= lastDay.getDate(); i++) daysArray.push({ day: i, date: new Date(year, month, i) })
  while (daysArray.length % 7 !== 0) daysArray.push({ day: '', date: null })
  return daysArray
})

const toggleOpen = () => { isOpen.value = !isOpen.value }
const prevMonth = () => { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1) }
const nextMonth = () => { currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1) }

const isSelected = (date) => {
  if (!date || !props.modelValue) return false
  const selectedDateStr = props.modelValue.split(' ')[0]
  return formatDateTime(date, 0, 0).split(' ')[0] === selectedDateStr
}

const isToday = (date) => date && date.toDateString() === new Date().toDateString()

const selectDate = (date) => {
  if (date) currentDate.value = new Date(date)
  // НЕ закрываем модалку
}

const applyDateTime = () => {
  emit('update:modelValue', formatDateTime(currentDate.value, selectedHour.value, selectedMinute.value))
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.date-time-picker')) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (props.modelValue) {
    const parts = props.modelValue.split(' ')
    if (parts.length === 2) {
      const [datePart, timePart] = parts
      const [year, month, day] = datePart.split('-')
      const [hour, minute] = timePart.split(':')
      currentDate.value = new Date(year, month-1, day)
      selectedHour.value = parseInt(hour) || 0
      selectedMinute.value = parseInt(minute) || 0
    }
  }
})

onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.date-time-picker {
  position: relative;
  width: 100%;
}
.date-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.date-trigger:hover {
  border-color: var(--primary);
}
.date-value {
  color: var(--gray-700);
}
.date-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  padding: 1rem;
  z-index: 100;
  width: 320px;
  box-shadow: var(--shadow-lg);
}
.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 500;
}
.month-nav {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  color: var(--gray-600);
}
.month-nav:hover {
  background: var(--gray-100);
  color: var(--primary);
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-bottom: 0.5rem;
}
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.day-btn {
  aspect-ratio: 1;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  border-radius: 50%;
  transition: all 0.2s;
  color: var(--gray-700);
}
.day-btn:not(.empty):hover {
  background: var(--gray-100);
  color: var(--primary);
}
.day-btn.selected {
  background: var(--primary);
  color: white;
}
.day-btn.today {
  font-weight: bold;
  border: 1px solid var(--primary);
}
.day-btn.empty {
  cursor: default;
  opacity: 0;
}
.time-selector {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}
.time-label {
  font-size: 0.8rem;
  color: var(--gray-600);
}
.time-select {
  padding: 0.3rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.3rem;
  background: white;
}
.date-actions {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-end;
}
.btn-apply {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 0.8rem;
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
</style>