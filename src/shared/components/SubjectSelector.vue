<template>
  <div class="subject-selector">
    <div class="subject-categories">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        <span class="category-icon">{{ cat.icon }}</span>
        <span class="category-name">{{ cat.name }}</span>
      </button>
    </div>
    
    <div class="subjects-grid">
      <button
        v-for="subject in filteredSubjects"
        :key="subject.id"
        class="subject-card"
        :class="{ selected: isSelected(subject.id) }"
        @click="toggleSubject(subject.id)"
      >
        <span class="subject-icon" :style="{ background: subject.color + '20', color: subject.color }">
          {{ subject.icon }}
        </span>
        <div class="subject-info">
          <span class="subject-name">{{ subject.name }}</span>
          <span class="subject-desc">{{ subject.description }}</span>
        </div>
        <span v-if="isSelected(subject.id)" class="check-mark">✓</span>
      </button>
    </div>
    
    <div class="selector-actions" v-if="showActions">
      <button class="btn-secondary" @click="$emit('cancel')">Отмена</button>
      <button class="btn-primary" @click="$emit('save', selectedSubjects)">Сохранить</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { SUBJECTS_LIST, getSubjectsByCategory } from '@core/constants/subjects';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const selectedSubjects = ref([...props.modelValue]);
const activeCategory = ref('all');

const categories = computed(() => {
  const cats = [{ id: 'all', name: 'Все', icon: '📚' }];
  const grouped = getSubjectsByCategory('ege') ? { ege: 'ЕГЭ', chinese: 'Китайский', english: 'Английский', programming: 'Программирование' } : {};
  
  // Категории
  const catsMap = {
    ege: { id: 'ege', name: 'ЕГЭ', icon: '🎓' },
    chinese: { id: 'chinese', name: 'Китайский', icon: '🐉' },
    english: { id: 'english', name: 'Английский', icon: '🇬🇧' },
    programming: { id: 'programming', name: 'Программирование', icon: '💻' }
  };
  
  Object.values(catsMap).forEach(cat => {
    if (SUBJECTS_LIST.some(s => s.category === cat.id)) {
      cats.push(cat);
    }
  });
  
  return cats;
});

const filteredSubjects = computed(() => {
  if (activeCategory.value === 'all') {
    return SUBJECTS_LIST;
  }
  return SUBJECTS_LIST.filter(s => s.category === activeCategory.value);
});

const isSelected = (subjectId) => {
  return selectedSubjects.value.includes(subjectId);
};

const toggleSubject = (subjectId) => {
  if (isSelected(subjectId)) {
    selectedSubjects.value = selectedSubjects.value.filter(id => id !== subjectId);
  } else {
    selectedSubjects.value.push(subjectId);
  }
  emit('update:modelValue', selectedSubjects.value);
};
</script>

<style scoped>
.subject-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.subject-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-600);
  transition: all 0.2s;
}

.category-btn:hover {
  background: var(--gray-100);
  color: var(--primary);
}

.category-btn.active {
  background: var(--primary-light);
  color: var(--primary);
}

.category-icon {
  font-size: 1rem;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.25rem;
}

.subject-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.subject-card:hover {
  border-color: var(--primary);
  transform: translateX(4px);
}

.subject-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.subject-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.subject-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subject-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-800);
}

.subject-desc {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.check-mark {
  color: var(--primary);
  font-size: 1.25rem;
  font-weight: bold;
}

.selector-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-600);
}

.btn-secondary:hover {
  background: var(--gray-100);
}

body.dark-theme .category-btn {
  color: var(--gray-400);
}

body.dark-theme .category-btn:hover {
  background: var(--gray-700);
}

body.dark-theme .subject-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}

body.dark-theme .subject-name {
  color: var(--gray-200);
}

body.dark-theme .subject-card.selected {
  background: rgba(230, 126, 34, 0.2);
}

body.dark-theme .btn-secondary {
  border-color: var(--gray-600);
  color: var(--gray-400);
}

body.dark-theme .btn-secondary:hover {
  background: var(--gray-700);
}
</style>