import { shuffleArray } from '@core/utils/shuffle'
import wordsData from '@modules/chinese/data/hsk_all.json'
import readingsData from '@modules/chinese/data/hsk-reading.json'

// HSK blueprints
const hskBlueprints = {
  '1': { totalTime: 40, sections: [{ name: 'Аудирование', type: 'listening', questionCount: 20 }, { name: 'Чтение', type: 'reading', questionCount: 20 }] },
  '2': { totalTime: 55, sections: [{ name: 'Аудирование', type: 'listening', questionCount: 25 }, { name: 'Чтение', type: 'reading', questionCount: 25 }] },
  '3': { totalTime: 90, sections: [{ name: 'Аудирование', type: 'listening', questionCount: 40 }, { name: 'Чтение', type: 'reading', questionCount: 30 }, { name: 'Письмо', type: 'writing', questionCount: 10 }] },
  '4': { totalTime: 105, sections: [{ name: 'Аудирование', type: 'listening', questionCount: 45 }, { name: 'Чтение', type: 'reading', questionCount: 40 }, { name: 'Письмо', type: 'writing', questionCount: 15 }] },
  '5': { totalTime: 125, sections: [{ name: 'Аудирование', type: 'listening', questionCount: 45 }, { name: 'Чтение', type: 'reading', questionCount: 45 }, { name: 'Письмо', type: 'writing', questionCount: 10 }] }
}

function getWordsByLevel(level) {
  return wordsData.filter(w => String(w.level) === String(level))
}

function getReadingsByLevel(level) {
  return readingsData.filter(r => String(r.level) === String(level))
}

function generateListeningQuestions(level, count) {
  const words = getWordsByLevel(level)
  const shuffled = shuffleArray(words).slice(0, count)
  return shuffled.map(word => ({
    type: 'listening',
    text: 'Прослушайте слово и выберите перевод:',
    word: word.simplified,
    options: shuffleArray([word.translations.ru, ...shuffleArray(words).slice(0, 3).map(w => w.translations.ru)]),
    correctAnswer: word.translations.ru
  }))
}

function generateReadingQuestions(level, count) {
  const readings = getReadingsByLevel(level)
  return readings.slice(0, count).map(reading => ({
    type: 'reading',
    text: reading.content,
    items: reading.questions?.map(q => ({
      question: q.question.ru,
      options: shuffleArray(q.options.map(opt => opt.ru)),
      answer: q.answer
    })) || []
  }))
}

function generateWritingQuestions(level, count) {
  const words = getWordsByLevel(level)
  return shuffleArray(words).slice(0, count).map(word => ({
    type: 'translate',
    question: word.translations.ru,
    correctAnswer: word.simplified
  }))
}

export async function generateExam(level, customTitle) {
  const blueprint = hskBlueprints[level]
  if (!blueprint) throw new Error(`Уровень ${level} не поддерживается`)

  const sections = []
  for (const section of blueprint.sections) {
    let questions = []
    if (section.type === 'listening') questions = generateListeningQuestions(level, section.questionCount)
    if (section.type === 'reading') questions = generateReadingQuestions(level, section.questionCount)
    if (section.type === 'writing') questions = generateWritingQuestions(level, section.questionCount)
    sections.push({ name: section.name, questions: shuffleArray(questions) })
  }

  return {
    id: `exam-${level}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: customTitle || `HSK ${level} Пробный экзамен`,
    level,
    sections,
    totalTime: blueprint.totalTime
  }
}