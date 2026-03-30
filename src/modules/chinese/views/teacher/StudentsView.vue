<template>
  <TeacherLayout>
    <div class="chinese-students-view">
      <div class="page-header">
        <h1>Ученики (китайский язык)</h1>
        <p class="subtitle">Управление учениками, изучающими китайский язык</p>
      </div>

      <div class="coming-soon">
        <div class="coming-soon-icon">👥</div>
        <h2>Функция в разработке</h2>
        <p>Скоро здесь появится возможность:</p>
        <ul>
          <li>Просматривать список учеников, изучающих китайский язык</li>
          <li>Отслеживать прогресс каждого ученика по уровням HSK</li>
          <li>Просматривать результаты экзаменов и практики</li>
          <li>Добавлять и редактировать учеников</li>
        </ul>
        <button @click="$router.back()" class="btn-back">← Назад</button>
      </div>
    </div>
  </TeacherLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TeacherLayout from '@core/layouts/TeacherLayout.vue'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.chinese-students-view {
  max-width: 800px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 2rem;
}
.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--secondary);
}
.subtitle {
  margin: 0.5rem 0 0;
  color: var(--gray-500);
}
.coming-soon {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid var(--gray-200);
}
.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.coming-soon h2 {
  margin: 0 0 1rem;
  color: var(--secondary);
}
.coming-soon p {
  margin-bottom: 1rem;
  color: var(--gray-600);
}
.coming-soon ul {
  text-align: left;
  max-width: 300px;
  margin: 0 auto 2rem;
  color: var(--gray-600);
}
.coming-soon li {
  margin: 0.5rem 0;
}
.btn-back {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-back:hover {
  background: var(--primary-dark);
}
body.dark-theme .coming-soon {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .coming-soon h2 {
  color: white;
}
</style>