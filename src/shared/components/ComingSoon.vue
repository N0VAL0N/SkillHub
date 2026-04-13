<template>
  <div class="coming-soon">
    <div class="icon">🚧</div>
    <h2>В разработке</h2>
    <p>Модуль «{{ subjectName }}» скоро появится</p>
    <button @click="goHome" class="btn-back">На главную</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  subjectName: {
    type: String,
    default: 'этот предмет'
  }
});

const router = useRouter();
const goHome = () => router.push('/');
</script>

<style scoped>
.coming-soon {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--gray-50);
  border-radius: 1.5rem;
  margin: 2rem;
}
.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}
p {
  color: var(--gray-500);
  margin-bottom: 2rem;
}
.btn-back {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
</style>