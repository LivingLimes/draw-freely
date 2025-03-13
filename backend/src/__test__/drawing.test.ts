import { Drawing } from "../drawing"

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
				// Same with the class Drawing's configuration
				const canvasHeight = 300
				const canvasWidth = 300
				const pixelSize = 4
				const expectedBufferSize = canvasHeight * canvasWidth * pixelSize
				
				expect(buffer.length).toEqual(expectedBufferSize)
				
				// Check if it's empty
				expect(buffer.every(byte => byte === 0)).toBe(true)
		})
		
		// for `canCreate()`
		test('should validate if a buffer can be used to create a drawing', () => {})
		
		// for `getValue()`
		test('should return the correct buffer value', () => {})
		
		// for `createFrom()`
		test('should create a drawing canvas with the correct values and reject the malformed ones', () => {})
})