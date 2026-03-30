// src/services/chinese/exam-generator/question-bank.js

import hskAll from '@/data/chinese/hsk_all.json'
import grammarAll from '@/data/chinese/grammar_all.json'
import readingsData from '@/data/chinese/hsk-reading.json'

/**
 * Перемешивает массив (Fisher-Yates)
 * @param {Array} array - исходный массив
 * @returns {Array} новый перемешанный массив
 */
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Получает случайные слова указанного уровня
 * @param {string} level - уровень HSK ('1'..'5')
 * @param {number} count - количество слов
 * @returns {Array} массив слов
 */
export function getRandomWords(level, count) {
  const words = hskAll.filter(w => String(w.level) === String(level))
  return shuffleArray(words).slice(0, count)
}

/**
 * Получает случайные грамматические точки указанного уровня
 * @param {string} level - уровень HSK ('1'..'5')
 * @param {number} count - количество грамматических точек
 * @returns {Array} массив грамматических точек
 */
export function getRandomGrammar(level, count) {
  const grammar = grammarAll.filter(g => String(g.level) === String(level))
  return shuffleArray(grammar).slice(0, count)
}

/**
 * Получает случайные тексты для чтения указанного уровня
 * @param {string} level - уровень HSK ('1'..'5')
 * @param {number} count - количество текстов
 * @returns {Array} массив текстов
 */
export function getRandomReadings(level, count) {
  const filtered = readingsData.filter(r => String(r.level) === String(level))
  return shuffleArray(filtered).slice(0, count)
}

/**
 * Получает все слова указанного уровня (без перемешивания)
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {Array} массив слов
 */
export function getWordsByLevel(level) {
  return hskAll.filter(w => String(w.level) === String(level))
}

/**
 * Получает все грамматические точки указанного уровня
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {Array} массив грамматических точек
 */
export function getGrammarByLevel(level) {
  return grammarAll.filter(g => String(g.level) === String(level))
}

/**
 * Получает все тексты указанного уровня
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {Array} массив текстов
 */
export function getReadingsByLevel(level) {
  return readingsData.filter(r => String(r.level) === String(level))
}

/**
 * Поиск слова по упрощённому написанию или переводу
 * @param {string} query - поисковый запрос
 * @returns {Array} массив найденных слов
 */
export function searchWords(query) {
  const lowerQuery = query.toLowerCase()
  return hskAll.filter(w => 
    w.simplified.includes(query) ||
    w.pinyin.toLowerCase().includes(lowerQuery) ||
    (w.translations?.ru || w.translations).toLowerCase().includes(lowerQuery)
  )
}

/**
 * Получение слова по ID
 * @param {number} id - ID слова
 * @returns {Object|null} слово или null
 */
export function getWordById(id) {
  return hskAll.find(w => w.id === id) || null
}

/**
 * Получение грамматической точки по ID
 * @param {string} id - ID грамматической точки
 * @returns {Object|null} грамматическая точка или null
 */
export function getGrammarById(id) {
  return grammarAll.find(g => g.id === id) || null
}

/**
 * Получение текста по ID
 * @param {string} id - ID текста
 * @returns {Object|null} текст или null
 */
export function getReadingById(id) {
  return readingsData.find(r => r.id === id) || null
}

/**
 * Подсчёт количества слов на уровне
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {number} количество слов
 */
export function countWordsByLevel(level) {
  return hskAll.filter(w => String(w.level) === String(level)).length
}

/**
 * Подсчёт количества грамматических точек на уровне
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {number} количество грамматических точек
 */
export function countGrammarByLevel(level) {
  return grammarAll.filter(g => String(g.level) === String(level)).length
}

/**
 * Подсчёт количества текстов на уровне
 * @param {string} level - уровень HSK ('1'..'5')
 * @returns {number} количество текстов
 */
export function countReadingsByLevel(level) {
  return readingsData.filter(r => String(r.level) === String(level)).length
}

// Экспорт сырых данных на случай, если нужен прямой доступ
export { hskAll, grammarAll, readingsData }