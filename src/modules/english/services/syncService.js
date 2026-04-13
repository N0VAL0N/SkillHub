// src/modules/english/services/syncService.js
import { auth, db } from '@core/services/firebase';
import { doc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { getAllPendingOperations, dequeueOperation } from '@core/services/syncQueue';
import { CACHE_TTL } from '@core/constants';

async function sendOperation(op) {
  const user = auth.currentUser;
  if (!user) return false;
  
  let docRef;
  
  if (op.collection === 'englishProgress') {
    docRef = doc(db, 'english', op.docId);
  } else if (op.collection === 'englishPacks') {
    const userId = op.data?.userId || user.uid;
    docRef = doc(db, `english/${userId}/packs/${op.docId}`);
    if (op.data && op.data.userId) {
      delete op.data.userId;
    }
  } else {
    docRef = doc(db, op.collection, op.docId);
  }
  
  try {
    switch (op.operation) {
      case 'set':
        await setDoc(docRef, op.data, { merge: true });
        break;
      case 'update':
        await updateDoc(docRef, op.data);
        break;
      case 'arrayUnion':
        for (const [field, values] of Object.entries(op.data)) {
          await updateDoc(docRef, { [field]: arrayUnion(...values) });
        }
        break;
      case 'arrayRemove':
        for (const [field, values] of Object.entries(op.data)) {
          await updateDoc(docRef, { [field]: arrayRemove(...values) });
        }
        break;
      case 'delete':
        await deleteDoc(docRef);
        break;
    }
    return true;
  } catch (err) {
    if (err.code === 'not-found' && (op.operation === 'update' || op.operation === 'arrayUnion' || op.operation === 'arrayRemove')) {
      try {
        let initialData = {};
        if (op.operation === 'arrayUnion' || op.operation === 'arrayRemove') {
          for (const [field, values] of Object.entries(op.data)) {
            initialData[field] = [];
          }
        } else {
          initialData = op.data;
        }
        await setDoc(docRef, initialData, { merge: true });
        if (op.operation === 'arrayUnion') {
          for (const [field, values] of Object.entries(op.data)) {
            await updateDoc(docRef, { [field]: arrayUnion(...values) });
          }
        } else if (op.operation === 'arrayRemove') {
          for (const [field, values] of Object.entries(op.data)) {
            await updateDoc(docRef, { [field]: arrayRemove(...values) });
          }
        } else if (op.operation === 'update') {
          await updateDoc(docRef, op.data);
        }
        return true;
      } catch (createErr) {
        console.error('Ошибка создания документа:', createErr);
        return false;
      }
    }
    console.error(`Ошибка синхронизации ${op.collection}/${op.docId}:`, err);
    return false;
  }
}

export async function flushQueue() {
  const user = auth.currentUser;
  if (!user) return;
  
  let operations = await getAllPendingOperations();
  if (operations.length === 0) return;
  
  // Группируем операции по ключу collection+docId, оставляем только последнюю по timestamp
  const latestOps = new Map();
  for (const op of operations) {
    const key = `${op.collection}|${op.docId}`;
    const existing = latestOps.get(key);
    if (!existing || op.timestamp > existing.timestamp) {
      latestOps.set(key, op);
    }
  }
  
  const uniqueOperations = Array.from(latestOps.values());
  console.log(`[Sync] Отправка ${uniqueOperations.length} операций (из ${operations.length} уникальных)...`);
  
  let successCount = 0;
  for (const op of uniqueOperations) {
    const success = await sendOperation(op);
    if (success) {
      await dequeueOperation(op.id);
      successCount++;
    }
  }
  
  // Удаляем все старые операции, которые не вошли в uniqueOperations
  for (const op of operations) {
    if (!uniqueOperations.includes(op)) {
      await dequeueOperation(op.id);
    }
  }
  
  const remaining = (await getAllPendingOperations()).length;
  console.log(`[Sync] Отправлено ${successCount}. Осталось в очереди: ${remaining}`);
}

let syncTimer = null;

export function startPeriodicSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    flushQueue();
  }, CACHE_TTL);
}

export function stopPeriodicSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushQueue();
  });
}