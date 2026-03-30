import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateExam } from '@modules/chinese/services/examGenerator'

export const useChineseExamStore = defineStore('chineseExam', () => {
  const exams = ref([])

  async function generateNewExam(level) {
    const exam = await generateExam(level)
    exams.value.push(exam)
    return exam
  }

  async function getExamById(id) {
    return exams.value.find(e => e.id === id) || null
  }

  return { exams, generateNewExam, getExamById }
})