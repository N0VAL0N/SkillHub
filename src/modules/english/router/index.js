// src/modules/english/router/index.js
export default [
  {
    path: '/english',
    name: 'EnglishDashboard',
    component: () => import('../views/EnglishDashboard.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/lessons',
    name: 'EnglishLessons',
    component: () => import('../views/EnglishLessons.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/lesson/:id',
    name: 'EnglishLessonScreen',
    component: () => import('../views/EnglishLessonScreen.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/library',
    name: 'EnglishLibrary',
    component: () => import('../views/EnglishLibrary.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/packs',
    name: 'EnglishPacks',
    component: () => import('../views/EnglishPacks.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/pack/new',
    name: 'EnglishPackCreate',
    component: () => import('../views/EnglishPackEdit.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/pack/:id/edit',
    name: 'EnglishPackEdit',
    component: () => import('../views/EnglishPackEdit.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/pack/:id/study',
    name: 'EnglishPackStudy',
    component: () => import('../views/EnglishPackStudy.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/practice',
    name: 'EnglishPractice',
    component: () => import('../views/EnglishPractice.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/stats',
    name: 'EnglishStats',
    component: () => import('../views/EnglishStats.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts' }
  },
  {
    path: '/english/exam/:level',
    name: 'EnglishExam',
    component: () => import('../views/EnglishExam.vue'),
    meta: { requiresAuth: true, subject: 'english_ielts', layout: 'blank' }
  },
  {
  path: '/english/repeat',
  name: 'EnglishRepeat',
  component: () => import('../views/EnglishRepeat.vue'),
  meta: { requiresAuth: true, subject: 'english_ielts' }
}
];