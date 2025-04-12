import React, { useEffect, useRef, useState } from "react"
import { socket } from "./socket"
import { GameMode, NO_CANVAS_ERROR, NO_CONTEXT_ERROR, SOCKET_EVENTS_INBOUND, SOCKET_EVENTS_OUTBOUND } from "./utils"
import "./App.css"
import useDrawing from "./hooks/useDrawing"

const CANVAS_HEIGHT = 300
const CANVAS_WIDTH = 300

const App: React.FC = () => {
		// I'd typically initialise this as undefined, but using it as a `ref` in the canvas element requires it to be | null.
		const canvasRef = useRef<HTMLCanvasElement | null>(null)
		const contextRef = useRef<CanvasRenderingContext2D>(undefined)
		
		const [gameMode, setGameMode] = useState<GameMode | undefined | null>(
				undefined,
		)
		const [turnPlayer, setTurnPlayer] = useState<string | undefined>(undefined)
		const isMyTurn = socket.id === turnPlayer
		
		const shouldShowCanvas = gameMode !== undefined && gameMode !== null
		
		const canvasDimension = {
				width: CANVAS_WIDTH,
				height: CANVAS_HEIGHT,
		}
		
		useEffect(() => {
				if (!shouldShowCanvas) return
				
				const canvas = canvasRef.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				
				canvas.width = CANVAS_HEIGHT
				canvas.height = CANVAS_WIDTH
				
				const context = canvas.getContext("2d")
				if (!context) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				context.lineCap = "round"
				context.strokeStyle = "black"
				context.lineWidth = 2
				contextRef.current = context
		}, [shouldShowCanvas])
		
		useEffect(() => {
				const onDraw = (drawing: Array<number>) => {
						const context = contextRef.current
						if (!context) {
								console.error(NO_CONTEXT_ERROR)
								return
						}
						
						console.log("drawing", drawing)
						context.putImageData(
								new ImageData(new Uint8ClampedArray(drawing), 300, 300),
								0,
								0,
						)
				}
				
				const onInitialLoad = ({
						drawing,
						lineLengthLimit: lengthLimit,
						gameMode: mode,
				}: {
						drawing: Array<number>
						lineLengthLimit: number
						gameMode: GameMode
				}) => {
						console.log({ drawing, lengthLimit, gameMode }, "initial data")
						
						// setLineLengthLimit(150)
						setGameMode(mode)
						
						const context = contextRef.current
						if (!context) {
								console.error(NO_CONTEXT_ERROR)
								return
						}
						
						context.putImageData(
								new ImageData(new Uint8ClampedArray(drawing), 300, 300),
								0,
								0,
						)
				}
				
				const onUpdateTurn = ({ turnPlayer }: { turnPlayer: string }) => {
						setTurnPlayer(turnPlayer)
				}
				
				const clearCanvas = ({ mode }: { mode: GameMode }) => {
						const canvas = canvasRef.current
						if (!canvas) {
								console.error(NO_CANVAS_ERROR)
								return
						}
						
						const context = contextRef.current
						if (!context) {
								console.error(NO_CONTEXT_ERROR)
								return
						}
						
						context.clearRect(0, 0, canvas.width, canvas.height)
						
						setGameMode(mode)
				}
				
				const selectedGameMode = (mode: GameMode) => {
						setGameMode(mode)
				}
				
				socket.on(SOCKET_EVENTS_INBOUND.DRAW, onDraw)
				socket.on(SOCKET_EVENTS_INBOUND.INITIAL_DATA, onInitialLoad)
				socket.on(SOCKET_EVENTS_INBOUND.UPDATE_TURN, onUpdateTurn)
				socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, clearCanvas)
				socket.on(SOCKET_EVENTS_INBOUND.SELECTED_GAME_MODE, selectedGameMode)
				
				return () => {
						socket.off(SOCKET_EVENTS_INBOUND.DRAW, onDraw)
						socket.off(SOCKET_EVENTS_INBOUND.INITIAL_DATA, onInitialLoad)
						socket.off(SOCKET_EVENTS_INBOUND.UPDATE_TURN, onUpdateTurn)
						socket.off(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, clearCanvas)
						socket.off(SOCKET_EVENTS_INBOUND.SELECTED_GAME_MODE, selectedGameMode)
				}
		}, [])
		
		const { startDrawing, draw, stopDrawing, clearCanvas } = useDrawing({ canvasRef, canvasDimension, contextRef, gameMode, turnPlayer })
		
		const selectGameMode = (mode: GameMode) => {
				setGameMode(mode)
				
				socket?.emit(SOCKET_EVENTS_OUTBOUND.SELECT_GAME_MODE, mode)
		}
		
		return (
				<div className="drawing-container">
						<h1>Draw Freely</h1>
						{shouldShowCanvas ? (
								<>
										<div>You've selected the '{gameMode}' game mode.</div>
										<div>
												{isMyTurn
														? "It is your turn to draw!"
														: `Waiting for your turn to draw. It is currently ${turnPlayer}'s turn to draw!`}
										</div>
										<canvas
												ref={canvasRef}
												onPointerDown={startDrawing}
												onPointerMove={draw}
												onPointerUp={stopDrawing}
												onPointerLeave={stopDrawing}
												className="drawing-canvas"
										/>
										<button type="button" onClick={clearCanvas} className="clear-button">
												Clear Canvas
										</button>
								</>
						) : (
								<>
										{( Object.keys(GameMode) as Array<keyof typeof GameMode> ).map(
												(enumKey) => {
														return (
																<button onClick={() => selectGameMode(GameMode[enumKey])}>
																		{GameMode[enumKey]}
																</button>
														)
												},
										)}
										<div className="about-content">
												<h3>About</h3>
												<p>
														Draw Freely is a free online multiplayer drawing game designed to
														encourage mindfulness and creativity.
												</p>
												<p>
														Choose your game mode and draw something with someone else or just
														by yourself. You don't compete against each other, you just draw things for fun!
												</p>
												<aside>
														Note, this game is still a work in progress!
												</aside>
										</div>
								</>
						)}
				</div>
		)
}

export default App
