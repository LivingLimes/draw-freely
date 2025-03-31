import { GameMode } from "../utils"

export interface SocketState {
		isConnected: boolean
		initialDataLoaded: boolean
		turnPlayer: string | undefined
		gameMode: GameMode | null
		lastDrawUpdate: number | null
}

export const initialSocketState: SocketState = {
		isConnected: false,
		initialDataLoaded: false,
		turnPlayer: undefined,
		gameMode: null,
		lastDrawUpdate: null,
}

export type SocketAction =
		| { type: "SOCKET_CONNECTED" }
		| { type: "SOCKET_DISCONNECTED" }
		| { type: "INITIAL_DATA_LOADED"; payload: { drawing: number[]; lineLengthLimit: number; gameMode: GameMode } }
		| { type: "TURN_UPDATED"; payload: { turnPlayer: string } }
		| { type: "GAME_MODE_SELECTED"; payload: { gameMode: GameMode } }
		| { type: "DRAWING_RECEIVED"; payload: number[] | Uint8ClampedArray }		// For both inbound and outbound events
		| { type: "CANVAS_CLEARED"; payload: { gameMode: GameMode } }

export function socketReducer(state: SocketState, action: SocketAction): SocketState {
		switch ( action.type ) {
				case "SOCKET_CONNECTED":
						return {
								...state,
								isConnected: true,
						}
				case "SOCKET_DISCONNECTED":
						return {
								...state,
								isConnected: false,
						}
				case "INITIAL_DATA_LOADED":
						return {
								...state,
								initialDataLoaded: true,
								gameMode: action.payload.gameMode
						}
				case "TURN_UPDATED":
						return {
								...state,
								turnPlayer: action.payload.turnPlayer
						}
				case "GAME_MODE_SELECTED":
						return {
								...state,
								gameMode: action.payload.gameMode
						}
				case "DRAWING_RECEIVED":
						return {
								...state,
								lastDrawUpdate: Date.now()
						}
				case "CANVAS_CLEARED":
						return {
								...state,
								gameMode: action.payload.gameMode
						}
		}
}