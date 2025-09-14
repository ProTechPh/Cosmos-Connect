#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Cosmos Connect build process...');

/**
 * Build script for Cosmos Connect
 * This script performs basic build tasks for the static web application
 */

// Build configuration
const BUILD_CONFIG = {
  sourceDir: '.',
  buildDir: 'dist',
  excludePatterns: [
    'node_modules',
    '.git',
    'scripts',
    'dist',
    '.env',
    '*.log',
    'package-lock.json'
  ]
};

/**
 * Create build directory if it doesn't exist
 */
function createBuildDirectory() {
  if (!fs.existsSync(BUILD_CONFIG.buildDir)) {
    fs.mkdirSync(BUILD_CONFIG.buildDir, { recursive: true });
    console.log('✅ Created build directory');
  } else {
    console.log('📁 Build directory already exists');
  }
}

/**
 * Check if a file/directory should be excluded from build
 */
function shouldExclude(itemPath) {
  const itemName = path.basename(itemPath);
  return BUILD_CONFIG.excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(itemName);
    }
    return itemName === pattern || itemPath.includes(pattern);
  });
}

/**
 * Copy files recursively
 */
function copyFiles(src, dest) {
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (shouldExclude(srcPath)) {
      return;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

/**
 * Validate critical files exist
 */
function validateBuild() {
  const criticalFiles = [
    'index.html',
    'js/main.js',
    'js/api.js',
    'js/navigation.js',
    'css/main.css'
  ];
  
  const missingFiles = criticalFiles.filter(file => 
    !fs.existsSync(path.join(BUILD_CONFIG.buildDir, file))
  );
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing critical files in build:', missingFiles);
    process.exit(1);
  }
  
  console.log('✅ All critical files validated');
}

/**
 * Create production environment file
 */
function createProductionEnv() {
  const prodEnvPath = path.join(BUILD_CONFIG.buildDir, '.env.production');
  const envContent = `# Production environment variables
NODE_ENV=production
BUILD_TIMESTAMP=${new Date().toISOString()}
BUILD_VERSION=${process.env.npm_package_version || '1.0.0'}
`;
  
  fs.writeFileSync(prodEnvPath, envContent);
  console.log('✅ Created production environment file');
}

/**
 * Generate build info
 */
function generateBuildInfo() {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    build_env: 'production'
  };
  
  const buildInfoPath = path.join(BUILD_CONFIG.buildDir, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log('✅ Generated build info');
}

/**
 * Clean previous build
 */
function cleanBuild() {
  if (fs.existsSync(BUILD_CONFIG.buildDir)) {
    fs.rmSync(BUILD_CONFIG.buildDir, { recursive: true, force: true });
    console.log('🧹 Cleaned previous build');
  }
}

/**
 * Main build process
 */
async function build() {
  try {
    console.log('📦 Building Cosmos Connect for production...\n');
    
    // Clean previous build
    cleanBuild();
    
    // Create build directory
    createBuildDirectory();
    
    // Copy source files
    console.log('📂 Copying source files...');
    copyFiles(BUILD_CONFIG.sourceDir, BUILD_CONFIG.buildDir);
    console.log('✅ Source files copied');
    
    // Validate build
    validateBuild();
    
    // Create production environment
    createProductionEnv();
    
    // Generate build info
    generateBuildInfo();
    
    console.log('\n🎉 Build completed successfully!');
    console.log(`📁 Build output: ${BUILD_CONFIG.buildDir}/`);
    console.log('🚀 Ready for deployment');
    
    // Show build size
    const buildSize = getBuildSize(BUILD_CONFIG.buildDir);
    console.log(`📊 Build size: ${buildSize}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Get build directory size
 */
function getBuildSize(dir) {
  let size = 0;
  
  function getSize(dirPath) {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        getSize(itemPath);
      } else {
        size += stat.size;
      }
    });
  }
  
  getSize(dir);
  
  // Convert to human readable format
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Run build
if (require.main === module) {
  build();
}

module.exports = { build };