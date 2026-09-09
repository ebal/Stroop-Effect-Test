// Pure board/matching/path logic (SPEC §3, §5-7) — no Vue, no storage.
//
// A game state is `{ cols, cells }`: `cells` is a flat, row-major array of
// length `rows * cols` (rows derived as cells.length / cols). A cell holds
// a digit 1-9, or `null` for an empty (removed) cell. Removed cells are
// never spliced out — SPEC §4's "Stable positions are important for
// planning" — so every index keeps its meaning for the life of the board.

function rowOf(index, cols) {
  return Math.floor(index / cols)
}

function colOf(index, cols) {
  return index % cols
}

export function isNumericMatch(a, b) {
  return a === b || a + b === 10
}

// Same row, every cell strictly between them (in that row) is empty.
export function isHorizontalClear(cells, cols, i, j) {
  if (rowOf(i, cols) !== rowOf(j, cols)) return false
  const lo = Math.min(i, j)
  const hi = Math.max(i, j)
  for (let k = lo + 1; k < hi; k++) {
    if (cells[k] !== null) return false
  }
  return true
}

// Same column, every cell strictly between them (down that column) is empty.
export function isVerticalClear(cells, cols, i, j) {
  if (colOf(i, cols) !== colOf(j, cols)) return false
  const lo = Math.min(i, j)
  const hi = Math.max(i, j)
  for (let k = lo + cols; k < hi; k += cols) {
    if (cells[k] !== null) return false
  }
  return true
}

// A "true diagonal" (SPEC §5): equal row and column distance. Every cell
// strictly between them along that diagonal is empty.
export function isDiagonalClear(cells, cols, i, j) {
  const ri = rowOf(i, cols)
  const ci = colOf(i, cols)
  const rj = rowOf(j, cols)
  const cj = colOf(j, cols)
  const dr = rj - ri
  const dc = cj - ci
  if (dr === 0 || Math.abs(dr) !== Math.abs(dc)) return false
  const stepR = dr > 0 ? 1 : -1
  const stepC = dc > 0 ? 1 : -1
  const steps = Math.abs(dr)
  for (let s = 1; s < steps; s++) {
    const idx = (ri + stepR * s) * cols + (ci + stepC * s)
    if (cells[idx] !== null) return false
  }
  return true
}

// SPEC §6: treat the board as one flattened row-major sequence — every
// cell strictly between the two flat indices is empty, regardless of row
// boundaries. This is what lets a match "wrap" from the end of one row to
// the start of another.
export function isSequentialClear(cells, i, j) {
  const lo = Math.min(i, j)
  const hi = Math.max(i, j)
  for (let k = lo + 1; k < hi; k++) {
    if (cells[k] !== null) return false
  }
  return true
}

// Split out from isLegalPair so the game layer can tell a player *why* a
// tap failed: two numbers that don't add up (isNumericMatch false) vs. two
// numbers that do match but have no clear path (this false) are different
// situations, and were previously indistinguishable from the outside —
// see useNumberMatchGame.js's tapCell.
export function isConnected(state, i, j) {
  return (
    isHorizontalClear(state.cells, state.cols, i, j) ||
    isVerticalClear(state.cells, state.cols, i, j) ||
    isDiagonalClear(state.cells, state.cols, i, j) ||
    isSequentialClear(state.cells, i, j)
  )
}

export function isLegalPair(state, i, j) {
  if (i === j) return false
  const a = state.cells[i]
  const b = state.cells[j]
  if (a === null || b === null) return false
  if (!isNumericMatch(a, b)) return false
  return isConnected(state, i, j)
}

// O(n^2) over occupied cells — boards stay small enough (even after several
// Add Numbers uses) that this is instant; only called on demand (Hint,
// stall detection), never on every render.
export function findLegalPairs(state) {
  const occupied = []
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] !== null) occupied.push(i)
  }
  const pairs = []
  for (let a = 0; a < occupied.length; a++) {
    for (let b = a + 1; b < occupied.length; b++) {
      const i = occupied[a]
      const j = occupied[b]
      if (isLegalPair(state, i, j)) pairs.push([i, j])
    }
  }
  return pairs
}

// Pure — returns a new state, does not mutate the one passed in.
export function removePair(state, i, j) {
  const cells = state.cells.slice()
  cells[i] = null
  cells[j] = null
  return { ...state, cells }
}

// SPEC §11: every currently-occupied value, in reading order, appended as
// new cells at the end of the logical board (padded to a whole number of
// rows so rendering never has a partial trailing row).
export function appendRemainingNumbers(state) {
  const remaining = state.cells.filter((v) => v !== null)
  const cells = state.cells.concat(remaining)
  const remainder = cells.length % state.cols
  if (remainder !== 0) {
    cells.push(...new Array(state.cols - remainder).fill(null))
  }
  return { ...state, cells }
}

export function remainingCount(state) {
  return state.cells.reduce((sum, v) => sum + (v === null ? 0 : 1), 0)
}

export function isBoardCleared(state) {
  return remainingCount(state) === 0
}
