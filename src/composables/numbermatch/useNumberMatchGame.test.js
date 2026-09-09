import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNumberMatchGame } from './useNumberMatchGame.js'

// Manually-driven virtual clock, matching this codebase's existing pattern
// (see e.g. useSwitchTrailGame.test.js) for composables that use
// performance.now() + setInterval.
let fakeNow
function advance(ms) {
  fakeNow += ms
  vi.advanceTimersByTime(ms)
}

describe('useNumberMatchGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fakeNow = 0
    vi.spyOn(performance, 'now').mockImplementation(() => fakeNow)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts playing immediately with a generated board', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    expect(game.status.value).toBe('playing')
    expect(game.boardState.value.cells.length).toBe(18) // easy: 6 cols x 3 rows
  })

  it('tapping a legal pair removes both and counts one Move, zero Mistakes', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7, 5, 5] }

    game.tapCell(0)
    expect(game.selected.value).toBe(0)
    game.tapCell(1) // 3 + 7 = 10, same row
    expect(game.boardState.value.cells).toEqual([null, null, 5, 5])
    expect(game.moves.value).toBe(1)
    expect(game.mistakes.value).toBe(0)
    expect(game.pairsRemoved.value).toBe(1)
    expect(game.selected.value).toBe(null)
  })

  it('tapping an illegal pair leaves the board unchanged and counts a Mistake', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 4, 5, 5] }

    game.tapCell(0)
    game.tapCell(1) // 3+4=7, not a match
    expect(game.boardState.value.cells).toEqual([3, 4, 5, 5])
    expect(game.moves.value).toBe(1)
    expect(game.mistakes.value).toBe(1)
  })

  it('tapping numbers that do not add up flags the reason as "mismatch"', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 4, 5, 5] }

    game.tapCell(0)
    game.tapCell(1) // 3+4=7, not a numeric match at all
    expect(game.invalidFlash.value).toEqual({ pair: [0, 1], reason: 'mismatch' })
  })

  it('tapping a numerically valid pair with no clear path flags the reason as "blocked"', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    // 3 and 7 add up to 10, but 5 sits directly between them (SPEC §5 example).
    game.boardState.value = { cols: 4, cells: [3, 5, null, 7] }

    game.tapCell(0)
    game.tapCell(3)
    expect(game.boardState.value.cells).toEqual([3, 5, null, 7]) // unchanged
    expect(game.invalidFlash.value).toEqual({ pair: [0, 3], reason: 'blocked' })
  })

  it('tapping the selected cell again deselects without counting a Move', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 4, 5, 5] }

    game.tapCell(0)
    game.tapCell(0)
    expect(game.selected.value).toBe(null)
    expect(game.moves.value).toBe(0)
  })

  it('tapping an empty cell is a total no-op', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, null, 5, 5] }

    game.tapCell(0)
    game.tapCell(1) // empty
    expect(game.selected.value).toBe(0) // selection untouched
    expect(game.moves.value).toBe(0)
  })

  it('clearing the board finishes the round as cleared', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7] }

    game.tapCell(0)
    game.tapCell(1)
    expect(game.status.value).toBe('finished')
    expect(game.results.value.cleared).toBe(true)
    expect(game.results.value.numbersRemaining).toBe(0)
  })

  it('is stalled (not finished) when no legal pair exists but Add Numbers remains', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1) // easy has 4 Add Numbers uses
    game.boardState.value = { cols: 2, cells: [1, 2, 3, 4] } // no legal pairs at all

    expect(game.stalled.value).toBe(true)
    expect(game.status.value).toBe('playing')
  })

  it('is Game Over (finished, not cleared) when no legal pair exists and Add Numbers is exhausted', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    // [1,2,3,4] has no legal pair, and repeatedly doubling it via Add
    // Numbers never creates one either (verified: every identical-value
    // pair this produces always has an occupied cell blocking every path).
    game.boardState.value = { cols: 2, cells: [1, 2, 3, 4] }
    for (let i = 0; i < 4; i++) game.addNumbers() // exhausts easy's 4 uses

    expect(game.addNumbersRemaining.value).toBe(0)
    expect(game.status.value).toBe('finished')
    expect(game.results.value.cleared).toBe(false)
  })

  it('Add Numbers appends the remaining values and clears Undo history', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [1, 2, 3, 4] }

    game.tapCell(0) // select '1', creates no removal — just checking history stays empty pre-add
    game.tapCell(0) // deselect
    game.addNumbers()

    expect(game.addNumbersUsed.value).toBe(1)
    expect(game.boardState.value.cells.slice(4, 8)).toEqual([1, 2, 3, 4])
    expect(game.moveHistory.value).toEqual([])
  })

  it('Undo restores both cells of the most recent removal exactly', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7, 5, 5] }

    game.tapCell(0)
    game.tapCell(1)
    expect(game.boardState.value.cells).toEqual([null, null, 5, 5])

    game.undo()
    expect(game.boardState.value.cells).toEqual([3, 7, 5, 5])
    expect(game.undos.value).toBe(1)
  })

  it('Hint highlights a real legal pair and increments Hints without removing it', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7, 5, 5] }

    game.hint()
    expect(game.hints.value).toBe(1)
    expect(game.hintPair.value).not.toBe(null)
    const [i, j] = game.hintPair.value
    expect(game.boardState.value.cells[i]).not.toBe(null)
    expect(game.boardState.value.cells[j]).not.toBe(null)
  })

  it('Restart reloads the exact original board and resets counters', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    const original = game.boardState.value.cells.slice()

    game.boardState.value = { cols: 2, cells: [3, 7, 5, 5] }
    game.tapCell(0)
    game.tapCell(1)
    expect(game.moves.value).toBe(1)

    game.restart()
    expect(game.boardState.value.cells).toEqual(original)
    expect(game.moves.value).toBe(0)
    expect(game.pairsRemoved.value).toBe(0)
  })

  it('a completed game reports clean = cleared && hints === 0', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7] }
    game.tapCell(0)
    game.tapCell(1)
    expect(game.results.value.clean).toBe(true)
  })

  it('using a Hint before clearing disqualifies Clean', () => {
    const game = useNumberMatchGame()
    game.start('easy', 1)
    game.boardState.value = { cols: 2, cells: [3, 7] }
    game.hint()
    game.tapCell(0)
    game.tapCell(1)
    expect(game.results.value.cleared).toBe(true)
    expect(game.results.value.clean).toBe(false)
  })
})
