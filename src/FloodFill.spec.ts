import { float, integer } from "./CommonTypes";
import { ScalarField } from "./ScalarField";

// TODO Tests probably needs expected images to be readable.
describe("FloodFill", function () {
  const createScalarField = (values: float[][]): ScalarField => {
    const scalarField = new ScalarField(values[0].length, values.length);
    for (let y = 0; y < values.length; y++) {
      const row = values[y];
      for (let x = 0; x < row.length; x++) {
        scalarField.set(x, y, row[x]);
      }
    }
    return scalarField;
  };

  const extractValues = (scalarField: ScalarField): float[][] => {
    const values: float[][] = [];
    for (let y = 0; y < scalarField.dimY(); y++) {
      const row: float[] = [];
      for (let x = 0; x < scalarField.dimX(); x++) {
        row.push(scalarField.get(x, y));
      }
      values.push(row);
    }
    return values;
  };

  // This is not a representative case
  // because field are usually kind of continuous.
  it("can fill a square", function () {
    const scalarField = createScalarField([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);

    scalarField.fillFrom(4, 4, 1, 0, 1);

    const a = 1;
    expect(extractValues(scalarField)).to.eql([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, a, a, a, a, 1, 0],
      [0, 1, a, a, a, a, 1, 0],
      [0, 1, a, a, a, a, 1, 0],
      [0, 1, a, a, a, a, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });
});
