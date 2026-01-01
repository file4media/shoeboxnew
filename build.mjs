#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

console.log('=== Starting Build Process ===');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);
console.log('');

try {
  // Step 1: Run Vite build
  console.log('=== Running Vite Build ===');
  execSync('npx vite build --logLevel info', { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  console.log('✅ Vite build complete');
  console.log('');

  // Step 2: Verify dist/public exists
  const distPublic = resolve(process.cwd(), 'dist/public');
  if (!existsSync(distPublic)) {
    throw new Error(`dist/public directory not found at ${distPublic}`);
  }
  console.log(`✅ dist/public exists at: ${distPublic}`);

  // Step 3: List generated assets
  const assetsDir = resolve(distPublic, 'assets');
  if (existsSync(assetsDir)) {
    const assets = readdirSync(assetsDir);
    console.log(`✅ Generated ${assets.length} asset files:`);
    assets.forEach(file => console.log(`   - ${file}`));
  }
  console.log('');

  // Step 4: Run esbuild for server
  console.log('=== Running esbuild ===');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit'
  });
  console.log('✅ esbuild complete');
  console.log('');

  console.log('=== Build Complete ===');
  
  // Final verification - list all files that will be deployed
  console.log('\n=== FINAL FILE LISTING ===');
  console.log('Files in dist/public:');
  if (existsSync(distPublic)) {
    const publicFiles = readdirSync(distPublic);
    publicFiles.forEach(file => console.log(`  ${file}`));
  }
  console.log('\nFiles in dist/public/assets:');
  if (existsSync(assetsDir)) {
    const assetFiles = readdirSync(assetsDir);
    assetFiles.forEach(file => console.log(`  ${file}`));
  }
  console.log('\nFiles in dist (root):');
  const distRoot = resolve(process.cwd(), 'dist');
  if (existsSync(distRoot)) {
    const distFiles = readdirSync(distRoot);
    distFiles.forEach(file => console.log(`  ${file}`));
  }
  console.log('=========================\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:');
  console.error(error.message);
  if (error.stdout) console.error('stdout:', error.stdout.toString());
  if (error.stderr) console.error('stderr:', error.stderr.toString());
  process.exit(1);
}
