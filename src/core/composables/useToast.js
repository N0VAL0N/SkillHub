// src/composables/useToast.js
import { createApp } from 'vue';
import CustomToast from '@shared/components/CustomToast.vue';

let toastContainer = null;

const showToast = (options) => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    document.body.appendChild(toastContainer);
  }
  
  const mountPoint = document.createElement('div');
  toastContainer.appendChild(mountPoint);
  
  const toastApp = createApp(CustomToast, {
    ...options,
    onClose: () => {
      toastApp.unmount();
      mountPoint.remove();
    }
  });
  
  toastApp.mount(mountPoint);
};

export const useToast = () => {
  return {
    success: (message, title = 'Успешно') => showToast({ type: 'success', title, message }),
    error: (message, title = 'Ошибка') => showToast({ type: 'error', title, message }),
    warning: (message, title = 'Внимание') => showToast({ type: 'warning', title, message }),
    info: (message, title = 'Информация') => showToast({ type: 'info', title, message })
  };
};