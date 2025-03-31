import type { Pointer } from "../types"

export interface DrawingState {
		isDrawing: boolean
		ongoingPointer: Pointer | null | undefined
		currentLineLength: number
}

export const initialDrawingState: DrawingState = {
		isDrawing: false,
		ongoingPointer: undefined,
		currentLineLength: 0,
}

export type DrawingAction =
		| { type: "START_DRAWING"; payload: { pointerId: number; x: number; y: number } }
		| { type: "ON_DRAWING"; payload: { pointerId: number; x: number; y: number; additionalLength: number } }
		| { type: "STOP_DRAWING"; payload: { pointerId: number } }
		| { type: "RESET_LINE_LENGTH"; }

export function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
		switch ( action.type ) {
				case "START_DRAWING":
						console.log("START DRAWING")
						return {
								...state,
								isDrawing: true,
								ongoingPointer: {
										...state.ongoingPointer,
										[action.payload.pointerId]: {
												relativeX: action.payload.x,
												relativeY: action.payload.y,
										},
								},
						}
				case "ON_DRAWING":
						return {
								...state,
								ongoingPointer: {
										...state.ongoingPointer,
										[action.payload.pointerId]: {
												relativeX: action.payload.x,
												relativeY: action.payload.y,
										},
								},
								currentLineLength: state.currentLineLength + action.payload.additionalLength,
						}
				case "STOP_DRAWING":
						console.log("STOP DRAWING")
						
						return {
								...state,
								isDrawing: false,
						}
				case "RESET_LINE_LENGTH": {
						return {
								...state,
								currentLineLength: 0,
						}
				}
				default:
						return state
		}
}