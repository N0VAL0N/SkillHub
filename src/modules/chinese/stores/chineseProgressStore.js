import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, auth } from '@core/services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const useChineseProgressStore = defineStore('chineseProgress', () => {
  const learnedWords = ref([])
  const completedLessons = ref([])
  const completedReadings = ref([])
  const lessonProgress = ref({})
  const examResults = ref([])
  const practiceStats = ref({ total: 0, correct: 0 })
  const isLoading = ref(false)

  async function loadProgress() {
    const user = auth.currentUser
    if (!user) return
    isLoading.value = true
    try {
      const docRef = doc(db, 'chineseProgress', user.uid)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        learnedWords.value = data.learnedWords || []
        completedLessons.value = data.completedLessons || []
        completedReadings.value = data.completedReadings || []
        lessonProgress.value = data.lessonProgress || {}
        examResults.value = data.examResults || []
        practiceStats.value = data.practiceStats || { total: 0, correct: 0 }
      }
    } catch (error) {
      console.error('Error loading chinese progress:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function saveProgress() {
    const user = auth.currentUser
    if (!user) return
    try {
      await setDoc(doc(db, 'chineseProgress', user.uid), {
        learnedWords: learnedWords.value,
        completedLessons: completedLessons.value,
        completedReadings: completedReadings.value,
        lessonProgress: lessonProgress.value,
        examResults: examResults.value,
        practiceStats: practiceStats.value,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error saving chinese progress:', error)
    }
  }

  function addLearnedWord(wordId) {
    if (!learnedWords.value.includes(wordId)) {
      learnedWords.value.push(wordId)
      saveProgress()
    }
  }

  function completeLesson(lessonId) {
    if (!completedLessons.value.includes(lessonId)) {
      completedLessons.value.push(lessonId)
      saveProgress()
    }
  }

  function addCompletedReading(readingId) {
    if (!completedReadings.value.includes(readingId)) {
      completedReadings.value.push(readingId)
      saveProgress()
    }
  }

  function updateLessonProgress(lessonId, data) {
    lessonProgress.value[lessonId] = { ...lessonProgress.value[lessonId], ...data }
    saveProgress()
  }

  function addExamResult(result) {
    examResults.value.push(result)
    saveProgress()
  }

  function addPracticeResult(correct) {
    practiceStats.value.total++
    if (correct) practiceStats.value.correct++
    saveProgress()
  }

  return {
    learnedWords,
    completedLessons,
    completedReadings,
    lessonProgress,
    examResults,
    practiceStats,
    isLoading,
    loadProgress,
    saveProgress,
    addLearnedWord,
    completeLesson,
    addCompletedReading,
    updateLessonProgress,
    addExamResult,
    addPracticeResult
  }
})