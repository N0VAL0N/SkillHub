<template>
  <router-view />
  <div v-if="appStore.toastVisible" class="global-toast" :class="appStore.toastType">
    <span class="toast-icon">
      <svg v-if="appStore.toastType === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else-if="appStore.toastType === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12M12 16H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
      </svg>
    </span>
    <span class="toast-message">{{ appStore.toastMessage }}</span>
    <button class="toast-close" @click="appStore.hideToast">✕</button>
  </div>
</template>

<script setup>
import { useAppStore } from './core/stores/appStore';
import { onMounted } from 'vue';
import { auth } from './core/services/firebase';

const appStore = useAppStore();

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    console.log('App mounted, auth state:', user?.email || 'No user');
  });
});
</script>

<style>
.global-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  animation: slideInRight 0.3s ease;
}

.global-toast.success {
  border-left: 4px solid #10b981;
}
.global-toast.success .toast-icon {
  color: #10b981;
}
.global-toast.error {
  border-left: 4px solid #ef4444;
}
.global-toast.error .toast-icon {
  color: #ef4444;
}
.global-toast.warning {
  border-left: 4px solid #f59e0b;
}
.global-toast.warning .toast-icon {
  color: #f59e0b;
}
.global-toast.info {
  border-left: 4px solid #3b82f6;
}
.global-toast.info .toast-icon {
  color: #3b82f6;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1;
}
.toast-close:hover {
  color: #64748b;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

body.dark-theme .global-toast {
  background: #1e293b;
  color: #e2e8f0;
}
body.dark-theme .toast-close {
  color: #64748b;
}
body.dark-theme .toast-close:hover {
  color: #94a3b8;
}
</style>