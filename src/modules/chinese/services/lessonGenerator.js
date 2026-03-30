import { shuffleArray } from '@core/utils/shuffle'
import hskAll from '@modules/chinese/data/hsk_all.json'
import grammarAll from '@modules/chinese/data/grammar_all.json'
import lessonTopics from '@modules/chinese/data/lessonTopics.json'

// Типы упражнений
export const ExerciseType = {
  FillBlank: 'fill-blank',
  MultipleChoice: 'multiple-choice',
  Listening: 'listening',
  Translate: 'translate',
  MatchPinyin: 'match-pinyin',
  MatchTranslation: 'match-translation',
  SentenceOrder: 'sentence-order',
  DialogueTrueFalse: 'dialogue-truefalse'
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function canGenerateType(type, wordsCount, hasSentences) {
  switch (type) {
    case ExerciseType.MatchPinyin:
    case ExerciseType.MatchTranslation:
      if (wordsCount < 2) return false
      return true
    case ExerciseType.SentenceOrder:
      if (!hasSentences) return false
      return true
    default:
      if (wordsCount === 0) return false
      return true
  }
}

function generateFillBlank(word, allWords) {
  const otherWords = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.simplified)

  const options = [word.simplified, ...otherWords]
  const shuffledOptions = shuffleArray(options)
  const correctIndex = shuffledOptions.indexOf(word.simplified)

  return {
    type: ExerciseType.FillBlank,
    level: word.level,
    sentence: `___ — это ${word.translations.ru}?`,
    options: shuffledOptions,
    correctAnswer: correctIndex
  }
}

function generateMultipleChoice(word, allWords) {
  const otherWords = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.translations.ru)

  const options = [word.translations.ru, ...otherWords]
  const shuffledOptions = shuffleArray(options)
  const correctIndex = shuffledOptions.indexOf(word.translations.ru)

  return {
    type: ExerciseType.MultipleChoice,
    level: word.level,
    question: `Что означает «${word.simplified}»?`,
    options: shuffledOptions,
    correctAnswer: correctIndex
  }
}

function generateListening(word, allWords) {
  const otherOptions = allWords
    .filter(w => w.id !== word.id && w.level === word.level)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.translations.ru)

  const options = [word.translations.ru, ...otherOptions]
  const shuffledOptions = shuffleArray(options)

  return {
    type: ExerciseType.Listening,
    level: word.level,
    word: word,
    options: shuffledOptions,
    correctAnswer: word.translations.ru
  }
}

function generateTranslate(word) {
  return {
    type: ExerciseType.Translate,
    level: word.level,
    question: word.translations.ru,
    correctAnswer: word.simplified
  }
}

function generateMatchPinyin(words) {
  if (words.length < 2) return null
  const selectedWords = words.slice(0, 4)
  const pairs = selectedWords.map(w => ({
    chinese: w.simplified,
    pinyin: w.pinyin
  }))
  const shuffledPairs = shuffleArray(pairs)
  return {
    type: ExerciseType.MatchPinyin,
    level: selectedWords[0].level,
    pairs: shuffledPairs,
    correctAnswer: 0
  }
}

function generateMatchTranslation(words) {
  if (words.length < 2) return null
  const selectedWords = words.slice(0, 4)
  const chineseItems = selectedWords.map(w => w.simplified)
  const translationItems = selectedWords.map(w => w.translations.ru)
  const shuffledChinese = shuffleArray(chineseItems)
  const shuffledTranslations = shuffleArray(translationItems)
  const pairs = shuffledChinese.map((chinese, idx) => ({
    chinese,
    translation: shuffledTranslations[idx]
  }))
  return {
    type: ExerciseType.MatchTranslation,
    level: selectedWords[0].level,
    pairs,
    correctAnswer: 0
  }
}

function generateSentenceOrderFromSentences(sentences, level) {
  if (!sentences || sentences.length === 0) return null
  const randomSentence = sentences[Math.floor(Math.random() * sentences.length)]
  const words = randomSentence.split(' ')
  if (words.length < 2) return null
  const correctOrder = words.map((_, i) => i)
  const shuffledIndices = shuffleArray([...correctOrder])
  const shuffledWords = shuffledIndices.map(i => words[i])
  return {
    type: ExerciseType.SentenceOrder,
    level,
    words: shuffledWords,
    correctOrder,
    correctAnswer: 0
  }
}

// ==================== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ====================

export function generateExercisesBase(options) {
  const { words, count, includeTypes, lessonLevel, sentences } = options
  const exercises = []

  if (words.length === 0) {
    console.warn('[generator] No words available, cannot generate exercises')
    return exercises
  }

  const desiredTypes = includeTypes || [
    ExerciseType.FillBlank,
    ExerciseType.MultipleChoice,
    ExerciseType.Listening,
    ExerciseType.Translate,
    ExerciseType.SentenceOrder
  ]

  const availableTypes = desiredTypes.filter(type =>
    canGenerateType(type, words.length, !!sentences?.length)
  )

  if (availableTypes.length === 0) {
    console.warn('[generator] No exercise types available after filtering')
    return exercises
  }

  let wordIndex = 0
  const getNextWord = () => {
    const word = words[wordIndex % words.length]
    wordIndex++
    return word
  }
  const resetWordIndex = () => { wordIndex = 0 }

  const tryAddExercise = (ex) => {
    if (ex) {
      exercises.push(ex)
      return true
    }
    return false
  }

  // 1. Сложные типы
  if (availableTypes.includes(ExerciseType.MatchPinyin) && words.length >= 2) {
    const target = Math.min(2, Math.floor(count / availableTypes.length))
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break
      tryAddExercise(generateMatchPinyin(words))
    }
  }

  if (availableTypes.includes(ExerciseType.MatchTranslation) && words.length >= 2) {
    const target = Math.min(2, Math.floor(count / availableTypes.length))
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break
      tryAddExercise(generateMatchTranslation(words))
    }
  }

  // 2. SentenceOrder
  if (availableTypes.includes(ExerciseType.SentenceOrder) && sentences?.length) {
    const target = Math.min(2, Math.floor(count / availableTypes.length))
    for (let i = 0; i < target; i++) {
      if (exercises.length >= count) break
      tryAddExercise(generateSentenceOrderFromSentences(sentences, lessonLevel))
    }
  }

  // 3. Базовые генераторы
  const basicGenerators = [
    { type: ExerciseType.FillBlank, gen: generateFillBlank },
    { type: ExerciseType.MultipleChoice, gen: generateMultipleChoice },
    { type: ExerciseType.Listening, gen: generateListening },
    { type: ExerciseType.Translate, gen: generateTranslate }
  ].filter(g => availableTypes.includes(g.type))

  const targetPerType = Math.floor(count / basicGenerators.length)
  for (const generator of basicGenerators) {
    resetWordIndex()
    for (let i = 0; i < targetPerType; i++) {
      if (exercises.length >= count) break
      const word = getNextWord()
      tryAddExercise(generator.gen(word, words))
    }
  }

  // 4. Добираем остальные
  if (exercises.length < count) {
    const remaining = count - exercises.length
    const allGenerators = [
      ...basicGenerators,
      ...(availableTypes.includes(ExerciseType.MatchPinyin) ? [{ type: ExerciseType.MatchPinyin }] : []),
      ...(availableTypes.includes(ExerciseType.MatchTranslation) ? [{ type: ExerciseType.MatchTranslation }] : []),
      ...(availableTypes.includes(ExerciseType.SentenceOrder) && sentences?.length ? [{ type: ExerciseType.SentenceOrder }] : [])
    ]

    for (let i = 0; i < remaining; i++) {
      if (allGenerators.length === 0) break
      const randomType = allGenerators[Math.floor(Math.random() * allGenerators.length)].type
      let ex = null

      if (randomType === ExerciseType.MatchPinyin) {
        ex = generateMatchPinyin(words)
      } else if (randomType === ExerciseType.MatchTranslation) {
        ex = generateMatchTranslation(words)
      } else if (randomType === ExerciseType.SentenceOrder) {
        ex = generateSentenceOrderFromSentences(sentences, lessonLevel)
      } else {
        const generator = basicGenerators.find(g => g.type === randomType)
        if (generator) {
          const word = getNextWord()
          ex = generator.gen(word, words)
        }
      }

      if (!tryAddExercise(ex)) {
        const idx = allGenerators.findIndex(g => g.type === randomType)
        if (idx !== -1) allGenerators.splice(idx, 1)
      }
    }
  }

  console.log(`[generator] Generated ${exercises.length} exercises (requested ${count})`)
  return exercises.slice(0, count)
}

// ==================== ГЕНЕРАЦИЯ УРОКА ====================

export async function generateLesson(id) {
  console.log('[generateLesson] generating lesson', id)
  const meta = lessonTopics[id]
  if (!meta) {
    console.warn('[generateLesson] no meta for', id)
    return null
  }

  const level = meta.level
  const allWords = hskAll.filter(w => String(w.level) === String(level))
  const words = allWords.filter(w => w.topics?.some(t => meta.topics.includes(t)))

  const grammarPoints = grammarAll.filter(g => 
    String(g.level) === String(level) && 
    g.topics?.some(t => meta.topics.includes(t))
  )

  const sentences = []
  if (meta.dialogues) {
    for (const dialogue of meta.dialogues) {
      for (const line of dialogue.lines) {
        sentences.push(line.chinese)
      }
    }
  }

  const generated = generateExercisesBase({
    words,
    count: 10,
    lessonLevel: level,
    sentences
  })

  const exercises = generated.map((ex, index) => ({
    ...ex,
    id: `${id}-ex-${index}`
  }))

  const lesson = {
    id,
    hskLevel: level,
    lessonNumber: meta.number,
    title: meta.title,
    topics: meta.topics,
    grammarPoints: grammarPoints.map(g => g.id),
    dialogues: meta.dialogues,
    newWords: words.map(w => w.id),
    exercises,
    trueFalseStatements: meta.trueFalseStatements
  }

  return lesson
}

export function getLessonMetaByLevel(level) {
  const entries = Object.entries(lessonTopics)
  return entries
    .filter(([_, meta]) => meta.level === level)
    .map(([id, meta]) => ({ id, ...meta }))
    .sort((a, b) => a.number - b.number)
}