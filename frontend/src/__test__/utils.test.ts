import { distanceBetweenTwoPoints } from "../utils"

const p1 = {
		x: 3,
		y: 0,
}

const p2 = {
		x: 0,
		y: 4,
}

describe("distance between two points", () => {
		const leg1 = p1.x - p2.x
		const leg2 = p1.y - p2.y
		
		const hypotenuse = Math.sqrt((leg1 ** 2) + (leg2 ** 2))
		
		it("should equal", () => {
				expect(distanceBetweenTwoPoints({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })).toEqual(hypotenuse)
		})
})