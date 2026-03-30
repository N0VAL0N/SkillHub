import { createRouter, createWebHistory } from 'vue-router';
import { globalGuard } from './guards';

// Импортируем маршруты модулей
import socialRoutes from '@/modules/social/router';
import chineseRoutes from '@/modules/chinese/router';

// Глобальные маршруты
const globalRoutes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/shared/views/LandingView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/shared/views/LoginView.vue'),
    meta: { requiresGuest: true },
    props: route => ({ mode: route.query.mode })
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/shared/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes: [...globalRoutes, ...socialRoutes, ...chineseRoutes]
});

router.beforeEach(globalGuard);

export default router;