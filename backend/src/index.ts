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
} as const

const SOCKET_EVENTS_INBOUND = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  DRAW: "draw",
  END_TURN: "end-turn",
  CLEAR_CANVAS: "clear-canvas"
} as const

const CANVAS_HEIGHT = 300
const CANVAS_WIDTH = 300
// In the canvas, each pixel is represented with 4 values: R, G, B and A.
const PIXEL_SIZE = 4

function createCanvasArray(): Array<number> {
  return new Array(CANVAS_HEIGHT * CANVAS_WIDTH * PIXEL_SIZE)
}
let drawing = createCanvasArray()
let players: Array<string> = []
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
  
  socket.emit(SOCKET_EVENTS_OUTBOUND.INITIAL_DATA, drawing)

  socket.on(SOCKET_EVENTS_INBOUND.DRAW, (drawingAsArray) => {
    drawing = drawingAsArray

    console.log('pre emit draw when drawing')
    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.DRAW, drawingAsArray)
  })

  socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, () => {
    drawing = createCanvasArray()

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS)
  })

  socket.on(SOCKET_EVENTS_INBOUND.END_TURN, () => {
    const nextPlayer = getNextElement(players, turnPlayer)
    turnPlayer = nextPlayer ?? players[0] ?? null
    
    io.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
      turnPlayer
    })
  })

  socket.on(SOCKET_EVENTS_INBOUND.DISCONNECT, (reason) => {
    console.log('User disconnected', socket.id, reason)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

function getNextElement<T>(array: Array<T>, element: T) {
  const currentIndex = array.indexOf(element)
  return currentIndex === -1 ? null : array[(currentIndex + 1) % array.length]
}