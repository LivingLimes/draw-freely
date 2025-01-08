import React, { useEffect, useRef, useState } from "react"
import { socket } from "./socket"
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

const SOCKET_EVENTS_INBOUND = {
  DRAW: "draw",
  CONNECT: "connect",
  INITIAL_DATA: "initial-data",
  UPDATE_TURN: "update-turn",
  CLEAR_CANVAS: "clear-canvas",
}

const SOCKET_EVENTS_OUTBOUND = {
  DRAW: "draw",
  END_TURN: "end-turn",
  CLEAR_CANVAS: "clear-canvas"
}

const App = () => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [turnPlayer, setTurnPlayer] = useState(null)
  const contextRef = useRef(null)

  const isMyTurn = socket.id === turnPlayer

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

  useEffect(() => {
    const onDraw = (data) => {
      console.log("onDraw")
      const context = contextRef.current
      if (!context) {
        console.error(NO_CONTEXT_ERROR)
        return
      }

      context.putImageData(
        new ImageData(new Uint8ClampedArray(data), 300, 300),
        0,
        0
      )
    }

    const onConnect = () => {
      console.log("for debugging: onConnect", socket.id)
    }

    const onInitialLoad = (data) => {
      console.log({ data }, "ddd")
      console.log(data, "per", new ImageData(300, 300))
      const context = contextRef.current
      if (!context) {
        console.error(NO_CONTEXT_ERROR)
        return
      }

      context.putImageData(
        new ImageData(new Uint8ClampedArray(data), 300, 300),
        0,
        0
      )
    }

    const onUpdateTurn = ({ turnPlayer }) => {
      setTurnPlayer(turnPlayer)
    }

    const clearCanvas = () => {
      const context = contextRef.current
      if (!context) {
        console.error(NO_CONTEXT_ERROR)
        return
      }

      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    socket.on(SOCKET_EVENTS_INBOUND.DRAW, onDraw)
    socket.on(SOCKET_EVENTS_INBOUND.CONNECT, onConnect)
    socket.on(SOCKET_EVENTS_INBOUND.INITIAL_DATA, onInitialLoad)
    socket.on(SOCKET_EVENTS_INBOUND.UPDATE_TURN, onUpdateTurn)
    socket.on(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, clearCanvas)

    return () => {
      socket.off(SOCKET_EVENTS_INBOUND.DRAW, onDraw)
      socket.off(SOCKET_EVENTS_INBOUND.CONNECT, onConnect)
      socket.off(SOCKET_EVENTS_INBOUND.INITIAL_DATA, onInitialLoad)
      socket.off(SOCKET_EVENTS_INBOUND.UPDATE_TURN, onUpdateTurn)
      socket.off(SOCKET_EVENTS_INBOUND.CLEAR_CANVAS, clearCanvas)
    }
  }, [])

  const startDrawing = (event) => {
    if (!isMyTurn) return

    const { offsetX, offsetY } = event.nativeEvent
    const context = contextRef.current

    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }
    setIsDrawing(true)

    context.beginPath()
    context.lineTo(offsetX, offsetY)
    context.stroke()

    socket?.emit(
      SOCKET_EVENTS_OUTBOUND.DRAW,
      context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data
    )
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

    socket?.emit(
      SOCKET_EVENTS_OUTBOUND.DRAW,
      context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data
    )
  }

  const stopDrawing = () => {
    if (!isDrawing) return 

    setIsDrawing(false)

    socket.emit(SOCKET_EVENTS_OUTBOUND.END_TURN)
  }

  const clearCanvas = () => {
    if (!contextRef.current) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    contextRef.current.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    socket?.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS)
  }

  return (
    <div className="drawing-container">
      <button>One line</button>
      <div>{isMyTurn ? "It is your turn to draw!" : `Waiting for your turn to draw. It is currently ${turnPlayer}'s turn to draw!`}</div>
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
