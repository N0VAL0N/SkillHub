/**
 * Глобальные константы приложения
 */

// ========== РОЛИ ПОЛЬЗОВАТЕЛЕЙ ==========
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// ========== ПРЕДМЕТЫ ==========
export const SUBJECTS = {
  SOCIAL: 'social',   // Обществознание
  CHINESE: 'chinese'  // Китайский язык
};

export const SUBJECTS_LIST = [
  { id: SUBJECTS.SOCIAL, name: 'Обществознание', icon: '⚖️', color: '#e67e22' },
  { id: SUBJECTS.CHINESE, name: 'Китайский язык', icon: '🐉', color: '#10b981' }
];

// ========== БЛОКИ ОБЩЕСТВОЗНАНИЯ ==========
export const SOCIAL_BLOCKS = [
  { id: 1, name: 'Человек и общество' },
  { id: 2, name: 'Экономика' },
  { id: 3, name: 'Социальные отношения' },
  { id: 4, name: 'Политика' },
  { id: 5, name: 'Право' }
];

// ========== УРОВНИ HSK (КИТАЙСКИЙ) ==========
export const HSK_LEVELS = ['1', '2', '3', '4', '5'];

export const HSK_LEVELS_WITH_NAMES = [
  { level: '1', name: 'HSK 1', wordsCount: 150 },
  { level: '2', name: 'HSK 2', wordsCount: 300 },
  { level: '3', name: 'HSK 3', wordsCount: 600 },
  { level: '4', name: 'HSK 4', wordsCount: 1200 },
  { level: '5', name: 'HSK 5', wordsCount: 2500 }
];

// ========== ТИПЫ ЗАДАНИЙ ==========
export const QUESTION_TYPES = {
  // Общие
  CHOICE: 'choice',
  MATCH: 'match',
  SHORT: 'short',
  ESSAY: 'essay',
  TEXT_ANALYSIS: 'text_analysis',
  PLAN: 'plan',
  TASK: 'task',
  LAW_TASK: 'law_task',
  GRAPH_ANALYSIS: 'graph_analysis',

  // Китайский
  LISTENING: 'listening',
  READING: 'reading',
  FILL_BLANK: 'fill-blank',
  TRANSLATE: 'translate',
  MATCH_PINYIN: 'match-pinyin',
  MATCH_TRANSLATION: 'match-translation',
  SENTENCE_ORDER: 'sentence-order',
  DIALOGUE_TRUEFALSE: 'dialogue-truefalse'
};

// ========== СТАТУСЫ ЗАДАНИЙ ==========
export const SUBMISSION_STATUS = {
  PENDING: 'pending',      // На проверке
  GRADED: 'graded',        // Проверено
  REJECTED: 'rejected'     // Отклонено
};

// ========== СТАТУСЫ ПРОГРЕССА ==========
export const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// ========== КЛЮЧИ LOCALSTORAGE ==========
export const STORAGE_KEYS = {
  THEME: 'theme',
  STREAK: 'streak',
  LAST_LOGIN_DATE: 'lastLoginDate',
  CURRENT_SUBJECT: 'currentSubject',
  STUDENT_FONT_SIZE: 'studentFontSize',
  TEACHER_FONT_SIZE: 'teacherFontSize',
  LIBRARY_FONT_SIZE: 'libraryFontSize'
};

// ========== НАСТРОЙКИ КЭШИРОВАНИЯ ==========
export const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 часов

// ========== КОД УЧИТЕЛЯ (для регистрации) ==========
export const TEACHER_INVITE_CODE = import.meta.env.VITE_TEACHER_INVITE_CODE || 'TEACHER2026';

// ========== ВАРИАНТЫ ОЦЕНОК ==========
export const GRADE_OPTIONS = (() => {
  const options = [];
  for (let i = 0; i <= 100; i += 5) {
    options.push({ value: i, label: i.toString() });
  }
  return options;
})();

// ========== ВАРИАНТЫ ВРЕМЕНИ ДЛЯ ТАЙМЕРА ==========
export const TIMER_OPTIONS = [
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
  { value: 180, label: '3 часа' },
  { value: 210, label: '3.5 часа (ЕГЭ)' }
];

// ========== КОНСТАНТЫ ДЛЯ СМ-2 АЛГОРИТМА ==========
export const SM2 = {
  MIN_EASINESS: 1.3,
  DEFAULT_EASINESS: 2.5,
  QUALITY_CORRECT_NO_HINT: 5,
  QUALITY_CORRECT_WITH_HINT: 3,
  QUALITY_INCORRECT: 1
};