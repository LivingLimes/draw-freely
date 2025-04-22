import Game from '../models/game'
import Player from '../models/player'
import Drawing from '../models/drawing'
import GameMode from '../game-mode'

describe('Game', () => {
  const DRAWING_BUFFER_SIZE = 300 * 300 * 4
  const firstPlayerId = 'first player'
  const secondPlayerId = 'second player'

  describe('Initialise a game', () => {
    it('should initialise an empty drawing', () => {
      const game = new Game()

      expect(game.drawing).toEqual(Drawing.createEmpty())
    })

    it('should initialise an empty array of players', () => {
      const game = new Game()
      expect(game.players).toHaveLength(0)
    })

    it('should initialise no current turn player', () => {
      const game = new Game()
      expect(game.currentPlayer).toBeNull()
    })

    it('should initialise an undefined game mode', () => {
      const game = new Game()
      expect(game.gameMode).toBeUndefined()
    })

    it('should initialise the default line limit', () => {
      const game = new Game()
      expect(game.lineLengthLimit).toEqual(150)
    })
  })

  describe('adding a new player', () => {
    it('should add player to player list', () => {
      const game = new Game()

      game.addPlayer(firstPlayerId)
      expect(game.players.some((player) => player.id === firstPlayerId)).toBe(
        true,
      )
    })

    it('should set the new player as current turn player when there is only player', () => {
      const game = new Game()
      game.addPlayer(firstPlayerId)

      expect(game.currentPlayer?.id).toEqual(firstPlayerId)
    })

    it('should not trigger a turn change when there is already one player in the game', () => {
      const game = new Game()
      game.addPlayer(firstPlayerId)
      game.addPlayer(secondPlayerId)

      expect(game.currentPlayer?.id).not.toEqual(secondPlayerId)
    })
  })

  describe('reset game', () => {
    it('should reset the drawing', () => {
      const game = new Game()
      const emptyDrawing = Drawing.createEmpty()
      const newDrawing = Drawing.createFrom(Buffer.alloc(DRAWING_BUFFER_SIZE, 1))
      game.updateDrawing(newDrawing)
      
      game.resetGame()

      expect(game.drawing).toEqual(emptyDrawing)
    })

    it('should reset the game mode', () => {
      const game = new Game()
      game.gameMode = GameMode.LineLengthLimit

      game.resetGame()

      expect(game.gameMode).toEqual(null)
    })
  })

  describe('remove a given player', () => {
    it('should be able to remove when the given player exists', () => {
      const game = new Game()
      game.addPlayer(firstPlayerId)

      game.removePlayer(firstPlayerId)
      expect(game.players).not.toContain(new Player(firstPlayerId))
    })

    it('should throw error when removing a non-existent player', () => {
      const game = new Game()
      const nonExistentPlayerId = 'ghost-player'

      expect(() => game.removePlayer(nonExistentPlayerId)).toThrow()
    })

    it('should trigger a turn change if the current player leaves the game', () => {
      const game = new Game()
      game.addPlayer(firstPlayerId)
      game.addPlayer(secondPlayerId)

      game.removePlayer(firstPlayerId)

      expect(game.currentPlayer?.id).toEqual(secondPlayerId)
    })
  })

  describe('next turn', () => {
    it('if only one player in the game, current turn player should not change', () => {
      const game = new Game()

      game.addPlayer(firstPlayerId)
      game.nextTurn()

      expect(game.currentPlayer?.id).toEqual(firstPlayerId)
    })

    it('should go to next player in list', () => {
      const game = new Game()

      game.addPlayer(firstPlayerId)
      game.addPlayer(secondPlayerId)
      game.nextTurn()
      expect(game.currentPlayer?.id).toEqual(secondPlayerId)

      game.nextTurn()
      expect(game.currentPlayer?.id).toEqual(firstPlayerId)
    })

    it('should loop back to first player from last player in list', () => {
      const game = new Game()

      game.addPlayer(firstPlayerId)
      game.addPlayer(secondPlayerId)
      game.nextTurn()
      game.nextTurn()

      expect(game.currentPlayer?.id).toEqual(firstPlayerId)
    })
  })
  
  describe('check if the given player in the list', () => {
    it('should return true if the given player is in the list', () => {
      const game = new Game()
      game.addPlayer(firstPlayerId)

      expect(game.hasPlayer(firstPlayerId)).toBe(true)
    })
  
    it('should return false if the given player is not in the list', () => {
      const game = new Game()
      expect(game.hasPlayer(firstPlayerId)).toBe(false)
    })
  })
})