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
    return Math.hypot((x1 - x2), (y1 - y2))
}