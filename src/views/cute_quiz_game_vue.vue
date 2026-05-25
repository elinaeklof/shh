<template>
  <main class="quiz-app">
    <div class="background-blur blur-1"></div>
    <div class="background-blur blur-2"></div>

    <section class="quiz-card" v-if="!finished">
      <header class="quiz-header">
        <div>
          <p class="eyebrow">Cute Quiz Game</p>
          <h1>Relationship Quiz 💖</h1>
        </div>

        <div class="progress-wrapper">
          <div class="progress-text">
            Fråga {{ currentQuestionIndex + 1 }} / {{ questions.length }}
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
              }"
            ></div>
          </div>
        </div>
      </header>

      <section class="question-section">
        <Transition name="fade" mode="out-in">
          <div :key="currentQuestionIndex">
            <div class="question-number">
              Question {{ currentQuestionIndex + 1 }}
            </div>

            <h2 class="question-title">
              {{ currentQuestion.question }}
            </h2>

            <div class="answers-grid">
              <button
                v-for="(answer, index) in currentQuestion.answers"
                :key="index"
                class="answer-button"
                :class="buttonState(index)"
                :disabled="selectedAnswer !== null"
                @click="selectAnswer(index)"
              >
                <span class="answer-letter">
                  {{ ['A', 'B', 'C', 'D'][index] }}
                </span>

                <span>{{ answer }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </section>

      <footer class="quiz-footer">
        <div class="score-pill">
          Score: {{ score }}
        </div>

        <button
          v-if="selectedAnswer !== null"
          class="next-button"
          @click="nextQuestion"
        >
          {{ currentQuestionIndex === questions.length - 1 ? 'Visa resultat ❤️' : 'Nästa fråga →' }}
        </button>
      </footer>
    </section>

    <section v-else class="result-card">
      <div class="result-emoji">
        {{ resultEmoji }}
      </div>

      <h1>Quiz Complete!</h1>

      <p class="result-score">
        {{ score }} / {{ questions.length }} rätt
      </p>

      <p class="result-message">
        {{ resultMessage }}
      </p>

      <button class="restart-button" @click="restartQuiz">
        Spela igen 💫
      </button>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

// =====================================================
// LÄGG IN DINA 15 FRÅGOR HÄR
//
// correctAnswer:
// 0 = första svaret
// 1 = andra svaret
// 2 = tredje svaret
// 3 = fjärde svaret
// =====================================================

const questions = ref([
  {
    question: 'Vad är Elinas favoritfärg?',
    answers: ['Rosa', 'Blå', 'Svart', 'Lila'],
    correctAnswer: 0
  },
  {
    question: 'Vad gör Richard klockan 3 på natten?',
    answers: ['Sover', 'Äter snacks', 'Spelar', 'Existentiell kris'],
    correctAnswer: 3
  },
  {
    question: 'Vem är sötast?',
    answers: ['Elina', 'Elina', 'Elina', 'Elina'],
    correctAnswer: 2
  },
  {
    question: 'Vilken emoji passar bäst?',
    answers: ['😭', '💀', '❤️', '🗿'],
    correctAnswer: 2
  },
  {
    question: 'Vad är bästa typen av date?',
    answers: ['Bio', 'Promenad', 'Gaming', 'Mys hemma'],
    correctAnswer: 3
  },

  // Lägg till resten här ↓

  {
    question: 'Fråga 6',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 1
  },
  {
    question: 'Fråga 7',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 0
  },
  {
    question: 'Fråga 8',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 2
  },
  {
    question: 'Fråga 9',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 3
  },
  {
    question: 'Fråga 10',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 0
  },
  {
    question: 'Fråga 11',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 2
  },
  {
    question: 'Fråga 12',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 1
  },
  {
    question: 'Fråga 13',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 3
  },
  {
    question: 'Fråga 14',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 1
  },
  {
    question: 'Fråga 15',
    answers: ['Svar 1', 'Svar 2', 'Svar 3', 'Svar 4'],
    correctAnswer: 0
  }
])

const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const score = ref(0)
const finished = ref(false)

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

function selectAnswer(index) {
  if (selectedAnswer.value !== null) return

  selectedAnswer.value = index

  if (index === currentQuestion.value.correctAnswer) {
    score.value++
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value >= questions.value.length - 1) {
    finished.value = true
    return
  }

  currentQuestionIndex.value++
  selectedAnswer.value = null
}

function buttonState(index) {
  if (selectedAnswer.value === null) return ''

  if (index === currentQuestion.value.correctAnswer) {
    return 'correct'
  }

  if (
    index === selectedAnswer.value &&
    selectedAnswer.value !== currentQuestion.value.correctAnswer
  ) {
    return 'wrong'
  }

  return 'disabled'
}

function restartQuiz() {
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  score.value = 0
  finished.value = false
}

const resultEmoji = computed(() => {
  const percentage = score.value / questions.value.length

  if (percentage === 1) return '👑'
  if (percentage >= 0.7) return '💖'
  if (percentage >= 0.5) return '😎'

  return '😭'
})

const resultMessage = computed(() => {
  const percentage = score.value / questions.value.length

  if (percentage === 1) {
    return 'Perfekt score. Certified soulmate.'
  }

  if (percentage >= 0.7) {
    return 'Väldigt bra. Relationship approved ❤️'
  }

  if (percentage >= 0.5) {
    return 'Du klarade dig ganska bra faktiskt.'
  }

  return 'Elina är besviken 😭'
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.quiz-app {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    radial-gradient(circle at top, #ffb7d5, #ff7eb3 40%, #6d214f 100%);
  font-family: Inter, system-ui, sans-serif;
}

.background-blur {
  position: absolute;
  border-radius: 999px;
  filter: blur(100px);
  opacity: 0.35;
}

.blur-1 {
  width: 300px;
  height: 300px;
  background: #ffffff;
  top: -80px;
  left: -80px;
}

.blur-2 {
  width: 400px;
  height: 400px;
  background: #ffd6e7;
  bottom: -100px;
  right: -100px;
}

.quiz-card,
.result-card {
  position: relative;
  z-index: 2;
  width: min(900px, 100%);
  padding: 36px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: start;
  margin-bottom: 36px;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 12px;
  font-weight: 900;
  color: #ff4d8d;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1;
  color: #4a1630;
}

.progress-wrapper {
  min-width: 260px;
}

.progress-text {
  margin-bottom: 10px;
  text-align: right;
  font-weight: 800;
  color: #7a3352;
}

.progress-bar {
  overflow: hidden;
  height: 16px;
  border-radius: 999px;
  background: #ffd6e7;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff4d8d, #ff7eb3);
  transition: width 0.35s ease;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  padding: 10px 16px;
  border-radius: 999px;
  background: #ffe0ec;
  color: #c2185b;
  font-weight: 900;
}

.question-title {
  margin: 0 0 32px;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.1;
  color: #4a1630;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.answer-button {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 100px;
  padding: 20px;
  border: none;
  border-radius: 28px;
  background: white;
  color: #4a1630;
  font-size: 18px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.2s ease,
    opacity 0.2s ease;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    inset 0 -4px 0 rgba(0, 0, 0, 0.05);
}

.answer-button:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.01);
}

.answer-letter {
  display: grid;
  place-items: center;
  min-width: 48px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #ffe0ec;
  color: #ff4d8d;
  font-weight: 1000;
}

.answer-button.correct {
  background: #d8ffe5;
}

.answer-button.wrong {
  background: #ffd6d6;
}

.answer-button.disabled {
  opacity: 0.6;
}

.quiz-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 36px;
}

.score-pill {
  padding: 14px 20px;
  border-radius: 999px;
  background: #4a1630;
  color: white;
  font-weight: 900;
}

.next-button,
.restart-button {
  border: none;
  border-radius: 999px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #ff4d8d, #ff7eb3);
  color: white;
  font-size: 17px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease;
  box-shadow: 0 14px 30px rgba(255, 77, 141, 0.35);
}

.next-button:hover,
.restart-button:hover {
  transform: translateY(-3px);
}

.result-card {
  text-align: center;
}

.result-emoji {
  font-size: 90px;
  margin-bottom: 12px;
}

.result-score {
  margin: 18px 0;
  font-size: 38px;
  font-weight: 1000;
  color: #ff4d8d;
}

.result-message {
  margin-bottom: 32px;
  font-size: 22px;
  color: #7a3352;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .quiz-app {
    padding: 16px;
  }

  .quiz-card,
  .result-card {
    padding: 24px;
    border-radius: 28px;
  }

  .quiz-header {
    flex-direction: column;
  }

  .progress-wrapper {
    width: 100%;
    min-width: auto;
  }

  .answers-grid {
    grid-template-columns: 1fr;
  }

  .quiz-footer {
    flex-direction: column;
    gap: 18px;
    align-items: stretch;
  }

  .next-button,
  .restart-button {
    width: 100%;
  }
}
</style>
