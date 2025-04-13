import * as crypto from 'node:crypto'
import Player from './player'
import Drawing from './drawing'
import { GameMode, getNextElement } from './utils'

interface IGame {
  addPlayer: (playerId: Player['id']) => void
  removePlayer: (playerId: Player['id']) => void
  updateDrawing: (drawing: Drawing) => void
  resetGame: () => void
  nextTurn: () => void
}

export default class Game implements IGame {
  #id = crypto.randomUUID()
  #currentTurnPlayer: Player | undefined | null = undefined
  #lineLengthLimit: number = 150
  #drawing: Drawing = Drawing.createEmpty()
  #players: Player[] = []
  #gameMode: GameMode | undefined | null = undefined

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

  get gameMode() {
    return this.#gameMode
  }

  set gameMode(mode) {
    this.#gameMode = mode
  }

  get lineLengthLimit() {
    return this.#lineLengthLimit
  }

  // set lineLengthLimit(newValue) {
  //   this.#lineLengthLimit = newValue
  // }

  public addPlayer(playerId: Player['id']): void {
    this.#players.push(new Player(playerId))
  }

  public removePlayer(playerId: Player['id']): void {
    const playerIndex = this.#players.findIndex(
      (player) => player.id === playerId,
    )

    if (playerIndex !== -1) {
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
    this.#gameMode = null
  }

  public nextTurn() {
    if (this.#players.length === 1) {
      this.#currentTurnPlayer = this.players[0]
      return
    }

    if (this.#currentTurnPlayer) {
      this.#currentTurnPlayer = getNextElement(
        this.#players,
        this.currentPlayer,
      )
      return
    }
  }
}
