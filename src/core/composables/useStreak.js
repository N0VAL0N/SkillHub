// src/core/composables/useStreak.js
import { auth, db } from '@core/services/firebase';
import { doc, runTransaction } from 'firebase/firestore';

const getMoscowDate = () => {
  const now = new Date();
  const moscowTime = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
  return moscowTime.toISOString().slice(0, 10);
};

export async function updateStreak(userId) {
  if (!userId) return 0;
  try {
    const userRef = doc(db, 'users', userId);
    
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) return 0;
      
      const userData = userSnap.data();
      const stats = userData.stats || {};
      let currentStreak = stats.streak || 0;
      const lastActiveDate = userData.lastActiveDate || null;
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
          stats: { streak: currentStreak },
          updatedAt: new Date()
        });
      }
      
      return currentStreak;
    });
    
    return result;
  } catch (err) {
    console.error('updateStreak error:', err);
    return 0;
  }
}