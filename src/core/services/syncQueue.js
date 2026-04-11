// src/core/services/syncQueue.js
import { openDB } from 'idb';

const DB_NAME = 'app_sync_queue';
const STORE_NAME = 'pending_ops';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('collection', 'collection');
          store.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }
  return dbPromise;
}

export async function enqueueOperation(collection, docId, data, operation = 'set') {
  const db = await getDB();
  let safeData;
  try {
    safeData = JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error('Cannot serialize data for queue:', e);
    return;
  }
  await db.add(STORE_NAME, {
    collection,
    docId,
    data: safeData,
    operation,
    timestamp: Date.now(),
    retries: 0
  });
}

export async function getOperationsByCollection(collection) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('collection');
  return index.getAll(collection);
}

export async function getAllPendingOperations() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function dequeueOperation(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearCollectionQueue(collection) {
  const db = await getDB();
  const ops = await getOperationsByCollection(collection);
  for (const op of ops) {
    await db.delete(STORE_NAME, op.id);
  }
}

export async function getQueueSize() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.length;
}

export async function clearAllQueues() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  for (const op of all) {
    await db.delete(STORE_NAME, op.id);
  }
  console.log(`[SyncQueue] Очищено ${all.length} операций`);
}