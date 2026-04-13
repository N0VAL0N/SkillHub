<template>
  <div class="landing-container">
    <div class="hero">
      <div class="logo">
        <span class="logo-icon">🎓</span>
        <h1>SkillHub</h1>
      </div>
      <p class="subtitle">Образовательная платформа для всестороннего развития</p>
      <p class="description">
        Подготовка к ЕГЭ, изучение иностранных языков, программирование и многое другое.
        Интерактивные задания, автопроверка, статистика и поддержка учителя.
        Учитесь эффективно в любое время и в любом месте.
      </p>
      <div class="subjects-preview">
        <span class="subject-tag">📐 Математика</span>
        <span class="subject-tag">⚖️ Обществознание</span>
        <span class="subject-tag">💻 Информатика</span>
        <span class="subject-tag">⚛️ Физика</span>
        <span class="subject-tag">🇬🇧 Английский</span>
        <span class="subject-tag">🐉 Китайский</span>
        <span class="subject-tag">💻 Программирование</span>
      </div>
      <div class="buttons">
        <router-link to="/login?mode=login" class="btn btn-login">Войти</router-link>
        <router-link to="/login?mode=register" class="btn btn-register">Зарегистрироваться</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.hero {
  max-width: 800px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 2.5rem;
}

.hero h1 {
  font-size: 3rem;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #64748b;
}

.subjects-preview {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.subject-tag {
  background: #f1f5f9;
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  color: #475569;
}

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
  background: #2c3e50;
  color: white;
}

.btn-login:hover {
  background: #1e2a36;
  transform: translateY(-2px);
}

.btn-register {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(102, 126, 234, 0.4);
}

@media (max-width: 640px) {
  .hero h1 {
    font-size: 2rem;
  }
  .subtitle {
    font-size: 1rem;
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