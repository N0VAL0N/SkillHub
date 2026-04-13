// src/core/services/globalSync.js
import { flushQueue as flushEnglishQueue } from '@/modules/english/services/syncService';
// В будущем добавим для китайского и общаги

export async function refreshAllData(appStore) {
  if (!appStore) {
    console.warn('[globalSync] appStore not provided');
    return;
  }
  appStore.showToast('Обновление данных...', 'info');
  try {
    // 1. Отправляем очередь английского
    await flushEnglishQueue();
    
    // 2. Перезагружаем сторадж английского
    const { useEnglishProgressFirestore } = await import('@/modules/english/stores/englishProgressFirestore');
    const { useEnglishPackStore } = await import('@/modules/english/stores/englishPackStore');
    const { useEnglishSm2Store } = await import('@/modules/english/stores/englishSm2Store');
    
    const progressStore = useEnglishProgressFirestore();
    const packStore = useEnglishPackStore();
    const sm2Store = useEnglishSm2Store();
    
    await progressStore.refresh();
    await packStore.refreshPacks();
    await sm2Store.refresh();
    
    appStore.showToast('Данные обновлены', 'success');
  } catch (err) {
    console.error('Ошибка обновления:', err);
    appStore.showToast('Ошибка обновления данных', 'error');
  }
}