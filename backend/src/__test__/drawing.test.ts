import { Drawing } from "../drawing"

const canvasHeight = 300
const canvasWidth = 300
const pixelSize = 4
const totalArraySize = canvasHeight * canvasWidth * pixelSize

describe("Drawing class", () => {
		// Test for the drawing class
		// for `createEmpty()`
		test('should crate an empty canvas of the correct size', () => {
				// Check Drawing instance
				const emptyDrawing = Drawing.createEmpty()
				expect(emptyDrawing).toBeInstanceOf(Drawing)
				
				// Check Buffer
				const buffer = emptyDrawing.getValue()
				expect(Buffer.isBuffer(buffer)).toBe(true)
				
				// Check the size of the drawing
				expect(buffer.length).toEqual(totalArraySize)
				
				// Check if it's empty
				expect(buffer.every(byte => byte === 0)).toBe(true)
		})
		
		// for `canCreate()`
		test('should validate if a buffer can be used to create a drawing', () => {
				const validDrawingBuffer = Buffer.alloc(totalArraySize, 0)
				const tooSmallBuffer = Buffer.alloc(totalArraySize - 1, 0)
				const tooLargeBuffer = Buffer.alloc(totalArraySize + 1, 0)
				const invalidBuffer = {} as any
				
				
				// Case 1: Valid buffer (300 * 300 * 4)
				expect(Drawing.canCreate(validDrawingBuffer)).toBe(true)
				// Case 2: Drawing size is smaller than the total array size
				expect(Drawing.canCreate(tooSmallBuffer)).toBe(false)
				// Case 3: Drawing size is bigger than the total array size
				expect(Drawing.canCreate(tooLargeBuffer)).toBe(false)
				// Case 4: Drawing is not a buffer (invalid)
				expect(Drawing.canCreate(invalidBuffer)).toBe(false)
				// TODO: Case 5: Value of a buffer's element isn't between 0 and 255
		
		})
		
		test.each([
				{ testName: "valid buffer, should return true", buffer: Buffer.alloc(totalArraySize, 0), expected: true },
				{ testName: "buffer is too small, should return false", buffer: Buffer.alloc(totalArraySize - 1, 0), expected: false },
				{ testName: "buffer is too large, should return false", buffer: Buffer.alloc(totalArraySize + 1, 0), expected: false },
				{ testName: "invalid buffer, should return false", buffer: {} as any, expected: false },
				{ testName: "invalid value of buffer's element, should return false", buffer: Buffer.alloc(totalArraySize, 300), expected: false },
		])("`canCreate()`: $testName", ({ buffer, expected }) => {
				expect(Drawing.canCreate(buffer)).toBe(expected)
		})
		
		test("should create a drawing canvas with the correct values and reject the malformed ones", () => {
				const validDrawingBuffer = Drawing.createEmpty().getValue()
				const invalidDrawingBuffer = Buffer.alloc(totalArraySize - 1, 0)
				
				expect(Drawing.createFrom(validDrawingBuffer)).toBeInstanceOf(Drawing)
				expect(() => Drawing.createFrom(invalidDrawingBuffer)).toThrow()
				
		
		})
})