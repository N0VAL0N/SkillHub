import { defineStore } from 'pinia'
import { ref } from 'vue'
import readingsData from '@/data/chinese/hsk-reading.json'

export const useChineseReadingStore = defineStore('chineseReading', () => {
  const readings = ref([])
  const isLoading = ref(false)

  async function loadReadings(level = null) {
    isLoading.value = true
    try {
      let allReadings = readingsData
      
      if (level) {
        readings.value = allReadings.filter(r => String(r.level) === String(level))
      } else {
        readings.value = allReadings
      }
    } catch (error) {
      console.error('Error loading Chinese readings:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    readings,
    isLoading,
    loadReadings
  }
})