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

export enum GameMode {
		OneLine         = "One Line",
		LineLengthLimit = "Line Length Limit",
}