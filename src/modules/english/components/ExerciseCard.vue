<template>
  <div class="exercise-card">
    <div class="exercise-header">
      <span class="exercise-type">{{ typeLabel }}</span>
    </div>

    <div class="exercise-body">
      <!-- Multiple Choice -->
      <div v-if="exercise.type === 'multiple-choice'" class="multiple-choice">
        <p class="question">{{ exercise.question }}</p>
        <div class="options">
          <button
            v-for="(opt, idx) in exercise.options"
            :key="idx"
            class="option-btn"
            :class="{ selected: localSelected === idx, correct: showResult && idx === exercise.correctAnswer, wrong: showResult && localSelected === idx && idx !== exercise.correctAnswer }"
            @click="!disabled && !showResult && selectOption(idx)"
            :disabled="disabled || showResult"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Fill Blank -->
      <div v-else-if="exercise.type === 'fill-blank'" class="fill-blank">
        <p class="sentence">{{ exercise.sentence }}</p>
        <div class="options">
          <button
            v-for="(opt, idx) in exercise.options"
            :key="idx"
            class="option-btn"
            :class="{ selected: localSelected === idx, correct: showResult && idx === exercise.correctAnswer, wrong: showResult && localSelected === idx && idx !== exercise.correctAnswer }"
            @click="!disabled && !showResult && selectOption(idx)"
            :disabled="disabled || showResult"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Translate -->
      <div v-else-if="exercise.type === 'translate'" class="translate">
        <p class="question">{{ exercise.question }}</p>
        <input
          v-model="localAnswer"
          type="text"
          class="answer-input"
          placeholder="Введите перевод..."
          :disabled="disabled || showResult"
          @keyup.enter="checkAnswer"
        />
      </div>

      <!-- Listening (пока без аудио, просто текст) -->
      <div v-else-if="exercise.type === 'listening'" class="listening">
        <p class="question">{{ exercise.question }}</p>
        <button class="btn-outline audio-btn" @click="playAudio(exercise.audioText || exercise.question)">
          🔊 Прослушать
        </button>
        <div class="options">
          <button
            v-for="(opt, idx) in exercise.options"
            :key="idx"
            class="option-btn"
            :class="{ selected: localSelected === idx, correct: showResult && idx === exercise.correctAnswer, wrong: showResult && localSelected === idx && idx !== exercise.correctAnswer }"
            @click="!disabled && !showResult && selectOption(idx)"
            :disabled="disabled || showResult"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <div class="exercise-footer" v-if="!showResult">
      <button class="btn-check" @click="checkAnswer" :disabled="!canCheck">
        Проверить
      </button>
    </div>

    <div v-else class="result-area">
      <div class="result-message" :class="{ correct: isAnswerCorrect, wrong: !isAnswerCorrect }">
        {{ isAnswerCorrect ? '✅ Правильно!' : '❌ Неправильно!' }}
      </div>
      <div v-if="!isAnswerCorrect && exercise.correctAnswerText" class="correct-answer">
        Правильный ответ: {{ exercise.correctAnswerText }}
      </div>
      <button class="btn-next" @click="next">
        {{ isLast ? 'Завершить' : 'Следующее →' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { speak } from '@core/services/tts';

const props = defineProps({
  exercise: { type: Object, required: true },
  isActive: { type: Boolean, default: true },
  initialState: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false }
});

const emit = defineEmits(['answered', 'update-state', 'next', 'mistake']);

const localSelected = ref(null);
const localAnswer = ref('');
const showResult = ref(false);
const isAnswerCorrect = ref(false);

const typeLabel = computed(() => {
  const labels = {
    'multiple-choice': 'Выберите правильный ответ',
    'fill-blank': 'Заполните пропуск',
    'translate': 'Переведите',
    'listening': 'Аудирование'
  };
  return labels[props.exercise.type] || 'Упражнение';
});

const canCheck = computed(() => {
  if (props.exercise.type === 'translate') {
    return localAnswer.value.trim().length > 0;
  }
  return localSelected.value !== null;
});

watch(() => props.initialState, (state) => {
  if (state) {
    if (state.answered !== undefined) showResult.value = state.answered;
    if (state.correct !== undefined) isAnswerCorrect.value = state.correct;
    if (state.selected !== undefined) localSelected.value = state.selected;
    if (state.answer !== undefined) localAnswer.value = state.answer;
  }
}, { immediate: true });

function selectOption(idx) {
  localSelected.value = idx;
  emit('update-state', { selected: idx });
}

function checkAnswer() {
  let correct = false;
  const ex = props.exercise;

  if (ex.type === 'multiple-choice' || ex.type === 'fill-blank' || ex.type === 'listening') {
    correct = (localSelected.value === ex.correctAnswer);
  } else if (ex.type === 'translate') {
    const userAnswerNorm = localAnswer.value.trim().toLowerCase();
    const correctNorm = ex.correctAnswer.toLowerCase();
    correct = (userAnswerNorm === correctNorm);
  }

  isAnswerCorrect.value = correct;
  showResult.value = true;

  emit('answered', { correct, answer: localSelected.value !== null ? localSelected.value : localAnswer.value });
  emit('update-state', { answered: true, correct, selected: localSelected.value, answer: localAnswer.value });

  if (!correct) {
    emit('mistake');
  }
}

function next() {
  emit('next');
}

async function playAudio(text) {
  try {
    await speak(text, 'en-US');
  } catch (e) {
    console.error('Audio error', e);
  }
}
</script>

<style scoped>
.exercise-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--gray-200);
}
.exercise-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.exercise-type {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.question, .sentence {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-align: center;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
.option-btn {
  padding: 0.6rem 1.2rem;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.option-btn.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.option-btn.correct {
  background: var(--success);
  color: white;
  border-color: var(--success);
}
.option-btn.wrong {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}
.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}
.audio-btn {
  margin-bottom: 1rem;
}
.exercise-footer {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.btn-check {
  padding: 0.6rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
.btn-check:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.result-area {
  text-align: center;
  margin-top: 1.5rem;
}
.result-message {
  padding: 0.75rem;
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
}
.result-message.correct {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.result-message.wrong {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
.correct-answer {
  font-size: 0.85rem;
  color: var(--success);
  margin-bottom: 0.75rem;
}
.btn-next {
  padding: 0.5rem 1.2rem;
  background: var(--secondary);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
}
body.dark-theme .exercise-card {
  background: var(--gray-800);
  border-color: var(--gray-700);
}
</style>