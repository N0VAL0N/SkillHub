// src/stores/chineseExamStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateExam } from '@/services/chinese/exam-generator'

export const useChineseExamStore = defineStore('chineseExam', () => {
  const exams = ref([])
  const currentExam = ref(null)
  const isLoading = ref(false)

  async function loadExams(level = null) {
    isLoading.value = true
    try {
      // Пока нет сохранённых экзаменов, генерируем один
      if (exams.value.length === 0) {
        const newExam = await generateExam(level || '1')
        exams.value.push(newExam)
      }
    } catch (error) {
      console.error('Error loading exams:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function generateNewExam(level) {
    const exam = await generateExam(level)
    exams.value.push(exam)
    return exam
  }

  async function getExamById(id) {
    return exams.value.find(e => e.id === id) || null
  }

  return {
    exams,
    currentExam,
    isLoading,
    loadExams,
    generateNewExam,
    getExamById
  }
})