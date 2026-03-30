import { auth, db } from '@/core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

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

export async function globalGuard(to, from, next) {
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

    // Проверка предметной принадлежности (если указана)
    const subject = to.meta.subject;
    if (subject === 'social') {
      if (to.path.startsWith('/teacher') && role !== 'teacher') {
        next('/student');
        return;
      }
      if (to.path.startsWith('/student') && role !== 'student') {
        next('/teacher');
        return;
      }
    } else if (subject === 'chinese') {
      if (to.path.startsWith('/teacher/chinese') && role !== 'teacher') {
        next('/chinese/lessons');
        return;
      }
    }

    next();
    return;
  }

  next();
}