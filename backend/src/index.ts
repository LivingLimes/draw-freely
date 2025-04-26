import { createServer } from 'http'
import { Server } from 'socket.io'
import Drawing from '@/models/drawing'
import { SOCKET_EVENTS_INBOUND, SOCKET_EVENTS_OUTBOUND } from '@/events'
import Game from '@/models/game'
import GameMode from '@/game-mode'

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

const game = new Game()

io.on(SOCKET_EVENTS_INBOUND.CONNECTION, (socket) => {
  console.log('User connected:', socket.id)

  game.addPlayer(socket.id)

  socket.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
    turnPlayer: game.currentPlayer?.id,
  })

  socket.emit(SOCKET_EVENTS_OUTBOUND.INITIAL_DATA, {
    lineLengthLimit: game.lineLengthLimit,
    drawing: game.drawing.getValue(),
    gameMode: game.gameMode,
  })

  socket.on(
    SOCKET_EVENTS_INBOUND.DRAW,
    (drawingAsArray: Buffer<ArrayBufferLike>) => {
      if (game.currentPlayer?.id !== socket.id || !game.hasPlayer(socket.id)) {
        return
      }

      if (!Drawing.canCreate(drawingAsArray)) {
        return
      }
      game.updateDrawing(Drawing.createFrom(drawingAsArray))

      socket.broadcast.emit(
        SOCKET_EVENTS_OUTBOUND.DRAW,
        game.drawing.getValue(),
      )
    },
  )

  socket.on(SOCKET_EVENTS_INBOUND.SELECT_GAME_MODE, (mode: GameMode) => {
    game.gameMode = mode

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.SELECTED_GAME_MODE, mode)
  })

  socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, () => {
    if (!game.hasPlayer(socket.id)) {
      return
    }

    game.resetGame()

    socket.broadcast.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS, {
      gameMode: game.gameMode,
    })
  })

  socket.on(SOCKET_EVENTS_INBOUND.END_TURN, () => {
    if (game.currentPlayer?.id !== socket.id || !game.hasPlayer(socket.id)) {
      return
    }

    game.nextTurn()

    io.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
      turnPlayer: game.currentPlayer.id,
    })
  })

  socket.on(SOCKET_EVENTS_INBOUND.DISCONNECT, (reason) => {
    console.log('User disconnected', socket.id, reason)

    // Turn player and viewer disconnect
    game.removePlayer(socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

httpServer.on('request', (req, res) => {
  if (req.url === '/debug' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        players: game.players.map((p) => p.id),
        currentPlayer: game.currentPlayer?.id,
        gameMode: game.gameMode,
        playerCount: game.players.length,
      }),
    )
  }
})
