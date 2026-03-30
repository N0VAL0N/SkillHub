import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, db } from '@/core/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const role = ref(null);
  const login = ref('');

  async function fetchUser() {
    const current = auth.currentUser;
    if (!current) {
      user.value = null;
      role.value = null;
      login.value = '';
      return;
    }
    user.value = current;
    const userDoc = await getDoc(doc(db, 'users', current.uid));
    if (userDoc.exists()) {
      role.value = userDoc.data().role;
      login.value = userDoc.data().login || current.email;
    }
  }

  async function logout() {
    await signOut(auth);
    user.value = null;
    role.value = null;
    login.value = '';
  }

  return {
    user,
    role,
    login,
    fetchUser,
    logout
  };
});