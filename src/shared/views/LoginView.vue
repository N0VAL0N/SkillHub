<template>
  <div class="login-container">
    <div class="login-card">
      <h1>SkillHub</h1>
      <p>{{ isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт' }}</p>

      <form @submit.prevent="handleSubmit">
        <input
          v-model="loginOrEmail"
          type="text"
          :placeholder="isLogin ? 'Имя пользователя или email' : 'Имя пользователя'"
          required
          :disabled="loading"
        />

        <input
          v-if="!isLogin"
          v-model="email"
          type="email"
          placeholder="Email"
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
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <input
          v-if="!isLogin"
          v-model="confirmPassword"
          type="password"
          placeholder="Повторите пароль"
          required
          :disabled="loading"
        />

        <div v-if="!isLogin" class="role-selector">
          <label class="role-option">
            <input type="radio" v-model="selectedRole" value="student" />
            <span> Ученик</span>
          </label>
          <label class="role-option">
            <input type="radio" v-model="selectedRole" value="teacher" />
            <span>Учитель</span>
          </label>
        </div>

        <input
          v-if="!isLogin && selectedRole === 'teacher'"
          v-model="inviteCode"
          type="text"
          placeholder="Код доступа учителя"
          required
          :disabled="loading"
        />

        <!-- КАСТОМНЫЙ ВЫБОР ПРЕДМЕТОВ -->
        <div v-if="!isLogin" class="subjects-selection">
          <label class="subjects-label">Выберите предметы, которые изучаете:</label>
          <SubjectSelector
            v-model="selectedSubjects"
            :showActions="false"
            :filterPlanned="false"
          />
        </div>

        <div class="options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span>Запомнить меня</span>
          </label>
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

    <MigrationModal
      :isOpen="showMigrationModal"
      :userId="currentUserId"
      :missingFields="missingFields"
      :currentData="currentUserData"
      @save="handleMigrationSave"
      @skip="handleMigrationSkip"
      @close="showMigrationModal = false"
    />
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
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import MigrationModal from '@shared/components/MigrationModal.vue';
import SubjectSelector from '@shared/components/SubjectSelector.vue';
import { SUBJECTS } from '@core/constants/subjects';
import { useAppStore } from '@core/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

// Код учителя читаем из .env
const TEACHER_INVITE_CODE = import.meta.env.VITE_TEACHER_INVITE_CODE || 'TEACHER2026';

const isLogin = ref(true);
const loginOrEmail = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedRole = ref('student');
const inviteCode = ref('');
const selectedSubjects = ref([SUBJECTS.SOCIAL]);
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

const showMigrationModal = ref(false);
const currentUserId = ref('');
const currentUserData = ref({});
const missingFields = ref([]);

// Поиск пользователя по email или login
const findUser = async (value) => {
  const searchValue = value.trim().toLowerCase();
  const emailQuery = query(collection(db, 'users'), where('email', '==', searchValue));
  const emailSnapshot = await getDocs(emailQuery);
  if (!emailSnapshot.empty) return emailSnapshot.docs[0];
  const loginQuery = query(collection(db, 'users'), where('login', '==', searchValue));
  const loginSnapshot = await getDocs(loginQuery);
  if (!loginSnapshot.empty) return loginSnapshot.docs[0];
  return null;
};

// Проверка недостающих полей
const checkMissingFields = (userData) => {
  const missing = [];
  if (!userData.email) missing.push('email');
  if (!userData.displayName) missing.push('displayName');
  if (!userData.subjects || userData.subjects.length === 0) missing.push('subjects');
  return missing;
};

// Авто-заполнение дефолтных значений
const autoFillDefaults = async (userId, userData) => {
  const updateData = {};
  let needsUpdate = false;
  if (!userData.settings) {
    updateData.settings = { theme: 'light', fontSize: 16, notifications: true };
    needsUpdate = true;
  }
  if (!userData.stats) {
    updateData.stats = { totalTasks: 0, correctAnswers: 0, streak: 0, lastActive: new Date() };
    needsUpdate = true;
  }
  if (userData.isActive === undefined) {
    updateData.isActive = true;
    needsUpdate = true;
  }
  if (!userData.classes) {
    updateData.classes = {};
    needsUpdate = true;
  }
  if (needsUpdate) {
    updateData.updatedAt = new Date();
    await updateDoc(doc(db, 'users', userId), updateData);
    return { ...userData, ...updateData };
  }
  return userData;
};

const handleMigrationSave = async (formData) => {
  try {
    const userRef = doc(db, 'users', currentUserId.value);
    const updateData = { updatedAt: new Date() };
    if (formData.email) updateData.email = formData.email.trim().toLowerCase();
    if (formData.displayName) updateData.displayName = formData.displayName.trim();
    if (formData.subjects && formData.subjects.length > 0) updateData.subjects = formData.subjects;
    await updateDoc(userRef, updateData);
    showMigrationModal.value = false;
    const userDoc = await getDoc(userRef);
    const role = userDoc.data().role;
    if (role === 'teacher') router.push('/teacher');
    else router.push('/student');
  } catch (err) {
    console.error(err);
    error.value = 'Ошибка сохранения данных';
    appStore.showToast('Ошибка сохранения данных', 'error');
  }
};

const handleMigrationSkip = () => {
  showMigrationModal.value = false;
  if (currentUserData.value.role === 'teacher') router.push('/teacher');
  else router.push('/student');
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  loginOrEmail.value = '';
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  selectedRole.value = 'student';
  inviteCode.value = '';
  selectedSubjects.value = [SUBJECTS.SOCIAL];
  error.value = '';
};

const handleSubmit = async () => {
  if (!loginOrEmail.value.trim()) {
    error.value = isLogin.value ? 'Введите имя пользователя или email' : 'Введите имя пользователя';
    appStore.showToast(error.value, 'error');
    return;
  }

  if (!isLogin.value) {
    if (!email.value.trim() || !email.value.includes('@')) {
      error.value = 'Введите корректный email';
      appStore.showToast(error.value, 'error');
      return;
    }
    if (password.value.length < 6) {
      error.value = 'Пароль должен быть не менее 6 символов';
      appStore.showToast(error.value, 'error');
      return;
    }
    if (password.value !== confirmPassword.value) {
      error.value = 'Пароли не совпадают';
      appStore.showToast(error.value, 'error');
      return;
    }
    if (selectedSubjects.value.length === 0) {
      error.value = 'Выберите хотя бы один предмет';
      appStore.showToast(error.value, 'error');
      return;
    }
  } else {
    if (password.value.length < 6) {
      error.value = 'Пароль должен быть не менее 6 символов';
      appStore.showToast(error.value, 'error');
      return;
    }
  }

  loading.value = true;
  error.value = '';

  try {
    await setPersistence(auth, rememberMe.value ? browserLocalPersistence : browserSessionPersistence);

    if (isLogin.value) {
      // ВХОД
      const userDoc = await findUser(loginOrEmail.value.trim());
      if (!userDoc) throw new Error('Пользователь не найден');
      const userData = userDoc.data();
      const userEmail = userData.email;
      if (!userEmail) throw new Error('У пользователя нет email');
      await signInWithEmailAndPassword(auth, userEmail, password.value);
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        error.value = 'Пожалуйста, подтвердите email. Проверьте почту.';
        appStore.showToast(error.value, 'error');
        loading.value = false;
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), { lastLoginAt: new Date(), updatedAt: new Date() });
      let freshUserData = await autoFillDefaults(user.uid, userData);
      currentUserId.value = user.uid;
      currentUserData.value = freshUserData;
      const missing = checkMissingFields(freshUserData);
      if (missing.length > 0) {
        missingFields.value = missing;
        showMigrationModal.value = true;
      } else {
        if (freshUserData.role === 'teacher') router.push('/teacher');
        else router.push('/student');
      }
    } else {
      // РЕГИСТРАЦИЯ
      const loginName = loginOrEmail.value.trim().toLowerCase();
      const loginQuery = query(collection(db, 'users'), where('login', '==', loginName));
      const loginSnapshot = await getDocs(loginQuery);
      if (!loginSnapshot.empty) throw new Error('Имя пользователя уже занято');
      const emailQuery = query(collection(db, 'users'), where('email', '==', email.value.toLowerCase()));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) throw new Error('Email уже используется');
      
      // Проверка кода учителя
      if (selectedRole.value === 'teacher' && inviteCode.value !== TEACHER_INVITE_CODE) {
        throw new Error('Неверный код доступа для учителя');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        login: loginName,
        displayName: loginName,
        email: email.value.toLowerCase(),
        role: selectedRole.value,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        classes: {},
        subjects: selectedSubjects.value,
        settings: { theme: 'light', fontSize: 16, notifications: true },
        stats: { totalTasks: 0, correctAnswers: 0, streak: 0, lastActive: new Date() }
      });
      appStore.showToast('Регистрация прошла успешно! Проверьте почту для подтверждения.', 'success');
      if (selectedRole.value === 'teacher') router.push('/teacher');
      else router.push('/student');
    }
  } catch (err) {
    console.error(err);
    let message = 'Ошибка. Попробуйте позже';
    if (err.code === 'auth/user-not-found') message = 'Пользователь не найден';
    else if (err.code === 'auth/wrong-password') message = 'Неверный пароль';
    else if (err.code === 'auth/email-already-in-use') message = 'Email уже используется';
    else if (err.code === 'auth/invalid-email') message = 'Неверный формат email';
    else if (err.code === 'auth/weak-password') message = 'Слишком слабый пароль';
    else if (err.message) message = err.message;
    error.value = message;
    appStore.showToast(message, 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

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
  color: #2c3e50;
}

.login-card > p {
  text-align: center;
  color: #64748b;
  margin-bottom: 1.5rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #e67e22;
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
  color: #94a3b8;
}

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
  color: #334155;
}

.role-option input {
  width: auto;
  margin: 0;
}

.subjects-selection {
  margin: 1rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.subjects-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #334155;
  font-size: 0.875rem;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.25rem;
}

.subject-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
}

.subject-checkbox:hover {
  background: #f1f5f9;
}

.subject-checkbox input {
  width: auto;
  margin: 0;
}

.subject-icon {
  font-size: 1rem;
}

.subject-name {
  color: #334155;
}

.options {
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #64748b;
}

.remember-me input {
  width: auto;
  margin: 0;
}

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
  background: #e67e22;
  color: white;
}

button[type="submit"]:hover:not(:disabled) {
  background: #d35400;
}

button[type="button"] {
  background: transparent;
  color: #2c3e50;
}

button[type="button"]:hover:not(:disabled) {
  color: #e67e22;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.85rem;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
}

body.dark-theme .login-card {
  background: #1e293b;
}

body.dark-theme .login-card h1 {
  color: #f1f5f9;
}

body.dark-theme .login-card > p {
  color: #94a3b8;
}

body.dark-theme input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

body.dark-theme .role-option {
  color: #cbd5e1;
}

body.dark-theme .subjects-selection {
  border-color: #334155;
}

body.dark-theme .subjects-label {
  color: #cbd5e1;
}

body.dark-theme .subject-name {
  color: #cbd5e1;
}

body.dark-theme .subject-checkbox:hover {
  background: #334155;
}

body.dark-theme .options {
  color: #94a3b8;
}

body.dark-theme button[type="button"] {
  color: #94a3b8;
}

body.dark-theme button[type="button"]:hover:not(:disabled) {
  color: #e67e22;
}
</style>