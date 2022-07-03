import { integer, float } from "./CommonTypes";
import { CoordConverter } from "./CoordConverter";
import { ShapePainter } from "./ShapePainter";

/**
 * The marching square algorithm use this interface to describe the contour
 * lines.
 * @see MarchingSquares
 */
export class ScaledShapePainter implements ShapePainter {
  shapePainter: ShapePainter;
  coordConverter: CoordConverter;

  /**
   * A rectangle can be several cells wide.
   * @param left {float}
   * @param top {float}
   * @param right {float}
   * @param bottom {float}
   */
  drawRectangle(left: float, top: float, right: float, bottom: float): void {
    this.shapePainter.drawRectangle(
      this.coordConverter.convertFromGridBasisX(left),
      this.coordConverter.convertFromGridBasisY(top),
      this.coordConverter.convertFromGridBasisX(right),
      this.coordConverter.convertFromGridBasisY(bottom)
    );
  }

  /**
   *
   * @param x {float}
   * @param y {float}
   */
  beginPath(x: float, y: float): void {
    this.shapePainter.beginPath(
      this.coordConverter.convertFromGridBasisX(x),
      this.coordConverter.convertFromGridBasisY(y)
    );
  }

  /**
   *
   * @param x {float}
   * @param y {float}
   */
  lineTo(x: float, y: float): void {
    this.shapePainter.lineTo(
      this.coordConverter.convertFromGridBasisX(x),
      this.coordConverter.convertFromGridBasisY(y)
    );
  }

  /**
   *
   */
  closePath(): void {
    this.shapePainter.closePath();
  }

  /**
   *
   * @param squareX {integer} The cell index where the path was drawn.
   * @param squareY {integer} The cell index where the path was drawn.
   */
  endPath(squareX: integer, squareY: integer): void {
    this.shapePainter.endPath(squareX, squareY);
  }

  /**
   * Notify that a cell was fill and the rectangle might be given later if
   * consecutive cells are filled.
   * @param squareX {integer}
   * @param squareY {integer}
   */
  onFilledSquareChange(squareX: integer, squareY: integer): void {
    this.shapePainter.onFilledSquareChange(squareX, squareY);
  }
}
