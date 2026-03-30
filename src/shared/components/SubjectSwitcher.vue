<template>
  <div class="subject-switcher">
    <button
      v-for="subject in subjects"
      :key="subject.id"
      @click="handleSwitch(subject.id)"
      :class="['subject-btn', { active: currentSubject === subject.id }]"
    >
      <span class="subject-icon">{{ subject.icon }}</span>
      <span class="subject-name">{{ subject.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore, type SubjectId } from '@/stores/appStore'
import { useQuestionGenerator } from '@/stores/questionGenerator'

const appStore = useAppStore()
const questionGenerator = useQuestionGenerator()

const currentSubject = computed(() => appStore.currentSubject)

const subjects = [
  { id: 'ege' as SubjectId, name: 'Обществознание', icon: '📚' },
  { id: 'chinese' as SubjectId, name: 'Китайский', icon: '🐉' }
]

function handleSwitch(subjectId: SubjectId) {
  if (subjectId === currentSubject.value) return
  appStore.setCurrentSubject(subjectId)
  questionGenerator.initialize(subjectId)
}
</script>

<style scoped>
.subject-switcher {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.subject-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-600);
  transition: all 0.2s ease;
  text-align: left;
}

.subject-btn:hover {
  background: var(--gray-100);
  color: var(--primary);
}

.subject-btn.active {
  background: var(--primary-light);
  color: var(--primary);
}

.subject-icon {
  font-size: 1.2rem;
  width: 28px;
  text-align: center;
}

.subject-name {
  flex: 1;
}

/* Тёмная тема */
body.dark-theme .subject-btn {
  color: var(--gray-400);
}

body.dark-theme .subject-btn:hover {
  background: var(--gray-700);
  color: var(--primary);
}

body.dark-theme .subject-btn.active {
  background: rgba(230, 126, 34, 0.2);
  color: var(--primary);
}
</style>