// src/stores/subjectStore.js
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSubjectStore = defineStore('subject', () => {
  const currentSubject = ref(localStorage.getItem('currentSubject') || 'social');

  function setSubject(subject) {
    currentSubject.value = subject;
    localStorage.setItem('currentSubject', subject);
  }

  // Автоматически сохраняем в localStorage при изменении
  watch(currentSubject, (val) => {
    localStorage.setItem('currentSubject', val);
  });

  return { currentSubject, setSubject };
});