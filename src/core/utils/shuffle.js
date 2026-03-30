// src/constants/shuffle.js

/**
 * Перемешивает массив (Fisher-Yates)
 * @param {Array} array - исходный массив
 * @returns {Array} новый перемешанный массив
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Перемешивает массив и возвращает индекс правильного ответа
 * @param {Array} array - исходный массив
 * @param {*} correctValue - значение, которое должно быть правильным ответом
 * @returns {Object} { shuffled, correctIndex }
 */
export function shuffleArrayWithCorrect(array, correctValue) {
  if (array.length <= 1) {
    return { shuffled: [...array], correctIndex: array.indexOf(correctValue) };
  }
  const shuffled = shuffleArray(array);
  let correctIndex = shuffled.findIndex(item => item === correctValue);
  // Если правильный ответ оказался на первой позиции и есть другие варианты, меняем его со случайным
  if (shuffled.length > 1 && correctIndex === 0) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
    correctIndex = shuffled.findIndex(item => item === correctValue);
  }
  return { shuffled, correctIndex };
}