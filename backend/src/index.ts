import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3001

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Socket.IO server is running!')
    return
  }
})
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000"
  }
})

const SOCKET_EVENTS_OUTBOUND = {
  DRAW: "draw",
  CONNECT: "connect",
  INITIAL_DATA: "initial-data",
  UPDATE_TURN: "update-turn",
  CLEAR_CANVAS: "clear-canvas",
  SELECTED_GAME_MODE: "selected-game-mode",
} as const

const SOCKET_EVENTS_INBOUND = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  DRAW: "draw",
  END_TURN: "end-turn",
  CLEAR_CANVAS: "clear-canvas",
  SELECT_GAME_MODE: "select-game-mode",
} as const

enum GameMode {
  OneLine = "One Line",
  LineLengthLimit = "Line Length Limit",
}

class Drawing {
  static readonly #canvasHeight = 300
  static readonly #canvasWidth = 300
  // In the canvas, each pixel is represented with 4 values: R, G, B and A.
  static readonly #pixelSize = 4
  static readonly #totalArraySize = Drawing.#canvasHeight * Drawing.#canvasWidth * Drawing.#pixelSize

  private value: Buffer

  private constructor(_value: Buffer) {
    this.value = _value
  }

  public getValue(): Readonly<Buffer> {
    return this.value
  }

  public static canCreate(drawing: Buffer) {
    if (!Buffer.isBuffer(drawing)) {
      return false
    }

    if (drawing.length !== Drawing.#totalArraySize) {
      return false
    }

    // We can validate this more strictly by enforcing all values to be black or white, but this is a bit more flexible.
    if (!drawing.every(el => el >= 0 && el <= 255 && Number.isFinite(el))) {
      return false
    }

    return true
  }

  public static createEmpty(): Drawing {
    return new Drawing(Buffer.alloc(Drawing.#totalArraySize))
  }

  public static createFrom(drawing: Buffer): Drawing {
    if (!this.canCreate(drawing)) {
      throw Error('Cannot create drawing as it is malformed')
    }

    return new Drawing(drawing)
  }
}

let drawing = Drawing.createEmpty()
let players: Array<string> = []
let gameMode: GameMode | undefined | null = undefined
const lineLengthLimit: number = 150
let turnPlayer: string | undefined | null = undefined

io.on(SOCKET_EVENTS_INBOUND.CONNECTION, (socket) => {
  console.log('User connected:', socket.id);

  players.push(socket.id)

  if (players.length === 1) {
    turnPlayer = socket.id
  }

  socket.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
    turnPlayer
  })

  socket.emit(SOCKET_EVENTS_OUTBOUND.INITIAL_DATA, { lineLengthLimit, drawing: drawing.getValue(), gameMode })

  socket.on(SOCKET_EVENTS_INBOUND.DRAW, (drawingAsArray) => {
    if (turnPlayer !== socket.id || !players.includes(socket.id)) {
      return
    }

    if (!Drawing.canCreate(drawingAsArray)) {
      return
    }
    drawing = Drawing.createFrom(drawingAsArray)

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.DRAW, drawing.getValue())
  })

  socket.on(SOCKET_EVENTS_INBOUND.SELECT_GAME_MODE, (mode: GameMode) => {
    gameMode = mode

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.SELECTED_GAME_MODE, mode)
  })

  socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, () => {
    if (!players.includes(socket.id)) {
      return
    }

    drawing = Drawing.createEmpty()
    gameMode = null

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS, {
      gameMode
    })
  })

  socket.on(SOCKET_EVENTS_INBOUND.END_TURN, () => {
    if (turnPlayer !== socket.id || !players.includes(socket.id)) {
      return
    }

    const nextPlayer = getNextElement(players, turnPlayer)
    turnPlayer = nextPlayer ?? players[0] ?? null

    io.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
      turnPlayer
    })
  })

  socket.on(SOCKET_EVENTS_INBOUND.DISCONNECT, (reason) => {
    console.log('User disconnected', socket.id, reason)

    // Turn player disconnect special case
    if (turnPlayer === socket.id) {
      const nextPlayer = getNextElement(players, turnPlayer)
      turnPlayer = nextPlayer ?? players[0] ?? null
    }

    // Turn player and viewer disconnect
    players = players.filter(p => p !== socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

function getNextElement<T>(array: Array<T>, element: T) {
  const currentIndex = array.indexOf(element)
  return currentIndex === -1 ? null : array[(currentIndex + 1) % array.length]
}