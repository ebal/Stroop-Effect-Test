<template>
  <div class="about">
    <h1>How to Play</h1>

    <p class="intro">
      Tap two numbers to remove them when they're <strong>identical</strong> or
      <strong>add up to 10</strong> — but only if they're connected: same row, same column, a true
      diagonal, or in reading order with nothing occupied between them (this can wrap from the end
      of one row to the start of another).
    </p>

    <div class="rule-example">
      <span>3 · · 7</span>
      <span class="ok">✓ connected</span>
    </div>
    <div class="rule-example">
      <span>3 · 5 · 7</span>
      <span class="blocked">✕ blocked by 5</span>
    </div>

    <h2>Difficulty</h2>
    <p class="intro">
      Difficulty comes from board size and how few <strong>Add Numbers</strong> uses you get, never
      tiny cells or timers. Easy is a small 6×3 board with 4 Add Numbers uses; Extreme is a 9×10
      board with only 1.
    </p>

    <h2>Add Numbers</h2>
    <p class="intro">
      Stuck with no legal pair left? <strong>Add Numbers</strong> copies every remaining number, in
      reading order, onto new cells at the end of the board — creating fresh matching
      opportunities. Removed cells never refill or shift; positions stay exactly where they are for
      planning.
    </p>

    <h2>Try it yourself</h2>
    <p class="intro">Untimed, unscored — see the connection rule in action.</p>

    <div class="demo">
      <p class="demo-feedback">
        {{ demoRemaining }} number{{ demoRemaining === 1 ? '' : 's' }} left
        <template v-if="demoCleared"> — cleared!</template>
      </p>
      <NumberBoard
        class="practice-board"
        :cols="demoState.cols"
        :cells="demoState.cells"
        :selected="demoSelected"
        :invalid-pair="demoInvalid"
        @tap="practiceTap"
      />
      <button class="next-btn" @click="resetPracticeBoard">Reset Board</button>
    </div>

    <button class="back-btn" @click="$emit('menu')">Back to Menu</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NumberBoard from './NumberBoard.vue'
import { isLegalPair, removePair, remainingCount, isBoardCleared } from '../../composables/numbermatch/board.js'

defineEmits(['menu'])

// A tiny fixed teaching board — never persisted, never scored (SPEC §26).
// Deliberately mirrors the spec's own "3 · · 7" vs "3 · 5 · 7" example:
// 3 and 7 start blocked by the two 5s between them; clearing the 5s (an
// easy adjacent match) opens a clear horizontal path between 3 and 7.
const PRACTICE_BOARD = { cols: 4, cells: [3, 5, 5, 7, 6, 4, 2, 8] }

const demoState = ref({ ...PRACTICE_BOARD, cells: PRACTICE_BOARD.cells.slice() })
const demoSelected = ref(null)
const demoInvalid = ref(null)
let demoFlashTimeout = null

const demoRemaining = computed(() => remainingCount(demoState.value))
const demoCleared = computed(() => isBoardCleared(demoState.value))

function practiceTap(i) {
  if (demoCleared.value) return
  if (demoState.value.cells[i] === null) return
  demoInvalid.value = null

  if (demoSelected.value === i) {
    demoSelected.value = null
    return
  }

  if (demoSelected.value === null) {
    demoSelected.value = i
    return
  }

  const a = demoSelected.value
  const b = i
  if (isLegalPair(demoState.value, a, b)) {
    demoState.value = removePair(demoState.value, a, b)
  } else {
    demoInvalid.value = [a, b]
    clearTimeout(demoFlashTimeout)
    demoFlashTimeout = setTimeout(() => {
      demoInvalid.value = null
    }, 400)
  }
  demoSelected.value = null
}

function resetPracticeBoard() {
  demoState.value = { ...PRACTICE_BOARD, cells: PRACTICE_BOARD.cells.slice() }
  demoSelected.value = null
  demoInvalid.value = null
}
</script>

<style scoped>
.about {
  max-width: 640px;
  width: 100%;
}

h1 {
  text-align: center;
  margin-bottom: 1rem;
}

h2 {
  margin: 2rem 0 0.75rem;
  font-size: 1.15rem;
}

.intro {
  color: var(--text-dim);
  line-height: 1.6;
}

.intro strong {
  color: var(--text);
}

.rule-example {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  margin: 0 auto 0.5rem;
  color: var(--text);
}

.rule-example .ok {
  color: var(--correct);
  font-size: 0.85rem;
  font-weight: 700;
}

.rule-example .blocked {
  color: var(--wrong);
  font-size: 0.85rem;
  font-weight: 700;
}

.demo {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.demo-feedback {
  margin: 0;
  min-height: 1.4em;
  color: var(--text-dim);
  text-align: center;
  font-weight: 600;
}

.practice-board {
  max-width: 280px;
}

.next-btn {
  background: var(--surface-2);
  color: var(--text);
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.back-btn {
  display: block;
  margin: 2rem auto 0;
  background: var(--accent);
  color: #10121a;
  border: none;
  border-radius: 10px;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
