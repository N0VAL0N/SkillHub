// src/constants/subjects.js
// ⚠️ ЕДИНСТВЕННОЕ МЕСТО ДЛЯ ДОБАВЛЕНИЯ/ИЗМЕНЕНИЯ ПРЕДМЕТОВ ⚠️
// НЕ ТРОГАТЬ ВСЁ ОСТАЛЬНОЕ!

export const SUBJECTS = {
  // === ЕГЭ ===
  SOCIAL: 'social',        // Обществознание
  RUSSIAN: 'russian',      // Русский язык
  MATH: 'math',            // Математика
  PHYSICS: 'physics',      // Физика
  INFO: 'info',            // Информатика
  HISTORY: 'history',      // История
  ENGLISH: 'english',      // Английский язык
  
  // === КИТАЙСКИЙ ===
  CHINESE_EGE: 'chinese_ege',    // Китайский ЕГЭ
  CHINESE_HSK: 'chinese_hsk',    // Китайский HSK
  
  // === АНГЛИЙСКИЙ ===
  ENGLISH_EGE: 'english_ege',    // Английский ЕГЭ
  ENGLISH_TOEFL: 'english_toefl', // TOEFL
  ENGLISH_IELTS: 'english_ielts', // IELTS
  
  // === ПРОГРАММИРОВАНИЕ (1 блок) ===
  PROGRAMMING: 'programming'      // Всё программирование в одной вкладке
};

export const SUBJECTS_LIST = [
  // ========== ЕГЭ ==========
  { 
    id: SUBJECTS.SOCIAL, 
    name: 'Обществознание', 
    icon: '⚖️', 
    color: '#e67e22',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по обществознанию'
  },
  { 
    id: SUBJECTS.RUSSIAN, 
    name: 'Русский язык', 
    icon: '📖', 
    color: '#3498db',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по русскому языку'
  },
  { 
    id: SUBJECTS.MATH, 
    name: 'Математика', 
    icon: '📐', 
    color: '#3b82f6',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по математике'
  },
  { 
    id: SUBJECTS.PHYSICS, 
    name: 'Физика', 
    icon: '⚛️', 
    color: '#8b5cf6',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по физике'
  },
  { 
    id: SUBJECTS.INFO, 
    name: 'Информатика', 
    icon: '💻', 
    color: '#06b6d4',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по информатике'
  },
  { 
    id: SUBJECTS.HISTORY, 
    name: 'История', 
    icon: '🏛️', 
    color: '#f97316',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по истории'
  },
  { 
    id: SUBJECTS.ENGLISH, 
    name: 'Английский язык', 
    icon: '🇬🇧', 
    color: '#14b8a6',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по английскому языку'
  },
  
  // ========== КИТАЙСКИЙ ==========
  { 
    id: SUBJECTS.CHINESE_EGE, 
    name: 'Китайский (ЕГЭ)', 
    icon: '🐉', 
    color: '#e11d48',
    category: 'chinese',
    description: 'Подготовка к ЕГЭ по китайскому языку'
  },
  { 
    id: SUBJECTS.CHINESE_HSK, 
    name: 'Китайский (HSK)', 
    icon: '🎋', 
    color: '#f43f5e',
    category: 'chinese',
    description: 'Международный экзамен HSK 1-5'
  },
  
  // ========== АНГЛИЙСКИЙ ==========
  { 
    id: SUBJECTS.ENGLISH_EGE, 
    name: 'Английский (ЕГЭ)', 
    icon: '📝', 
    color: '#0d9488',
    category: 'english',
    description: 'Подготовка к ЕГЭ по английскому языку'
  },
  { 
    id: SUBJECTS.ENGLISH_TOEFL, 
    name: 'TOEFL', 
    icon: '🗽', 
    color: '#0891b2',
    category: 'english',
    description: 'Международный экзамен TOEFL'
  },
  { 
    id: SUBJECTS.ENGLISH_IELTS, 
    name: 'IELTS', 
    icon: '🇬🇧', 
    color: '#0e7c7c',
    category: 'english',
    description: 'Международный экзамен IELTS'
  },
  
  // ========== ПРОГРАММИРОВАНИЕ (1 блок) ==========
  { 
    id: SUBJECTS.PROGRAMMING, 
    name: 'Программирование', 
    icon: '💻', 
    color: '#a855f7',
    category: 'programming',
    description: 'C++, Python, Java, Web, Games, Алгоритмы'
  }
];

export const getSubjectById = (id) => {
  return SUBJECTS_LIST.find(s => s.id === id);
};

export const getSubjectsByCategory = (category) => {
  return SUBJECTS_LIST.filter(s => s.category === category);
};