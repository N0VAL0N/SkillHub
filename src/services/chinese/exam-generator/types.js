// src/services/chinese/exam-generator/types.js

/**
 * @typedef {Object} ExamBlueprint
 * @property {string} level - HSK уровень '1'..'5'
 * @property {number} totalTime - общее время экзамена в минутах
 * @property {Array<ExamSectionBlueprint>} sections - секции экзамена
 */

/**
 * @typedef {Object} ExamSectionBlueprint
 * @property {string} name - название секции
 * @property {string} type - тип секции: 'listening' | 'reading' | 'grammar' | 'writing'
 * @property {number} questionCount - количество вопросов
 * @property {Array<string>} sources - источники вопросов
 */

/**
 * @typedef {Object} Exam
 * @property {string} id - уникальный ID экзамена
 * @property {string} title - название
 * @property {string} level - HSK уровень
 * @property {Array<ExamSection>} sections - секции
 * @property {number} totalTime - общее время
 * @property {number} [completedAt] - дата завершения
 * @property {Object} [score] - результат
 */

/**
 * @typedef {Object} ExamSection
 * @property {string} name - название секции
 * @property {Array<ExamQuestion>} questions - вопросы
 */

/**
 * @typedef {Object} ExamListeningQuestion
 * @property {string} type - 'listening'
 * @property {string} text - инструкция
 * @property {string} word - слово для озвучки
 * @property {Array<string>} options - варианты перевода
 * @property {string} correctAnswer - правильный ответ
 */

/**
 * @typedef {Object} ExamReadingQuestion
 * @property {string} type - 'reading'
 * @property {string} text - текст
 * @property {Array<{question: string, options: Array<string>, answer: number}>} items - вопросы к тексту
 */

/**
 * @typedef {Object} ExamGrammarQuestion
 * @property {string} type - 'fill-blank'
 * @property {string} sentence - предложение с пропуском
 * @property {Array<string>} options - варианты
 * @property {number} correctAnswer - индекс правильного ответа
 */

/**
 * @typedef {Object} ExamWritingQuestion
 * @property {string} type - 'translate'
 * @property {string} question - русская фраза
 * @property {string} correctAnswer - китайский перевод
 */

/**
 * @typedef {ExamListeningQuestion|ExamReadingQuestion|ExamGrammarQuestion|ExamWritingQuestion} ExamQuestion
 */

// Экспорт пустой, так как это только JSDoc типы для IDE
export default {}