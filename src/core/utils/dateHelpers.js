export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('ru-RU');
}

export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const [date, time] = dateTimeStr.split(' ');
  if (!time) return date;
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year} ${time}`;
}

export function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'Вчера';
  return `${days} дн назад`;
}