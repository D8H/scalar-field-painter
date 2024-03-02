import { integer, float, MergingOperation } from "./CommonTypes";
import { FloodFill } from "./FloodFill";

/**
 * @param x1 {float} first point x
 * @param y1 {float} first point y
 * @param x2 {float} second point x
 * @param y2 {float} second point y
 * @return {float} the square distance between 2 points
 */
const getDistanceSq = (x1: float, y1: float, x2: float, y2: float): float => {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return deltaX * deltaX + deltaY * deltaY;
};

/**
 * @param x {float} point x
 * @param y {float} point y
 * @param x1 {float} segment extremity x
 * @param y1 {float} segment extremity y
 * @param x2 {float} segment extremity x
 * @param y2 {float} segment extremity y
 * @return {float} the square distance between a point and a segment
 */
const getDistanceSqToSegment = (
  x: float,
  y: float,
  x1: float,
  y1: float,
  x2: float,
  y2: float
): float => {
  const length2 = getDistanceSq(x1, y1, x2, y2);
  if (length2 === 0) return getDistanceSq(x, y, x1, y1);
  const t = Math.max(
    0,
    Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length2)
  );
  return getDistanceSq(x, y, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
};

/**
 * A scalar field.
 */
export class ScalarField {
  /** @type {number[][]} */
  private values: number[][];

  private floodFill: FloodFill;

  /**
   * Create a scalar field.
   * @param dimX {integer}
   * @param dimY {integer}
   */
  constructor(dimX: integer, dimY: integer) {
    const fieldValues = new Array(dimY);
    for (var y = 0; y < dimY; y++) {
      fieldValues[y] = new Array(dimX).fill(0);
    }
    this.values = fieldValues;
    this.floodFill = new FloodFill(this);
  }

  /**
   * @return {integer} grid dimension on y
   */
  dimY() {
    return this.values.length;
  }

  /**
   * @return {integer} grid dimension on y
   */
  dimX() {
    const firstColumn = this.values[0];
    return firstColumn ? firstColumn.length : 0;
  }

  isInside(x: float, y: float) {
    return x >= 0 && x <= this.dimX() - 1 && y >= 0 && y <= this.dimY() - 1;
  }

  get(x: integer, y: integer) {
    return this.values[y][x];
  }

  /**
   * @param squareX {integer} x grid index
   * @param squareY {integer} y grid index
   * @param value {float} the field value
   */
  set(x: integer, y: integer, value: float) {
    this.values[y][x] = value;
  }

  /**
   * @param pointX {float} in grid basis
   * @param pointY {float} in grid basis
   * @return {float} the field value
   */
  extrapolate(x: float, y: float) {
    const squareX = Math.floor(x);
    const squareY = Math.floor(y);

    if (
      squareX < 0 ||
      squareY < 0 ||
      // - 1 because the extrapolation uses the next value.
      squareX >= this.dimX() - 1 ||
      squareY >= this.dimY() - 1
    ) {
      return 0;
    }

    // Extrapolate
    let weighedValueSum = 0;
    let weightSum = 0;
    for (let vertexX = squareX; vertexX <= squareX + 1; vertexX++) {
      for (let vertexY = squareY; vertexY <= squareY + 1; vertexY++) {
        const value = this.values[vertexY][vertexX];
        const dx = vertexX - x;
        const dy = vertexY - y;
        if (dx === 0 && dy === 0) {
          // No interpolation needed.
          return value;
        } else {
          const distance = Math.hypot(dx, dy);
          weighedValueSum += value / distance;
          weightSum += 1 / distance;
        }
      }
    }
    const mean = weighedValueSum / weightSum;
    return mean;
  }

  /**
   * Clear the field by filling it with a give value.
   * @param value {float}
   */
  clear(value = 0) {
    for (let rowValues of this.values) {
      for (let x = 0; x < rowValues.length; x++) {
        rowValues[x] = value;
      }
    }
  }

  /**
   * Cap the field between 2 values.
   * @param min {float}
   * @param max {float}
   */
  clamp(min: float, max: float) {
    for (let rowValues of this.values) {
      for (let x = 0; x < rowValues.length; x++) {
        rowValues[x] = Math.min(Math.max(min, rowValues[x]), max);
      }
    }
  }

  /**
   * Apply an affine transformation on each field value.
   * @param a {float} factor
   * @param b {float} offset
   */
  transform(a: float, b: float) {
    for (let rowValues of this.values) {
      for (let x = 0; x < rowValues.length; x++) {
        rowValues[x] = a * rowValues[x] + b;
      }
    }
  }

  /**
   * Merge the values from another field.
   * @param scalarField {ScalarField}
   * @param operation {function(float, float):float}
   */
  mergeField(scalarField: ScalarField, operation: MergingOperation) {
    const dimX = Math.min(this.dimX(), scalarField.dimX());
    const dimY = Math.min(this.dimY(), scalarField.dimY());
    for (let y = 0; y < dimY; y++) {
      const thisRowValues = this.values[y];
      const otherRowValues = scalarField.values[y];
      for (let x = 0; x < dimX; x++) {
        thisRowValues[x] = operation(thisRowValues[x], otherRowValues[x]);
      }
    }
  }

  /**
   * Merge a disk in the field.
   * @param centerX {float} in grid basis
   * @param centerY {float} in grid basis
   * @param radius {float} in grid basis
   * @param cappingRadiusRatio {float}
   * @param operation {function(float, float):float}
   */
  mergeDisk(
    centerX: float,
    centerY: float,
    radius: float,
    cappingRadiusRatio: float,
    operation: MergingOperation
  ) {
    const cappingRadius = cappingRadiusRatio * radius;
    const minX = Math.max(0, Math.floor(centerX - cappingRadius));
    const minY = Math.max(0, Math.floor(centerY - cappingRadius));
    const maxX = Math.min(this.dimX() - 1, Math.ceil(centerX + cappingRadius));
    const maxY = Math.min(this.dimY() - 1, Math.ceil(centerY + cappingRadius));

    const radiusSq = radius * radius;
    // Avoid too big values
    const minDistanceSq = 1 / 1024 / 1024;
    for (let y = minY; y <= maxY; y++) {
      const rowValues = this.values[y];
      for (let x = minX; x <= maxX; x++) {
        const distanceSq = Math.max(
          minDistanceSq,
          getDistanceSq(x, y, centerX, centerY)
        );
        rowValues[x] = operation(rowValues[x], radiusSq / distanceSq);
      }
    }
  }

  /**
   * Merge a segment in the field.
   * @param startX {float} in grid basis
   * @param startY {float} in grid basis
   * @param endX {float} in grid basis
   * @param endY {float} in grid basis
   * @param thickness {float} in grid basis
   * @param cappingRadiusRatio {float}
   * @param operation {function(float, float):float}
   */
  mergeSegment(
    startX: float,
    startY: float,
    endX: float,
    endY: float,
    thickness: float,
    cappingRadiusRatio: float,
    operation: MergingOperation
  ) {
    const cappingRadius = cappingRadiusRatio * thickness;
    const minX = Math.max(
      0,
      Math.floor(Math.min(startX, endX) - cappingRadius)
    );
    const minY = Math.max(
      0,
      Math.floor(Math.min(startY, endY) - cappingRadius)
    );
    const maxX = Math.min(
      this.dimX() - 1,
      Math.ceil(Math.max(startX, endX) + cappingRadius)
    );
    const maxY = Math.min(
      this.dimY() - 1,
      Math.ceil(Math.max(startY, endY) + cappingRadius)
    );

    const thicknessSq = thickness * thickness;
    // Avoid too big values
    const minDistanceSq = 1 / 1024 / 1024;
    for (let y = minY; y <= maxY; y++) {
      const rowValues = this.values[y];
      for (let x = minX; x <= maxX; x++) {
        const distanceSq = Math.max(
          minDistanceSq,
          getDistanceSqToSegment(x, y, startX, startY, endX, endY)
        );
        rowValues[x] = operation(rowValues[x], thicknessSq / distanceSq);
      }
    }
  }

  /**
   * Merge a hill in the field.
   * @param centerX {float} in grid basis
   * @param centerY {float} in grid basis
   * @param height {float}
   * @param radius {float} in grid basis
   * @param opacity {float}
   * @param cappingRadiusRatio {float}
   * @param operation {function(float, float):float}
   */
  mergeHill(
    centerX: float,
    centerY: float,
    height: float,
    radius: float,
    opacity: float,
    cappingRadiusRatio: float,
    operation: MergingOperation
  ) {
    const cappingRadius = cappingRadiusRatio * radius;
    const minX = Math.max(0, Math.floor(centerX - cappingRadius));
    const minY = Math.max(0, Math.floor(centerY - cappingRadius));
    const maxX = Math.min(this.dimX() - 1, Math.ceil(centerX + cappingRadius));
    const maxY = Math.min(this.dimY() - 1, Math.ceil(centerY + cappingRadius));

    const logHeightDividedByRadiusSq = Math.log(height) / (radius * radius);
    const opacityMultipliedByHeight = opacity * height;
    // Avoid too big values
    const minDistanceSq = 1 / 1024 / 1024;
    for (let y = minY; y <= maxY; y++) {
      const rowValues = this.values[y];
      for (let x = minX; x <= maxX; x++) {
        const distanceSq = Math.max(
          minDistanceSq,
          getDistanceSq(x, y, centerX, centerY)
        );
        // This is like a gaussian, but parametrized differently.
        rowValues[x] = operation(
          rowValues[x],
          opacityMultipliedByHeight *
            Math.exp(-distanceSq * logHeightDividedByRadiusSq)
        );
      }
    }
  }

  /**
   * Flood an area from a given location until a maximum field value is reached.
   * @param originX {float} in grid basis
   * @param originY {float} in grid basis
   * @param valueMax {float}
   * @param thickness {float}
   * @param cappingRadiusRatio {float} the radius where to stop the contour shading
   * @param isMinimum {boolean} when set to true, the threshold is a minimum
   * or a maximum otherwise.
   */
  fillFrom(
    originX: float,
    originY: float,
    valueMax: float,
    thickness: float,
    cappingRadiusRatio: float
  ) {
    this.floodFill.fillFrom(
      originX,
      originY,
      valueMax,
      thickness,
      cappingRadiusRatio
    );
  }

  /**
   * Flood an area from a given location until a maximum field value is reached.
   * @param originX {float} in grid basis
   * @param originY {float} in grid basis
   * @param valueMax {float}
   * @param thickness {float}
   * @param cappingRadiusRatio {float} the radius where to stop the contour shading
   * @param isMinimum {boolean} when set to true, the threshold is a minimum
   * or a maximum otherwise.
   */
  unfillFrom(
    originX: float,
    originY: float,
    valueMin: float,
    thickness: float,
    cappingRadiusRatio: float
  ) {
    this.floodFill.unfillFrom(
      originX,
      originY,
      valueMin,
      thickness,
      cappingRadiusRatio
    );
  }
}
