import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icons/icon.svg');
const svgContent = readFileSync(svgPath, 'utf-8');

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: size },
  });
  const rendered = resvg.render();
  const pngBuffer = rendered.asPng();
  const outPath = resolve(__dirname, `../public/icons/icon-${size}.png`);
  writeFileSync(outPath, pngBuffer);
  console.log(`Generated icon-${size}.png (${pngBuffer.length} bytes)`);
}
console.log('All icons generated successfully!');
