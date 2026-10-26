// Builds dist/configurator.js: one minified script (CSS included) for a
// <script> tag in Webflow. `--watch` rebuilds on change.
import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const options = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/configurator.js',
  bundle: true,
  format: 'iife',
  target: ['es2020', 'safari15'],
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  loader: { '.css': 'text' },
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: { js: `/*! Tornante Configurator for Webflow v${pkg.version} */` },
  logLevel: 'info',
};
if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
