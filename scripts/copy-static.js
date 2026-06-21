import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

// manifest.json
copyRecursive(join(root, 'public', 'manifest.json'), join(dist, 'manifest.json'));

// icons
copyRecursive(join(root, 'public', 'icons'), join(dist, 'icons'));

// content.css (injected via content_scripts css array, not bundled by vite)
copyRecursive(join(root, 'src', 'content', 'content.css'), join(dist, 'content', 'content.css'));

console.log('Static assets copied to dist/');
