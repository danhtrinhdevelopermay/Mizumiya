#!/usr/bin/env node

import { spawn } from 'child_process';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';

// Function to copy directory recursively
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  try {
    console.log('🏗️ Building client with Vite...');
    await runCommand('vite build');

    console.log('📦 Building server with esbuild...');
    await runCommand('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');

    console.log('📁 Copying build files to correct location...');
    // Copy built client files from dist/public to server/public for production serving
    copyDir('./dist/public', './server/public');

    console.log('✅ Build completed successfully!');
    console.log('📄 Client files copied to server/public for production serving');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();