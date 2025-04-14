import { createServer } from 'http'
import { Server } from 'socket.io'
import Drawing from '@/drawing'
import { SOCKET_EVENTS_INBOUND, SOCKET_EVENTS_OUTBOUND } from '@/utils'
import Game from '@/game'
import { GameMode } from '@/game-mode'

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
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
})

// Initialise a new game
const game = new Game()

io.on(SOCKET_EVENTS_INBOUND.CONNECTION, (socket) => {
  console.log('User connected:', socket.id)

  game.addPlayer(socket.id)

  socket.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, game.currentPlayer)

  socket.emit(SOCKET_EVENTS_OUTBOUND.INITIAL_DATA, {
    lineLengthLimit: game.lineLengthLimit,
    drawing: game.drawing,
    gameMode: game.gameMode,
  })

  socket.on(SOCKET_EVENTS_INBOUND.DRAW, (drawingAsArray) => {
    if (
      game.currentPlayer?.id !== socket.id ||
      !game.players.every((player) => player.id === socket.id)
    ) {
      return
    }

    if (!Drawing.canCreate(drawingAsArray)) {
      return
    }
    game.updateDrawing(Drawing.createFrom(drawingAsArray))

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.DRAW, game.drawing)
  })

  socket.on(SOCKET_EVENTS_INBOUND.SELECT_GAME_MODE, (mode: GameMode) => {
    game.gameMode = mode

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.SELECTED_GAME_MODE, mode)
  })

  socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, () => {
    if (!game.players.every((player) => player.id === socket.id)) {
      return
    }

    game.resetGame()

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS, game.gameMode)
  })

  socket.on(SOCKET_EVENTS_INBOUND.END_TURN, () => {
    if (
      game.currentPlayer?.id !== socket.id ||
      !game.players.every((player) => player.id === socket.id)
    ) {
      return
    }

    game.nextTurn()

    io.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, game.currentPlayer)
  })

  socket.on(SOCKET_EVENTS_INBOUND.DISCONNECT, (reason) => {
    console.log('User disconnected', socket.id, reason)

    // Turn player disconnect special case
    if (game.currentPlayer?.id === socket.id) {
      game.nextTurn()
    }

    // Turn player and viewer disconnect
    game.removePlayer(socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
