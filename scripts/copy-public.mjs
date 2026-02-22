// Copy public/ assets into dist/<target>/ after WXT build
import { cpSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = resolve(fileURLToPath(import.meta.url), '../..');
const publicDir = join(rootDir, 'public');
const distDir = join(rootDir, 'dist');

if (!existsSync(publicDir)) {
  console.log('[copy-public] No public/ directory found, skipping.');
  process.exit(0);
}

// Determine target from CLI arg, or copy to all built targets
const targetArg = process.argv[2];

if (targetArg) {
  const dest = join(distDir, targetArg);
  if (existsSync(dest)) {
    cpSync(publicDir, dest, { recursive: true });
    console.log(`[copy-public] Copied public/ → dist/${targetArg}/`);
  }
} else {
  // Auto-detect all built targets
  if (!existsSync(distDir)) {
    console.log('[copy-public] dist/ not found, skipping.');
    process.exit(0);
  }
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const dest = join(distDir, entry.name);
      cpSync(publicDir, dest, { recursive: true });
      console.log(`[copy-public] Copied public/ → dist/${entry.name}/`);
    }
  }
}
