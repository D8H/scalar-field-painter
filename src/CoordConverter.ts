import { integer, float, FloatPoint } from "./CommonTypes";

/**
 * A coordinate converter between a surface and a grid.
 */
export class CoordConverter {
  cellWidth: integer;
  cellHeight: integer;

  left: float;
  top: float;
  right: float;
  bottom: float;

  /**
   * Create a coordinate converter between a surface and a grid.
   * @param cellWidth {float}
   * @param cellHeight {float}
   * @param left {float}
   * @param top {float}
   * @param right {float}
   * @param bottom {float}
   */
  constructor(
    cellWidth: integer,
    cellHeight: integer,
    left: float,
    top: float,
    right: float,
    bottom: float
  ) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }
  /**
   * @param x {float} in the scene basis
   * @return {float} x in the grid basis
   */
  convertToGridBasisX(x: float) {
    return (x - this.left) / this.cellWidth;
  }

  /**
   * @param y {float} in the scene basis
   * @return {float} y in the grid basis
   */
  convertToGridBasisY(y: float) {
    return (y - this.top) / this.cellHeight;
  }

  /**
   * @param x {float} in the grid basis
   * @return {float} x in the scene basis
   */
  convertFromGridBasisX(x: float) {
    return x * this.cellWidth + this.left;
  }

  /**
   * @param y {float} in the grid basis
   * @return {float} y in the scene basis
   */
  convertFromGridBasisY(y: float) {
    return y * this.cellHeight + this.top;
  }

  /**
   * @param distance {float} in the grid basis
   * @return {float} distance in the scene basis
   */
  convertToGridBasisDistance(distance: float) {
    return distance / this.cellWidth;
  }
}
