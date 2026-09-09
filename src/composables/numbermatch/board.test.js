import { describe, it, expect } from 'vitest'
import {
  isNumericMatch,
  isHorizontalClear,
  isVerticalClear,
  isDiagonalClear,
  isSequentialClear,
  isConnected,
  isLegalPair,
  findLegalPairs,
  removePair,
  appendRemainingNumbers,
  remainingCount,
  isBoardCleared,
} from './board.js'

describe('isNumericMatch', () => {
  it('matches identical digits', () => {
    expect(isNumericMatch(8, 8)).toBe(true)
    expect(isNumericMatch(3, 3)).toBe(true)
  })

  it('matches digits summing to 10', () => {
    expect(isNumericMatch(1, 9)).toBe(true)
    expect(isNumericMatch(2, 8)).toBe(true)
    expect(isNumericMatch(3, 7)).toBe(true)
    expect(isNumericMatch(4, 6)).toBe(true)
    expect(isNumericMatch(5, 5)).toBe(true)
  })

  it('rejects unrelated values', () => {
    expect(isNumericMatch(3, 4)).toBe(false)
    expect(isNumericMatch(1, 2)).toBe(false)
  })
})

// 3-wide grid for path tests:
//   0  1  2
//   3  4  5
//   6  7  8
describe('isHorizontalClear', () => {
  it('true for adjacent same-row cells', () => {
    expect(isHorizontalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 1)).toBe(true)
  })

  it('true when every intervening same-row cell is empty', () => {
    const cells = [3, null, 7, 4, 5, 6, 7, 8, 9]
    expect(isHorizontalClear(cells, 3, 0, 2)).toBe(true)
  })

  it('false when an intervening same-row cell is occupied', () => {
    const cells = [3, 5, 7, 4, 5, 6, 7, 8, 9]
    expect(isHorizontalClear(cells, 3, 0, 2)).toBe(false)
  })

  it('false across different rows', () => {
    expect(isHorizontalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 3)).toBe(false)
  })
})

describe('isVerticalClear', () => {
  it('true for adjacent same-column cells', () => {
    expect(isVerticalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 3)).toBe(true)
  })

  it('true when every intervening same-column cell is empty', () => {
    const cells = [3, 2, 3, null, 5, 6, 7, 8, 9]
    expect(isVerticalClear(cells, 3, 0, 6)).toBe(true)
  })

  it('false when an intervening same-column cell is occupied', () => {
    const cells = [3, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(isVerticalClear(cells, 3, 0, 6)).toBe(false)
  })

  it('false across different columns', () => {
    expect(isVerticalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 4)).toBe(false)
  })
})

describe('isDiagonalClear', () => {
  it('true for an adjacent true diagonal', () => {
    expect(isDiagonalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 4)).toBe(true) // (0,0)->(1,1)
  })

  it('true across a longer diagonal with clear intervening cells', () => {
    const cells = [3, 2, 3, 4, null, 6, 7, 8, 7]
    expect(isDiagonalClear(cells, 3, 0, 8)).toBe(true) // (0,0)->(1,1)->(2,2)
  })

  it('false when an intervening diagonal cell is occupied', () => {
    const cells = [3, 2, 3, 4, 5, 6, 7, 8, 7]
    expect(isDiagonalClear(cells, 3, 0, 8)).toBe(false)
  })

  it('false when row/column distances differ (not a true diagonal)', () => {
    expect(isDiagonalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 5)).toBe(false) // (0,0)->(1,2)
  })

  it('false for the same row or column (zero row distance)', () => {
    expect(isDiagonalClear([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 0, 2)).toBe(false)
  })
})

describe('isSequentialClear (row-wrap)', () => {
  it('true when nothing occupied lies between the flattened indices, even across a row boundary', () => {
    // row 1: · · · · · 4   row 2: 6 · · · · ·   (SPEC §6 example)
    const cells = [null, null, null, null, null, 4, 6, null, null, null, null, null]
    expect(isSequentialClear(cells, 5, 6)).toBe(true)
  })

  it('false when an occupied cell lies strictly between the two flat indices', () => {
    const cells = [3, null, 5, null, 7]
    expect(isSequentialClear(cells, 0, 4)).toBe(false)
  })
})

// isConnected is isLegalPair minus the numeric-match requirement — it's
// what lets the game distinguish "not a valid pair" from "valid pair,
// blocked path" for player feedback.
describe('isConnected', () => {
  it('is true for a connected pair regardless of whether the numbers match', () => {
    const state = { cols: 4, cells: [3, null, null, 4] } // 3 and 4 don't match, but path is clear
    expect(isConnected(state, 0, 3)).toBe(true)
  })

  it('is false when every path is blocked, regardless of whether the numbers match', () => {
    const state = { cols: 4, cells: [3, 9, null, 4] } // blocked by 9, and 3+4 doesn't match either
    expect(isConnected(state, 0, 3)).toBe(false)
  })
})

describe('isLegalPair', () => {
  const state = { cols: 4, cells: [3, null, null, 7, 6, 2, 5, 5, 3, 7, 4, 6] }

  it('true for a numerically valid, horizontally clear pair', () => {
    expect(isLegalPair(state, 0, 3)).toBe(true) // 3 + 7 = 10, row clear
  })

  it('false for a numerically invalid pair even if clear', () => {
    expect(isLegalPair({ cols: 4, cells: [3, null, null, 4] }, 0, 3)).toBe(false)
  })

  it('false for a numerically valid pair with a blocked path in every direction', () => {
    // 3 and 7 in the same row, but 5 sits directly between them.
    const blocked = { cols: 4, cells: [3, 5, null, 7] }
    expect(isLegalPair(blocked, 0, 3)).toBe(false)
  })

  it('false when either cell is empty', () => {
    expect(isLegalPair(state, 1, 3)).toBe(false)
  })

  it('false comparing a cell to itself', () => {
    expect(isLegalPair(state, 0, 0)).toBe(false)
  })
})

describe('findLegalPairs', () => {
  it('finds every legal pair on a small board', () => {
    const state = { cols: 2, cells: [3, 7, 5, 5] }
    const pairs = findLegalPairs(state)
    // 3+7 (row0), 5+5 (row1), and 3<->? diagonal 0-3 (3,5 no), 1-2 vertical(7,5 no)
    expect(pairs).toContainEqual([0, 1])
    expect(pairs).toContainEqual([2, 3])
  })

  it('returns an empty array when no legal pair exists', () => {
    const state = { cols: 2, cells: [1, 2, 3, 4] }
    expect(findLegalPairs(state)).toEqual([])
  })
})

describe('removePair', () => {
  it('empties exactly the two given cells and does not mutate the input', () => {
    const state = { cols: 2, cells: [3, 7, 5, 5] }
    const after = removePair(state, 0, 1)
    expect(after.cells).toEqual([null, null, 5, 5])
    expect(state.cells).toEqual([3, 7, 5, 5]) // input untouched
  })
})

describe('appendRemainingNumbers', () => {
  it('copies only occupied values, in reading order, to the end', () => {
    const state = { cols: 4, cells: [3, null, 7, null, null, 4, null, 6] }
    const after = appendRemainingNumbers(state)
    // remaining in reading order: 3, 7, 4, 6
    expect(after.cells.slice(8, 12)).toEqual([3, 7, 4, 6])
  })

  it('pads the tail with null up to a whole number of rows', () => {
    const state = { cols: 4, cells: [3, null, null, null] } // 1 remaining value
    const after = appendRemainingNumbers(state)
    expect(after.cells.length % state.cols).toBe(0)
    expect(after.cells).toEqual([3, null, null, null, 3, null, null, null])
  })

  it('does not mutate the input state', () => {
    const state = { cols: 2, cells: [3, null] }
    appendRemainingNumbers(state)
    expect(state.cells).toEqual([3, null])
  })
})

describe('remainingCount / isBoardCleared', () => {
  it('counts only non-null cells', () => {
    expect(remainingCount({ cols: 2, cells: [3, null, 7, null] })).toBe(2)
  })

  it('isBoardCleared is true only when every cell is null', () => {
    expect(isBoardCleared({ cols: 2, cells: [null, null, null, null] })).toBe(true)
    expect(isBoardCleared({ cols: 2, cells: [3, null, null, null] })).toBe(false)
  })
})
