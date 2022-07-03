import { integer, float, MergingOperation } from "./CommonTypes";
import { CoordConverter } from "./CoordConverter";
import { ScalarField } from "./ScalarField";

/**
 * A height map.
 */
export class HeightMap {
  scalarField: ScalarField;
  coordConverter: CoordConverter;

  /**
   * Create a height map.
   * @param scalarField {ScalarField} a scalar field for the height values.
   * @param coordConverter {CoordConverter} a coordinate converter between the
   * surface and the scalar field grid.
   */
  constructor(scalarField: ScalarField, coordConverter: CoordConverter) {
    this.scalarField = scalarField;
    this.coordConverter = coordConverter;
  }

  /**
   * @param pointX {float} in terrain basis
   * @param pointY {float} in terrain basis
   * @param normal {[float, float, float]} the result
   * @return {[float, float, float]} the result
   */
  getFieldNormal(
    pointX: float,
    pointY: float,
    normal: [float, float, float]
  ): [float, float, float] {
    if (!normal) {
      normal = [0, 0, 0];
    }
    let x = this.coordConverter.convertToGridBasisX(pointX);
    let y = this.coordConverter.convertToGridBasisY(pointY);

    let squareX = Math.floor(x);
    let squareY = Math.floor(y);

    if (
      squareX < 0 ||
      squareY < 0 ||
      squareX >= this.scalarField.dimX() ||
      squareY >= this.scalarField.dimY()
    ) {
      return null;
    }

    // This gives very approximating values on borders
    // but it's the easiest way to avoid to be out of bounds.
    // Why 1 but dim - 3?
    // - 1 margin for the normal calculus on both side
    // - 1 extra because extrapolation asks values on right and bottom.
    if (squareX < 1) {
      squareX = 1;
      x = squareX;
    }
    if (squareX > this.scalarField.dimX() - 3) {
      squareX = this.scalarField.dimX() - 3;
      x = squareX;
    }
    if (squareY < 1) {
      squareY = 1;
      y = squareY;
    }
    if (squareY > this.scalarField.dimY() - 3) {
      squareY = this.scalarField.dimY() - 3;
      y = squareY;
    }

    // Extrapolate
    let weighedValueSumX = 0;
    let weighedValueSumY = 0;
    let weighedValueSumZ = 0;
    for (let vertexX = squareX; vertexX <= squareX + 1; vertexX++) {
      for (let vertexY = squareY; vertexY <= squareY + 1; vertexY++) {
        normal[0] = 0;
        normal[1] = 0;
        normal[2] = 0;
        this.addGridPointNormal(vertexX, vertexY, normal);
        const dx = vertexX - x;
        const dy = vertexY - y;
        if (dx === 0 && dy === 0) {
          // Double break, no interpolation needed.
          vertexX += 2;
          vertexY += 2;
        } else {
          const distance = Math.hypot(dx, dy);
          weighedValueSumX += normal[0] / distance;
          weighedValueSumY += normal[1] / distance;
          weighedValueSumZ += normal[2] / distance;
        }
      }
    }
    const length = Math.hypot(normal[0], normal[1], normal[2]);
    normal[0] /= length;
    normal[1] /= length;
    normal[2] /= length;
    return normal;
  }

  /**
   * @param pointX {float} in terrain basis
   * @param pointY {float} in terrain basis
   * @return {float} the field value
   */
  getHeight(pointX: float, pointY: float) {
    let x = this.coordConverter.convertToGridBasisX(pointX);
    let y = this.coordConverter.convertToGridBasisY(pointY);
    return this.scalarField.extrapolate(x, y);
  }

  /**
   * Evaluate the normal at a given grid point.
   *
   * The normal is not normalized.
   *
   * @param x {integer} grid index
   * @param y {integer} grid index
   * @param normal {[float, float, float]} the result
   */
  private addGridPointNormal(
    x: integer,
    y: integer,
    normal: [float, float, float]
  ) {
    const z = this.scalarField.get(x, y);

    let rightX = 1;
    const rightY = 0;
    let rightZ = this.scalarField.get(x + 1, y) - z;
    const rightLength = Math.hypot(rightX, rightZ);
    rightX /= rightLength;
    rightZ /= rightLength;

    let leftX = -1;
    const leftY = 0;
    let leftZ = this.scalarField.get(x - 1, y) - z;
    const leftLength = Math.hypot(leftX, leftZ);
    leftX /= leftLength;
    leftZ /= leftLength;

    const bottomX = 0;
    let bottomY = 1;
    let bottomZ = this.scalarField.get(x, y + 1) - z;
    const bottomLength = Math.hypot(bottomY, bottomZ);
    bottomY /= bottomLength;
    bottomZ /= bottomLength;

    const topX = 0;
    let topY = -1;
    let topZ = this.scalarField.get(x, y - 1) - z;
    const topLength = Math.hypot(topY, topZ);
    topY /= topLength;
    topZ /= topLength;

    // The mean of the normal of the 4 triangles around the grid point.
    this.addNormal(topX, topY, topZ, rightX, rightY, rightZ, normal);
    this.addNormal(rightX, rightY, rightZ, bottomX, bottomY, bottomZ, normal);
    this.addNormal(bottomX, bottomY, bottomZ, leftX, leftY, leftZ, normal);
    this.addNormal(leftX, leftY, leftZ, topX, topY, topZ, normal);
  }

  /**
   * @param uX {float}
   * @param uY {float}
   * @param uZ {float}
   * @param vX {float}
   * @param vY {float}
   * @param vZ {float}
   * @param normal {[float, float, float]} the result
   */
  private addNormal(
    uX: float,
    uY: float,
    uZ: float,
    vX: float,
    vY: float,
    vZ: float,
    normal: [float, float, float]
  ) {
    normal[0] += uY * vZ - uZ * vY;
    normal[1] += uZ * vX - uX * vZ;
    normal[2] += uX * vY - uY * vX;
  }

  /**
   * Clear the field by filling it with a give value.
   * @param value {float}
   */
  clear(value = 0) {
    this.scalarField.clear(value);
  }

  /**
   * Cap the field between 2 values.
   * @param min {float}
   * @param max {float}
   */
  clamp(min: float, max: float) {
    this.scalarField.clamp(min, max);
  }

  /**
   * Apply an affine transformation on each field value.
   * @param a {float} factor
   * @param b {float} offset
   */
  transform(a: float, b: float) {
    this.scalarField.transform(a, b);
  }

  /**
   * Merge a disk in the field.
   * @param centerX {float} in terrain basis
   * @param centerY {float} in terrain basis
   * @param radius {float} in terrain basis
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
    this.scalarField.mergeDisk(
      this.coordConverter.convertToGridBasisX(centerX),
      this.coordConverter.convertToGridBasisY(centerY),
      this.coordConverter.convertToGridBasisDistance(radius),
      cappingRadiusRatio,
      operation
    );
  }

  /**
   * Merge a segment in the field.
   * @param startX {float} in terrain basis
   * @param startY {float} in terrain basis
   * @param endX {float} in terrain basis
   * @param endY {float} in terrain basis
   * @param thickness {float} in terrain basis
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
    this.scalarField.mergeSegment(
      this.coordConverter.convertToGridBasisX(startX),
      this.coordConverter.convertToGridBasisY(startY),
      this.coordConverter.convertToGridBasisX(endX),
      this.coordConverter.convertToGridBasisY(endY),
      this.coordConverter.convertToGridBasisDistance(thickness),
      cappingRadiusRatio,
      operation
    );
  }

  /**
   * Merge a hill in the field.
   * @param centerX {float} in terrain basis
   * @param centerY {float} in terrain basis
   * @param height {float}
   * @param radius {float} in terrain basis
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
    this.scalarField.mergeHill(
      this.coordConverter.convertToGridBasisX(centerX),
      this.coordConverter.convertToGridBasisY(centerY),
      height,
      this.coordConverter.convertToGridBasisDistance(radius),
      opacity,
      cappingRadiusRatio,
      operation
    );
  }

  /**
   * Flood an area from a given location until a maximum field value is reached.
   * @param originX {float} in terrain basis
   * @param originY {float} in terrain basis
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
    this.scalarField.fillFrom(
      this.coordConverter.convertToGridBasisX(originX),
      this.coordConverter.convertToGridBasisY(originY),
      valueMax,
      this.coordConverter.convertToGridBasisDistance(thickness),
      cappingRadiusRatio
    );
  }

  /**
   * Flood an area from a given location until a maximum field value is reached.
   * @param originX {float} in terrain basis
   * @param originY {float} in terrain basis
   * @param valueMax {float}
   * @param thickness {float}
   * @param cappingRadiusRatio {float} the radius where to stop the contour shading
   * @param isMinimum {boolean} when set to true, the threshold is a minimum
   * or a maximum otherwise.
   */
  unfillFrom(
    originX: float,
    originY: float,
    valueMax: float,
    thickness: float,
    cappingRadiusRatio: float
  ) {
    this.scalarField.unfillFrom(
      this.coordConverter.convertToGridBasisX(originX),
      this.coordConverter.convertToGridBasisY(originY),
      valueMax,
      this.coordConverter.convertToGridBasisDistance(thickness),
      cappingRadiusRatio
    );
  }
}
