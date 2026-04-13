import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import VueDevTools from 'vite-plugin-vue-devtools' 

export default defineConfig({
  plugins: [
    vue(),
    VueDevTools({ launchEditor: 'code' })  
  ],
  base: './', // добавляем эту строку
  resolve: {
    alias: {
      // Основной алиас для src
      '@': path.resolve(__dirname, './src'),
      
      // Новая архитектура
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      
      // Старые алиасы оставляем для обратной совместимости (постепенно уберём)
      '@stores': path.resolve(__dirname, './src/stores'),
      '@components': path.resolve(__dirname, './src/components'),
      '@views': path.resolve(__dirname, './src/views'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@db': path.resolve(__dirname, './src/db'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@composables': path.resolve(__dirname, './src/composables'),
      '@data': path.resolve(__dirname, './src/data'),
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'idb', 'chart.js']
  }
})