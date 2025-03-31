import React, { useEffect, useRef, useState } from "react"
import { socket } from "./socket"
import { GameMode } from "./utils"
import "./App.css"
import useDrawing from "./hooks/useDrawing"
import useSocketEvents from "./hooks/useSocketEvents"
import useCanvas from "./hooks/useCanvas"

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
		const [lineLengthLimit, setLineLengthLimit] = useState<number | undefined>(130)
		
		const isMyTurn = socket.id === turnPlayer
		const shouldShowCanvas = gameMode !== undefined && gameMode !== null
		
		// Initialise Canvas API (receiver)
		const canvasApi = useCanvas({
				canvasRef,
				contextRef,
				canvasDimension: {
						width: CANVAS_WIDTH,
						height: CANVAS_HEIGHT,
				},
				contextConfigs: { lineCap: "round", lineWidth: 2, strokeStyle: "black" },
				shouldInitCanvas: gameMode !== undefined && gameMode !== null,
		})
		
		// Initialise socket events (invoker)
		const { sendDrawing, sendEndTurn, sendGameMode, sendClearCanvas } = useSocketEvents({
				canvasApi,
				onTurnChanged: setTurnPlayer,
				onGameModeChanged: setGameMode,
				onLineLengthLimitChanged: setLineLengthLimit,
		})
		
		// Initialise drawing functions
		const { startDrawing, draw, stopDrawing } = useDrawing({
				canvasRef,
				contextRef,
				gameMode,
				lineLengthLimit,
				isMyTurn,
				canvasDimension: {
						width: CANVAS_WIDTH,
						height: CANVAS_HEIGHT,
				},
				canvasApi: canvasApi,
				onDrawingUpdate: sendDrawing,
				onEndTurn: sendEndTurn,
		})

		// Debug if the context can be drawn on the canvas
		if (contextRef.current && canvasRef.current) {
				console.log("Drawing test pattern");
				const ctx = contextRef.current;
				
				// Clear canvas
				ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
				
				// Draw a simple shape
				ctx.fillStyle = 'blue';
				ctx.fillRect(10, 10, 50, 50);
				
				// Draw a line
				ctx.beginPath();
				ctx.moveTo(100, 100);
				ctx.lineTo(200, 200);
				ctx.stroke();
		}
		
		// Debug: socket connection
		useEffect(() => {
				console.log("Socket connection status:", {
						id: socket.id,
						connected: socket.connected
				});
		}, []);
		
		useEffect(() => {
				// Simple socket test
				if (socket.connected) {
						console.log("Testing socket communication");
						socket.emit("test-event", { message: "Hello server" });
						
						const handleTestResponse = (data: any) => {
								console.log("Received test response from server:", data);
						};
						
						socket.on("test-response", handleTestResponse);
						
						return () => {
								socket.off("test-response", handleTestResponse);
						};
				} else {
						console.error("socket is disconnected")
						return
				}
		}, [socket.connected]);
		
		useEffect(() => {
				if (gameMode !== undefined && gameMode !== null) {
						// Make sure the canvas has had time to render
						setTimeout(() => {
								const result = canvasApi.initCanvas()
								if (!result) {
										console.error("Failed to initialize canvas after game mode selection")
								}
						}, 0)
				}
		}, [gameMode, canvasApi])
		
		const selectGameMode = (mode: GameMode) => {
				setGameMode(mode)
				sendGameMode()
		}
		
		const clearCanvas = () => {
				canvasApi.clearCanvas()
				sendClearCanvas()
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
																<button
																		key={GameMode[enumKey]}
																		onClick={() => selectGameMode(GameMode[enumKey])}>
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
