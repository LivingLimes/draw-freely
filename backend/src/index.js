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

const CANVAS_HEIGHT = 300
const CANVAS_WIDTH = 300
// In the canvas, each pixel is represented with 4 values: R, G, B and A.
const PIXEL_SIZE = 4

function createCanvasArray() {
  return new Array(CANVAS_HEIGHT * CANVAS_WIDTH * PIXEL_SIZE)
}
let drawing = createCanvasArray()

io.on('connection', (socket) => {
  console.log('User connected', socket.id)

  socket.emit('initial-data', drawing)

  socket.on('draw', (drawingAsArray) => {
    drawing = drawingAsArray

    socket.broadcast.emit('draw', drawingAsArray)
  })

  socket.on('clear-canvas', () => {
    drawing = createCanvasArray()

    socket.broadcast.emit('clear-canvas')
  })

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})