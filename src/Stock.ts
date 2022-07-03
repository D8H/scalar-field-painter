/**
 * A stock to reuse instances and avoid allocation.
 */
export class Stock<T> {
  private elements: Array<T> = [];

  /**
   * Create a stock.
   */
  constructor() {}

  /**
   * Get an element to avoid allocation or create a new one if the stock is
   * empty.
   * @param create
   * @returns an element
   */
  getOrCreate(create: () => T): T {
    return this.elements.pop() || create();
  }

  /**
   * Stock an element to use it later.
   * @param element
   */
  stock(element: T) {
    this.elements.push(element);
  }

  /**
   * Free all the elements from the stock.
   */
  flush() {
    this.elements.length = 0;
  }
}
