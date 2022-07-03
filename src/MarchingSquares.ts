import { integer, float, FloatPoint } from "./CommonTypes";
import { ScalarField } from "./ScalarField";
import { ShapePainter } from "./ShapePainter";

const South = 0;
const East = 1;
const North = 2;
const West = 3;
const SouthWest = 4;
const SouthEast = 5;
const NorthEast = 6;
const NorthWest = 7;

const SouthWestMask = 1;
const SouthEastMask = 2;
const NorthEastMask = 4;
const NorthWestMask = 8;

const marchingSquaresFillVertices = [
  [],
  [South, West, SouthWest],
  [East, South, SouthEast],
  [East, West, SouthWest, SouthEast],

  [North, East, NorthEast],
  [South, SouthWest, West, North, NorthEast, East],
  [South, North, NorthEast, SouthEast],
  [West, North, NorthEast, SouthEast, SouthWest],

  [West, North, NorthWest],
  [North, South, SouthWest, NorthWest],
  [South, West, NorthWest, North, East, SouthEast],
  [North, East, SouthEast, SouthWest, NorthWest],

  [East, West, NorthWest, NorthEast],
  [East, South, SouthWest, NorthWest, NorthEast],
  [South, West, NorthWest, NorthEast, SouthEast],
  [],
];

const marchingSquaresOutlineVertices = [
  [[]],
  [[South, West]],
  [[East, South]],
  [[East, West]],

  [[North, East]],
  [
    [East, South],
    [West, North],
  ],
  [[South, North]],
  [[West, North]],

  [[West, North]],
  [[North, South]],
  [
    [South, West],
    [North, East],
  ],
  [[North, East]],

  [[East, West]],
  [[East, South]],
  [[South, West]],
  [[]],
];

/**
 * A marching square algorithm implementation.
 */
export class MarchingSquares {
  /** {FloatPoint} Avoid memory allocations when returning points */
  workingPoint: FloatPoint = [0, 0];

  scalarField: ScalarField;

  /**
   *
   * @param scalarField
   */
  constructor(scalarField: ScalarField) {
    this.scalarField = scalarField;
  }

  /**
   * @param x {integer} the square top in the grid
   * @param y {integer} the square left in the grid
   * @param threshold {float}
   * @return {integer} one of the 16 marching squares cases
   */
  private getSquareIndex(x: integer, y: integer, threshold: float) {
    /** @type {float} */
    let squareIndex = 0;
    if (this.scalarField.get(x, y + 1) > threshold) {
      squareIndex |= SouthWestMask;
    }
    if (this.scalarField.get(x + 1, y + 1) > threshold) {
      squareIndex |= SouthEastMask;
    }
    if (this.scalarField.get(x + 1, y) > threshold) {
      squareIndex |= NorthEastMask;
    }
    if (this.scalarField.get(x, y) > threshold) {
      squareIndex |= NorthWestMask;
    }
    return squareIndex;
  }

  /**
   * Returns the mean between 2 corners weighted by their field value.
   * @param indexX1 {integer} first corner x
   * @param indexY1 {integer} first corner y
   * @param indexX2 {integer} second corner x
   * @param indexY2 {integer} second corner y
   * @param threshold {float}
   * @return {float} x in the grid
   */
  private betweenX(
    indexX1: integer,
    indexY1: integer,
    indexX2: integer,
    indexY2: integer,
    threshold: float
  ) {
    const value1 = this.scalarField.get(indexX1, indexY1);
    const value2 = this.scalarField.get(indexX2, indexY2);

    const weight1 = Math.abs(value1 - threshold);
    const weight2 = Math.abs(value2 - threshold);

    return (weight2 * indexX1 + weight1 * indexX2) / (weight1 + weight2);
  }

  /**
   * Returns the mean between 2 corners weighted by their field value.
   * @param indexX1 {integer} first corner x
   * @param indexY1 {integer} first corner y
   * @param indexX2 {integer} second corner x
   * @param indexY2 {integer} second corner y
   * @param threshold {float}
   * @return {float} y in the grid
   */
  private betweenY(
    indexX1: integer,
    indexY1: integer,
    indexX2: integer,
    indexY2: integer,
    threshold: float
  ) {
    const value1 = this.scalarField.get(indexX1, indexY1);
    const value2 = this.scalarField.get(indexX2, indexY2);

    const weight1 = Math.abs(value1 - threshold);
    const weight2 = Math.abs(value2 - threshold);

    return (weight2 * indexY1 + weight1 * indexY2) / (weight1 + weight2);
  }

  /**
   * @param side {integer} point location
   * @param indexX {integer} the square top in the grid
   * @param indexY {integer} the square left in the grid
   * @param threshold {float}
   * @param point {FloatPoint} is the result
   */
  private calcPoint(
    side: integer,
    indexX: integer,
    indexY: integer,
    threshold: float,
    point: FloatPoint
  ) {
    let gridX = 0;
    let gridY = 0;

    switch (side) {
      case South:
        gridY = indexY + 1;
        gridX = this.betweenX(indexX, gridY, indexX + 1, gridY, threshold);
        break;

      case East:
        gridX = indexX + 1;
        gridY = this.betweenY(gridX, indexY, gridX, indexY + 1, threshold);
        break;

      case North:
        gridY = indexY;
        gridX = this.betweenX(indexX, gridY, indexX + 1, gridY, threshold);
        break;

      case West:
        gridX = indexX;
        gridY = this.betweenY(gridX, indexY, gridX, indexY + 1, threshold);
        break;

      case SouthWest:
        gridX = indexX;
        gridY = indexY + 1;
        break;

      case SouthEast:
        gridX = indexX + 1;
        gridY = indexY + 1;
        break;

      case NorthEast:
        gridX = indexX + 1;
        gridY = indexY;
        break;

      case NorthWest:
        gridX = indexX;
        gridY = indexY;
        break;
    }

    point[0] = gridX;
    point[1] = gridY;
  }

  /**
   * Draw the field squares
   * @param minX {integer} left
   * @param minY {integer} top
   * @param maxX {integer} right
   * @param maxY {integer} bottom
   * @param threshold {float}
   * @param drawUnder {boolean}
   * @param shapePainter {ShapePainter}
   */
  fillContour(
    minX: integer,
    minY: integer,
    maxX: integer,
    maxY: integer,
    threshold: float,
    drawUnder: boolean,
    shapePainter: ShapePainter
  ) {
    const point = this.workingPoint;

    // It draws bands and small polygons.
    // The contour line is in a second loop, it's more efficient
    // than switching the style constantly.

    for (let squareY = minY; squareY < maxY - 1; squareY++) {
      // for run-length encoding
      let first15SquareX = -1;

      for (let squareX = minX; squareX < maxX - 1; squareX++) {
        shapePainter.onFilledSquareChange(squareX, squareY);
        let squareIndex = this.getSquareIndex(squareX, squareY, threshold);
        if (drawUnder) {
          squareIndex = 15 - squareIndex;
        }

        if (first15SquareX === -1 && squareIndex === 15) {
          first15SquareX = squareX;
        }
        if (first15SquareX !== -1) {
          if (squareIndex !== 15) {
            shapePainter.drawRectangle(
              first15SquareX,
              squareY,
              squareX,
              squareY + 1
            );
            first15SquareX = -1;
          } else if (squareX === maxX - 2) {
            shapePainter.drawRectangle(
              first15SquareX,
              squareY,
              squareX + 1,
              squareY + 1
            );
            first15SquareX = -1;
          }
        }
        if (squareIndex !== 0 && squareIndex !== 15) {
          let fillVertices = marchingSquaresFillVertices[squareIndex];
          this.calcPoint(fillVertices[0], squareX, squareY, threshold, point);
          shapePainter.beginPath(point[0], point[1]);
          for (let index = 1; index < fillVertices.length; index++) {
            this.calcPoint(
              fillVertices[index],
              squareX,
              squareY,
              threshold,
              point
            );
            shapePainter.lineTo(point[0], point[1]);
          }
          shapePainter.closePath();
          shapePainter.endPath(squareX, squareY);
        }
      }
    }
  }

  /**
   * Draw the field squares
   * @param minX {integer} left
   * @param minY {integer} top
   * @param maxX {integer} right
   * @param maxY {integer} bottom
   * @param threshold {float}
   * @param drawUnder {boolean}
   * @param shapePainter {ShapePainter}
   */
  outlineContour(
    minX: integer,
    minY: integer,
    maxX: integer,
    maxY: integer,
    threshold: float,
    drawUnder: boolean,
    shapePainter: ShapePainter
  ) {
    const point = this.workingPoint;
    for (let squareY = minY; squareY < maxY - 1; squareY++) {
      for (let squareX = minX; squareX < maxX - 1; squareX++) {
        let squareIndex = this.getSquareIndex(squareX, squareY, threshold);
        if (drawUnder) {
          squareIndex = 15 - squareIndex;
        }

        if (squareIndex !== 0 && squareIndex !== 15) {
          for (let outlineVertices of marchingSquaresOutlineVertices[
            squareIndex
          ]) {
            this.calcPoint(
              outlineVertices[0],
              squareX,
              squareY,
              threshold,
              point
            );
            shapePainter.beginPath(point[0], point[1]);
            for (let index = 1; index < outlineVertices.length; index++) {
              this.calcPoint(
                outlineVertices[index],
                squareX,
                squareY,
                threshold,
                point
              );
              shapePainter.lineTo(point[0], point[1]);
            }
            shapePainter.endPath(squareX, squareY);
          }
        }
      }
    }
  }
}
