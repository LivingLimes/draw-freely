export function getNextElement<T>(array: Array<T>, element: T) {
  const currentIndex = array.indexOf(element)
  return currentIndex === -1 ? null : array[(currentIndex + 1) % array.length]
}
