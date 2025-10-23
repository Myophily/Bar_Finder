# Kakao Map Bar Finder (술집 검색기)

A web application to search for bars and restaurants within a specified region using the Kakao Map API. The application automatically splits large areas into 1km×1km grid cells to overcome API pagination limits and provides comprehensive search results.

## Features

- **Interactive Map Interface**: Draw rectangles or polygons to define search regions
- **Intelligent Grid Splitting**: Automatically divides large areas into 1km×1km cells for comprehensive coverage
- **Smart Filtering**: Filters results for bar-related establishments (술집, 포차, 주점, 호프, etc.)
- **Comprehensive Results**: Collects all available data with automatic deduplication
- **Sortable Table**: Click column headers to sort results
- **Search Filter**: Filter displayed results by any field
- **CSV Export**: Download results with proper Korean character encoding (UTF-8 BOM)
- **Progress Tracking**: Real-time progress indicator during searches

## Prerequisites

Before running this application, you need:

1. **Kakao Developer Account**: Sign up at [Kakao Developers](https://developers.kakao.com/)
2. **Kakao API Keys**:
   - REST API Key (for Local API searches)
   - JavaScript API Key (for map display)

## Getting API Keys

### Step 1: Create a Kakao Developers Account
1. Go to [https://developers.kakao.com/](https://developers.kakao.com/)
2. Click "시작하기" (Get Started) and log in with your Kakao account
3. If you don't have a Kakao account, create one first

### Step 2: Register an Application
1. Go to "내 애플리케이션" (My Applications)
2. Click "애플리케이션 추가하기" (Add Application)
3. Fill in the application details:
   - App name (e.g., "Bar Finder")
   - Company name (optional)
4. Click "저장" (Save)

### Step 3: Get Your API Keys
1. After creating the app, you'll see your app dashboard
2. Click on your app to see details
3. Under "앱 키" (App Keys), you'll find:
   - **JavaScript 키** (JavaScript Key) - Copy this
   - **REST API 키** (REST API Key) - Copy this

### Step 4: Configure Platform Settings
1. Go to "플랫폼" (Platform) in the left menu
2. Click "Web 플랫폼 등록" (Register Web Platform)
3. Add your site URL:
   - For local testing: `http://localhost` or `http://127.0.0.1`
   - For production: Your actual domain
4. Click "저장" (Save)

## Installation & Setup

### 1. Clone or Download the Files

Make sure you have all the following files in your project directory:
```
place_search/
├── index.html
├── app.js
├── styles.css
├── config.js
└── README.md
```

### 2. Configure API Keys

Open `config.js` and replace the placeholder values with your actual API keys:

```javascript
const CONFIG = {
    // Replace with your Kakao REST API key
    KAKAO_REST_API_KEY: 'your_rest_api_key_here',

    // Replace with your Kakao JavaScript API key
    KAKAO_MAP_API_KEY: 'your_javascript_api_key_here',

    // ... other settings
};
```

### 3. Run the Application

Since this is a client-side web application, you can run it in several ways:

#### Option A: Using a Local Web Server (Recommended)

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js (http-server):**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open your browser and navigate to: `http://localhost:8000`

#### Option B: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option C: Direct File Access (May have limitations)

Simply double-click `index.html` to open it in your browser. Note: Some features may not work due to CORS restrictions.

## Usage Guide

### 1. Draw a Search Region

**Option 1: Rectangle**
- Click the "사각형 그리기" (Draw Rectangle) button
- Click and drag on the map to draw a rectangle
- The area will be highlighted in blue

**Option 2: Polygon**
- Click the "다각형 그리기" (Draw Polygon) button
- Click multiple points on the map to create a custom shape
- Double-click or click the starting point to complete the polygon

### 2. Review Region Information

After drawing, you'll see:
- Total area in km²
- Center coordinates
- Number of 1km×1km grid cells generated

### 3. Start Search

- Click the "검색 시작" (Start Search) button
- Watch the progress bar as each grid cell is searched
- The system will:
  - Search each 1km×1km grid cell
  - Collect all pages of results (up to 45 pages per cell)
  - Filter for bar-related establishments
  - Automatically deduplicate results

### 4. Review Results

Once complete:
- Results appear in a sortable table
- Click column headers to sort by that field
- Use the search box to filter results
- Total count is displayed in the green badge

### 5. Export to CSV

- Click "CSV 다운로드" (Download CSV) button
- File will be saved with Korean character support
- Opens correctly in Excel and Google Sheets

## Configuration Options

Edit `config.js` to customize:

### Grid Cell Size
```javascript
GRID_CELL_SIZE: 1000,  // Size in meters (default: 1km)
```

### Search Radius
```javascript
SEARCH_RADIUS: 707,  // Radius in meters (diagonal of 1km square / 2)
```

### Bar Keywords
Add or remove keywords to filter results:
```javascript
BAR_KEYWORDS: ['술집', '포차', '주점', '호프', '맥주', '선술집', '이자카야', 'BAR', 'bar', 'Bar']
```

### Default Map Settings
```javascript
DEFAULT_CENTER: {
    lat: 37.5665,  // Seoul City Hall
    lng: 126.9780
},
DEFAULT_LEVEL: 8  // Zoom level (1-14, lower = more zoomed in)
```

## Technical Details

### API Limitations

The Kakao Local API has the following limitations:
- Maximum 45 pages per search
- Maximum 15 results per page
- Maximum 675 total results per search query (45 × 15)

**Solution**: This application automatically splits large areas into 1km×1km grid cells and searches each cell independently, then combines and deduplicates the results.

### Grid Search Strategy

1. User draws a region (rectangle or polygon)
2. Calculate bounding box (southwest and northeast corners)
3. Divide into 1km×1km grid cells
4. For each cell:
   - Search from center point with 707m radius (covers entire cell)
   - Paginate through all results
   - Filter for bar-related establishments
5. Combine all results and remove duplicates by place ID
6. Display in sortable table

### Category Filtering

The app uses:
- Category code: `FD6` (Restaurants)
- Keyword filtering for bar-related terms in `category_name` and `place_name`

### Rate Limiting

To avoid API rate limits:
- 100ms delay between grid cells
- 50ms delay between pagination requests
- Requests are made sequentially, not in parallel

## Troubleshooting

### API Key Errors

**Error**: "Kakao Map API를 로드하는데 실패했습니다"

**Solutions**:
- Verify your JavaScript API key in `config.js`
- Check that your domain is registered in Kakao Developers platform settings
- Ensure `http://localhost` is added for local testing

### CORS Errors

**Error**: Cross-Origin Request Blocked

**Solutions**:
- Use a local web server (not direct file access)
- Ensure platform is registered in Kakao Developers console

### No Results Found

**Possible Causes**:
- Region doesn't contain any bar-related establishments
- Keywords don't match the category names
- API rate limiting (wait a few minutes and try again)

**Solutions**:
- Try a different region (e.g., entertainment districts)
- Adjust `BAR_KEYWORDS` in `config.js` to include more terms
- Make region smaller to reduce API calls

### Incomplete Results

**Issue**: Not all bars in the region are returned

**Explanation**:
- Each grid cell is limited to 675 results (API limitation)
- Dense areas may have more than 675 bars per 1km²

**Solution**:
- The app already uses optimal grid size (1km×1km)
- For extremely dense areas, manually divide into smaller regions

## File Structure

```
place_search/
├── index.html          # Main HTML structure
├── app.js             # Application logic
│   ├── Map initialization
│   ├── Drawing manager
│   ├── Grid generation
│   ├── API search with pagination
│   ├── Results rendering
│   └── CSV export
├── styles.css         # Styling and responsive design
├── config.js          # Configuration (API keys, settings)
└── README.md          # This file
```

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- IE11: ❌ Not supported (use modern browser)

## API Reference

### Kakao Local API
- Documentation: [https://developers.kakao.com/docs/latest/ko/local/dev-guide](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- Endpoint: `https://dapi.kakao.com/v2/local/search/category.json`

### Kakao Maps API
- Documentation: [https://apis.map.kakao.com/web/documentation/](https://apis.map.kakao.com/web/documentation/)
- Drawing Library: Used for region selection

## License

This project is provided as-is for educational and personal use. Make sure to comply with Kakao's API terms of service.

## Support

For issues related to:
- **Kakao API**: Contact [Kakao Developers Support](https://devtalk.kakao.com/)
- **This Application**: Check the troubleshooting section above

## Credits

- Maps powered by [Kakao Map](https://map.kakao.com/)
- Local data provided by [Kakao Local API](https://developers.kakao.com/)

---

**Happy searching! 🍺**
