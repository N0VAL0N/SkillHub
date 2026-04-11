// src/core/constants/subjects.js
// ⚠️ ТОЛЬКО РЕАЛЬНЫЕ ПРЕДМЕТЫ (ЕСТЬ ИЛИ ПЛАНИРУЮТСЯ)

export const SUBJECTS = {
  // ЕГЭ (планируются)
  SOCIAL: 'social',         // Обществознание ✅
  INFO: 'info',             // Информатика 🚧
  MATH: 'math',             // Математика 🚧
  PHYSICS: 'physics',       // Физика 🚧

  // Иностранные
  CHINESE_HSK: 'chinese_hsk',   // Китайский HSK ✅
  ENGLISH_IELTS: 'english_ielts', // Английский IELTS (B2) ✅

  // Программирование (отдельный блок, заглушка)
  PROGRAMMING: 'programming'    // 🚧
};

export const SUBJECTS_LIST = [
  {
    id: SUBJECTS.SOCIAL,
    name: 'Обществознание',
    icon: '⚖️',
    color: '#e67e22',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по обществознанию',
    status: 'active'  // модуль готов
  },
  {
    id: SUBJECTS.INFO,
    name: 'Информатика',
    icon: '💻',
    color: '#06b6d4',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по информатике',
    status: 'planned'  // в разработке
  },
  {
    id: SUBJECTS.MATH,
    name: 'Математика',
    icon: '📐',
    color: '#3b82f6',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по математике',
    status: 'planned'
  },
  {
    id: SUBJECTS.PHYSICS,
    name: 'Физика',
    icon: '⚛️',
    color: '#8b5cf6',
    category: 'ege',
    description: 'Подготовка к ЕГЭ по физике',
    status: 'planned'
  },
  {
    id: SUBJECTS.CHINESE_HSK,
    name: 'Китайский (HSK)',
    icon: '🐉',
    color: '#e11d48',
    category: 'chinese',
    description: 'Подготовка к HSK 1-5',
    status: 'active'
  },
  {
    id: SUBJECTS.ENGLISH_IELTS,
    name: 'Английский (IELTS)',
    icon: '🇬🇧',
    color: '#0d9488',
    category: 'english',
    description: 'Подготовка к IELTS (B2)',
    status: 'active'
  },
  {
    id: SUBJECTS.PROGRAMMING,
    name: 'Программирование',
    icon: '💻',
    color: '#a855f7',
    category: 'programming',
    description: 'C++, Python, Java, алгоритмы',
    status: 'placeholder'  // заглушка
  }
];

export const getSubjectById = (id) => SUBJECTS_LIST.find(s => s.id === id);
export const getSubjectsByCategory = (category) => SUBJECTS_LIST.filter(s => s.category === category);
export const getActiveSubjects = () => SUBJECTS_LIST.filter(s => s.status === 'active');