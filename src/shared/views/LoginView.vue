<template>
  <div class="login-container">
    <div class="login-card">
      <h1>ЕГЭ‑ПРО</h1>
      <p>{{ isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт' }}</p>
      <form @submit.prevent="handleSubmit">
        <input
          v-model="login"
          type="text"
          placeholder="Логин"
          required
          :disabled="loading"
        />
        <div class="password-field">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Пароль"
            required
            :disabled="loading"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Выбор роли (только при регистрации) -->
        <div v-if="!isLogin" class="role-selector">
          <label class="role-option">
            <input type="radio" v-model="selectedRole" value="student" />
            <span> Ученик</span>
          </label>
          <label class="role-option">
            <input type="radio" v-model="selectedRole" value="teacher" />
            <span> Учитель</span>
          </label>
        </div>

        <!-- Поле для кода учителя (только при регистрации учителя) -->
        <div v-if="!isLogin && selectedRole === 'teacher'" class="form-group">
          <input
            v-model="inviteCode"
            type="text"
            placeholder="Код доступа учителя"
            class="form-input"
            required
          />
        </div>

        <div class="options">
          <div class="remember-me">
            <input type="checkbox" v-model="rememberMe" id="remember" />
            <label for="remember">Запомнить меня</label>
          </div>
        </div>

        <div class="buttons">
          <button type="submit" :disabled="loading">
            {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
          </button>
          <button type="button" @click="toggleMode" :disabled="loading">
            {{ isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти' }}
          </button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '@core/services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const router = useRouter();

const isLogin = ref(true);
const login = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);
const selectedRole = ref('student');
const inviteCode = ref('');

const TEACHER_CODE = import.meta.env.VITE_TEACHER_INVITE_CODE || 'TEACHER2026';

// Генерация уникального фейкового email
const generateFakeEmail = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}@egepro.local`;
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  login.value = '';
  password.value = '';
  error.value = '';
  selectedRole.value = 'student';
  inviteCode.value = '';
};

const handleSubmit = async () => {
  if (!login.value.trim()) {
    error.value = 'Введите логин';
    return;
  }
  if (password.value.length < 6) {
    error.value = 'Пароль должен быть не менее 6 символов';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    let persistenceType;
    if (Capacitor.isNativePlatform()) {
      persistenceType = indexedDBLocalPersistence;
    } else {
      persistenceType = rememberMe.value ? browserLocalPersistence : browserSessionPersistence;
    }
    await setPersistence(auth, persistenceType);

    if (isLogin.value) {
      // === ВХОД ===
      const q = query(collection(db, 'users'), where('login', '==', login.value.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Пользователь с таким логином не найден');
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const fakeEmail = userData.authEmail;

      if (!fakeEmail) {
        throw new Error('Некорректные данные пользователя: отсутствует authEmail');
      }

      // Просто пытаемся войти — если пользователь существует, всё пройдёт
      await signInWithEmailAndPassword(auth, fakeEmail, password.value);

      if (userData.role === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
      
    } else {
      // === РЕГИСТРАЦИЯ ===
      // Проверяем, не занят ли логин
      const q = query(collection(db, 'users'), where('login', '==', login.value.trim()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error('Логин уже занят');
      }

      // Проверка кода для учителя
      if (selectedRole.value === 'teacher' && inviteCode.value !== TEACHER_CODE) {
        throw new Error('Неверный код доступа для учителя');
      }

      // Генерируем фейковый email
      const fakeEmail = generateFakeEmail();

      // Создаём пользователя в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password.value);
      const uid = userCredential.user.uid;

      // Сохраняем данные в Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        login: login.value.trim(),
        role: selectedRole.value,
        authEmail: fakeEmail,
        createdAt: new Date(),
      });

      error.value = 'Регистрация успешна! Теперь войдите.';
      isLogin.value = true;
      login.value = '';
      password.value = '';
    }
  } catch (err) {
    console.error('Ошибка:', err);
    
    if (err.code === 'auth/user-not-found') {
      error.value = 'Пользователь не найден';
    } else if (err.code === 'auth/wrong-password') {
      error.value = 'Неверный пароль';
    } else if (err.code === 'auth/email-already-in-use') {
      error.value = 'Этот email уже используется. Попробуйте другой логин.';
    } else if (err.message) {
      error.value = err.message;
    } else {
      error.value = 'Ошибка. Попробуйте позже';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* ========== КАРТОЧКА ВХОДА ========== */
.login-card {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}
.login-card h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  text-align: center;
  color: var(--secondary);
}
.login-card > p {
  text-align: center;
  color: var(--gray-500);
  margin-bottom: 1.5rem;
}

/* ========== ПОЛЯ ВВОДА ========== */
input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
}
input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.1);
}
.password-field {
  position: relative;
  margin-bottom: 1rem;
}
.password-field input {
  margin-bottom: 0;
  padding-right: 40px;
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--gray-500);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toggle-password:hover {
  color: var(--primary);
}

/* ========== ВЫБОР РОЛИ ========== */
.role-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}
.role-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--gray-700);
}
.role-option input {
  width: auto;
  margin: 0;
}

/* ========== ОПЦИИ ========== */
.options {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}
.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.remember-me input {
  width: auto;
  margin: 0;
}
.remember-me label {
  color: var(--gray-600);
  cursor: pointer;
}

/* ========== КНОПКИ ========== */
.buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
button[type="submit"],
button[type="button"] {
  padding: 0.75rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
button[type="submit"] {
  background: var(--primary);
  color: white;
}
button[type="submit"]:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
button[type="button"] {
  background: transparent;
  color: var(--secondary);
}
button[type="button"]:hover:not(:disabled) {
  color: var(--primary);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== ОШИБКИ ========== */
.error {
  color: var(--danger);
  margin-top: 1rem;
  text-align: center;
  font-size: 0.85rem;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
}
</style>