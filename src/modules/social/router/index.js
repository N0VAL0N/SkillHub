export default [
  // Студенческие маршруты
  {
    path: '/student',
    name: 'SocialStudentDashboard',
    component: () => import('@/modules/social/views/student/DashboardView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/theory',
    name: 'SocialStudentTheory',
    component: () => import('@/modules/social/views/student/TheoryView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/theory/:topicId',
    name: 'SocialStudentTheoryDetail',
    component: () => import('@/modules/social/views/student/TheoryDetailView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/practice',
    name: 'SocialStudentPractice',
    component: () => import('@/modules/social/views/student/PracticeView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/cards',
    name: 'SocialStudentCards',
    component: () => import('@/modules/social/views/student/CardsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/homework',
    name: 'SocialStudentHomework',
    component: () => import('@/modules/social/views/student/HomeworkView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/task/:id',
    name: 'SocialStudentTask',
    component: () => import('@/modules/social/views/student/TaskView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/results/:id',
    name: 'SocialStudentResults',
    component: () => import('@/modules/social/views/student/ResultsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },
  {
    path: '/student/stats',
    name: 'SocialStudentStats',
    component: () => import('@/modules/social/views/student/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'student' }
  },

  // Учительские маршруты
  {
    path: '/teacher',
    name: 'SocialTeacherDashboard',
    component: () => import('@/modules/social/views/teacher/DashboardView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/students',
    name: 'SocialTeacherStudents',
    component: () => import('@/modules/social/views/teacher/StudentsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/classes',
    name: 'SocialTeacherClasses',
    component: () => import('@/modules/social/views/teacher/ClassesView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/check',
    name: 'SocialTeacherCheck',
    component: () => import('@/modules/social/views/teacher/CheckView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/stats',
    name: 'SocialTeacherStats',
    component: () => import('@/modules/social/views/teacher/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/library',
    name: 'SocialTeacherLibrary',
    component: () => import('@/modules/social/views/teacher/LibraryView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/exams',
    name: 'SocialTeacherExams',
    component: () => import('@/modules/social/views/teacher/ExamsView.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/exams/:id',
    name: 'SocialTeacherExamEdit',
    component: () => import('@/modules/social/views/teacher/ExamEditor.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  },
  {
    path: '/teacher/exams/create',
    name: 'SocialTeacherExamCreate',
    component: () => import('@/modules/social/views/teacher/ExamEditor.vue'),
    meta: { requiresAuth: true, subject: 'social', role: 'teacher' }
  }
];