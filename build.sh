#!/bin/bash
set -e

echo "=== Starting Vite build ==="
vite build
echo "=== Vite build complete ==="

echo "=== Starting esbuild ==="
esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "=== esbuild complete ==="

echo "=== Build complete ==="
