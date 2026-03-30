<template>
  <StudentLayout>
    <div class="theory-detail">
      <div class="page-header">
        <button @click="goBack" class="btn-back">← Назад</button>
        <h1 v-if="topic">{{ topic.title }}</h1>
      </div>

      <div v-if="topic" class="detail-content">
        <div class="theory-section">
          <h2>Объяснение</h2>
          <div class="theory-text">{{ topic.explanation }}</div>
        </div>

        <div v-if="topic.examples?.length" class="examples-section">
          <h2>Примеры</h2>
          <ul class="examples-list">
            <li v-for="(example, idx) in topic.examples" :key="idx">{{ example }}</li>
          </ul>
        </div>

        <div v-if="topic.definitions?.length" class="terms-section">
          <h2>Ключевые термины</h2>
          <div class="terms-list">
            <div v-for="def in topic.definitions" :key="def.term" class="term-card">
              <strong>{{ def.term }}</strong>
              <p>{{ def.definition }}</p>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="startPractice" class="btn-practice">Начать тренировку по теме</button>
          <router-link :to="`/student/theory`" class="btn-back-theory">К списку тем</router-link>
        </div>
      </div>

      <div v-else class="not-found">
        <h2>Тема не найдена</h2>
        <p>Возможно, тема ещё не добавлена в базу знаний.</p>
        <router-link to="/student/theory" class="btn-back-theory">Вернуться к теории</router-link>
      </div>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import StudentLayout from '@/layouts/StudentLayout.vue';
import theoryData from '@/data/theory.json';

const router = useRouter();
const route = useRoute();
const topicId = route.params.topicId;
const topic = ref(null);

onMounted(() => {
  // Ищем тему по topic_id
  const blocks = theoryData.blocks || [];
  for (const block of blocks) {
    const found = block.lessons?.find(lesson => lesson.topic_id === topicId);
    if (found) {
      topic.value = found;
      break;
    }
  }
});

const goBack = () => {
  router.push('/student/theory');
};

const startPractice = () => {
  router.push(`/student/practice?topic=${topicId}`);
};
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.theory-detail {
  max-width: 900px;
  margin: 0 auto;
}

/* ========== ШАПКА ========== */
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.btn-back {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--primary);
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}
.btn-back:hover {
  color: var(--primary-dark);
}
.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--primary);
}

/* ========== ОСНОВНОЙ КОНТЕНТ ========== */
.detail-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow);
}
.theory-section h2,
.examples-section h2,
.terms-section h2 {
  font-size: 1.5rem;
  margin: 0 0 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary);
  color: var(--primary);
}
.theory-text {
  line-height: 1.6;
  font-size: 1rem;
  color: var(--gray-700);
  white-space: pre-wrap;
}
.examples-list {
  margin: 0;
  padding-left: 1.5rem;
}
.examples-list li {
  margin: 0.75rem 0;
  line-height: 1.5;
  color: var(--gray-700);
}
.terms-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.term-card {
  background: var(--gray-50);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: transform 0.2s;
}
.term-card:hover {
  transform: translateX(4px);
}
.term-card strong {
  color: var(--primary);
  display: block;
  margin-bottom: 0.5rem;
}
.term-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-600);
  line-height: 1.4;
}

/* ========== КНОПКИ ДЕЙСТВИЙ ========== */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-600);
}
.btn-practice {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-practice:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-back-theory {
  padding: 0.75rem 1.5rem;
  background: none;
  border: 1px solid var(--gray-300);
  border-radius: 2rem;
  text-decoration: none;
  color: var(--gray-500);
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-back-theory:hover {
  background: var(--gray-100);
}

/* ========== НЕ НАЙДЕНО ========== */
.not-found {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid var(--gray-200);
}
.not-found h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.not-found p {
  margin-bottom: 1.5rem;
  color: var(--gray-500);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .detail-content {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .theory-text,
body.dark-theme .examples-list li,
body.dark-theme .term-card p {
  color: var(--gray-500);
}
body.dark-theme .term-card {
  background: var(--gray-700);
}
body.dark-theme .not-found {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
</style>