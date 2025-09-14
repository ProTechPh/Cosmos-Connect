# Cosmos Connect 🚀

A beautiful, responsive web application that provides clean access to NASA's vast collection of space data and imagery through an intuitive glass morphism interface.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge&logo=vercel)](https://cosmos-connect.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/ProTechPh/Cosmos-Connect?style=for-the-badge&logo=github)](https://github.com/ProTechPh/Cosmos-Connect)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![NASA API](https://img.shields.io/badge/NASA-API-red?style=for-the-badge&logo=nasa)](https://api.nasa.gov/)

![Cosmos Connect](https://raw.githubusercontent.com/ProTechPh/Cosmos-Connect/main/assets/images/preview.png)

## 🌌 Live Demo

Experience Cosmos Connect live: **[cosmos-connect.vercel.app](https://cosmos-connect.vercel.app)**

*No installation required - works directly in your browser!*

## 🎆 What Makes It Special

- **🌌 Universal Access**: No account required, works on any modern device
- **📱 Mobile First**: Optimized touch interface with responsive design
- **⚡ Lightning Fast**: Advanced caching and optimization techniques
- **🌙 Works Offline**: Full functionality with cached NASA data
- **🎨 Beautiful UI**: Glass morphism design with smooth animations
- **🔍 Smart Search**: AI-powered search across all NASA datasets
- **🛫 Space Data**: 6+ NASA APIs integrated seamlessly

## ✨ Features

### 🌌 NASA API Integrations
- **APOD (Astronomy Picture of the Day)**: Browse stunning cosmic imagery with detailed explanations
- **Mars Weather**: Real-time weather reports from NASA's InSight Mars lander
- **Near Earth Objects**: Track asteroids and comets approaching Earth
- **Space Weather**: Monitor solar flares, geomagnetic storms, and CME events
- **Mars Rover Photos**: Browse photos from Curiosity, Perseverance, Opportunity, and Spirit
- **Exoplanets**: Explore NASA's database of confirmed exoplanets

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Modern glass-like interface with backdrop blur effects
- **NASA-Inspired Theme**: Space-themed color palette with cosmic gradients
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Dark Theme**: Optimized for comfortable viewing in low-light environments

### 🔍 Advanced Features
- **Global Search**: Search across all NASA data types with intelligent suggestions and filters
- **Smart Caching**: Local storage with TTL, priorities, compression, and automatic cleanup
- **Offline Support**: Full functionality with cached data when internet is unavailable
- **User Preferences**: Persistent settings for themes, units, favorites, search history
- **Performance Optimized**: 
  - Lazy loading for images and content
  - API request throttling and queuing
  - Efficient data structures and algorithms
  - Bundle size optimization
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Progressive Enhancement**: Core functionality works without JavaScript

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- NASA API key (optional but recommended for higher rate limits)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ProTechPh/Cosmos-Connect.git
   cd Cosmos-Connect
   ```

2. **Install dependencies (Optional for development)**
   ```bash
   npm install
   ```

3. **Configure NASA API Key (Recommended)**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env and add your NASA API key
   VITE_NASA_API_KEY=your_nasa_api_key_here
   ```

4. **Start the development server**
   
   **Option A: Using npm (Recommended)**
   ```bash
   npm start
   # or for development with hot reload
   npm run dev
   ```
   
   **Option B: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   
   **Option C: Using Node.js serve**
   ```bash
   npx serve -s . -l 8000
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📋 NASA API Setup

1. **Get a NASA API Key (Recommended)**
   - Visit [NASA API Portal](https://api.nasa.gov/)
   - Sign up for a free API key (no cost, instant approval)
   - **Benefits**: 
     - Rate limits: 1,000 requests per hour (vs 30 for demo key)
     - More reliable service
     - Priority support
   - **Usage**: Add to `.env` file as `VITE_NASA_API_KEY=your_key`

2. **Configure the Application**
   ```bash
   # Create and edit your .env file
   cp .env.example .env
   
   # Update the NASA API key in .env
   VITE_NASA_API_KEY=YOUR_API_KEY_HERE
   ```
   
   **Alternative: Direct Configuration**
   ```javascript
   // Update js/config.js if not using .env
   const CONFIG = {
     NASA_API_KEY: 'YOUR_API_KEY_HERE',
     // ... other configuration
   };
   ```

## 🏗️ Project Structure

```
cosmos-connect/
├── index.html              # Main homepage
├── package.json            # Project configuration and scripts
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── .htaccess              # Apache server configuration
├── NASA_API_Endpoints.md   # NASA API documentation
├── css/
│   ├── main.css            # Core styles and theme
│   └── components.css      # Component-specific styles
├── js/
│   ├── api.js              # NASA API service layer
│   ├── caching.js          # Advanced caching system
│   ├── config.js           # Application configuration
│   ├── navigation.js       # Navigation and UI management
│   ├── search.js           # Global search functionality
│   ├── utils.js            # Utility functions
│   ├── main.js             # Homepage functionality
│   ├── apod.js             # APOD page functionality
│   ├── mars-weather.js     # Mars weather functionality
│   ├── asteroids.js        # Asteroid tracking
│   ├── space-weather.js    # Space weather monitoring
│   ├── mars-rovers.js      # Mars rover photos
│   └── exoplanets.js       # Exoplanet explorer
├── pages/
│   ├── apod.html           # Astronomy Picture of the Day
│   ├── mars-weather.html   # Mars Weather Dashboard
│   ├── asteroids.html      # Near Earth Objects Tracker
│   ├── space-weather.html  # Space Weather Monitor
│   ├── mars-rovers.html    # Mars Rover Photo Browser
│   ├── exoplanets.html     # Exoplanet Database Explorer
│   └── about.html          # About page
└── assets/
    ├── images/             # Static images and screenshots
    └── icons/              # Application icons
```

## 🛠️ Development

### Available Scripts
The project includes various npm scripts for development and deployment:

```bash
# Development
npm start          # Start production server on port 8000
npm run dev        # Start development server on port 3000

# Code Quality
npm run lint       # Lint JavaScript files
npm run format     # Format code with Prettier
npm run validate   # Validate HTML files
npm test           # Run all tests (lint + validate)

# Deployment
npm run deploy:netlify   # Deploy to Netlify
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:surge     # Deploy to Surge.sh

# Performance
npm run lighthouse       # Run Lighthouse audit
npm run optimize        # Optimize assets
npm run analyze         # Analyze bundle size
```

### Code Style
- **JavaScript**: ES6+ features, modular architecture
- **CSS**: CSS Custom Properties, mobile-first responsive design
- **HTML**: Semantic HTML5, accessibility best practices

### Key Technologies
- **Frontend**: Vanilla JavaScript (ES6+), Bootstrap 5, Chart.js
- **APIs**: NASA Open Data APIs (APOD, InSight, DONKI, Mars Rovers, Exoplanet Archive)
- **Storage**: LocalStorage with advanced caching and TTL
- **Design**: Glass Morphism, CSS Grid, Flexbox, CSS Custom Properties
- **Build Tools**: Node.js, npm, Prettier, ESLint, HTML Validator
- **Icons**: Bootstrap Icons, Font Awesome

### Performance Optimization
- **Lazy Loading**: Images and content loaded on demand
- **Caching**: Intelligent API response caching with TTL
- **Compression**: Optimized assets and efficient data structures
- **Rate Limiting**: Built-in API throttling and request queuing

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 80+     | ✅ Full Support |
| Firefox | 75+     | ✅ Full Support |
| Safari  | 13+     | ✅ Full Support |
| Edge    | 80+     | ✅ Full Support |
| Opera   | 67+     | ✅ Full Support |

### Required Features
- CSS Grid and Flexbox
- CSS Custom Properties
- Fetch API
- ES6 Modules
- Backdrop Filter (for glass morphism)

## 🚀 Deployment

### GitHub Pages
```bash
# Build and deploy to GitHub Pages
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Netlify
```bash
# Deploy to Netlify using npm script
npm run deploy:netlify
```

### Vercel
```bash
# Deploy to Vercel using npm script
npm run deploy:vercel
```

### Surge.sh
```bash
# Deploy to Surge.sh using npm script
npm run deploy:surge
```

### Traditional Hosting
1. Upload all files to your web server
2. Ensure the server serves `.html` files for clean URLs
3. Configure HTTPS (required for some browser features)

## 🔧 Configuration

### Environment Variables
The application uses environment variables for configuration. Copy `.env.example` to `.env` and customize:

```bash
# NASA API Configuration
VITE_NASA_API_KEY=your_nasa_api_key_here
VITE_API_BASE_URL=https://api.nasa.gov

# Cache Duration (in minutes)
VITE_CACHE_DURATION_APOD=60
VITE_CACHE_DURATION_MARS_WEATHER=30
VITE_CACHE_DURATION_ASTEROIDS=180
VITE_CACHE_DURATION_SPACE_WEATHER=15

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ADVANCED_SEARCH=true
VITE_ENABLE_USER_PREFERENCES=true
```

### Application Configuration
```javascript
// js/config.js - Main configuration file
const CONFIG = {
  NASA_API_KEY: import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.nasa.gov',
  // ... other configuration loaded from environment
};
```

### Customization
- **Theme Colors**: Modify CSS custom properties in `css/main.css`
- **API Endpoints**: Update `js/api.js` configuration
- **Cache Settings**: Adjust cache durations in `js/caching.js`
- **Features**: Enable/disable features in configuration

## 📊 Analytics & Monitoring

### Performance Monitoring
```javascript
// Add to main.js for performance tracking
performance.mark('app-start');
// ... application code
performance.mark('app-ready');
performance.measure('app-load-time', 'app-start', 'app-ready');
```

### Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Application Error:', event.error);
  // Send to your error tracking service
});
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contributing Guidelines
- **Code Style**: Follow existing patterns and use Prettier for formatting
- **Testing**: Test on multiple browsers and devices before submitting
- **Documentation**: Update README and add inline comments for complex features
- **Accessibility**: Ensure all new features meet WCAG 2.1 AA standards
- **Performance**: Monitor Lighthouse scores and maintain > 90 performance score
- **API Usage**: Implement proper error handling and fallbacks for NASA APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA** for providing free access to their amazing APIs
- **Bootstrap** for the responsive grid system and components
- **Chart.js** for beautiful data visualizations
- **Bootstrap Icons** for the comprehensive icon set
- **Font Awesome** for additional iconography
- **Open source community** for tools and inspiration

## 📞 Support

### Troubleshooting

**Common Issues:**

1. **API Rate Limiting**
   - **Issue**: "Too many requests" error
   - **Solution**: Get a NASA API key for higher rate limits (1000/hour vs 30/hour)
   - **Quick Fix**: Wait an hour for rate limit reset

2. **CORS Errors**
   - **Issue**: Cannot fetch data from NASA APIs
   - **Solution**: Serve the app from a local server (not file://)
   - **Commands**: Use `npm start` or `python -m http.server`

3. **Images Not Loading**
   - **Issue**: NASA images fail to load
   - **Solution**: Check network connection and NASA API status
   - **Fallback**: App will show placeholder images

4. **Caching Issues**
   - **Issue**: Old data still showing
   - **Solution**: Clear browser cache or localStorage
   - **Command**: Open DevTools > Application > Storage > Clear

**Getting Help:**
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on [GitHub Issues](https://github.com/ProTechPh/Cosmos-Connect/issues)
- **NASA API Help**: Visit [NASA API Documentation](https://api.nasa.gov/)
- **Community**: Join discussions in [GitHub Discussions](https://github.com/ProTechPh/Cosmos-Connect/discussions)

## 🌟 Show Your Support

If you like this project, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing to the codebase

---

**Made with ❤️ and ☕ for space enthusiasts everywhere** 🌌