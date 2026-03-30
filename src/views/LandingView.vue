<template>
  <div class="landing-container">
    <div class="hero">
      <h1>ЕГЭ‑ПРО</h1>
      <p class="subtitle">Подготовка к ЕГЭ по обществознанию</p>
      <p class="description">
        Интерактивные задания, автопроверка, статистика и поддержка учителя.
        Готовьтесь эффективно в любое время и в любом месте.
      </p>
      <div class="buttons">
        <router-link to="/login?mode=login" class="btn btn-loginbtn btn-register">Войти</router-link>
        <router-link to="/login?mode=register" class="btn btn-login">Зарегистрироваться</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
.landing-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

/* ========== ГЕРОЙ-БЛОК ========== */
.hero {
  max-width: 800px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.hero h1 {
  font-size: 4rem;
  margin: 0 0 1rem;
  color: var(--secondary);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.subtitle {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--secondary);
}
.description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: var(--gray-600);
}

/* ========== КНОПКИ ========== */
.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-login {
  background: var(--secondary);
  color: white;
}
.btn-login:hover {
  background: var(--secondary-dark);
  transform: translateY(-2px);
}
.btn-register {
  background: var(--primary);
  color: white;
}
.btn-register:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* ========== АДАПТИВНОСТЬ ========== */
@media (max-width: 640px) {
  .hero h1 {
    font-size: 2.5rem;
  }
  .subtitle {
    font-size: 1.2rem;
  }
  .buttons {
    flex-direction: column;
    align-items: center;
  }
  .btn {
    width: 80%;
    text-align: center;
  }
}
</style>