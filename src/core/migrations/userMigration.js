// src/core/migrations/userMigration.js
import { db } from '@core/services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Получить список пользователей, которым нужна миграция
 */
export async function getUsersNeedingMigration() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  const result = [];
  
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const missingFields = [];
    
    if (!data.email) missingFields.push('email');
    if (!data.displayName) missingFields.push('displayName');
    if (!data.subjects || data.subjects.length === 0) missingFields.push('subjects');
    
    if (missingFields.length > 0) {
      result.push({
        userId: userDoc.id,
        displayName: data.displayName || data.login,
        email: data.email,
        role: data.role,
        missingFields,
        currentData: data
      });
    }
  }
  
  return result;
}

/**
 * Обновить одного пользователя
 */
export async function updateUser(userId, updateData) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updateData,
    updatedAt: new Date()
  });
  console.log(`[Migration] Updated user: ${userId}`);
}