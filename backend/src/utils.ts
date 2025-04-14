export function getNextElement<T>(array: Array<T>, element: T) {
  const currentIndex = array.indexOf(element)
  return currentIndex === -1 ? null : array[(currentIndex + 1) % array.length]
}

export const SOCKET_EVENTS_OUTBOUND = {
  DRAW: 'draw',
  CONNECT: 'connect',
  INITIAL_DATA: 'initial-data',
  UPDATE_TURN: 'update-turn',
  CLEAR_CANVAS: 'clear-canvas',
  SELECTED_GAME_MODE: 'selected-game-mode',
} as const

export const SOCKET_EVENTS_INBOUND = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  DRAW: 'draw',
  END_TURN: 'end-turn',
  CLEAR_CANVAS: 'clear-canvas',
  SELECT_GAME_MODE: 'select-game-mode',
} as const
