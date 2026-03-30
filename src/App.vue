<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { auth } from './core/services/firebase';  // ← изменён путь

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user?.email || 'No user');
  });
});
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ========== АКТИВНЫЕ СОСТОЯНИЯ ========== */
.router-link-active,
.router-link-exact-active {
  color: var(--primary);
}

/* ========== АНИМАЦИИ ПЕРЕХОДОВ ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* ========== ЗАГРУЗКА ========== */
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== ОБЩИЕ УТИЛИТЫ ДЛЯ APP ========== */
.text-center {
  text-align: center;
}
.w-100 {
  width: 100%;
}
.h-100 {
  height: 100%;
}
.cursor-pointer {
  cursor: pointer;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-auto {
  overflow: auto;
}
.rounded {
  border-radius: 0.5rem;
}
.rounded-lg {
  border-radius: 1rem;
}
.rounded-full {
  border-radius: 9999px;
}

/* ========== ФОКУС ========== */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ========== ВЫДЕЛЕНИЕ ТЕКСТА ========== */
::selection {
  background: var(--primary-light);
  color: var(--primary);
}

body.dark-theme ::selection {
  background: rgba(230, 126, 34, 0.3);
  color: var(--primary);
}
</style>