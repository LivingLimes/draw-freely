import Drawing from '../drawing'

const canvasHeight = 300
const canvasWidth = 300
const pixelSize = 4
const totalArraySize = canvasHeight * canvasWidth * pixelSize

describe('test Drawing class', () => {
  describe('test `createEmpty()`)', () => {
    const emptyDrawing = Drawing.createEmpty()
    const buffer = emptyDrawing.getValue()

    test('should be the same size as `totalArraySize`', () => {
      expect(buffer.length).toEqual(totalArraySize)
    })

    test('value of the buffer should be empty', () => {
      expect(buffer).toEqual(Buffer.alloc(totalArraySize, 0))
    })
  })

  describe('test `canCreate()', () => {
    test.each([
      {
        testName: 'valid buffer, should return true',
        buffer: Buffer.alloc(totalArraySize, 0),
        expected: true,
      },
      {
        testName: 'buffer is too small, should return false',
        buffer: Buffer.alloc(totalArraySize - 1, 0),
        expected: false,
      },
      {
        testName: 'buffer is too large, should return false',
        buffer: Buffer.alloc(totalArraySize + 1, 0),
        expected: false,
      },
    ])('$testName', ({ buffer, expected }) => {
      expect(Drawing.canCreate(buffer)).toBe(expected)
    })
  })

  describe('test `createFrom()`', () => {
    const emptyDrawingBuffer = Buffer.alloc(totalArraySize)
    const nonEmptyDrawingBuffer = Buffer.alloc(totalArraySize, 100)
    const invalidDrawingBuffer = Buffer.alloc(totalArraySize - 1, 0)

    test('should create an empty drawing ', () => {
      const drawing = Drawing.createFrom(emptyDrawingBuffer)
      expect(drawing).toBeInstanceOf(Drawing)
      expect(drawing.getValue()).toEqual(Buffer.alloc(totalArraySize, 0))
    })

    test('should create a non empty drawing', () => {
      const drawing = Drawing.createFrom(nonEmptyDrawingBuffer)
      expect(drawing).toBeInstanceOf(Drawing)
      expect(drawing.getValue().every((el) => el >= 0 && el <= 255)).toBe(true)
    })

    test('should reject the malformed drawing (size is too small)', () => {
      expect(() => Drawing.createFrom(invalidDrawingBuffer)).toThrow()
    })
  })
})
