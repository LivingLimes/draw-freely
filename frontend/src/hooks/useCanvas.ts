import { RefObject } from "react"

export const NO_CANVAS_ERROR = `You're trying to access the canvas ref but it is null. This generally means that
- The canvas element hasn't mounted yet.
- The canvas element has unmounted.
- The canvas element is conditionally not being loaded at the time.
- There is a race condition between state updates and ref access. E.g. If you store canvas size in state and resize the canvas but you try to access the ref before the canvas remounts after the state change.
More details here: https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes`

export const NO_CONTEXT_ERROR = `Canvas context is null. This generally means that
- The canvas ref is null.
- The context identifier is not supported by the browser.
- The canvas has already been set to a different context mode.
More details here: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext`

interface canvasProps {
		canvasRef: RefObject<HTMLCanvasElement | null>
		contextRef: RefObject<CanvasRenderingContext2D | undefined>
		canvasDimension: {
				width: number
				height: number
		}
		contextConfigs: {
				lineCap: CanvasPathDrawingStyles["lineCap"]
				lineWidth: CanvasPathDrawingStyles["lineWidth"]
				strokeStyle: CanvasFillStrokeStyles["strokeStyle"]
		}
		// Flags
		shouldInitCanvas?: boolean
		// Callback functions
		onClearCanvas?: () => void
}

interface CanvasApi {
		initCanvas: () => { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D } | null,
		drawLine: ({ startX, startY, endX, endY }: { startX: number, startY: number, endX: number, endY: number }) => void
		putImageData: (imageData: Array<number> | Uint8ClampedArray) => void
		clearCanvas: () => void
}

function useCanvas({ canvasRef, contextRef, canvasDimension, contextConfigs, onClearCanvas, shouldInitCanvas }: canvasProps): CanvasApi {
		
		
		const initCanvas = () => {
				if (!shouldInitCanvas) {
						return
				}
				
				const canvas = canvasRef.current
				if (!canvas) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				
				canvas.width = canvasDimension.width
				canvas.height = canvasDimension.height
				
				const context = canvas.getContext("2d")
				if (!context) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				context.lineCap = contextConfigs.lineCap
				context.lineWidth = contextConfigs.lineWidth
				context.strokeStyle = contextConfigs.strokeStyle
				
				contextRef.current = context
				
				return { canvas, context }
		}
		
		const drawLine = (
				{ startX, startY, endX, endY }: { startX: number; startY: number; endX: number; endY: number },
		) => {
				if (!contextRef.current) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				const context = contextRef.current
				
				context.beginPath()
				context.moveTo(startX, startY)
				context.lineTo(endX, endY)
				context.stroke()
		}
		
		const putImageData = (imageData: Array<number> | Uint8ClampedArray) => {
				if (!contextRef.current) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				const data = imageData instanceof Uint8ClampedArray ? imageData : new Uint8ClampedArray(imageData)
				
				contextRef.current.putImageData(new ImageData(data, canvasDimension.width, canvasDimension.height), 0, 0)
		}
		
		const clearCanvas = () => {
				if (!canvasRef.current) {
						console.error(NO_CANVAS_ERROR)
						return
				}
				if (!contextRef.current) {
						console.error(NO_CONTEXT_ERROR)
						return
				}
				
				contextRef.current.clearRect(0, 0, canvasDimension.width, canvasDimension.height)
				
				if (onClearCanvas) {
						onClearCanvas()
				}
		}
		
		return <CanvasApi>{
				initCanvas,
				drawLine,
				putImageData,
				clearCanvas,
		}
}

export default useCanvas