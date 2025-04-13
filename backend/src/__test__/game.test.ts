import Game from '../game'
import Player from '../player'
import Drawing from '../drawing'
import { GameMode } from '../utils'
import * as crypto from 'node:crypto'

describe('Class `Game`', () => {
  const game = new Game()

  describe('should provide access to properties via getter', () => {
    it('should return the id with a correct format', () => {
      expect(game.id).toBeDefined()
      expect(typeof game.id).toBe(typeof crypto.randomUUID())
    })

    it('should return the drawing data', () => {
      expect(game.drawing).toBeInstanceOf(Drawing)
    })

    it('should return a list of players', () => {
      expect(Array.isArray(game.players)).toBe(true)
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

  it('should set the game mode correctly', () => {
    const gameModes = [GameMode.OneLine, GameMode.LineLengthLimit, null]

    for (const mode of gameModes) {
      game.gameMode = mode
      expect(game.gameMode).toBe(mode)
    }
  })

  it('should add a new player', () => {
    const newPlayerId = 'new-player'
    game.addPlayer(newPlayerId)
    expect(
      game.players.findIndex((player) => player.id === newPlayerId),
    ).not.toEqual(-1)
  })

  it('should update the drawing with the given one', () => {
    const arraySize = 300 * 300 * 4
    const newDrawing = Drawing.createFrom(Buffer.alloc(arraySize, 1))
    game.updateDrawing(newDrawing)

    expect(game.drawing).toEqual(newDrawing)
  })

  describe('should reset the game', () => {
    beforeEach(() => game.resetGame())

    it('should clear the canvas', () => {
      expect(game.drawing).toEqual(Drawing.createEmpty())
    })

    it('should reset the game mode', () => {
      expect(game.gameMode).toEqual(null)
    })
  })

  describe('remove a given player', () => {
    beforeEach(() => {
      while (game.players.length > 0) {
        game.removePlayer(game.players[0].id)
      }
    })

    it('should be able to remove when the given player exists', () => {
      for (let i = 0; i < 100; i++) {
        game.addPlayer(`player-${i}`)
      }

      const axedPlayerId = `player-${Math.floor(Math.random() * 100)}`

      game.removePlayer(axedPlayerId)
      expect(
        game.players.findIndex((player) => player.id === axedPlayerId),
      ).toEqual(-1)
    })

    it('should throw error when removing non-existent player', () => {
      const nonExistentPlayerId = 'ghost-player'
      expect(() => game.removePlayer(nonExistentPlayerId)).toThrow()
    })
  })

  describe('should update turn', () => {
    beforeAll(() => {
      game.resetGame()
      while (game.players.length > 0) {
        game.removePlayer(game.players[0].id)
      }
    })

    it('should set `currentPlayer` to undefined when no one is in the game', () => {
      game.nextTurn()
      expect(game.currentPlayer).toBeUndefined()
    })

    it('should set `currentPlayer` to the only player when one player exists ', () => {
      const player1Id = 'player-1'
      game.addPlayer(player1Id)
      game.nextTurn()
      expect(game.currentPlayer).toEqual(new Player(player1Id))
    })

    it('should cycle through players when multiple players in the game', () => {
      const numberOfPlayers = 100
      const playerIds = Array.from(
        { length: numberOfPlayers },
        (_, index) => `player-${index + 1}`,
      )
      playerIds.forEach((id) => game.addPlayer(id))

      // Start game - set the current turn player as the first player
      game.nextTurn()
      expect(game.currentPlayer?.id).toBe('player-1')

      for (let i = 1; i < numberOfPlayers; i++) {
        game.nextTurn()
        expect(game.currentPlayer?.id).toBe(`player-${i + 1}`)
      }

      // After going through all players, it should cycle back the first player in the list
      game.nextTurn()
      expect(game.currentPlayer?.id).toBe('player-1')
    })
  })
})
