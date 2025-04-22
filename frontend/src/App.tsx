import React, { useEffect, useState } from "react"
import { socket } from "./socket"
import { distanceBetweenTwoPoints } from "./utils"
import "./App.css"
import { type Pointer } from "./types"
import About from "./About"
import useCanvas from "./useCanvas"
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
}

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null)
  const { canvasRef, contextRef, shouldShowCanvas } = useCanvas({ gameMode })
  const [isDrawing, setIsDrawing] = useState(false)
  const [turnPlayer, setTurnPlayer] = useState<string | undefined>(undefined)

  const [lineLengthLimit, setLineLengthLimit] = useState<number | undefined>(
    undefined
  )
  const [currentLineLength, setCurrentLineLength] = useState<number>(0)

  const [ongoingPointer, setOngoingPointer] = useState<
    Pointer | undefined | null
  >(undefined)

  const isMyTurn = socket.id === turnPlayer

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
      context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data
    )
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const pointer = ongoingPointer?.[event.pointerId]
    if (!pointer) {
      console.error(
        `Could not find pointer for ${event.type} pointer id ${event.pointerId}`
      )
      return
    }

    const context = contextRef.current
    if (!context) {
      console.error(NO_CONTEXT_ERROR)
      return
    }

    const { pageX, pageY } = event
    const canvas = canvasRef.current
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
        `Could not find pointer for ${event.type} pointer id ${event.pointerId}`
      )
      return
    }

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
          {(Object.keys(GameMode) as Array<keyof typeof GameMode>).map(
            (enumKey) => {
              return (
                <button onClick={() => selectGameMode(GameMode[enumKey])}>
                  {GameMode[enumKey]}
                </button>
              )
            }
          )}
          <About />
        </>
      )}
    </div>
  )
}

export default App
