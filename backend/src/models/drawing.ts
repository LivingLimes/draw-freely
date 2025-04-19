export default class Drawing {
  static readonly #canvasHeight = 300
  static readonly #canvasWidth = 300
  // In the canvas, each pixel is represented with 4 values: R, G, B and A.
  static readonly #pixelSize = 4
  static readonly #totalArraySize =
    Drawing.#canvasHeight * Drawing.#canvasWidth * Drawing.#pixelSize

  private value: Buffer

  private constructor(_value: Buffer) {
    this.value = _value
  }

  public getValue(): Readonly<Buffer> {
    return this.value
  }

  public static canCreate(drawing: Buffer) {
    return drawing.length === Drawing.#totalArraySize
  }

  public static createEmpty(): Drawing {
    return new Drawing(Buffer.alloc(Drawing.#totalArraySize))
  }

  public static createFrom(drawing: Buffer): Drawing {
    if (!this.canCreate(drawing)) {
      throw Error('Cannot create drawing as it is malformed')
    }

    return new Drawing(drawing)
  }
}
