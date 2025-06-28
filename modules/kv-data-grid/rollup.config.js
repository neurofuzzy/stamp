import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/kv-datagrid.js',
      format: 'umd',
      name: 'KVDataGrid',      // Global variable name
      sourcemap: true
    },
    {
      file: 'dist/kv-datagrid.esm.js', 
      format: 'es',            // For modern bundlers
      sourcemap: true
    }
  ],
  plugins: [
    typescript(),
    terser()                   // Minification
  ]
}; 