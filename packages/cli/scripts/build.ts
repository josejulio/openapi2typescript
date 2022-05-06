import { build } from 'esbuild';
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp';

build({
    plugins: [pnpPlugin()],
    platform: 'node',
    bundle: true,
    entryPoints: ['src/main.ts'],
    external: [ 'espree' ],
    minify: true,
    format: 'cjs',
    target: 'node14.0',
    sourcemap: true,
    outfile: 'dist/main.js',
}).catch((e) => {
    console.log('Build not successful', e.message);
    process.exit(1);
});
