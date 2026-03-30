import { createRouter, createWebHistory } from 'vue-router';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true },
    props: route => ({ mode: route.query.mode })
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },

  // ==================== ОБЩЕСТВОЗНАНИЕ (СТУДЕНТ) ====================
  {
    path: '/student',
    name: 'Student',
    component: () => import('@/views/student/StudentView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/theory',
    name: 'StudentTheory',
    component: () => import('@/views/student/TheoryView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/theory/:topicId',
    name: 'StudentTheoryDetail',
    component: () => import('@/views/student/TheoryDetailView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/practice',
    name: 'StudentPractice',
    component: () => import('@/views/student/PracticeView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/cards',
    name: 'StudentCards',
    component: () => import('@/views/student/CardsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/homework',
    name: 'StudentHomework',
    component: () => import('@/views/student/HomeworkView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/task/:id',
    name: 'StudentTask',
    component: () => import('@/views/student/TaskView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/results/:id',
    name: 'StudentResults',
    component: () => import('@/views/student/ResultsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/student/stats',
    name: 'StudentStats',
    component: () => import('@/views/student/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },

  // ==================== ОБЩЕСТВОЗНАНИЕ (УЧИТЕЛЬ) ====================
  {
    path: '/teacher',
    name: 'Teacher',
    component: () => import('@/views/teacher/TeacherView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/students',
    name: 'TeacherStudents',
    component: () => import('@/views/teacher/StudentsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/classes',
    name: 'TeacherClasses',
    component: () => import('@/views/teacher/ClassesView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/check',
    name: 'TeacherCheck',
    component: () => import('@/views/teacher/CheckView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/stats',
    name: 'TeacherStats',
    component: () => import('@/views/teacher/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/library',
    name: 'TeacherLibrary',
    component: () => import('@/views/teacher/LibraryView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/exams',
    name: 'TeacherExams',
    component: () => import('@/views/teacher/ExamsView.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/exams/:id',
    name: 'TeacherExamEdit',
    component: () => import('@/views/teacher/ExamEditor.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },
  {
    path: '/teacher/exams/create',
    name: 'TeacherExamCreate',
    component: () => import('@/views/teacher/ExamEditor.vue'),
    meta: { requiresAuth: true, subject: 'social' }
  },

  // ==================== КИТАЙСКИЙ ЯЗЫК (СТУДЕНТ) ====================
  {
    path: '/chinese/lessons',
    name: 'ChineseLessons',
    component: () => import('@/views/chinese/LessonsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/lesson/:id',
    name: 'ChineseLesson',
    component: () => import('@/views/chinese/LessonScreen.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/vocabulary',
    name: 'ChineseVocabulary',
    component: () => import('@/views/chinese/VocabularyView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/grammar',
    name: 'ChineseGrammar',
    component: () => import('@/views/chinese/GrammarView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/readings',
    name: 'ChineseReadings',
    component: () => import('@/views/chinese/ReadingsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/exams',
    name: 'ChineseExams',
    component: () => import('@/views/chinese/ExamsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/exam/:id',
    name: 'ChineseExam',
    component: () => import('@/views/chinese/ExamSession.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/packs',
    name: 'ChinesePacks',
    component: () => import('@/views/chinese/PacksView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/pack/:id/study',
    name: 'ChinesePackStudy',
    component: () => import('@/views/chinese/PackStudy.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/practice',
    name: 'ChinesePractice',
    component: () => import('@/views/chinese/PracticeView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/chinese/stats',
    name: 'ChineseStats',
    component: () => import('@/views/chinese/StatsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },

  // ==================== КИТАЙСКИЙ ЯЗЫК (УЧИТЕЛЬ) – пока заглушки ====================
  {
    path: '/teacher/chinese/students',
    name: 'TeacherChineseStudents',
    component: () => import('@/views/teacher/ChineseStudentsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/teacher/chinese/exams',
    name: 'TeacherChineseExams',
    component: () => import('@/views/teacher/ChineseExamsView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  },
  {
    path: '/teacher/chinese/check',
    name: 'TeacherChineseCheck',
    component: () => import('@/views/teacher/ChineseCheckView.vue'),
    meta: { requiresAuth: true, subject: 'chinese' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Кэш ролей
let userRoleCache = null;
let cachedUid = null;

const getUserRole = async (uid) => {
  if (cachedUid === uid && userRoleCache !== null) {
    return userRoleCache;
  }
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      userRoleCache = role;
      cachedUid = uid;
      return role;
    }
    return null;
  } catch (error) {
    console.error('Ошибка получения роли:', error);
    return null;
  }
};

const clearSessionAndRedirect = async (next) => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Ошибка выхода:', e);
  }
  userRoleCache = null;
  cachedUid = null;
  localStorage.removeItem('lastLoginDate');
  localStorage.removeItem('streak');
  localStorage.removeItem('student_dashboard');
  localStorage.removeItem('teacher_dashboard');
  localStorage.removeItem('teacher_stats');
  next('/login');
};

router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser;

  // Страницы для гостей
  if (to.meta.requiresGuest) {
    if (user) {
      const role = await getUserRole(user.uid);
      if (role === null) {
        await clearSessionAndRedirect(next);
        return;
      }
      if (role === 'teacher') {
        next('/teacher');
      } else {
        next('/student');
      }
    } else {
      next();
    }
    return;
  }

  // Страницы, требующие авторизации
  if (to.meta.requiresAuth) {
    if (!user) {
      next('/login');
      return;
    }

    const role = await getUserRole(user.uid);
    if (role === null) {
      await clearSessionAndRedirect(next);
      return;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await clearSessionAndRedirect(next);
      return;
    }

    // Проверка доступа в зависимости от предмета
    const subject = to.meta.subject;

    // Для обществознания – проверяем роль
    if (subject === 'social') {
      if (to.path.startsWith('/teacher') && role !== 'teacher') {
        next('/student');
        return;
      }
      if (to.path.startsWith('/student') && role !== 'student') {
        next('/teacher');
        return;
      }
    }

    // Для китайского пока разрешаем всем (и ученикам, и учителям)
    // Но учительские страницы китайского пока заглушки
    if (subject === 'chinese') {
      // Если пользователь учитель, но идёт на ученическую страницу – ок
      // Если пользователь ученик, но идёт на учительскую – пока редирект на ученическую
      if (to.path.startsWith('/teacher/chinese') && role !== 'teacher') {
        next('/chinese/lessons');
        return;
      }
    }

    next();
    return;
  }

  next();
});

auth.onAuthStateChanged((user) => {
  if (!user) {
    userRoleCache = null;
    cachedUid = null;
  }
});

export default router;