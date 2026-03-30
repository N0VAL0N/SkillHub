import { ref, watch } from 'vue';

export function useTheme() {
  const currentTheme = ref(localStorage.getItem('theme') || 'light');

  function setTheme(theme) {
    currentTheme.value = theme;
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Применяем при инициализации
  if (currentTheme.value === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  return {
    currentTheme,
    setTheme
  };
}