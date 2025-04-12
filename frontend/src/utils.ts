// Pythagoras' theorem
export function distanceBetweenTwoPoints({
		x1,
		y1,
		x2,
		y2,
}: {
		x1: number
		y1: number
		x2: number
		y2: number
}): number {
		return Math.hypot(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

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
		OneLine         = "One Line",
		LineLengthLimit = "Line Length Limit",
}

export { NO_CANVAS_ERROR, NO_CONTEXT_ERROR, SOCKET_EVENTS_INBOUND, SOCKET_EVENTS_OUTBOUND, GameMode }