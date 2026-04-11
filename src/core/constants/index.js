// src/core/constants/index.js
import { SUBJECTS, SUBJECTS_LIST, getSubjectById, getSubjectsByCategory, getActiveSubjects } from './subjects';

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// ========== ТИПЫ ЗАДАНИЙ ПО ПРЕДМЕТАМ ==========
export const QUESTION_TYPES = {
  // --- Общие (базовые) ---
  CHOICE: 'choice',           // Выбор одного правильного ответа
  SHORT: 'short',             // Краткий ответ (число, слово)
  MATCH: 'match',             // Установление соответствия

  // --- Математика (ЕГЭ) ---
  CALC_BASIC: 'calc_basic',   // Вычисления и преобразования
  TEXT_PROBLEM: 'text_problem', // Текстовая задача
  GRAPH_ANALYSIS: 'graph_analysis', // Анализ графика / диаграммы
  EQUATION: 'equation',       // Решение уравнения
  INEQUALITY: 'inequality',   // Решение неравенства
  ECONOMIC_TASK: 'economic_task', // Экономическая задача
  PLANIMETRY: 'planimetry',   // Планиметрия
  STEREOMETRY: 'stereometry', // Стереометрия
  PARAMETER: 'parameter',     // Задача с параметром
  INTEGER_SOLVE: 'integer_solve', // Целые числа / теория чисел

  // --- Физика (ЕГЭ) ---
  MULTIPLE_CHOICE: 'multiple_choice', // Множественный выбор (2 из 5)
  QUALITATIVE_TASK: 'qualitative_task', // Качественная задача (объяснение явления)
  CALC_SHORT: 'calc_short',   // Вычислительная задача (краткий ответ)
  MATCHING: 'matching',       // Установление соответствия (графики и величины)
  EXTENDED_SOLUTION: 'extended_solution', // Развернутое решение (с обоснованием)

  // --- Информатика (ЕГЭ) ---
  COMPUTING: 'computing',     // Вычисление (системы счисления, логика)
  ALGORITHM_CODE: 'algorithm_code', // Написание кода / алгоритма
  TABLE_PROCESSING: 'table_processing', // Обработка таблиц (Excel)
  GRAPH_PATH: 'graph_path',   // Поиск путей в графе / анализ таблиц
  INFO_SEARCH: 'info_search', // Информационный поиск (базы данных)

  // --- Английский (IELTS) ---
  // Аудирование (Listening)
  LISTEN_MULTIPLE_CHOICE: 'listen_multiple_choice',
  LISTEN_FORM_COMPLETION: 'listen_form_completion',
  LISTEN_MAP_PLAN: 'listen_map_plan',
  // Чтение (Reading)
  READ_MULTIPLE_CHOICE: 'read_multiple_choice',
  READ_TRUE_FALSE: 'read_true_false',
  READ_MATCHING: 'read_matching',
  // Письмо (Writing)
  WRITE_DESCRIBE_CHART: 'write_describe_chart', // Task 1 (описание графика/схемы)
  WRITE_ESSAY: 'write_essay', // Task 2 (эссе)
  // Говорение (Speaking)
  SPEAK_MONOLOGUE: 'speak_monologue', // Индивидуальное высказывание (cue card)
  SPEAK_DIALOGUE: 'speak_dialogue',   // Диалог с экзаменатором

  // --- Китайский (HSK) ---
  LISTENING: 'listening',
  READING: 'reading',
  FILL_BLANK: 'fill-blank',
  TRANSLATE: 'translate',
  MATCH_PINYIN: 'match-pinyin',
  MATCH_TRANSLATION: 'match-translation',
  SENTENCE_ORDER: 'sentence-order',
  DIALOGUE_TRUEFALSE: 'dialogue-truefalse',

  // --- Программирование (заглушка) ---
  CODE_TASK: 'code_task',
  ALGO_THEORY: 'algo_theory'
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending',      // На проверке
  GRADED: 'graded',        // Проверено
  REJECTED: 'rejected'     // Отклонено
};

export const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const STORAGE_KEYS = {
  THEME: 'theme',
  STREAK: 'streak',
  LAST_LOGIN_DATE: 'lastLoginDate',
  CURRENT_SUBJECT: 'currentSubject',
  STUDENT_FONT_SIZE: 'studentFontSize',
  TEACHER_FONT_SIZE: 'teacherFontSize',
  LIBRARY_FONT_SIZE: 'libraryFontSize'
};

export const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 часов

export const GRADE_OPTIONS = (() => {
  const options = [];
  for (let i = 0; i <= 100; i += 5) {
    options.push({ value: i, label: i.toString() });
  }
  return options;
})();

export const TIMER_OPTIONS = [
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 150, label: '2.5 часа' },
  { value: 180, label: '3 часа' },
  { value: 210, label: '3.5 часа (ЕГЭ)' }
];

export const SM2 = {
  MIN_EASINESS: 1.3,
  DEFAULT_EASINESS: 2.5,
  QUALITY_CORRECT_NO_HINT: 5,
  QUALITY_CORRECT_WITH_HINT: 3,
  QUALITY_INCORRECT: 1
};

// Реэкспорт subjects
export { SUBJECTS, SUBJECTS_LIST, getSubjectById, getSubjectsByCategory, getActiveSubjects } from './subjects';