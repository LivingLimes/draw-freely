import React, { RefObject, useReducer } from "react"
import { distanceBetweenTwoPoints, GameMode } from "../utils"
import useCanvas, { NO_CANVAS_ERROR } from "../hooks/useCanvas"
import { drawingReducer, initialDrawingState } from "../reducers/drawingReducer"

interface DrawingHookProps {
		canvasRef: RefObject<HTMLCanvasElement | null>
		canvasDimension: {
				width: number
				height: number
		}
		canvasApi: ReturnType<typeof useCanvas>,
		contextRef: RefObject<CanvasRenderingContext2D | undefined>
		gameMode: GameMode | undefined | null
		lineLengthLimit: number | undefined
		isMyTurn: boolean
		// Callback for socket events
		onDrawingUpdate?: (imageData: Uint8ClampedArray) => void
		onEndTurn?: () => void
}

function useDrawing({ canvasRef, canvasDimension, canvasApi, contextRef, gameMode, isMyTurn, lineLengthLimit, onDrawingUpdate, onEndTurn }: DrawingHookProps) {
		const [state, dispatch] = useReducer(drawingReducer, initialDrawingState)
		
		const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!isMyTurn) return
				
				const canvas = canvasRef.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				
				const rect = canvas.getBoundingClientRect()
				const relativeX = event.pageX - rect.left
				const relativeY = event.pageY - rect.top
				
				canvasApi.drawLine({
						startX: relativeX,
						startY: relativeY,
						endX: relativeX,
						endY: relativeY
				})
				
				dispatch({
						type: "START_DRAWING",
						payload: {
								pointerId: event.pointerId,
								x: relativeX,
								y: relativeY
						}
				})
				
				if (contextRef.current && onDrawingUpdate) {
						const imageData = contextRef.current.getImageData(0, 0, canvasDimension.width, canvasDimension.height).data
						onDrawingUpdate(imageData)
				}
		}
		
		const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!state.isDrawing || !isMyTurn) return
				
				
				const pointer = state.ongoingPointer?.[event.pointerId]
				if (!pointer) {
						console.error(`Could not find pointer for ${event.type} pointer id ${event.pointerId}`)
						return
				}
				
				const canvas = canvasRef.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				
				const rect = canvas.getBoundingClientRect()
				const relativeX = event.pageX - rect.left
				const relativeY = event.pageY - rect.top
				
				const additionalLength = distanceBetweenTwoPoints({
						x1: pointer.relativeX,
						y1: pointer.relativeY,
						x2: relativeX,
						y2: relativeY
				})
				
				canvasApi.drawLine({
						startX: relativeX,
						startY: relativeY,
						endX: relativeX,
						endY: relativeY
				})
				
				dispatch({
						type: "ON_DRAWING",
						payload: {
								pointerId: event.pointerId,
								x: relativeX,
								y: relativeY,
								additionalLength
						}
				})
				
				switch ( gameMode ) {
						case "One Line":
								// TODO: Add 10 second timer
								break
						case "Line Length Limit":
								if (lineLengthLimit && state.currentLineLength + additionalLength > lineLengthLimit) {
										stopDrawing(event)
										dispatch({
												type: "RESET_LINE_LENGTH"
										})
										if (onEndTurn) {
												onEndTurn()
										}
										return
								}
								break
						default:
								console.error(`Invalid Game Mode '${gameMode}'`)
				}
				
				if (contextRef.current && onDrawingUpdate) {
						const imageData = contextRef.current.getImageData(0, 0, canvasDimension.width, canvasDimension.height).data
						const hasContent = Array.from(imageData).some(pixel =>  pixel > 0)
						console.log(`Sending drawing data, hsa content: ${hasContent}`)
						onDrawingUpdate(imageData)
				}
		}
		
		const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!state.isDrawing) return
				
				dispatch({
						type: "STOP_DRAWING",
						payload: {
								pointerId: event.pointerId
						}
				})
				
				if (gameMode === "One Line" && onEndTurn) {
						onEndTurn()
				}
		}
		
		return {
				startDrawing,
				draw,
				stopDrawing,
		}
}

export default useDrawing