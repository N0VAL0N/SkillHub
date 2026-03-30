import { defineStore } from 'pinia'
import { ref } from 'vue'
import hskAll from '@/data/chinese/hsk_all.json'

export const useChineseVocabularyStore = defineStore('chineseVocabulary', () => {
  const words = ref([])
  const isLoading = ref(false)

  async function loadVocabulary(level = null) {
    isLoading.value = true
    try {
      // Загружаем из JSON
      let allWords = hskAll
      
      if (level) {
        words.value = allWords.filter(w => String(w.level) === String(level))
      } else {
        words.value = allWords
      }
    } catch (error) {
      console.error('Error loading Chinese vocabulary:', error)
    } finally {
      isLoading.value = false
    }
  }

  function getWordsByTopics(level, topics) {
    return words.value.filter(w => {
      if (String(w.level) !== String(level)) return false
      if (!w.topics || w.topics.length === 0) return false
      return w.topics.some(t => topics.includes(t))
    })
  }

  function search(term) {
    const lowerTerm = term.toLowerCase()
    return words.value.filter(w => {
      if (w.simplified.includes(term)) return true
      if (w.translations.ru.toLowerCase().includes(lowerTerm)) return true
      if (w.pinyin.toLowerCase().includes(lowerTerm)) return true
      return false
    })
  }

  return {
    words,
    isLoading,
    loadVocabulary,
    getWordsByTopics,
    search
  }
})