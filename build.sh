#!/bin/bash
set -ex  # Exit on error, print commands

echo "=== Starting Vite build ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "Checking if vite is available..."
which vite || echo "vite not in PATH, using npx"

# Run Vite build with explicit error handling
if command -v vite &> /dev/null; then
    vite build --logLevel info
else
    npx vite build --logLevel info
fi

echo "=== Vite build complete ==="
echo "Checking dist/public directory..."
ls -la dist/public/ || echo "dist/public not found!"
ls -la dist/public/assets/ || echo "assets directory not found!"

echo "=== Starting esbuild ==="
if command -v esbuild &> /dev/null; then
    esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
else
    npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
fi
echo "=== esbuild complete ==="

echo "=== Build complete ==="
