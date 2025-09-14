# Build Scripts

This directory contains build and optimization scripts for the Cosmos Connect project.

## Scripts

### `build.js`
Production build script that:
- Cleans previous builds
- Creates a `dist/` directory
- Copies all source files (excluding development files)
- Validates critical files exist
- Creates production environment file
- Generates build information
- Reports build size

**Usage:** `npm run build`

### `optimize.js`
Optimization script that:
- Minifies CSS files (22-23% size reduction)
- Optimizes HTML files (42-50% size reduction)
- Basic JavaScript optimization (comment removal)
- Creates an `optimized/` directory
- Generates optimization report with recommendations

**Usage:** `npm run optimize`

## Output Directories

- `dist/` - Production-ready build output
- `optimized/` - Optimized files with minification and compression

## Notes

- The build script excludes development files (node_modules, .git, scripts, etc.)
- Optimization focuses on safe transformations that don't break functionality
- Both scripts generate reports for tracking improvements
- For more aggressive JavaScript minification, consider using tools like Terser in your CI/CD pipeline