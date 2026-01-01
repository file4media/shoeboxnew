#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
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
let html = '';
if (existsSync(indexHtml)) {
  html = readFileSync(indexHtml, 'utf-8');
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

// Check actual content of generated JS file
console.log('\nChecking generated JS file content...');
if (existsSync(assetsDir)) {
  const assets = readdirSync(assetsDir);
  const jsFile = assets.find(f => f.endsWith('.js'));
  if (jsFile) {
    const jsPath = resolve(assetsDir, jsFile);
    const jsContent = readFileSync(jsPath, 'utf-8');
    const first200 = jsContent.substring(0, 200);
    console.log(`✅ JS file: ${jsFile}`);
    console.log(`   Size: ${jsContent.length} bytes`);
    console.log(`   First 200 chars: ${first200}`);
    
    // Check if it looks like compiled code or source
    if (jsContent.includes('import React') || jsContent.includes('from "react"')) {
      console.log('   ⚠️  WARNING: File contains React imports - looks like SOURCE CODE!');
    } else if (first200.includes('function') && first200.length < 100) {
      console.log('   ⚠️  WARNING: File looks like unminified source!');
    } else {
      console.log('   ✅ File appears to be compiled/minified');
    }
  }
}

console.log('\n========================================\n');

// Write diagnostic info to file for server to read
const diagnosticData = {
  timestamp: new Date().toISOString(),
  distPublicExists: existsSync(distPublic),
  publicFiles: existsSync(distPublic) ? readdirSync(distPublic) : [],
  assetsExists: existsSync(assetsDir),
  assetFiles: existsSync(assetsDir) ? readdirSync(assetsDir) : [],
  indexHtmlExists: existsSync(indexHtml),
  indexHtmlReferences: existsSync(indexHtml) ? {
    js: html.match(/<script[^>]*src="([^"]+)"/)?.[1],
    css: html.match(/<link[^>]*href="([^"]+\.css)"/)?.[1]
  } : null
};

const diagnosticFile = resolve(process.cwd(), 'dist/build-diagnostic.json');
writeFileSync(diagnosticFile, JSON.stringify(diagnosticData, null, 2));
console.log(`✅ Diagnostic info written to ${diagnosticFile}`);
console.log('\n========================================\n');
