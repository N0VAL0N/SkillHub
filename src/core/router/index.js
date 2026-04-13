// src/core/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { globalGuard } from './guards';

import socialRoutes from '@/modules/social/router';
import chineseRoutes from '@/modules/chinese/router';
import englishRoutes from '@/modules/english/router';

import ComingSoon from '@/shared/components/ComingSoon.vue';

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

const placeholderStudentRoutes = [
  {
    path: '/student/math',
    name: 'StudentMath',
    component: ComingSoon,
    props: { subjectName: 'Математика' },
    meta: { requiresAuth: true, subject: 'math' }
  },
  {
    path: '/student/physics',
    name: 'StudentPhysics',
    component: ComingSoon,
    props: { subjectName: 'Физика' },
    meta: { requiresAuth: true, subject: 'physics' }
  },
  {
    path: '/student/info',
    name: 'StudentInfo',
    component: ComingSoon,
    props: { subjectName: 'Информатика' },
    meta: { requiresAuth: true, subject: 'info' }
  },
  {
    path: '/student/programming',
    name: 'StudentProgramming',
    component: ComingSoon,
    props: { subjectName: 'Программирование' },
    meta: { requiresAuth: true, subject: 'programming' }
  }
];

const placeholderTeacherRoutes = [
  {
    path: '/teacher/math',
    name: 'TeacherMath',
    component: ComingSoon,
    props: { subjectName: 'Математика (учитель)' },
    meta: { requiresAuth: true, role: 'teacher', subject: 'math' }
  },
  {
    path: '/teacher/physics',
    name: 'TeacherPhysics',
    component: ComingSoon,
    props: { subjectName: 'Физика (учитель)' },
    meta: { requiresAuth: true, role: 'teacher', subject: 'physics' }
  },
  {
    path: '/teacher/info',
    name: 'TeacherInfo',
    component: ComingSoon,
    props: { subjectName: 'Информатика (учитель)' },
    meta: { requiresAuth: true, role: 'teacher', subject: 'info' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...globalRoutes,
    ...socialRoutes,
    ...chineseRoutes,
    ...englishRoutes,
    ...placeholderStudentRoutes,
    ...placeholderTeacherRoutes
  ]
});

router.beforeEach(globalGuard);
export default router;