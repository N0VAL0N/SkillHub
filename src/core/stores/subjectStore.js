// src/core/stores/subjectStore.js
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSubjectStore = defineStore('subject', () => {
  const currentSubject = ref(localStorage.getItem('currentSubject') || 'social');
  const userSubjects = ref([]);

  function setSubject(subject) {
    currentSubject.value = subject;
    localStorage.setItem('currentSubject', subject);
  }

  function setUserSubjects(subjects) {
    userSubjects.value = subjects || [];
    localStorage.setItem('userSubjects', JSON.stringify(userSubjects.value));
  }

  // Загрузка предметов пользователя из localStorage при инициализации
  const saved = localStorage.getItem('userSubjects');
  if (saved) {
    try {
      userSubjects.value = JSON.parse(saved);
    } catch (e) {}
  }

  watch(currentSubject, (val) => {
    localStorage.setItem('currentSubject', val);
  });

  watch(userSubjects, (val) => {
    localStorage.setItem('userSubjects', JSON.stringify(val));
  }, { deep: true });

  return { currentSubject, userSubjects, setSubject, setUserSubjects };
});