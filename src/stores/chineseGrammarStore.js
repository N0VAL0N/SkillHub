import { defineStore } from 'pinia'
import { ref } from 'vue'
import grammarAll from '@/data/chinese/grammar_all.json'

export const useChineseGrammarStore = defineStore('chineseGrammar', () => {
  const grammarPoints = ref([])
  const isLoading = ref(false)

  async function loadGrammar(level = null) {
    isLoading.value = true
    try {
      let allGrammar = grammarAll
      
      if (level) {
        grammarPoints.value = allGrammar.filter(g => String(g.level) === String(level))
      } else {
        grammarPoints.value = allGrammar
      }
    } catch (error) {
      console.error('Error loading Chinese grammar:', error)
    } finally {
      isLoading.value = false
    }
  }

  function getGrammarByTopics(level, topics) {
    return grammarPoints.value.filter(g => {
      if (String(g.level) !== String(level)) return false
      if (!g.topics || g.topics.length === 0) return false
      return g.topics.some(t => topics.includes(t))
    })
  }

  return {
    grammarPoints,
    isLoading,
    loadGrammar,
    getGrammarByTopics
  }
})