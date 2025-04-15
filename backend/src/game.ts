import * as crypto from 'node:crypto'
import Player from './player'
import Drawing from './drawing'
import { getNextElement } from './utils'
import { GameMode } from './game-mode'

interface IGame {
  addPlayer: (playerId: Player['id']) => void
  removePlayer: (playerId: Player['id']) => void
  updateDrawing: (drawing: Drawing) => void
  resetGame: () => void
  nextTurn: () => void
  gameMode: GameMode | undefined | null
  lineLengthLimit: number
}

export default class Game implements IGame {
  #id = crypto.randomUUID()
  #currentTurnPlayer: Player | undefined | null = undefined
  #drawing: Drawing = Drawing.createEmpty()
  #players: Player[] = []
  public gameMode: GameMode | undefined | null = undefined
  public lineLengthLimit: number = 150

  get id() {
    return this.#id
  }

  get drawing() {
    return this.#drawing
  }

  get players() {
    return this.#players
  }

  get currentPlayer() {
    return this.#currentTurnPlayer
  }

  public addPlayer(playerId: Player['id']): void {
    this.#players.push(new Player(playerId))

    if (this.#players.length === 1) {
      this.nextTurn()
    }
  }

  public removePlayer(playerId: Player['id']): void {
    const playerIndex = this.#players.findIndex(
      (player) => player.id === playerId,
    )

    if (playerIndex !== -1) {
      if (this.#currentTurnPlayer?.id === playerId) {
        this.nextTurn()
      }
      this.#players = this.#players.filter((player) => player.id !== playerId)
    } else {
      throw Error(`Player ${playerId} not found.`)
    }
  }

  public updateDrawing(drawing: Drawing): void {
    this.#drawing = drawing
  }

  public resetGame() {
    this.#drawing = Drawing.createEmpty()
    this.gameMode = null
  }

  public nextTurn() {
    const nextPlayer = getNextElement(this.#players, this.currentPlayer)
    this.#currentTurnPlayer = nextPlayer ?? this.#players[0] ?? null
  }
}
