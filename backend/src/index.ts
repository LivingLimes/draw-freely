import { createServer } from "http"
import { Server } from "socket.io"
import Drawing from "@/drawing"

const PORT = 3001

const httpServer = createServer((req, res) => {
		if (req.method === "GET" && req.url === "/") {
				res.writeHead(200, { "Content-Type": "text/plain" })
				res.end("Socket.IO server is running!")
				return
		}
})
const io = new Server(httpServer, {
		cors: {
				origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
		},
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
		OneLine         = "One Line",
		LineLengthLimit = "Line Length Limit",
}

let drawing = Drawing.createEmpty()
let players: Array<string> = []
let gameMode: GameMode | undefined | null = undefined
const lineLengthLimit: number = 150
let turnPlayer: string | undefined | null = undefined

io.on(SOCKET_EVENTS_INBOUND.CONNECTION, (socket) => {
		console.log("User connected:", socket.id)
		
		players.push(socket.id)
		
		if (players.length === 1) {
				turnPlayer = socket.id
		}
		
		socket.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
				turnPlayer,
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
						gameMode,
				})
		})
		
		socket.on(SOCKET_EVENTS_INBOUND.END_TURN, () => {
				if (turnPlayer !== socket.id || !players.includes(socket.id)) {
						return
				}
				
				const nextPlayer = getNextElement(players, turnPlayer)
				turnPlayer = nextPlayer ?? players[0] ?? null
				
				io.emit(SOCKET_EVENTS_OUTBOUND.UPDATE_TURN, {
						turnPlayer,
				})
		})
		
		socket.on(SOCKET_EVENTS_INBOUND.DISCONNECT, (reason) => {
				console.log("User disconnected", socket.id, reason)
				
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
		return currentIndex === -1 ? null : array[( currentIndex + 1 ) % array.length]
}