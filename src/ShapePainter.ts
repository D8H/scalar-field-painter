import { integer, float } from "./CommonTypes";

/**
 * The marching square algorithm use this interface to describe the contour
 * lines.
 * @see MarchingSquares
 */
export interface ShapePainter {
  /**
   * A rectangle can be several cells wide.
   * @param left {float}
   * @param top {float}
   * @param right {float}
   * @param bottom {float}
   */
  drawRectangle(left: float, top: float, right: float, bottom: float): void;

  /**
   *
   * @param x {float}
   * @param y {float}
   */
  beginPath(x: float, y: float): void;

  /**
   *
   * @param x {float}
   * @param y {float}
   */
  lineTo(x: float, y: float): void;

  /**
   *
   */
  closePath(): void;

  /**
   *
   * @param squareX {integer} The cell index where the path was drawn.
   * @param squareY {integer} The cell index where the path was drawn.
   */
  endPath(squareX: integer, squareY: integer): void;

  /**
   * Notify that a cell was fill and the rectangle might be given later if
   * consecutive cells are filled.
   * @param squareX {integer}
   * @param squareY {integer}
   */
  onFilledSquareChange(squareX: integer, squareY: integer): void;
}
