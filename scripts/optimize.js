#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('⚡ Starting Cosmos Connect optimization process...');

/**
 * Optimization script for Cosmos Connect
 * This script performs various optimizations for better performance
 */

// Optimization configuration
const OPTIMIZE_CONFIG = {
  sourceDir: '.',
  outputDir: 'optimized',
  cssMinify: true,
  jsMinify: false, // Basic minification only
  removeComments: true,
  compressImages: false // Would require additional dependencies
};

/**
 * Basic CSS minification
 */
function minifyCSS(cssContent) {
  return cssContent
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around specific characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Basic JavaScript optimization (remove comments and extra whitespace)
 */
function optimizeJS(jsContent) {
  return jsContent
    // Remove single-line comments (but preserve URLs)
    .replace(/^(\s*)(\/\/(?!:\/\/).*)$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace (but preserve strings)
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Optimize HTML (remove comments and extra whitespace)
 */
function optimizeHTML(htmlContent) {
  return htmlContent
    // Remove HTML comments (except IE conditionals)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Remove extra whitespace between tags
    .replace(/>\s+</g, '><')
    // Remove leading/trailing whitespace on lines
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

/**
 * Create optimized directory
 */
function createOptimizedDirectory() {
  if (!fs.existsSync(OPTIMIZE_CONFIG.outputDir)) {
    fs.mkdirSync(OPTIMIZE_CONFIG.outputDir, { recursive: true });
    console.log('✅ Created optimized directory');
  }
}

/**
 * Process and optimize files
 */
function optimizeFiles(src, dest) {
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    // Skip certain directories and files
    if (item === 'node_modules' || item === '.git' || item === 'optimized' || item === 'dist') {
      return;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      optimizeFiles(srcPath, destPath);
    } else {
      const ext = path.extname(item).toLowerCase();
      let content = fs.readFileSync(srcPath, 'utf8');
      let optimized = false;
      
      // Optimize based on file type
      switch (ext) {
        case '.css':
          if (OPTIMIZE_CONFIG.cssMinify) {
            content = minifyCSS(content);
            optimized = true;
          }
          break;
        case '.js':
          if (OPTIMIZE_CONFIG.jsMinify) {
            content = optimizeJS(content);
            optimized = true;
          }
          break;
        case '.html':
          content = optimizeHTML(content);
          optimized = true;
          break;
        default:
          // Copy file as-is for other types
          fs.copyFileSync(srcPath, destPath);
          return;
      }
      
      fs.writeFileSync(destPath, content);
      
      if (optimized) {
        const originalSize = fs.statSync(srcPath).size;
        const optimizedSize = fs.statSync(destPath).size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`✅ Optimized ${item}: ${originalSize} → ${optimizedSize} bytes (${savings}% savings)`);
      }
    }
  });
}

/**
 * Generate optimization report
 */
function generateOptimizationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    optimizations: {
      css_minified: OPTIMIZE_CONFIG.cssMinify,
      js_optimized: OPTIMIZE_CONFIG.jsMinify,
      html_optimized: true,
      comments_removed: OPTIMIZE_CONFIG.removeComments
    },
    recommendations: [
      'Consider using a CDN for faster asset delivery',
      'Enable gzip compression on your web server',
      'Implement proper caching headers',
      'Consider using WebP images for better compression',
      'Minify JavaScript in production with a proper tool like Terser'
    ]
  };
  
  const reportPath = path.join(OPTIMIZE_CONFIG.outputDir, 'optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('✅ Generated optimization report');
}

/**
 * Clean previous optimization
 */
function cleanOptimized() {
  if (fs.existsSync(OPTIMIZE_CONFIG.outputDir)) {
    fs.rmSync(OPTIMIZE_CONFIG.outputDir, { recursive: true, force: true });
    console.log('🧹 Cleaned previous optimization');
  }
}

/**
 * Main optimization process
 */
async function optimize() {
  try {
    console.log('⚡ Optimizing Cosmos Connect for better performance...\n');
    
    // Clean previous optimization
    cleanOptimized();
    
    // Create optimized directory
    createOptimizedDirectory();
    
    // Optimize files
    console.log('🔧 Processing and optimizing files...');
    optimizeFiles(OPTIMIZE_CONFIG.sourceDir, OPTIMIZE_CONFIG.outputDir);
    
    // Generate report
    generateOptimizationReport();
    
    console.log('\n🎉 Optimization completed successfully!');
    console.log(`📁 Optimized output: ${OPTIMIZE_CONFIG.outputDir}/`);
    console.log('💡 Check optimization-report.json for recommendations');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Run optimization
if (require.main === module) {
  optimize();
}

module.exports = { optimize };