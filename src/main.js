// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './core/router';
import './main.css';
import { auth, db } from './core/services/firebase';

console.log('Firebase initialized', { auth, db }); // 👈 добавить

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

let appMounted = false;

auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user?.email || 'No user');
  if (!appMounted) {
    app.mount('#app');
    appMounted = true;
  }
});