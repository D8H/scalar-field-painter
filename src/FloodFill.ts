import { integer, float } from "./CommonTypes";
import { ScalarField } from "./ScalarField";
import { Stock } from "./Stock";

const deltas = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

type Node = { x: integer; y: integer };
type ContourNode = {
  x: integer;
  y: integer;
  originX: float;
  originY: float;
  value: float;
};

const createNode = () => ({ x: 0, y: 0 });
const createContourNode = () => ({
  x: 0,
  y: 0,
  originX: 0,
  originY: 0,
  value: 0,
});

export type GetContourValue = (
  fieldValue: float,
  distanceSq: float
) => number | null;

/**
 *
 */
export class FloodFill {
  scalarField: ScalarField;

  private floodStack: Array<Node> = [];
  private nodeStock: Stock<Node> = new Stock<Node>();

  private contourStack: Array<ContourNode> = [];
  private nextContourStack: Array<ContourNode> = [];
  private contourNodeStock: Stock<ContourNode> = new Stock<ContourNode>();

  constructor(scalarField: ScalarField) {
    this.scalarField = scalarField;
  }

  /**
   * Fill an area from a given location until a maximum field value is reached.
   *
   * The result is the same as drawing circles at every point of the area.
   * This mean that the area will be filled with a value a lot gibber than 1.
   *
   * @param originX {float} in grid basis
   * @param originY {float} in grid basis
   * @param valueMax {float} the value where to stop the flooding
   * @param thickness {float} the thickness of the contour shading.
   * The field will have the value 1 at this given distance from the area.
   * @param cappingRadiusRatio {float} the radius where to stop the contour shading
   * or a maximum otherwise.
   */
  fillFrom(
    originX: float,
    originY: float,
    valueMax: float,
    thickness: float,
    cappingRadiusRatio: float
  ) {
    const thicknessSq = thickness * thickness;
    const fillingValue = Math.max(valueMax, thicknessSq * 1024 * 1024);
    const cappingRadius = cappingRadiusRatio * thickness;
    const cappingRadiusSq = cappingRadius * cappingRadius;

    const getContourValue: GetContourValue = (fieldValue, distanceSq) => {
      const value = thicknessSq / distanceSq;
      return fieldValue < value && distanceSq < cappingRadiusSq ? value : null;
    };

    this.floodFrom(
      originX,
      originY,
      (fieldValue) => fieldValue < valueMax,
      fillingValue,
      getContourValue
    );

    this.shadeContour(getContourValue);
  }

  /**
   * Unfill an area from a given location until a minimum field value is reached.
   *
   * It fills the area with the value 0.
   *
   * @param originX {float} in grid basis
   * @param originY {float} in grid basis
   * @param valueMax {float} the value where to stop the flooding
   * @param thickness {float} the thickness of the contour shading.
   * The field will have the value 1 at this given distance from the area.
   * @param cappingRadiusRatio {float} the radius where to stop the contour shading
   * or a maximum otherwise.
   */
  unfillFrom(
    originX: float,
    originY: float,
    valueMin: float,
    thickness: float,
    cappingRadiusRatio: float
  ) {
    const fillingValue = 0;
    const thicknessSq = thickness * thickness;
    const cappingRadius = cappingRadiusRatio * thickness;
    const cappingRadiusSq = cappingRadius * cappingRadius;

    const getContourValue: GetContourValue = (fieldValue, distanceSq) => {
      const value = distanceSq / thicknessSq;
      return fieldValue > value && distanceSq < cappingRadiusSq ? value : null;
    };

    this.floodFrom(
      originX,
      originY,
      (fieldValue) => fieldValue > valueMin,
      fillingValue,
      getContourValue
    );

    this.shadeContour(getContourValue);
  }

  /**
   * Flood an area from a given location until a condition is reached.
   * @param originX {float} in grid basis
   * @param originY {float} in grid basis
   * @param canFlood {(float) => boolean}
   * @param fillingValue {float}
   * @param getContourValue {(number, number) => number}
   * or a maximum otherwise.
   */
  private floodFrom(
    originX: float,
    originY: float,
    canFlood: (fieldValue: float) => boolean,
    fillingValue: float,
    getContourValue: GetContourValue
  ) {
    const scalarField = this.scalarField;

    // They should already be empty at this point.
    this.floodStack.length = 0;
    this.contourStack.length = 0;
    this.nextContourStack.length = 0;

    {
      const x = Math.round(originX);
      const y = Math.round(originY);
      if (!scalarField.isInside(x, y)) {
        return;
      }
      const fieldValue = scalarField.get(x, y);
      if (canFlood(fieldValue)) {
        const node = this.nodeStock.getOrCreate(createNode);
        node.x = x;
        node.y = y;
        this.floodStack.push(node);
      }
    }

    while (this.floodStack.length > 0) {
      const node = this.floodStack.pop();
      const x = node.x;
      const y = node.y;
      scalarField.set(x, y, fillingValue);
      for (const delta of deltas) {
        const neighborX = x + delta.x;
        const neighborY = y + delta.y;
        if (!scalarField.isInside(neighborX, neighborY)) {
          continue;
        }
        const fieldValue = scalarField.get(neighborX, neighborY);
        if (canFlood(fieldValue)) {
          const neighbor = this.nodeStock.getOrCreate(createNode);
          neighbor.x = neighborX;
          neighbor.y = neighborY;
          this.floodStack.push(neighbor);
        } else {
          this.checkAnAddContourNode(
            neighborX,
            neighborY,
            x,
            y,
            getContourValue
          );
        }
      }
      this.nodeStock.stock(node);
    }
  }

  /**
   * Shade the contour to keep the field somewhat continuous.
   * @param getContourValue
   */
  private shadeContour(getContourValue: GetContourValue) {
    const scalarField = this.scalarField;

    const swap = this.nextContourStack;
    this.nextContourStack = this.contourStack;
    this.contourStack = swap;

    while (this.contourStack.length > 0) {
      while (this.contourStack.length > 0) {
        const node = this.contourStack.pop();

        if (scalarField.get(node.x, node.y) > node.value) {
          // This node wasn't the nearest one.
          continue;
        }
        for (const delta of deltas) {
          const neighborX = node.x + delta.x;
          const neighborY = node.y + delta.y;
          this.checkAnAddContourNode(
            neighborX,
            neighborY,
            node.originX,
            node.originY,
            getContourValue
          );
        }
        this.contourNodeStock.stock(node);
      }
      const swap = this.nextContourStack;
      this.nextContourStack = this.contourStack;
      this.contourStack = swap;
    }
  }

  private checkAnAddContourNode(
    nodeX: float,
    nodeY: float,
    originX: float,
    originY: float,
    getContourValue: GetContourValue
  ): void {
    const scalarField = this.scalarField;
    if (!scalarField.isInside(nodeX, nodeY)) {
      return;
    }
    // Avoid too big values
    const minDistanceSq = 1 / 1024 / 1024;

    const deltaX = nodeX - originX;
    const deltaY = nodeY - originY;
    const distanceSq = Math.max(
      minDistanceSq,
      deltaX * deltaX + deltaY * deltaY
    );
    const value = getContourValue(scalarField.get(nodeX, nodeY), distanceSq);
    if (value !== null) {
      scalarField.set(nodeX, nodeY, value);
      const newNode = this.contourNodeStock.getOrCreate(createContourNode);
      newNode.x = nodeX;
      newNode.y = nodeY;
      newNode.originX = originX;
      newNode.originY = originY;
      newNode.value = value;
      this.nextContourStack.push(newNode);
    }
  }
}
