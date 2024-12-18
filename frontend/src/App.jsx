import React, { useEffect, useRef, useState } from "react"
import "./App.css"

const CANVAS_HEIGHT = 300
const CANVAS_WIDTH = 300

const NO_CANVAS_ERROR = `You're trying to access the canvas ref but it is null. This generally means that
- The canvas element hasn't mounted yet.
- The canvas element has unmounted.
- The canvas element is conditionally not being loaded at the time.
- There is a race condition between state updates and ref access. E.g. If you store canvas size in state and resize the canvas but you try to access the ref before the canvas remounts after the state change.

More details here: https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes`

const NO_CONTEXT_ERROR = `Canvas context is null. This generally means that
- The canvas ref is null.
- The context identifier is not supported by the browser.
- The canvas has already been set to a different context mode.

More details here: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext`

const App = () => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const contextRef = useRef(null)

  useEffect(() => {
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
  }, [])

  const startDrawing = (event) => {
    const { offsetX, offsetY } = event.nativeEvent
    const context = contextRef.current

    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    context.beginPath()
    context.lineTo(offsetX, offsetY)
    context.stroke()
    setIsDrawing(true)
  }

  const draw = (event) => {
    if (!isDrawing) return

    const context = contextRef.current
    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    const { offsetX, offsetY } = event.nativeEvent
    context.lineTo(offsetX, offsetY)
    context.stroke()
  }

  const stopDrawing = () => {
    const context = contextRef.current
    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (!contextRef.current) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    contextRef.current.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  return (
    <div className="drawing-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="drawing-canvas"
      />
      <button type="button" onClick={clearCanvas} className="clear-button">
        Clear Canvas
      </button>
    </div>
  )
}

export default App
