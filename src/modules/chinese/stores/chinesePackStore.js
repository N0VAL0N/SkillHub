import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { updateCardSM2 } from '@modules/chinese/services/sm2'

export const useChinesePackStore = defineStore('chinesePack', () => {
  const packs = ref([])
  const currentPack = ref(null)
  const cards = ref([])
  const isLoading = ref(false)

  async function loadPacks() {
    isLoading.value = true
    try {
      const saved = localStorage.getItem('chinese_packs')
      if (saved) {
        packs.value = JSON.parse(saved)
      }
      const savedCards = localStorage.getItem('chinese_cards')
      if (savedCards) {
        cards.value = JSON.parse(savedCards)
      }
    } catch (error) {
      console.error('Error loading packs:', error)
    } finally {
      isLoading.value = false
    }
  }

  function savePacks() {
    localStorage.setItem('chinese_packs', JSON.stringify(packs.value))
    localStorage.setItem('chinese_cards', JSON.stringify(cards.value))
  }

  function createPack(packData) {
    const now = Date.now()
    const newPack = {
      id: uuidv4(),
      ...packData,
      createdAt: now,
      updatedAt: now,
      cardCount: 0
    }
    packs.value.push(newPack)
    savePacks()
    return newPack
  }

  function updatePack(packId, updates) {
    const index = packs.value.findIndex(p => p.id === packId)
    if (index !== -1) {
      packs.value[index] = { ...packs.value[index], ...updates, updatedAt: Date.now() }
      if (currentPack.value?.id === packId) currentPack.value = packs.value[index]
      savePacks()
      return true
    }
    return false
  }

  function deletePack(packId) {
    packs.value = packs.value.filter(p => p.id !== packId)
    cards.value = cards.value.filter(c => c.packId !== packId)
    if (currentPack.value?.id === packId) currentPack.value = null
    savePacks()
  }

  function loadPack(packId) {
    const pack = packs.value.find(p => p.id === packId)
    if (pack) {
      currentPack.value = pack
      return pack
    }
    return null
  }

  function addCard(packId, cardData) {
    const now = Date.now()
    const newCard = {
      id: uuidv4(),
      packId,
      ...cardData,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      lastReview: 0,
      totalReviews: 0,
      correctCount: 0,
      streak: 0
    }
    cards.value.push(newCard)
    const pack = packs.value.find(p => p.id === packId)
    if (pack) pack.cardCount = cards.value.filter(c => c.packId === packId).length
    savePacks()
    return newCard
  }

  function addCards(packId, cardsData) {
    const now = Date.now()
    const newCards = cardsData.map(data => ({
      id: uuidv4(),
      packId,
      ...data,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      lastReview: 0,
      totalReviews: 0,
      correctCount: 0,
      streak: 0
    }))
    cards.value.push(...newCards)
    const pack = packs.value.find(p => p.id === packId)
    if (pack) pack.cardCount = cards.value.filter(c => c.packId === packId).length
    savePacks()
    return newCards
  }

  function updateCard(cardId, updates) {
    const index = cards.value.findIndex(c => c.id === cardId)
    if (index !== -1) {
      cards.value[index] = { ...cards.value[index], ...updates }
      savePacks()
      return true
    }
    return false
  }

  function deleteCard(cardId) {
    const card = cards.value.find(c => c.id === cardId)
    if (card) {
      cards.value = cards.value.filter(c => c.id !== cardId)
      const pack = packs.value.find(p => p.id === card.packId)
      if (pack) pack.cardCount = cards.value.filter(c => c.packId === card.packId).length
      savePacks()
    }
  }

  function answerCard(cardId, quality) {
    const index = cards.value.findIndex(c => c.id === cardId)
    if (index === -1) return false
    const updated = updateCardSM2(cards.value[index], quality)
    cards.value[index] = updated
    savePacks()
    return true
  }

  function getDueCards(packId, limit = 20) {
    const now = Date.now()
    return cards.value
      .filter(c => c.packId === packId && c.dueDate <= now)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, limit)
  }

  function getCardsByPackId(packId) {
    return cards.value.filter(c => c.packId === packId)
  }

  return {
    packs,
    currentPack,
    cards,
    isLoading,
    loadPacks,
    savePacks,
    createPack,
    updatePack,
    deletePack,
    loadPack,
    addCard,
    addCards,
    updateCard,
    deleteCard,
    answerCard,
    getDueCards,
    getCardsByPackId
  }
})