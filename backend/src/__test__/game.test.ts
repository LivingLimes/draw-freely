import Game from '../models/game'
import Player from '../models/player'
import Drawing from '../models/drawing'
import * as crypto from 'node:crypto'
import { getNextElement } from '../utils'

const DRAWING_BUFFER_SIZE = 300 * 300 * 4

function createGameWithIds(players: Player['id'][]): Game {
  const game = new Game()

  players.forEach((player) => {
    game.addPlayer(player)
  })

  return game
}

function createGameWithPlayers(count: number): Game {
  const game = new Game()

  for (let i = 0; i < count; i++) {
    game.addPlayer(`player-${i}`)
  }

  return game
}

describe('Class `Game`', () => {
  describe('should initialise a game', () => {
    const game = new Game()

    it('should return the id with a correct format', () => {
      expect(game.id).toBeDefined()
      expect(typeof game.id).toBe(typeof crypto.randomUUID())
    })

    it('should return the drawing data', () => {
      expect(game.drawing).toBeInstanceOf(Drawing)
      expect(game.drawing).toEqual(Drawing.createEmpty())
    })

    it('should return an empty array of players', () => {
      expect(game.players).toHaveLength(0)
    })

    it('should return undefined for the current player when initiated', () => {
      expect(game.currentPlayer).toBeUndefined()
    })

    it('should return undefined for the game mode before the player picks one', () => {
      expect(game.gameMode).toBeUndefined()
    })

    it('should return the default line limit', () => {
      expect(game.lineLengthLimit).toEqual(150)
    })
  })

  describe('adding a new player', () => {
    const newPlayerId = 'new-player'
    const anotherNewPlayerId = 'another-new-player'

    it('should add a new player', () => {
      const game = createGameWithIds([newPlayerId])

      game.addPlayer(newPlayerId)
      expect(game.players.some((player) => player.id === newPlayerId)).toBe(
        true,
      )
    })

    it('should set the new player as #currentTurnPlayer as there is only one player', () => {
      const game = createGameWithIds([newPlayerId])

      expect(game.currentPlayer?.id).toEqual(newPlayerId)
    })

    it('should not trigger a turn change when there are more than one player in the game', () => {
      const game = createGameWithIds([newPlayerId])

      game.addPlayer(anotherNewPlayerId)
      expect(game.currentPlayer?.id).not.toEqual(anotherNewPlayerId)
    })
  })

  it('should update the drawing with the given one', () => {
    const game = new Game()

    const newDrawing = Drawing.createFrom(Buffer.alloc(DRAWING_BUFFER_SIZE, 1))
    game.updateDrawing(newDrawing)

    expect(game.drawing).toEqual(newDrawing)
  })

  describe('should reset the game', () => {
    const game = new Game()

    const newDrawing = Drawing.createFrom(Buffer.alloc(DRAWING_BUFFER_SIZE, 1))
    const emptyDrawing = Drawing.createEmpty()
    game.updateDrawing(newDrawing)

    it('should clear the canvas', () => {
      expect(game.drawing).not.toEqual(emptyDrawing)
      game.resetGame()
      expect(game.drawing).toEqual(emptyDrawing)
    })

    it('should reset the game mode', () => {
      game.resetGame()
      expect(game.gameMode).toEqual(null)
    })
  })

  describe('remove a given player', () => {
    it('should be able to remove when the given player exists', () => {
      const game = createGameWithPlayers(100)

      const removedPlayerId = `player-${Math.floor(Math.random() * 100)}`

      game.removePlayer(removedPlayerId)
      expect(game.players).not.toContain(new Player(removedPlayerId))
    })

    it('should throw error when removing a non-existent player', () => {
      const game = createGameWithPlayers(100)

      const nonExistentPlayerId = 'ghost-player'
      expect(() => game.removePlayer(nonExistentPlayerId)).toThrow()
    })

    it('should trigger a turn change if the current player leaving the game', () => {
      const game = createGameWithPlayers(100)

      // After 10 turns
      for (let i = 0; i < 10; i++) {
        game.nextTurn()
      }

      const currentPlayerId = game.currentPlayer?.id
      const nextPlayer = getNextElement(game.players, game.currentPlayer)

      if (currentPlayerId) {
        game.removePlayer(currentPlayerId)
      }

      expect(game.currentPlayer).toEqual(nextPlayer)
    })
  })

  describe('should update turn', () => {
    it('should set `currentPlayer` to the only player in the game', () => {
      const game = new Game()

      const player1Id = 'player-1'
      game.addPlayer(player1Id)
      expect(game.currentPlayer).toEqual(new Player(player1Id))
    })

    it('should cycle through players when multiple players in the game', () => {
      const game = new Game()

      const numberOfPlayers = 100
      const playerIds = Array.from(
        { length: numberOfPlayers },
        (_, index) => `player-${index + 1}`,
      )
      playerIds.forEach((id) => game.addPlayer(id))

      expect(game.currentPlayer).toEqual(new Player('player-1'))

      for (let i = 1; i < numberOfPlayers; i++) {
        game.nextTurn()
        expect(game.currentPlayer).toEqual(new Player(`player-${i + 1}`))
      }

      // After going through all players, it should cycle back the first player in the list
      game.nextTurn()
      expect(game.currentPlayer).toEqual(new Player('player-1'))
    })
  })
})

describe('check if the given player in the list', () => {
  it('should return true if the given player is in the list', () => {
    const game = createGameWithPlayers(10)
    expect(game.hasPlayer(`player-1`)).toBe(true)
  })

  it('should return false if the given player is not in the list', () => {
    const game = createGameWithPlayers(10)
    expect(game.hasPlayer(`player-100`)).toBe(false)
  })
})
