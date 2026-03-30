export default [
  // Студенческие маршруты
  {
    path: '/chinese',
    name: 'ChineseDashboard',
    component: () => import('@/modules/chinese/views/student/DashboardView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/lessons',
    name: 'ChineseLessons',
    component: () => import('@/modules/chinese/views/student/LessonsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/lesson/:id',
    name: 'ChineseLesson',
    component: () => import('@/modules/chinese/views/student/LessonScreen.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
  path: '/chinese/library',
  name: 'ChineseLibrary',
  component: () => import('@/modules/chinese/views/student/LibraryView.vue'),
  meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/exams',
    name: 'ChineseExams',
    component: () => import('@/modules/chinese/views/student/ExamsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/exam/:id',
    name: 'ChineseExam',
    component: () => import('@/modules/chinese/views/student/ExamSession.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/packs',
    name: 'ChinesePacks',
    component: () => import('@/modules/chinese/views/student/PacksView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/pack/:id/study',
    name: 'ChinesePackStudy',
    component: () => import('@/modules/chinese/views/student/PackStudy.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/practice',
    name: 'ChinesePractice',
    component: () => import('@/modules/chinese/views/student/PracticeView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },
  {
    path: '/chinese/stats',
    name: 'ChineseStats',
    component: () => import('@/modules/chinese/views/student/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'student' }
  },

  // Учительские маршруты (пока заглушки)
  {
    path: '/teacher/chinese',
    name: 'TeacherChineseDashboard',
    component: () => import('@/modules/chinese/views/teacher/DashboardView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'teacher' }
  },
  {
    path: '/teacher/chinese/students',
    name: 'TeacherChineseStudents',
    component: () => import('@/modules/chinese/views/teacher/StudentsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'teacher' }
  },
  {
    path: '/teacher/chinese/exams',
    name: 'TeacherChineseExams',
    component: () => import('@/modules/chinese/views/teacher/ExamsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'teacher' }
  },
  {
    path: '/teacher/chinese/check',
    name: 'TeacherChineseCheck',
    component: () => import('@/modules/chinese/views/teacher/CheckView.vue'),
    meta: { requiresAuth: true, subject: 'chinese', role: 'teacher' }
  }
];