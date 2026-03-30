// HSK уровни
export const HSK_LEVELS = {
  Level1: '1',
  Level2: '2',
  Level3: '3',
  Level4: '4',
  Level5: '5'
}

// Blueprints для экзаменов HSK
export const hskBlueprints = {
  [HSK_LEVELS.Level1]: {
    level: HSK_LEVELS.Level1,
    totalTime: 40,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 20, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 20, sources: ['reading'] }
    ]
  },
  [HSK_LEVELS.Level2]: {
    level: HSK_LEVELS.Level2,
    totalTime: 55,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 25, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 25, sources: ['reading'] }
    ]
  },
  [HSK_LEVELS.Level3]: {
    level: HSK_LEVELS.Level3,
    totalTime: 90,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 40, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 30, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 10, sources: ['grammar'] }
    ]
  },
  [HSK_LEVELS.Level4]: {
    level: HSK_LEVELS.Level4,
    totalTime: 105,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 45, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 40, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 15, sources: ['grammar'] }
    ]
  },
  [HSK_LEVELS.Level5]: {
    level: HSK_LEVELS.Level5,
    totalTime: 125,
    sections: [
      { name: 'Аудирование', type: 'listening', questionCount: 45, sources: ['vocabulary'] },
      { name: 'Чтение', type: 'reading', questionCount: 45, sources: ['reading'] },
      { name: 'Письмо', type: 'writing', questionCount: 10, sources: ['grammar'] }
    ]
  }
}