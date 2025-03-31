import { socket } from "../socket"
import { GameMode } from "../utils"
import { useCallback, useEffect, useReducer } from "react"
import { initialSocketState, socketReducer } from "../reducers/socketReducer"
import useCanvas from "../hooks/useCanvas"

const SOCKET_EVENTS_INBOUND = {
		DRAW: "draw",
		CONNECT: "connect",
		INITIAL_DATA: "initial-data",
		UPDATE_TURN: "update-turn",
		CLEAR_CANVAS: "clear-canvas",
		SELECTED_GAME_MODE: "selected-game-mode",
} as const

const SOCKET_EVENTS_OUTBOUND = {
		DRAW: "draw",
		END_TURN: "end-turn",
		CLEAR_CANVAS: "clear-canvas",
		SELECT_GAME_MODE: "select-game-mode",
} as const

interface UseSocketEventsProps {
		canvasApi: ReturnType<typeof useCanvas>
		onTurnChanged?: (turnPlayer: string) => void
		onGameModeChanged?: (gameMode: GameMode) => void
		onLineLengthLimitChanged?: (limit: number) => void
}

function useSocketEvents({ canvasApi, onTurnChanged, onGameModeChanged, onLineLengthLimitChanged }: UseSocketEventsProps) {
		const [state, dispatch] = useReducer(socketReducer, initialSocketState)
		
		// Setup event listeners
		
		useEffect(() => {
				const handleConnect = () => {
						dispatch({ type: "SOCKET_CONNECTED" })
				}
				
				// const handleDisconnect = () => {
				// 		dispatch({ type: "SOCKET_DISCONNECTED" })
				// }
				
				const handleInitialLoad = (data: {
						drawing: number[]
						lineLengthLimit: number
						gameMode: GameMode
				}) => {
						
						dispatch({
								type: "INITIAL_DATA_LOADED",
								payload: data,
						})
						console.log(data, "initial data")
						
						if (onGameModeChanged) {
								onGameModeChanged(data.gameMode)
						}
						
						if (onLineLengthLimitChanged) {
								onLineLengthLimitChanged(data.lineLengthLimit)
						}
						
						canvasApi.putImageData(new Uint8ClampedArray(data.drawing))
						
				}
				
				const handleTurnUpdate = (data: { turnPlayer: string }) => {
						dispatch({
								type: "TURN_UPDATED",
								payload: data,
						})
						
						if (onTurnChanged) {
								onTurnChanged(data.turnPlayer)
						}
				}
				
				const handleGameModeChange = (data: { gameMode: GameMode }) => {
						dispatch({
								type: "GAME_MODE_SELECTED",
								payload: data,
						})
						
						if (onGameModeChanged) {
								onGameModeChanged(data.gameMode)
						}
				}
				
				const handleDrawEvent = (drawing: number[]) => {
						const imageData = new Uint8ClampedArray(drawing)
						// Check if received data has content
						const hasContent = Array.from(imageData).some(pixel => pixel > 0)
						console.log(`Received drawing data, has content: ${hasContent}`)
						
						canvasApi.putImageData(imageData)
						
						dispatch({
								type: "DRAWING_RECEIVED",
								payload: imageData,
						})
						
				}
				
				const handleCanvasClear = (data: { gameMode: GameMode }) => {
						canvasApi.clearCanvas()
						
						dispatch({
								type: "CANVAS_CLEARED",
								payload: data,
						})
						
						if (onGameModeChanged) {
								onGameModeChanged(data.gameMode)
						}
				}
				
				socket.on(SOCKET_EVENTS_INBOUND.CONNECT, handleConnect)
				socket.on(SOCKET_EVENTS_INBOUND.INITIAL_DATA, handleInitialLoad)
				socket.on(SOCKET_EVENTS_INBOUND.DRAW, handleDrawEvent)
				socket.on(SOCKET_EVENTS_INBOUND.UPDATE_TURN, handleTurnUpdate)
				socket.on(SOCKET_EVENTS_INBOUND.SELECTED_GAME_MODE, handleGameModeChange)
				socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, handleCanvasClear)
				
				return () => {
						socket.off(SOCKET_EVENTS_INBOUND.CONNECT, handleConnect)
						socket.off(SOCKET_EVENTS_INBOUND.INITIAL_DATA, handleInitialLoad)
						socket.off(SOCKET_EVENTS_INBOUND.DRAW, handleDrawEvent)
						socket.off(SOCKET_EVENTS_INBOUND.UPDATE_TURN, handleTurnUpdate)
						socket.off(SOCKET_EVENTS_INBOUND.SELECTED_GAME_MODE, handleGameModeChange)
						socket.off(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, handleCanvasClear)
				}
		}, [canvasApi, onTurnChanged, onGameModeChanged, onLineLengthLimitChanged])
		
		const sendDrawing = useCallback((imageData: Uint8ClampedArray) => {
				socket.emit(SOCKET_EVENTS_OUTBOUND.DRAW, imageData)
		}, [])
		
		const sendEndTurn = useCallback(() => {
				socket.emit(SOCKET_EVENTS_OUTBOUND.END_TURN)
		}, [])
		
		const sendClearCanvas = useCallback(() => {
				socket.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS)
		}, [])
		
		const sendGameMode = useCallback(() => {
				socket.emit(SOCKET_EVENTS_OUTBOUND.SELECT_GAME_MODE)
		}, [])
		
		return {
				isConnected: state.isConnected,
				turnPlayer: state.turnPlayer,
				gameMode: state.gameMode,
				initialDataLoaded:state.initialDataLoaded,
				
				sendDrawing,
				sendEndTurn,
				sendClearCanvas,
				sendGameMode,
				
				socketId: socket.id
		}
}

export default useSocketEvents