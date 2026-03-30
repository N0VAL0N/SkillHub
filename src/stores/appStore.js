import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const toastMessage = ref('')
  const toastType = ref('info')
  const toastVisible = ref(false)
  let toastTimeout = null

  function showToast(message, type = 'info') {
    if (toastTimeout) clearTimeout(toastTimeout)
    toastMessage.value = message
    toastType.value = type
    toastVisible.value = true
    toastTimeout = setTimeout(() => {
      toastVisible.value = false
    }, 3000)
  }

  function hideToast() {
    toastVisible.value = false
    if (toastTimeout) clearTimeout(toastTimeout)
  }

  return {
    toastMessage,
    toastType,
    toastVisible,
    showToast,
    hideToast
  }
})