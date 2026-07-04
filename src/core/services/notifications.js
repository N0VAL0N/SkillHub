// src/core/services/notifications.js
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let isScheduled = false;

export async function scheduleDailyReminder(timeStr) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications only available on native platforms');
    return;
  }

  const [hour, minute] = timeStr.split(':').map(Number);
  
  // Отменяем предыдущие
  await cancelReminder();
  
  // Планируем новое
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'SkillHub',
        body: 'Не забудьте позаниматься сегодня!',
        id: 1,
        schedule: {
          on: {
            hour,
            minute
          },
          every: 'day',
          allowWhileIdle: true
        }
      }
    ]
  });
  
  isScheduled = true;
  console.log(`Daily reminder scheduled at ${timeStr}`);
}

export async function cancelReminder() {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  isScheduled = false;
}

export async function requestPermissions() {
  if (!Capacitor.isNativePlatform()) return true;
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}