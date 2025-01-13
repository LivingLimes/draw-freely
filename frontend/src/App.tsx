import React, { useEffect, useRef, useState } from "react"
import { socket } from "./socket"
import { distanceBetweenTwoPoints } from "./utils"
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
  SELECTED_GAME_MODE: "selected-game-mode",
} as const

const SOCKET_EVENTS_OUTBOUND = {
  DRAW: "draw",
  END_TURN: "end-turn",
  CLEAR_CANVAS: "clear-canvas",
  SELECT_GAME_MODE: "select-game-mode",
} as const

enum GameMode {
  OneLine = "One Line",
  LineLengthLimit = "Line Length Limit",
  TimeLimit = "Time Limit",
}

const App: React.FC = () => {
  // I'd typically initialise this as undefined, but using it as a `ref` in the canvas element requires it to be | null.
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode | undefined | null>(
    undefined
  )
  const [turnPlayer, setTurnPlayer] = useState<string | undefined>(undefined)
  const contextRef = useRef<CanvasRenderingContext2D>(undefined)

  const [lineLengthLimit, setLineLengthLimit] = useState<number | undefined>(
    undefined
  )
  const [lastX, setLastX] = useState<number | undefined | null>(undefined)
  const [lastY, setLastY] = useState<number | undefined | null>(undefined)
  const [currentLineLength, setCurrentLineLength] = useState<number>(0)

  const shouldShowCanvas = gameMode !== undefined && gameMode !== null
  const isMyTurn = socket.id === turnPlayer

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
        0
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

      setLineLengthLimit(150)
      setGameMode(mode)

      const context = contextRef.current
      if (!context) {
        console.error(NO_CONTEXT_ERROR)
        return
      }

      context.putImageData(
        new ImageData(new Uint8ClampedArray(drawing), 300, 300),
        0,
        0
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

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn) return

    const { offsetX, offsetY } = event.nativeEvent
    setLastX(offsetX)
    setLastY(offsetY)

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

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const context = contextRef.current
    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    const { offsetX, offsetY } = event.nativeEvent
    context.lineTo(offsetX, offsetY)
    context.stroke()

    if (gameMode === GameMode.LineLengthLimit) {
      if (
        lastX === undefined ||
        lastX === null ||
        lastY === undefined ||
        lastY === null
      ) {
        throw Error("lastX or lastY is undefined")
      }

      if (
        lineLengthLimit !== undefined &&
        currentLineLength > lineLengthLimit
      ) {
        stopDrawing()
        setCurrentLineLength(0)

        return
      }

      const additionalLength = distanceBetweenTwoPoints({
        x1: lastX,
        y1: lastY,
        x2: offsetX,
        y2: offsetY,
      })

      setCurrentLineLength((prev) => prev + additionalLength)
      setLastX(offsetX)
      setLastY(offsetY)

      socket?.emit(
        SOCKET_EVENTS_OUTBOUND.DRAW,
        context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data
      )
    } else if (gameMode === GameMode.OneLine) {
      socket?.emit(
        SOCKET_EVENTS_OUTBOUND.DRAW,
        context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data
      )
    } else {
      throw Error(`Invalid Game Mode '${gameMode}'`)
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    setIsDrawing(false)

    socket.emit(SOCKET_EVENTS_OUTBOUND.END_TURN)
  }

  const clearCanvas = () => {
    if (!contextRef.current) return

    contextRef.current.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    socket?.emit(SOCKET_EVENTS_OUTBOUND.CLEAR_CANVAS)
  }

  const selectGameMode = (mode: GameMode) => {
    setGameMode(mode)

    socket?.emit(SOCKET_EVENTS_OUTBOUND.SELECT_GAME_MODE, mode)
  }

  return (
    <div className="drawing-container">
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
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="drawing-canvas"
          />
          <button type="button" onClick={clearCanvas} className="clear-button">
            Clear Canvas
          </button>
        </>
      ) : (
        <>
          <button onClick={() => selectGameMode(GameMode.OneLine)}>
            One Line
          </button>
          <button onClick={() => selectGameMode(GameMode.LineLengthLimit)}>
            Line length Limit
          </button>
        </>
      )}
    </div>
  )
}

export default App
