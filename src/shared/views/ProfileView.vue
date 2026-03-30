<template>
  <div class="profile-view">
    <div class="profile-card">
      <div class="avatar-large">{{ userLogin.charAt(0).toUpperCase() }}</div>
      <h2>{{ userLogin }}</h2>
      <p class="email">{{ userEmail }}</p>
      <p class="role">{{ userRole === 'teacher' ? ' Учитель' : ' Ученик' }}</p>
      <div class="actions">
        <button @click="goBack" class="btn-back">Назад</button>
        <button @click="logout" class="btn-logout">Выйти из аккаунта</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const userLogin = ref('');
const userEmail = ref('');
const userRole = ref('');

const CACHE_TTL = 12 * 60 * 60 * 1000;

const getCachedData = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  } catch (e) {}
  return null;
};

const setCachedData = (key, data) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) return;
  const cached = getCachedData(`profile_${user.uid}`);
  if (cached) {
    userLogin.value = cached.userLogin;
    userEmail.value = cached.userEmail;
    userRole.value = cached.userRole;
    return;
  }
  userEmail.value = user.email;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    userLogin.value = userDoc.data().login;
    userRole.value = userDoc.data().role;
    setCachedData(`profile_${user.uid}`, { userLogin: userLogin.value, userEmail: userEmail.value, userRole: userRole.value });
  }
});

const goBack = () => router.push(userRole.value === 'teacher' ? '/teacher' : '/student');
const logout = async () => { await signOut(auth); router.push('/'); };
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.profile-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  padding: 2rem;
}

/* ========== КАРТОЧКА ПРОФИЛЯ ========== */
.profile-card {
  background: white;
  border-radius: 2rem;
  padding: 2rem;
  text-align: center;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-200);
  transition: transform 0.2s;
}
.profile-card:hover {
  transform: translateY(-4px);
}
.avatar-large {
  width: 80px;
  height: 80px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 auto 1rem;
}
.profile-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: var(--secondary);
}
.email {
  color: var(--gray-500);
  margin: 0.5rem 0;
}
.role {
  font-size: 1rem;
  color: var(--primary);
  margin: 0.5rem 0 1.5rem;
  font-weight: 500;
}

/* ========== КНОПКИ ========== */
.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.btn-back,
.btn-logout {
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-back {
  background: var(--secondary);
  color: white;
  border: none;
}
.btn-back:hover {
  background: var(--secondary-dark);
  transform: translateY(-1px);
}
.btn-logout {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}
.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: translateY(-1px);
}

/* ========== ТЁМНАЯ ТЕМА ========== */
body.dark-theme .profile-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
body.dark-theme .profile-card h2 {
  color: #ffffff;
}
body.dark-theme .email {
  color: var(--gray-400);
}
</style>