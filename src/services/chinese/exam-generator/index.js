import { hskBlueprints } from './blueprints'
import {
  generateListeningQuestions,
  generateReadingQuestions,
  generateGrammarQuestions,
  generateWritingQuestions
} from './generators'
import { shuffleArray } from '@/constants/shuffle'

/**
 * Генерация полного экзамена HSK
 * @param {string} level - уровень HSK ('1'..'5')
 * @param {string} customTitle - опциональное название
 * @returns {Promise<Object>} объект экзамена
 */
export async function generateExam(level, customTitle) {
  console.log(`[exam-generator] generating exam for level ${level}`)

  const blueprint = hskBlueprints[level]
  if (!blueprint) throw new Error(`Уровень ${level} не поддерживается`)

  const sections = []

  for (const section of blueprint.sections) {
    let questions = []

    switch (section.type) {
      case 'listening':
        questions = generateListeningQuestions(level, section.questionCount)
        break
      case 'reading':
        questions = generateReadingQuestions(level, section.questionCount)
        break
      case 'grammar':
        questions = generateGrammarQuestions(level, section.questionCount)
        break
      case 'writing':
        questions = generateWritingQuestions(level, section.questionCount)
        break
    }

    questions = shuffleArray(questions)

    // Для reading вопросов перемешиваем опции внутри каждого item
    if (section.type === 'reading') {
      questions = questions.map(q => {
        if (q.type === 'reading') {
          return {
            ...q,
            items: q.items.map(item => ({
              ...item,
              options: shuffleArray(item.options)
            }))
          }
        }
        return q
      })
    }

    sections.push({
      name: section.name,
      questions
    })

    console.log(`[exam-generator] section ${section.name}: generated ${questions.length} questions`)
  }

  const exam = {
    id: `exam-${level}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: customTitle || `HSK ${level} Пробный экзамен`,
    level,
    sections,
    totalTime: blueprint.totalTime || 60
  }

  console.log('[exam-generator] exam generated:', exam.id)
  return exam
}