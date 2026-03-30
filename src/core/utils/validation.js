/**
 * Валидация пароля
 * @param {string} password - пароль
 * @returns {Object} { isValid, message }
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, message: 'Пароль не может быть пустым' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Пароль должен содержать минимум 6 символов' };
  }
  return { isValid: true, message: '' };
}

/**
 * Валидация логина
 * @param {string} login - логин
 * @returns {Object} { isValid, message }
 */
export function validateLogin(login) {
  if (!login) {
    return { isValid: false, message: 'Логин не может быть пустым' };
  }
  if (login.length < 3) {
    return { isValid: false, message: 'Логин должен содержать минимум 3 символа' };
  }
  if (login.length > 50) {
    return { isValid: false, message: 'Логин не должен превышать 50 символов' };
  }
  // Разрешены буквы, цифры, подчёркивание, дефис, точка
  const validPattern = /^[a-zA-Zа-яА-Я0-9_.-]+$/;
  if (!validPattern.test(login)) {
    return { isValid: false, message: 'Логин может содержать только буквы, цифры, _, -, .' };
  }
  return { isValid: true, message: '' };
}

/**
 * Валидация email (базовая)
 * @param {string} email - email
 * @returns {Object} { isValid, message }
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, message: 'Email не может быть пустым' };
  }
  const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { isValid: false, message: 'Введите корректный email' };
  }
  return { isValid: true, message: '' };
}

/**
 * Валидация оценки (0-100)
 * @param {number} grade - оценка
 * @returns {Object} { isValid, message }
 */
export function validateGrade(grade) {
  if (grade === undefined || grade === null) {
    return { isValid: false, message: 'Оценка не указана' };
  }
  const num = Number(grade);
  if (isNaN(num)) {
    return { isValid: false, message: 'Оценка должна быть числом' };
  }
  if (num < 0 || num > 100) {
    return { isValid: false, message: 'Оценка должна быть в диапазоне 0-100' };
  }
  return { isValid: true, message: '' };
}

/**
 * Проверка, является ли строка пустой или только пробелами
 * @param {string} str - строка
 * @returns {boolean}
 */
export function isEmptyString(str) {
  return !str || str.trim() === '';
}

/**
 * Валидация названия (не пустое, не слишком длинное)
 * @param {string} title - название
 * @param {number} maxLength - максимальная длина
 * @returns {Object} { isValid, message }
 */
export function validateTitle(title, maxLength = 100) {
  if (!title || title.trim() === '') {
    return { isValid: false, message: 'Название не может быть пустым' };
  }
  if (title.length > maxLength) {
    return { isValid: false, message: `Название не должно превышать ${maxLength} символов` };
  }
  return { isValid: true, message: '' };
}