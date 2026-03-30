/**
 * SM-2 алгоритм для интервального повторения
 */

/**
 * Обновляет параметры карточки по алгоритму SM-2
 * @param {Object} card - карточка с полями easiness, interval, repetitions
 * @param {number} quality - качество ответа (0-5)
 * @returns {Object} обновлённая карточка
 */
export function updateCardSM2(card, quality) {
  const newCard = { ...card }

  if (quality < 3) {
    // Неправильно – сбрасываем повторения
    newCard.repetitions = 0
    newCard.interval = 1
  } else {
    // Правильно – увеличиваем интервал
    if (newCard.repetitions === 0) {
      newCard.interval = 1
    } else if (newCard.repetitions === 1) {
      newCard.interval = 6
    } else {
      newCard.interval = Math.round(newCard.interval * newCard.easiness)
    }
    newCard.repetitions++
  }

  // Обновляем easiness (фактор лёгкости)
  newCard.easiness = Math.max(1.3, newCard.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  const now = Date.now()
  newCard.lastReview = now
  newCard.dueDate = now + newCard.interval * 24 * 60 * 60 * 1000

  newCard.totalReviews = (newCard.totalReviews || 0) + 1
  if (quality >= 3) {
    newCard.correctCount = (newCard.correctCount || 0) + 1
    newCard.streak = (newCard.streak || 0) + 1
  } else {
    newCard.streak = 0
  }

  return newCard
}

/**
 * Получает список карточек, которые пора повторять
 * @param {Array} cards - массив карточек
 * @param {number} now - текущая метка времени (Date.now())
 * @returns {Array} отфильтрованные карточки с dueDate <= now
 */
export function getDueCards(cards, now = Date.now()) {
  return cards.filter(card => card.dueDate <= now)
}

/**
 * Рассчитывает качество ответа на основе количества попыток и использования подсказок
 * @param {boolean} isCorrect - правильный ли ответ
 * @param {boolean} usedHint - использовал ли подсказку
 * @returns {number} качество 0-5
 */
export function calculateQuality(isCorrect, usedHint = false) {
  if (!isCorrect) return 1
  if (usedHint) return 3
  return 5
}