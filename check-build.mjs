#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

console.log('\n========================================');
console.log('POST-BUILD DIAGNOSTIC CHECK');
console.log('========================================\n');

const distPublic = resolve(process.cwd(), 'dist/public');
const assetsDir = resolve(distPublic, 'assets');
const indexHtml = resolve(distPublic, 'index.html');

console.log('Checking dist/public directory...');
if (existsSync(distPublic)) {
  const files = readdirSync(distPublic);
  console.log(`✅ dist/public exists with ${files.length} items:`);
  files.forEach(f => console.log(`   - ${f}`));
} else {
  console.log('❌ dist/public does NOT exist');
}

console.log('\nChecking dist/public/assets directory...');
if (existsSync(assetsDir)) {
  const assets = readdirSync(assetsDir);
  console.log(`✅ assets folder exists with ${assets.length} files:`);
  assets.forEach(f => console.log(`   - ${f}`));
} else {
  console.log('❌ assets folder does NOT exist');
}

console.log('\nChecking index.html content...');
if (existsSync(indexHtml)) {
  const html = readFileSync(indexHtml, 'utf-8');
  const scriptMatch = html.match(/<script[^>]*src="([^"]+)"/);
  const cssMatch = html.match(/<link[^>]*href="([^"]+\.css)"/);
  
  console.log('✅ index.html exists');
  if (scriptMatch) {
    console.log(`   JS reference: ${scriptMatch[1]}`);
  }
  if (cssMatch) {
    console.log(`   CSS reference: ${cssMatch[1]}`);
  }
} else {
  console.log('❌ index.html does NOT exist');
}

console.log('\n========================================\n');
