import { getRandomWords, getRandomGrammar, getRandomReadings } from './question-bank'
import { shuffleArray } from '@/constants/shuffle' // или своя функция

/**
 * Генерация вопросов для аудирования
 */
export function generateListeningQuestions(level, count) {
  const words = getRandomWords(level, count * 2)
  const questions = []

  for (let i = 0; i < count; i++) {
    const word = words[i]
    if (!word) continue

    const otherWords = getRandomWords(level, 3).filter(w => w.id !== word.id)
    const options = [word.translations.ru, ...otherWords.map(w => w.translations.ru)]
    const shuffledOptions = shuffleArray(options)

    questions.push({
      type: 'listening',
      text: 'Прослушайте слово и выберите перевод:',
      word: word.simplified,
      options: shuffledOptions,
      correctAnswer: word.translations.ru
    })
  }
  return questions
}

/**
 * Генерация вопросов для чтения
 */
export function generateReadingQuestions(level, count) {
  const readingsList = getRandomReadings(level, count)
  const questions = []

  for (const reading of readingsList) {
    if (!reading.questions || reading.questions.length === 0) continue

    const items = reading.questions.map(q => ({
      question: q.question.ru,
      options: q.options.map(opt => opt.ru),
      answer: q.answer
    }))

    questions.push({
      type: 'reading',
      text: reading.content,
      items
    })
  }
  return questions
}

/**
 * Генерация вопросов по грамматике (fill-blank)
 */
export function generateGrammarQuestions(level, count) {
  const grammarPointsList = getRandomGrammar(level, count)
  const questions = []

  for (const g of grammarPointsList) {
    if (!g.examples || g.examples.length === 0) continue
    const example = g.examples[0]
    const sentence = typeof example === 'string' ? example : example.chinese
    const filled = sentence.replace(g.pattern, '___')

    const otherPatterns = grammarPointsList
      .filter(g2 => g2.id !== g.id)
      .map(g2 => g2.pattern)
      .slice(0, 3)
    const options = [g.pattern, ...otherPatterns]
    const shuffledOptions = shuffleArray(options)

    questions.push({
      type: 'fill-blank',
      sentence: filled,
      options: shuffledOptions,
      correctAnswer: shuffledOptions.indexOf(g.pattern)
    })
  }
  return questions
}

/**
 * Генерация вопросов для письма (перевод)
 */
export function generateWritingQuestions(level, count) {
  const words = getRandomWords(level, count)
  return words.map(word => ({
    type: 'translate',
    question: word.translations.ru,
    correctAnswer: word.simplified
  }))
}