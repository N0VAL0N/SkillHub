// src/core/composables/useStreak.js
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@core/services/firebase';

const getMoscowDate = () => {
  const now = new Date();
  const moscowTime = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
  return moscowTime.toISOString().slice(0, 10);
};

/**
 * Обновляет streak пользователя (вызывать при входе и после выполнения заданий)
 */
export async function updateStreak(userId) {
  if (!userId) return 0;
  try {
    const userRef = doc(db, 'users', userId);
    let newStreak = 0;
    
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) return;
      
      const data = userSnap.data();
      const stats = data.stats || {};
      let currentStreak = stats.streak || 0;
      const lastActiveDate = data.lastActiveDate || null;
      const today = getMoscowDate();

      if (lastActiveDate !== today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        
        if (lastActiveDate === yesterdayStr) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        
        transaction.update(userRef, {
          lastActiveDate: today,
          'stats.streak': currentStreak,
          updatedAt: new Date()
        });
        newStreak = currentStreak;
      } else {
        newStreak = currentStreak;
      }
    });
    return newStreak;
  } catch (err) {
    console.error('updateStreak error:', err);
    return 0;
  }
}

/**
 * Получить текущий streak без обновления
 */
export async function getCurrentStreak(userId) {
  if (!userId) return 0;
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return 0;
    return userSnap.data().stats?.streak || 0;
  } catch (err) {
    console.error('getCurrentStreak error:', err);
    return 0;
  }
}