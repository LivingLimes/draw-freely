import React, { RefObject, useState } from "react"
import type { Pointer } from "@/types"
import { socket } from "../socket"
import { distanceBetweenTwoPoints, GameMode, NO_CANVAS_ERROR, NO_CONTEXT_ERROR, SOCKET_EVENTS_OUTBOUND } from "../utils"

interface DrawingHookProps {
		canvasRef: RefObject<HTMLCanvasElement | null>
		canvasDimension: {
				width: number
				height: number
		}
		contextRef: RefObject<CanvasRenderingContext2D | undefined>
		gameMode: GameMode | undefined | null
		turnPlayer: string | undefined
}

function useDrawing({ canvasRef, canvasDimension, contextRef, gameMode, turnPlayer }: DrawingHookProps) {
		const [isDrawing, setIsDrawing] = useState(false)
		const [lineLengthLimit, setLineLengthLimit] = useState<number | undefined>(undefined)
		const [currentLineLength, setCurrentLineLength] = useState<number>(0)
		const [ongoingPointer, setOngoingPointer] = useState<Pointer | undefined | null>(undefined)
		const isMyTurn = socket.id === turnPlayer
		
		const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!isMyTurn) return
				
				const { pageX, pageY, pointerId } = event
				const canvas = canvasRef.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				const rect = canvas.getBoundingClientRect()
				const relativeX = pageX - rect.left
				const relativeY = pageY - rect.top
				
				const context = contextRef.current
				if (!context) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				setIsDrawing(true)
				
				context.beginPath()
				context.moveTo(relativeX, relativeY)
				context.lineTo(relativeX, relativeY)
				context.stroke()
				setOngoingPointer({
						[pointerId]: {
								relativeX,
								relativeY,
						},
				})
				
				socket?.emit(
						SOCKET_EVENTS_OUTBOUND.DRAW,
						context.getImageData(0, 0, canvasDimension.width, canvasDimension.height).data,
				)
		}
		
		const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!isDrawing) return
				
				const pointer = ongoingPointer?.[event.pointerId]
				if (!pointer) {
						console.error(
								`Could not find pointer for ${event.type} pointer id ${event.pointerId}`,
						)
						return
				}
				
				const context = contextRef!.current
				if (!context) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				const { pageX, pageY } = event
				const canvas = canvasRef!.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				const rect = canvas.getBoundingClientRect()
				const relativeX = pageX - rect.left
				const relativeY = pageY - rect.top
				
				context.beginPath()
				context.moveTo(pointer.relativeX, pointer.relativeY)
				context.lineTo(relativeX, relativeY)
				context.stroke()
				
				if (gameMode === GameMode.LineLengthLimit) {
						if (
								lineLengthLimit !== undefined &&
								currentLineLength > lineLengthLimit
						) {
								stopDrawing(event)
								setCurrentLineLength(0)
								
								return
						}
						
						const additionalLength = distanceBetweenTwoPoints({
								x1: pointer.relativeX,
								y1: pointer.relativeY,
								x2: relativeX,
								y2: relativeY,
						})
						
						setCurrentLineLength((prev) => prev + additionalLength)
						
						socket?.emit(
								SOCKET_EVENTS_OUTBOUND.DRAW,
								context.getImageData(0, 0, canvasDimension.width, canvasDimension.height).data,
						)
				}
				else if (gameMode === GameMode.OneLine) {
						socket?.emit(
								SOCKET_EVENTS_OUTBOUND.DRAW,
								context.getImageData(0, 0, canvasDimension.width, canvasDimension.height).data,
						)
				}
				else {
						throw Error(`Invalid Game Mode '${gameMode}'`)
				}
				
				setOngoingPointer({
						[event.pointerId]: {
								relativeX: relativeX,
								relativeY: relativeY,
						},
				})
		}
		
		const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
				if (!isDrawing) return
				
				const pointer = ongoingPointer?.[event.pointerId]
				if (!pointer) {
						console.error(
								`Could not find pointer for ${event.type} pointer id ${event.pointerId}`,
						)
						return
				}
				
				setIsDrawing(false)
				
				socket.emit(SOCKET_EVENTS_OUTBOUND.END_TURN)
		}
		
		const clearCanvas = () => {
				if (!contextRef.current) return
				
				contextRef.current.clearRect(0, 0, canvasDimension.width, canvasDimension.height)
				
				socket?.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS)
		}
		
		return {
				startDrawing,
				draw,
				stopDrawing,
				clearCanvas,
				setLineLengthLimit
		}
}

export default useDrawing