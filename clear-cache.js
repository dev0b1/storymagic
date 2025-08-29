#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Vite cache...');

// Clear Vite cache directories
const cacheDirectories = [
  'node_modules/.vite',
  '.vite',
  'client/.vite',
  'dist'
];

cacheDirectories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('✅ Vite cache cleared!');
console.log('💡 Now run: npm run dev');
