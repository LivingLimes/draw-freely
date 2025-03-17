import Drawing from "../drawing"

const canvasHeight = 300
const canvasWidth = 300
const pixelSize = 4
const totalArraySize = canvasHeight * canvasWidth * pixelSize

describe("test Drawing class", () => {
		describe("test `createEmpty()`)", () => {
				const emptyDrawing = Drawing.createEmpty()
				const buffer = emptyDrawing.getValue()
				
				test("should create an instance of Drawing", () => {
						expect(emptyDrawing).toBeInstanceOf(Drawing)
				})
				
				test("should be the same size as `totalArraySize`", () => {
						expect(buffer.length).toEqual(totalArraySize)
				})
				
				test("value of the buffer should be empty", () => {
						expect(buffer.every(el => el >= 0)).toBe(true)
				})
		})
		
		describe("test `canCreate()", () => {
				test.each([
						{ testName: "valid buffer, should return true", buffer: Buffer.alloc(totalArraySize, 0), expected: true },
						{ testName: "buffer is too small, should return false", buffer: Buffer.alloc(totalArraySize - 1, 0), expected: false },
						{ testName: "buffer is too large, should return false", buffer: Buffer.alloc(totalArraySize + 1, 0), expected: false },
						{ testName: "invalid input, should return false", buffer: Object.create(null), expected: false },
				])("$testName", ({ buffer, expected }) => {
						expect(Drawing.canCreate(buffer)).toBe(expected)
				})
		})
		
		describe("test `createFrom()`", () => {
				const validDrawingBuffer = Drawing.createEmpty().getValue()
				const invalidDrawingBuffer = Buffer.alloc(totalArraySize - 1, 0)
				
				test("should create a drawing canvas with the correct values", () => {
						expect(Drawing.createFrom(validDrawingBuffer)).toBeInstanceOf(Drawing)
				})
				
				test("should reject the malformed drawing (size is too small)", () => {
						expect(() => Drawing.createFrom(invalidDrawingBuffer)).toThrow()
				})
		})
})