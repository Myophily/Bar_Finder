# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **client-side web application** that uses the Kakao Map API to search for bars and restaurants within user-defined regions. The app overcomes Kakao API pagination limits (max 675 results per query) by automatically dividing large search areas into 1km×1km grid cells and aggregating results.

**Tech Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Kakao Maps API, Kakao Local API

## Running the Application

### Development Server

Use any local web server. Common options:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in browser.

### API Keys Configuration

**IMPORTANT**: Before first run, update `config.js` with valid Kakao API keys:
- `KAKAO_REST_API_KEY`: For Local API searches
- `KAKAO_MAP_API_KEY`: For map display

Get keys at: https://developers.kakao.com/console/app

## Architecture

### File Structure

```
place_search/
├── index.html          # UI structure and layout
├── app.js             # Core application logic
├── config.js          # API keys and configuration
├── styles.css         # Styling
└── README.md          # User documentation
```

### Core Application Flow (app.js)

The application follows this sequence:

1. **Initialization** (`loadKakaoMapScript` → `initializeMap`)
   - Dynamically loads Kakao Maps SDK with drawing and services libraries
   - Initializes map centered on Seoul (configurable in `CONFIG.DEFAULT_CENTER`)
   - Sets up drawing manager for user region selection

2. **Region Selection** (`initializeDrawingManager` → `onRegionDrawn`)
   - User draws rectangle or polygon on map
   - App calculates bounding box (southwest/northeast corners)
   - Generates 1km×1km grid cells covering the entire region
   - **Key calculation**: Grid cells use lat/lng degree approximations (1° lat ≈ 111km, 1° lng varies by latitude)

3. **Grid-Based Search** (`startSearch` → `searchGridCell`)
   - Iterates through each grid cell sequentially
   - For each cell: searches from center point with 707m radius (covers entire 1km×1km cell)
   - Paginates through API results (up to 45 pages × 15 results per cell)
   - Filters results by checking if `category_name` contains `BAR_CATEGORY_FILTER` ("음식점 > 술집")
   - This includes all bar subcategories (e.g., "음식점 > 술집 > 호프·요리주점", "음식점 > 술집 > 포장마차")
   - Deduplicates results using Map with `place.id` as key

4. **Results Display** (`displayResults` → `renderTable`)
   - Renders sortable table with all deduplicated results
   - Supports client-side filtering via search input
   - CSV export with UTF-8 BOM for Excel compatibility

### Key Technical Decisions

**Grid Cell Size (1km×1km)**:
- Balances API efficiency vs coverage
- Search radius of 707m covers entire cell (diagonal/2 = √(1000²+1000²)/2 ≈ 707m)
- Smaller cells = more API calls but better coverage in dense areas

**Rate Limiting**:
- 100ms delay between grid cells
- 50ms delay between pagination requests
- Sequential (not parallel) to avoid hitting API rate limits

**Deduplication Strategy**:
- Uses `Map` with place ID as key (not array filtering)
- Handles overlapping search results from adjacent grid cells

**Coordinate System**:
- Kakao API uses WGS84 (lat/lng)
- `x` = longitude, `y` = latitude in API responses
- Approximate meter-to-degree conversion for grid generation (see `generateGrid`)

## Configuration Options (config.js)

### Critical Settings

- **GRID_CELL_SIZE**: 1000 (meters) - Controls search granularity
- **SEARCH_RADIUS**: 707 (meters) - Must cover grid cell diagonal
- **BAR_CATEGORY_FILTER**: "음식점 > 술집" - Exact category string to match in `category_name`
- **BAR_KEYWORDS**: (DEPRECATED) Previously used for keyword-based filtering, now kept for reference only
- **MAX_PAGE**: 45 - Kakao API hard limit
- **CATEGORY.RESTAURANT**: "FD6" - Kakao category code for restaurants/bars

### Customization

To search different establishment types:
1. Change `CATEGORY.RESTAURANT` to appropriate Kakao category code
2. Update `BAR_CATEGORY_FILTER` to match the desired category hierarchy (e.g., "음식점 > 한식" for Korean restaurants)
3. Modify the filter logic in `searchGridCell` function (app.js:330-336) if needed
4. Adjust UI labels in `index.html`

**Important**: The filtering is based on Kakao's category hierarchy structure. Use the format "대분류 > 중분류 > 소분류" where applicable. The filter performs substring matching, so specifying "음식점 > 술집" will match all subcategories like "음식점 > 술집 > 호프·요리주점".

## Common Development Tasks

### Testing API Integration

Test with small area first (e.g., 1-2 grid cells) to verify:
- API keys are valid
- Rate limiting doesn't cause failures
- Results are properly filtered and deduplicated

### Debugging Grid Generation

Add visual grid overlay (not currently implemented):
```javascript
// In generateGrid(), after creating cells array:
cells.forEach(cell => {
    const rectangle = new kakao.maps.Rectangle({
        bounds: new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(cell.bounds.sw.lat, cell.bounds.sw.lng),
            new kakao.maps.LatLng(cell.bounds.ne.lat, cell.bounds.ne.lng)
        ),
        strokeWeight: 1,
        strokeColor: '#FF0000',
        fillOpacity: 0.1
    });
    rectangle.setMap(App.map);
});
```

### Modifying Search Logic

Key function: `searchGridCell(cell)` in app.js:315-358
- Handles pagination loop
- Applies category-based filtering (app.js:330-336)
  - Filters by substring match on `category_name` field
  - Checks against `CONFIG.BAR_CATEGORY_FILTER` value
  - Includes all subcategories of the specified category
- Returns array of matching places

## Known Limitations

1. **API Rate Limits**: Kakao enforces request limits (not publicly documented)
   - Current delays (100ms/50ms) are conservative estimates
   - Large areas (100+ grid cells) may take several minutes

2. **Dense Area Coverage**: Maximum 675 results per grid cell
   - Extremely dense areas (e.g., Gangnam) may have >675 bars per km²
   - No workaround without reducing grid size further

3. **CORS Requirements**: Must run via web server (not `file://` protocol)
   - Kakao API requires proper Origin headers

4. **No Backend**: All API keys are exposed in client-side code
   - For production, move API calls to backend proxy

## API Reference

### Kakao Local API Endpoint
```
GET https://dapi.kakao.com/v2/local/search/category.json
Headers: Authorization: KakaoAK {REST_API_KEY}
Params:
  - category_group_code: FD6 (restaurants)
  - x: longitude (center point)
  - y: latitude (center point)
  - radius: meters (max 20000)
  - page: 1-45
  - size: 1-15
```

### Response Structure
```javascript
{
  meta: { total_count, pageable_count, is_end },
  documents: [
    {
      id, place_name, category_name,
      address_name, road_address_name,
      phone, x, y, place_url, distance
    }
  ]
}
```

## Security Note

`config.js` contains hardcoded API keys. For version control:
1. Add `config.js` to `.gitignore`
2. Create `config.example.js` with placeholder values
3. Document API key setup in README
