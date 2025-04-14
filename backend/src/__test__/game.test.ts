import Game from '../game'
import Player from '../player'
import Drawing from '../drawing'
import * as crypto from 'node:crypto'

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
      expect(game.players.length).toEqual(0)
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

  it('should add a new player', () => {
    const game = new Game()

    const newPlayerId = 'new-player'
    game.addPlayer(newPlayerId)
    expect(
      game.players.findIndex((player) => player.id === newPlayerId),
    ).not.toEqual(-1)
  })

  it('should update the drawing with the given one', () => {
    const game = new Game()

    const arraySize = 300 * 300 * 4
    const newDrawing = Drawing.createFrom(Buffer.alloc(arraySize, 1))
    game.updateDrawing(newDrawing)

    expect(game.drawing).toEqual(newDrawing)
  })

  describe('should reset the game', () => {
    const game = new Game()
    game.resetGame()

    it('should clear the canvas', () => {
      expect(game.drawing).toEqual(Drawing.createEmpty())
    })

    it('should reset the game mode', () => {
      expect(game.gameMode).toEqual(null)
    })
  })

  describe('remove a given player', () => {
    const game = new Game()

    for (let i = 0; i < 100; i++) {
      game.addPlayer(`player-${i}`)
    }

    const axedPlayerId = `player-${Math.floor(Math.random() * 100)}`

    it('should be able to remove when the given player exists', () => {
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
    it('should set `currentPlayer` to the only player when one player exists ', () => {
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
