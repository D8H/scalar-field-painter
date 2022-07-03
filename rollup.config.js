//import pkg from "./package.json";
import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
//import commonjs from '@rollup/plugin-commonjs';

export default [
  //To try without plugin-typescript
  {
  	input: './src/index.ts',
  	output: [{
  		name: 'ScalarFieldPainter',
  		format: 'umd',
  		file: './dist/ScalarFieldPainter.js',
  		sourcemap: true,
  	},
    {
      name: 'ScalarFieldPainter',
      format: 'umd',
      file: './dist/ScalarFieldPainter.min.js',
  		sourcemap: true,
      plugins: [terser()]
    },
    ],
  	external: [],
    plugins: [
      resolve({
          extensions: ['.js'],
      }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  {
    input: './dist/dts/index.d.ts',
    output:{
  		name: 'ScalarFieldPainter',
      format: 'umd',
      file: "./dist/ScalarFieldPainter.d.ts",
    },
    plugins: [dts()]
  }
];
